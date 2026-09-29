/**
 * OmniAgent VPS Gateway Server v3.0
 * 
 * Origin: OmniAgent (Open Source) → ESGGO OmniAgent (ESG Specialized)
 * 
 * New in v3.0:
 *  - WebSocket broadcast channel (OmniAgentBus bridge)
 *  - POST /stream  → Server-Sent Events streaming AI output
 *  - POST /omni-jules → OmniJules self-healing endpoint
 *  - GET  /skills  → OmniAgent skill registry (absorbed skills)
 *  - POST /evolve  → Trigger OmniAgent→OmniAgent evolution pull
 *  - POST /swarm/broadcast → Swarm task event relay
 *  - Multi-model routing with skill-based model selection
 *  - Global error handlers for uncaught exceptions
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createHash, timingSafeEqual } from 'crypto';
import { readFileSync, appendFileSync, existsSync, statSync, renameSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { inferTaskType, routeModel, formatRoutingResult } from './model-router.mjs';
// §20.4 蜂群矩陣 SSOT — 單一事實來源，供 /oa/* 路由與萬能CLI 共用
import { ARRAYS, AGENTS, listAgents } from './oa-swarm-matrix.mjs';
import {
  createTaskLog,
  handleOaStatus,
  handleOaAgents,
  handleDispatch,
  buildBroadcastPayload,
} from './oa-swarm-handlers.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env
try {
  const env = readFileSync(join(__dirname, '.env'), 'utf8');
  for (const line of env.split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const idx = t.indexOf('=');
    if (idx === -1) continue;
    const k = t.slice(0, idx).trim();
    const v = t.slice(idx + 1).trim();
    if (!(k in process.env)) process.env[k] = v;
  }
} catch { console.warn('[OmniGateway] No .env file — using process env'); }

// ── Env Loader ──────────────────────────────────────────────
// PM2 `--update-env` 偶爾不會把 .env 新欄位注入 forked process，
// 所以 gateway 啟動時強制再讀一次 `apps/gateway/.env`，避免 Telegram 等欄位被吃掉。
function loadGatewayEnv() {
  const envPath = join(__dirname, '.env');
  try {
    const text = readFileSync(envPath, 'utf8');
    for (const raw of text.split('\n')) {
      const line = raw.trim();
      if (!line || line.startsWith('#')) continue;
      const idx = line.indexOf('=');
      if (idx === -1) continue;
      const key = line.slice(0, idx).trim();
      const value = line.slice(idx + 1).trim();
      if (!(key in process.env)) process.env[key] = value;
    }
    console.log(`[OmniGateway] env loaded from ${envPath}`);
  } catch (err) {
    console.warn(`[OmniGateway] failed to load ${envPath}: ${err.message}`);
  }
}
loadGatewayEnv();

// Strip Gemma 4 thinking channels so only the final answer is returned.
// Gemma 4 emits reasoning in channel blocks with multiple known variants:
//   <channel>thought ... </channel>  |  <channel/>  |  <channel|>  |  <|channel>thought ... <channel|>
// Also strips markdown code fences that may wrap the final JSON/text.
// Ported from universal-tag-service.ts splitThinking() for consistency.
function stripGemma4Thinking(raw) {
  if (typeof raw !== 'string') return raw;
  const START = '<|channel>thought';
  const END = '<channel|>';
  if (!raw.includes(START)) return raw;
  const lastEnd = raw.lastIndexOf(END);
  return lastEnd === -1 ? raw.slice(raw.indexOf(START) + START.length) : raw.slice(lastEnd + END.length);
}

// ── Config ────────────────────────────────────────────────────
const PORT           = Number(process.env.PORT || 8642);
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
const GROQ_API_KEY   = process.env.GROQ_API_KEY;
const VPS_IP         = process.env.VPS_IP || '161.118.248.180';
const GATEWAY_KEY    = process.env.GATEWAY_API_KEY || process.env.GATEWAY_KEY;
if (!GATEWAY_KEY) {
  console.error('[OmniGateway] CRITICAL: GATEWAY_API_KEY or GATEWAY_KEY environment variable is required. Starting without it would compromise security. Exiting.');
  process.exit(1);
}

// ── Event Sink (統一 JSONL + SSE 斷點續傳 Last-Event-ID) ──
// 所有 SSE 事件同時寫入單一有序 JSONL, 既作審計 sink 也作重播源。
const EVENT_LOG = process.env.EVENT_LOG_PATH || join(__dirname, 'events.jsonl');
const EVENT_LOG_MAX = Number(process.env.EVENT_LOG_MAX_BYTES || 10 * 1024 * 1024);
let EVENT_SEQ = 0;
function appendEvent(type, payload) {
  EVENT_SEQ += 1;
  const rec = { id: EVENT_SEQ, ts: Date.now(), type, payload };
  try {
    if (existsSync(EVENT_LOG) && statSync(EVENT_LOG).size > EVENT_LOG_MAX) {
      try { renameSync(EVENT_LOG, `${EVENT_LOG}.${Date.now()}.bak`); } catch {}
    }
    appendFileSync(EVENT_LOG, JSON.stringify(rec) + '\n');
  } catch { /* sink 失敗不影響主流程 */ }
  return rec.id;
}
function replayEventsSince(lastId) {
  if (lastId <= 0 || !existsSync(EVENT_LOG)) return [];
  return readFileSync(EVENT_LOG, 'utf8').trim().split('\n')
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(r => r && r.id > lastId);
}
function readEvents({ after = 0, limit = 50 } = {}) {
  if (!existsSync(EVENT_LOG)) return [];
  const all = readFileSync(EVENT_LOG, 'utf8').trim().split('\n')
    .map(l => { try { return JSON.parse(l); } catch { return null; } })
    .filter(r => r && r.id > after);
  return all.slice(-Math.min(limit, 500));
}
const SITE_URL       = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || `http://${VPS_IP}:${PORT}`;
const SITE_NAME      = 'ESGGO OmniAgent Gateway';
const DEFAULT_ALLOWED_ORIGINS = [
  SITE_URL,
  `http://${VPS_IP}`,
  'https://esggo.vercel.app',
  'https://esggo-original-esg-sunshine.vercel.app',
  `http://127.0.0.1:${process.env.NEXT_PUBLIC_APP_PORT || 3000}`,
  `http://localhost:${process.env.NEXT_PUBLIC_APP_PORT || 3000}`,
];
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || DEFAULT_ALLOWED_ORIGINS.join(',')).split(',').map((origin) => origin.trim()).filter(Boolean);

const startTime = Date.now();
const genId = (p) => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
const hashLock = (d) => createHash('sha256').update(JSON.stringify(d)).digest('hex');

// ── Global Error Tracking ──────────────────────────────────────
const errorMetrics = {
  totalErrors: 0,
  recentErrors: [],
  uncaughtExceptions: 0,
  unhandledRejections: 0,
};

function logError(type, error) {
  const errorEntry = {
    ts: Date.now(),
    error: String(error?.message || error),
    stack: error?.stack?.slice(0, 500),
  };
  
  errorMetrics.recentErrors.unshift(errorEntry);
  if (errorMetrics.recentErrors.length > 50) {
    errorMetrics.recentErrors.pop();
  }
  errorMetrics.totalErrors++;
  
  console.error(`[OmniGateway] [${type}] ${errorEntry.error}`);
}

// ── AI Clients ────────────────────────────────────────────────
const FREE_TIER_ONLY = process.env.FREE_TIER_ONLY !== 'false';
const gemini = GEMINI_API_KEY && !FREE_TIER_ONLY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

// ── OmniAgent Skill Registry (OmniAgent absorbed skills) ─────────
// 每個技能同時綁定 OpenRouter 模型和 Groq 模型（Groq 優先，速度快 3-5 倍）
const SKILL_REGISTRY = [
  { id: 'gri_report_draft',     name: 'GRI 報告草稿生成',     origin: 'omniagent:data_synthesis',      model: 'meta-llama/llama-3.2-90b-vision:free',  groq_model: 'llama-3.3-70b-versatile',     esgDomain: 'E/S/G', fiveT: 'T2', status:'absorbed' },
  { id: 'carbon_calculation',   name: 'ISO 14064 碳排計算',    origin: 'omniagent:code_generation',     model: 'mistralai/mistral-small-3.1-24b:free',  groq_model: 'llama-3.3-70b-versatile',     esgDomain: 'E',     fiveT: 'T1', status: 'absorbed' },
  { id: 'compliance_review',    name: 'CSRD/GRI 合規審查',    origin: 'omniagent:web_search',           model: 'qwen/qwen3-next-80b-a3b-instruct:free', groq_model: 'llama-3.3-70b-versatile',     esgDomain: 'G', fiveT: 'T2', status: 'absorbed' },
  { id: 'evidence_ocr',        name: '碳排帳單 OCR 提取',     origin: 'omniagent:file_analysis',        model: 'qwen/qwen3-vl-8b:free',                 groq_model: 'gemma2-9b-it',               esgDomain: 'E', fiveT: 'T1', status: 'absorbed' },
  { id: 'email_archival',       name: 'ESG 郵件自動歸檔',     origin: 'omniagent:email_reading',        model: 'meta-llama/llama-3.3-70b-instruct:free', groq_model: 'llama-3.1-8b-instant',        esgDomain: 'G', fiveT: 'T1', status: 'absorbed' },
  { id: 'stakeholder_analysis', name: '利害關係人問卷分析',    origin: 'omniagent:data_synthesis',      model: 'qwen/qwen3-next-80b-a3b-instruct:free', groq_model: 'llama-3.3-70b-versatile',     esgDomain: 'S', fiveT: 'T3', status: 'absorbed' },
  { id: 'omni_jules_heal',      name: 'OmniJules 自動修復',   origin: 'google_jules:karma_protocol', model: 'openai/gpt-oss-120b:free',              groq_model: 'llama-3.3-70b-versatile',     esgDomain: 'SYS', fiveT: 'T4', status: 'transcended' },
  { id: 'swarm_orchestration',  name: 'OmniAgent 蜂群調度',    origin: 'omniagent:multi_agent',          model: 'mistralai/mistral-small-3.1-24b:free',  groq_model: 'llama-3.1-8b-instant',        esgDomain: 'SYS', fiveT: 'T5', status: 'transcended' },
];

// ── Free Models List (OpenRouter :free — 200 req/day) ────────
let FREE_MODELS = [
  // === Large / Premium Tier (70B-405B) ===
  { id: 'meta-llama/llama-3.2-90b-vision:free',       name: 'Meta: Llama 3.2 90B Vision',              tier: 'premium' },
  { id: 'openai/gpt-oss-120b:free',                  name: 'OpenAI: GPT-OSS 120B',                    tier: 'premium' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free',    name: 'Meta: Llama 3.3 70B Instruct',            tier: 'large' },
  { id: 'qwen/qwen3-next-80b-a3b-instruct:free',    name: 'Qwen: Qwen3 Next 80B (MoE)',              tier: 'large' },
  // === Mid Tier (20B-31B) ===
  { id: 'mistralai/mistral-small-3.1-24b:free',       name: 'Mistral: Small 3.1 24B (Default)',         tier: 'mid' },
  { id: 'google/gemma-4-31b-it:free',                name: 'Google: Gemma 4 31B',                      tier: 'mid' },
  { id: 'google/gemma-3-27b-it:free',                name: 'Google: Gemma 3 27B (Vision)',              tier: 'mid' },
  // === Light / Vision Tier (7B-8B) ===
  { id: 'qwen/qwen3-vl-8b:free',                    name: 'Qwen: Qwen3-VL 8B (Free Vision)',          tier: 'light' },
  { id: 'google/gemma-2-27b-it:free',                name: 'Google: Gemma 2 27B',                       tier: 'mid' },
  { id: 'meta-llama/llama-3.2-3b-instruct:free',     name: 'Meta: Llama 3.2 3B Instruct (Tiny)',        tier: 'light' },
];

// ── ESG System Prompt ─────────────────────────────────────────
const ESG_SYSTEM_PROMPT = `你是 ESGGO 平台的 OmniAgent AI 助手（Open Source 來自 OmniAgent 生態），ESGGO 專屬能力。
專精於 ESG 永續報告、GRI 框架、CSRD 合規、TCFD 與碳盤查（ISO 14064-1）。
以專業繁體中文回覆，使用 Markdown 格式，提供具體可執行的分析。
所有輸出須符合 5T 誠信協議：可溯源、透明、可感知、可信任、可追蹤。`;

// ── OpenRouter Call ───────────────────────────────────────────
async function callOpenRouter(modelId, userPrompt, systemPrompt = ESG_SYSTEM_PROMPT, imageUrl = null) {
  if (!OPENROUTER_KEY) throw new Error('No OPENROUTER_API_KEY');
  const messages = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: imageUrl
        ? [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: imageUrl } },
          ]
        : userPrompt,
    },
  ];
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_KEY}`,
      'HTTP-Referer': SITE_URL,
      'X-Title': SITE_NAME,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature: 0.7,
      max_tokens: 4096,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content || '';
}

// ── Groq Call (Free tier: 30 req/min, no daily cap) ──────────
// Groq is the fastest free inference provider for Llama / Mixtral models
const GROQ_MODELS = [
  { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B (Groq Free)', maxTokens: 32768 },
  { id: 'llama-3.1-8b-instant',    name: 'Llama 3.1 8B Instant (Groq Free)', maxTokens: 8192 },
  { id: 'gemma2-9b-it',            name: 'Gemma 2 9B (Groq Free)', maxTokens: 8192 },
  { id: 'mixtral-8x7b-32768',      name: 'Mixtral 8x7B (Groq Free)', maxTokens: 32768 },
];

// ── Startup Log ──────────────────────────────────────────────
console.log(`[OmniGateway] Gemini: ${gemini ? '✅' : '❌'} | OpenRouter: ${OPENROUTER_KEY ? '✅' : '❌'} | Groq: ${GROQ_API_KEY ? '✅' : '❌'} | Free-tier: ${FREE_TIER_ONLY}`);
console.log(`[OmniGateway] Free models: ${FREE_MODELS.length} | Groq models: ${GROQ_MODELS.length} | Skills: ${SKILL_REGISTRY.length}`);

async function callGroq(userPrompt, systemPrompt = ESG_SYSTEM_PROMPT, modelId = null) {
  if (!GROQ_API_KEY) throw new Error('No GROQ_API_KEY');
  const model = modelId || GROQ_MODELS[0].id;
  const modelInfo = GROQ_MODELS.find(m => m.id === model) || GROQ_MODELS[0];
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: Math.min(4096, modelInfo.maxTokens),
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}: ${await res.text()}`);
  const j = await res.json();
  return j.choices?.[0]?.message?.content || '';
}

// ── AI Dispatcher (Smart Routing) ─────────────────────────────
// Fallback chain: Local LLM (Gemma) → Smart Routing (Primary → Fallback1 → Fallback2) → Mock
async function dispatchAI(task, skillId) {
  const prompt = task.prompt || task.message || `請分析並回覆：類型=${task.taskType} 標題=${task.title}`;
  const imageUrl = task.imageUrl || task.image_url || null;
  const skill = SKILL_REGISTRY.find(s => s.id === skillId);
  const localServer = process.env.LOCAL_GEMMA_SERVER_URL;
  const localVisionModel = process.env.LOCAL_GEMMA_VISION_MODEL || 'gemma3:4b';

  // ══ 智慧模型路由 ══════════════════════════════════════════
  const taskType = inferTaskType(prompt);
  const routing = routeModel(taskType);
  console.log(`[OmniGateway] Smart Routing: ${formatRoutingResult(routing, taskType)}`);

  // 1. Try local LLM (Gemma) server first (vision-capable)
  if (localServer && imageUrl) {
    try {
      const response = await fetch(`${localServer}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: localVisionModel,
          prompt: `${ESG_SYSTEM_PROMPT}\n\n${prompt}`,
          image: imageUrl.startsWith('data:') ? imageUrl : undefined,
          stream: false
        })
      });
      if (response.ok) {
        const data = await response.json();
        const rawLocal = data.response || data.content;
        return { content: stripGemma4Thinking(rawLocal), provider: 'Local', model: localVisionModel, taskType };
      }
    } catch (e) {
      console.warn('[OmniGateway] Local server fallback:', e.message);
    }
  }

  // 1b. Text tasks -> local Gemma 4 (text-only, stronger) before cloud
  if (localServer && !imageUrl) {
    try {
      // ⚠ `/api/generate` + `stream:false` + `data.response` 是 Ollama 原生
      //   REST API 的契約（非 OpenAI 相容的 /v1/chat/completions）。
      //   這裡的「Ollama」是後端服務實作名，不是模型名也不是專案品牌 ——
      //   模型是 Gemma/Qwen，專案品牌是 Agent Mesh。
      //   若日後換成 LM Studio / llama.cpp / vLLM 等相容服務，須確認其
      //   仍實作此原生端點與回應欄位，否則應改走 /v1/chat/completions。
      //   對照：model-router.mjs 的 local_gemma provider 走的是
      //   `/ollama/v1/chat/completions`（OpenAI 相容層），兩者刻意不同：
      //   這裡要的是 Ollama 原生語意，路由層要的是跨供應商統一介面。
      const response = await fetch(`${localServer}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.LOCAL_GEMMA_MODEL || 'qwen3:8b-vision',
          prompt: `${ESG_SYSTEM_PROMPT}\n\n${prompt}`,
          stream: false
        })
      });
      if (response.ok) {
        const data = await response.json();
        const rawLocal = data.response || data.content;
        return { content: stripGemma4Thinking(rawLocal), provider: 'Local', model: process.env.LOCAL_GEMMA_MODEL || 'qwen3:8b-vision', taskType };
      }
    } catch (e) {
      console.warn('[OmniGateway] Local text fallback:', e.message);
    }
  }

  // ══ 嘗試 1: Primary Model (Smart Routing) ══════════════════
  const { primary, fallback1, fallback2 } = routing;
  try {
    console.log(`[OmniGateway] Trying primary: ${primary.provider}/${primary.model}`);
    if (primary.provider === 'groq' && GROQ_API_KEY) {
      const content = await callGroq(prompt, ESG_SYSTEM_PROMPT, primary.model);
      return { content, provider: 'Groq', model: primary.model, taskType, strategy: routing.strategy };
    }
    if (primary.provider === 'openrouter' && OPENROUTER_KEY) {
      const content = await callOpenRouter(primary.model, prompt, ESG_SYSTEM_PROMPT, imageUrl);
      return { content, provider: 'OpenRouter', model: primary.model, taskType, strategy: routing.strategy };
    }
  } catch (e) {
    console.warn(`[OmniGateway] Primary ${primary.provider}/${primary.model} failed:`, e.message);
  }

  // ══ 嘗試 2: Fallback 1 ═════════════════════════════════════
  try {
    console.log(`[OmniGateway] Trying fallback1: ${fallback1.provider}/${fallback1.model}`);
    if (fallback1.provider === 'groq' && GROQ_API_KEY) {
      const content = await callGroq(prompt, ESG_SYSTEM_PROMPT, fallback1.model);
      return { content, provider: 'Groq', model: fallback1.model, taskType, strategy: routing.strategy };
    }
    if (fallback1.provider === 'openrouter' && OPENROUTER_KEY) {
      const content = await callOpenRouter(fallback1.model, prompt, ESG_SYSTEM_PROMPT, imageUrl);
      return { content, provider: 'OpenRouter', model: fallback1.model, taskType, strategy: routing.strategy };
    }
  } catch (e) {
    console.warn(`[OmniGateway] Fallback1 ${fallback1.provider}/${fallback1.model} failed:`, e.message);
  }

  // ══ 嘗試 3: Fallback 2 ═════════════════════════════════════
  try {
    console.log(`[OmniGateway] Trying fallback2: ${fallback2.provider}/${fallback2.model}`);
    if (fallback2.provider === 'groq' && GROQ_API_KEY) {
      const content = await callGroq(prompt, ESG_SYSTEM_PROMPT, fallback2.model);
      return { content, provider: 'Groq', model: fallback2.model, taskType, strategy: routing.strategy };
    }
    if (fallback2.provider === 'openrouter' && OPENROUTER_KEY) {
      const content = await callOpenRouter(fallback2.model, prompt, ESG_SYSTEM_PROMPT, imageUrl);
      return { content, provider: 'OpenRouter', model: fallback2.model, taskType, strategy: routing.strategy };
    }
  } catch (e) {
    console.warn(`[OmniGateway] Fallback2 ${fallback2.provider}/${fallback2.model} failed:`, e.message);
  }

  // ══ 所有 AI 失敗 → Mock ══════════════════════════════════════
  console.warn('[OmniGateway] All providers failed, using mock response');
  const mock = {
    gri_report_draft:     `## GRI 報告草稿\n\n根據 GRI 2021 框架，本章節針對 **${task.title}** 進行揭露。\n\n**核心指標**：範疇一排放量、能源使用強度、員工多樣性。\n\n5T 狀態：全項驗證通過。`,
    carbon_calculation:   `## 碳排計算結果 (ISO 14064-1)\n\n- 活動數據：${task.inputData || '待輸入'}\n- 排放係數：0.509 kgCO₂e/kWh（台電 2023）\n- **計算結果：8,450 tCO₂e**`,
    compliance_review:    `## 合規審查報告\n\n| 框架 | 符合率 | 缺口 |\n|------|--------|------|\n| GRI 2021 | 78% | 305-3 未揭露 |\n| CSRD/ESRS | 65% | E1 氣候適應缺失 |`,
    omni_jules_heal:      `## OmniJules 自動修復報告 (萬能果因協議)\n\n### 觀果 (Observe)\n${task.failureReason || '系統偵測到異常'}\n\n### 修因 (Cultivate)\n已啟動修復。`,
  };
  const content = mock[skillId] || mock[task.taskType] || `OmniAgent 已處理任務：${task.title || task.taskType}`;
  return { content, provider: 'Mock', model: 'mock-v3.0', taskType, strategy: 'mock_fallback' };
}


// ── WebSocket Server ──────────────────────────────────────────
const wssClients = new Set();
function broadcastWS(event) {
  const msg = JSON.stringify({ ...event, timestamp: Date.now() });
  wssClients.forEach(ws => { try { ws.send(msg); } catch {} });
}

// ── Heartbeat Broadcaster ─────────────────────────────────────
setInterval(() => {
  if (wssClients.size > 0) {
    const mem = process.memoryUsage();
    broadcastWS({
      type: 'HEARTBEAT',
      source: 'Gateway',
      payload: {
        uptime: Math.floor((Date.now() - startTime) / 1000),
        clients: wssClients.size,
        memory: { used_mb: (mem.heapUsed / 1024 / 1024).toFixed(1), rss_mb: (mem.rss / 1024 / 1024).toFixed(1) },
        errors: errorMetrics.totalErrors,
        timestamp: Date.now()
      }
    });
  }
}, 3000);

// ── Evolution Log (in-memory) ─────────────────────────────────
const evolutionLog = [];
const busEvents = [];

// ── §20.4 OA-Team 任務簽印佇列 (5T-Trackable ring buffer) ─────
// 環緩衝邏輯在 oa-swarm-handlers.mjs，此處僅建立實例（單一事實來源）
const oaTaskLog = createTaskLog(200);

// ── Express + HTTP Server ─────────────────────────────────────
const app = express();

// Trust first proxy (Cloudflare → VPS), required for express-rate-limit
app.set('trust proxy', 1);
const httpServer = createServer(app);

// ── WebSocket setup (authenticated) ────────────────────────────
// WS_AUTH_TOKEN 未設定 → 保持既有行為（任何 client 皆可連線，向後相容）
// WS_AUTH_TOKEN 有設定 → 必須帶 query `?token=` 或 Sec-WebSocket-Protocol 才接受
const WS_AUTH_TOKEN = String(process.env.WS_AUTH_TOKEN || '').trim();
const WS_AUTH_ENABLED = WS_AUTH_TOKEN.length > 0;

function safeTokenEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

/**
 * 從 handshake 抽出 token 與（若來自 subprotocol）要回應的 protocol 名稱。
 * 支援格式（Sec-WebSocket-Protocol 以逗號分隔多個 protocol，故 "bearer, TOKEN" 是合法寫法）：
 *   ws://host:port/?token=XXX
 *   new WebSocket(url, ['bearer', TOKEN])   → protocol 欄回 'TOKEN'
 *   new WebSocket(url, ['auth.TOKEN'])      → protocol 欄回 'auth.TOKEN'
 *   new WebSocket(url, ['token.TOKEN'])
 *   new WebSocket(url, [TOKEN])             → 單一 protocol 即 token
 * 回傳的 protocol 一定來自 client 實際提出的清單，ws server 才會接受。
 */
function extractWsToken(req) {
  // 收集「所有」候選而非取第一個：實測中 client 可能同時帶多個憑證來源
  // （例如反向代理注入的無關 Authorization + 有效的 subprotocol token）。
  // 舊實作在第一個 header 就 return，會讓後面有效的憑證永遠不被檢查而誤回 401。
  const candidates = [];

  // 1) query string（瀏覽器 WebSocket 唯一可行方式）
  try {
    const url = new URL(req.url, 'http://localhost');
    const q = url.searchParams.get('token') || url.searchParams.get('access_token');
    if (q) candidates.push(q);
  } catch {}

  // 2) HTTP header（僅 Node / 裝置端 client 可用；瀏覽器 WS 無法自訂 header）
  //    相容既有 gateway-client.ts 的 `X-Omni-Token: GATEWAY_API_KEY` 寫法
  const h = req.headers;
  if (h['x-omni-token']) candidates.push(String(h['x-omni-token']));
  if (h['x-api-key']) candidates.push(String(h['x-api-key']));
  const auth = h['authorization'];
  if (auth) {
    const t = auth.replace(/^Bearer\s+/i, '').trim();
    if (t) candidates.push(t);
  }

  // 3) Sec-WebSocket-Protocol
  //    需一併記住「哪個 protocol 對應哪個 token」，因為 ws server 只會
  //    回應 client 實際提出的 protocol 值。
  let protocol = null;
  const raw = req.headers['sec-websocket-protocol'];
  if (raw) {
    const list = String(raw).split(',').map(s => s.trim()).filter(Boolean);
    for (let i = 0; i < list.length; i++) {
      const c = list[i];
      // 帶前綴的單一 protocol：bearer.TOKEN / auth.TOKEN / token.TOKEN
      const m = /^(?:bearer|auth|token)[\s.:]+(.+)$/i.exec(c);
      if (m) { candidates.push(m[1].trim()); protocol ||= c; }
      // 裸 marker：['bearer', TOKEN] → 取下一個作為 token
      if (/^(?:bearer|auth|token)$/i.test(c) && list[i + 1]) {
        candidates.push(list[i + 1]); protocol ||= list[i + 1];
      }
    }
    // 單一 protocol 本身就是 token
    if (list.length === 1) { candidates.push(list[0]); protocol ||= list[0]; }
  }

  return { candidates, protocol };
}

// ws 的 handleUpgrade() 沒有第 5 個 options 參數，protocol 選擇必須走
// wss.options.handleProtocols（於 handleUpgrade 內同步呼叫）。
// 因此用這個 request-scope 變數把「本次要回應的 protocol」傳進去。
let pendingProtocol = null;

const wss = new WebSocketServer({
  noServer: true,
  handleProtocols(protocols) {
    // 認證未啟用 → 沿用 ws 預設（回第一個 client 提出的 protocol，維持舊行為）
    if (!WS_AUTH_ENABLED) return protocols.values().next().value ?? false;
    return pendingProtocol ?? false;
  },
});

function rejectUpgrade(socket, code, statusText, message) {
  const body = JSON.stringify({ error: message, code });
  socket.write(
    `HTTP/1.1 ${code} ${statusText}\r\n` +
    'Connection: close\r\n' +
    'Content-Type: application/json\r\n' +
    `Content-Length: ${Buffer.byteLength(body)}\r\n` +
    '\r\n' + body
  );
  socket.destroy();
}

httpServer.on('upgrade', (req, socket, head) => {
  const key = String(req.headers.upgrade || '').toLowerCase();
  if (key !== 'websocket') { socket.destroy(); return; }

  pendingProtocol = null;
  if (WS_AUTH_ENABLED) {
    const { candidates, protocol } = extractWsToken(req);
    // 任一候選命中即放行：不能只比第一個，否則無關的 header（例如反向代理
    // 注入的 Authorization）會遮蔽掉後面有效的 subprotocol token 而誤回 401。
    const matched = candidates.some((t) => safeTokenEqual(t, WS_AUTH_TOKEN));
    if (!matched) {
      console.warn(`[OmniGateway] 🔒 WS 認證失敗 — 拒絕 ${req.socket?.remoteAddress} (url=${req.url})`);
      rejectUpgrade(socket, 401, 'Unauthorized', 'WS token missing or invalid');
      return;
    }
    if (protocol) pendingProtocol = protocol;
    console.log(`[OmniGateway] 🔓 WS 認證通過 (${protocol ? 'subprotocol' : 'query/header token'})`);
  }

  wss.handleUpgrade(req, socket, head, (ws) => {
    pendingProtocol = null;
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (ws, req) => {
  wssClients.add(ws);
  console.log(`[OmniGateway] 🔌 WS client connected (total: ${wssClients.size}) url=${req.url}`);
  ws.send(JSON.stringify({ type: 'CONNECTED', message: 'OmniAgentBus WebSocket Bridge Active', ts: Date.now() }));
  ws.on('close', () => { wssClients.delete(ws); });
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());
      broadcastWS({ type: 'RELAY', ...msg });
    } catch {}
  });
});

app.use(helmet({ crossOriginEmbedderPolicy: false }));

const corsOptions = {
  origin: ALLOWED_ORIGINS.length > 0
    ? (origin, cb) => (!origin || ALLOWED_ORIGINS.includes(origin) ? cb(null, true) : cb(new Error(`CORS: ${origin}`)))
    : '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Omni-Token', 'X-Api-Key'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '4mb' }));
app.set('trust proxy', 'loopback');
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

const aiLimiter = rateLimit({ windowMs: 60_000, max: 30, message: { error: 'AI rate limit: max 30 req/min' } });

// ── Auth Middleware ───────────────────────────────────────────
function requireAuth(req, res, next) {
  const token = (req.headers['x-omni-token'] || req.headers['x-api-key'] || req.headers['authorization'] || '').replace('Bearer ', '');
  if (!GATEWAY_KEY || !token || token !== GATEWAY_KEY) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key', hint: 'Set X-Omni-Token header' });
  }
  next();
}

// ── Routes ────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ ok: true, ts: Date.now(), ws_clients: wssClients.size, errors: errorMetrics.totalErrors }));

app.get('/status', requireAuth, (_req, res) => {
  const mem = process.memoryUsage();
  res.json({
    status: 'online', version: '3.0.0',
    gateway_name: 'ESGGO OmniAgent Gateway',
    origin: 'Hermes (Open Source) → OmniAgent (ESGGO Evolved)',
    platform: 'Ubuntu 24.04 / Oracle Cloud ARM64',
    vps_ip: VPS_IP,
    providers: { gemini: !!gemini, openrouter: !!OPENROUTER_KEY, groq: !!GROQ_API_KEY, free_models: FREE_MODELS.length, groq_models: GROQ_MODELS.length, mock_fallback: true },
    websocket: { enabled: true, clients: wssClients.size },
    skills: { total: SKILL_REGISTRY.length, transcended: SKILL_REGISTRY.filter(s => s.status === 'transcended').length },
    evolution: { logs: evolutionLog.length, last: evolutionLog.at(-1)?.ts || null },
    errors: errorMetrics,
    uptime_seconds: Math.floor((Date.now() - startTime) / 1000),
    memory: { used_mb: (mem.heapUsed / 1024 / 1024).toFixed(1), rss_mb: (mem.rss / 1024 / 1024).toFixed(1) },
    endpoints: ['/health', '/status', '/models', '/skills', '/execute', '/stream', '/omni-jules', '/evolve', '/swarm/broadcast'],
  });
});

app.get('/models', requireAuth, (_, res) => res.json({
  openrouter: { provider: 'OpenRouter', free_models: FREE_MODELS, default: FREE_MODELS[0]?.id, count: FREE_MODELS.length },
  groq: { provider: 'Groq', models: GROQ_MODELS, default: GROQ_MODELS[0]?.id, count: GROQ_MODELS.length, note: '30 req/min, no daily cap — fastest free inference' },
  total_free: FREE_MODELS.length + GROQ_MODELS.length,
}));

// GET /skills — OmniAgent-absorbed skill registry
app.get('/skills', requireAuth, (_req, res) => {
  res.json({
    total: SKILL_REGISTRY.length,
    source: 'OmniAgent Open Source + OmniJules → ESGGO OmniAgent',
    skills: SKILL_REGISTRY.map(s => ({
      ...s,
      description: `ESG Domain: ${s.esgDomain} | 5T Tag: ${s.fiveT} | Origin: ${s.origin}`,
    })),
  });
});

// GET /skills/:id — Single skill detail
app.get('/skills/:id', requireAuth, (req, res) => {
  const skill = SKILL_REGISTRY.find(s => s.id === req.params.id);
  if (!skill) return res.status(404).json({ error: 'Skill not found' });
  res.json(skill);
});

// POST /esg/skills — ESG Skills list with routing info
app.post('/esg/skills', requireAuth, (req, res) => {
  const esgSkills = [
    { id: 'carbon-calculation', taskType: 'carbon_calculation', name: '碳排計算 (ISO 14064)', pillar: 'E' },
    { id: 'tcfd-analysis', taskType: 'tcfd_analysis', name: 'TCFD 氣候風險分析', pillar: 'E' },
    { id: 'sdg-mapping', taskType: 'sdg_mapping', name: 'SDG 目標對應', pillar: 'E' },
    { id: 'compliance-review', taskType: 'compliance_review', name: '合規審查 (GRI/CSRD)', pillar: 'S' },
    { id: 'gri-report-draft', taskType: 'gri_report_draft', name: 'GRI 報告草稿', pillar: 'G' },
    { id: 'materiality-matrix', taskType: 'materiality_matrix', name: '重大性矩陣', pillar: 'G' },
    { id: 'stakeholder-analysis', taskType: 'stakeholder_analysis', name: '利害關係人分析', pillar: 'S' },
    { id: 'email-archival', taskType: 'email_archival', name: '郵件自動歸檔', pillar: 'G' },
    { id: 'evidence-ocr', taskType: 'evidence_ocr', name: '帳單 OCR 提取', pillar: 'E' },
    { id: 'report-assembly', taskType: 'report_assembly', name: '報告組裝', pillar: 'G' },
  ];

  const skillsWithRouting = esgSkills.map(skill => ({
    ...skill,
    routing: routeModel(skill.taskType),
  }));

  res.json({
    total: skillsWithRouting.length,
    skills: skillsWithRouting,
  });
});

// POST /esg/skills/:taskType — Execute ESG skill with prompts
app.post('/esg/skills/:taskType', requireAuth, aiLimiter, async (req, res) => {
  const { taskType } = req.params;
  const { company, year, language, data } = req.body;

  const esgSkills = {
    carbon_calculation: { system: '你是 ESG GO 碳排計算專家，精通 ISO 14064。', name: '碳排計算' },
    tcfd_analysis: { system: '你是 ESG GO TCFD 氣候風險分析專家。', name: 'TCFD 分析' },
    sdg_mapping: { system: '你是 ESG GO SDG 目標對應專家。', name: 'SDG 對應' },
    compliance_review: { system: '你是 ESG GO 合規審查專家，精通 GRI/CSRD/TCFD/ISSB。', name: '合規審查' },
    gri_report_draft: { system: '你是 ESG GO GRI 報告撰寫專家。', name: 'GRI 報告' },
    materiality_matrix: { system: '你是 ESG GO 重大性評估專家。', name: '重大性矩陣' },
    stakeholder_analysis: { system: '你是 ESG GO 利害關係人分析專家。', name: '利害關係人分析' },
    email_archival: { system: '你是 ESG GO 郵件歸檔專家。', name: '郵件歸檔' },
    evidence_ocr: { system: '你是 ESG GO OCR 數據提取專家。', name: 'OCR 提取' },
    report_assembly: { system: '你是 ESG GO 報告組裝專家。', name: '報告組裝' },
  };

  const skill = esgSkills[taskType];
  if (!skill) return res.status(404).json({ error: `Unknown task type: ${taskType}` });

  const routing = routeModel(taskType);
  console.log(`[OmniGateway] ESG Skill: ${taskType} | ${skill.name} | Routing: ${formatRoutingResult(routing)}`);

  res.json({
    success: true,
    skillId: taskType,
    skillName: skill.name,
    routing: {
      primary: `${routing.primary.provider}/${routing.primary.model}`,
      fallback1: `${routing.fallback1.provider}/${routing.fallback1.model}`,
      fallback2: `${routing.fallback2.provider}/${routing.fallback2.model}`,
    },
    prompts: {
      system: skill.system,
      user: `請為 ${company || '該公司'} ${year || '2024'} 年度進行${skill.name}。`,
    },
    context: { company, year, language, data },
  });
});

// POST /execute — Standard AI task execution
app.post('/execute', requireAuth, aiLimiter, async (req, res) => {
  const { task, skillId } = req.body;
  if (!task?.id || !task?.taskType) return res.status(400).json({ error: 'task.id and task.taskType required' });

  const resolved = skillId || task.taskType;
  console.log(`[OmniGateway] Execute: ${task.id} | skill=${resolved}`);

  broadcastWS({ type: 'OBSERVE', source: 'Gateway', payload: { taskId: task.id, skill: resolved } });

  // ── ESG Report Bridge: delegate to Next.js async API ──
  if (task.taskType === 'esg-report' || task.taskType === 'sustain-write') {
    try {
      const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || `http://${VPS_IP || '127.0.0.1'}:3000`;
      const bridgeRes = await fetch(`${siteUrl}/api/sustain-write/v5/async`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyId: task.companyId || task.company }),
      });
      const bridgeData = await bridgeRes.json();
      if (bridgeData.taskId) {
        broadcastWS({ type: 'MANIFEST', source: 'ESG-Bridge', payload: { taskId: task.id, taskId: bridgeData.taskId } });
        return res.json({
          success: true,
          bridge: { target: 'nextjs', endpoint: '/api/sustain-write/v5/async' },
          taskId: bridgeData.taskId,
          progressUrl: `/api/sustain-write/v5/progress/${bridgeData.taskId}`,
        });
      }
      return res.status(502).json({ error: 'Bridge returned failure', detail: bridgeData });
    } catch (err) {
      return res.status(502).json({ error: 'Bridge unreachable: ' + err.message });
    }
  }

  try {
    const aiResult = await dispatchAI(task, resolved);
    const ts = new Date().toISOString();
    const execId = genId('exec');
    const artId = genId('art');

    const result = {
      execution: {
        id: execId, taskId: task.id,
        runtime: 'omniagent-gateway-v3', runtimeVersion: '3.0.0',
        modelProvider: aiResult.provider, modelName: aiResult.model,
        status: 'completed', startedAt: ts, finishedAt: new Date().toISOString(),
        outputRefIds: [artId],
      },
      artifact: {
        id: artId, executionId: execId, taskId: task.id,
        title: `${task.title || task.taskType} — OmniAgent v3`,
        content: aiResult.content,
        hashLock: hashLock(aiResult.content),
        reviewStatus: 'awaiting_review', version: 1,
        fiveT: { T1: true, T2: true, T4: true, T5: true },
        createdAt: ts,
      },
    };

    broadcastWS({ type: 'MANIFEST', source: 'Gateway', payload: { taskId: task.id, artId } });
    res.json(result);
  } catch (err) {
    logError('EXECUTE', err);
    broadcastWS({ type: 'HEAL', source: 'Gateway', payload: { taskId: task.id, error: err.message } });
    res.status(500).json({ error: err.message });
  }
});

// GET /events — 審計事件查詢 (統一 JSONL sink 可服務化, 對齊 OmniCore §10 執行後追蹤)
app.get('/events', requireAuth, (req, res) => {
  const after = Number(req.query.after || 0);
  const limit = Math.min(Number(req.query.limit || 50), 500);
  const events = readEvents({ after, limit });
  res.json({ count: events.length, after, limit, events });
});

// POST /stream — SSE Streaming AI response
app.post('/stream', requireAuth, aiLimiter, async (req, res) => {
  const { task, skillId } = req.body;
  if (!task?.taskType) return res.status(400).json({ error: 'task.taskType required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // 斷點續傳: 客戶端重連帶 Last-Event-ID, 從統一 JSONL sink 重播之後的事件
  const lastId = Number(req.headers['last-event-id'] || req.query.lastEventId || 0);
  const replay = replayEventsSince(lastId);
  for (const r of replay) {
    res.write(`id: ${r.id}\nevent: ${r.type}\ndata: ${JSON.stringify(r.payload)}\n\n`);
  }

  // send() 帶單調 id 且寫入統一 sink (審計 + 重播同源)
  const send = (event, data) => {
    const id = appendEvent(event, data);
    res.write(`id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  send('status', { stage: 'DISPATCHING', model: 'auto', ts: Date.now() });

  try {
    if (gemini) {
      const m = gemini.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = task.prompt || `請分析：${task.taskType} — ${task.title}`;
      const streamResult = await m.generateContentStream([ESG_SYSTEM_PROMPT, prompt]);

      send('status', { stage: 'STREAMING', provider: 'Google Gemini' });

      for await (const chunk of streamResult.stream) {
        const text = chunk.text();
        if (text) send('chunk', { text });
      }
    } else {
      // Simulate streaming from mock
      send('status', { stage: 'STREAMING', provider: 'Mock' });
      const mockContent = `## OmniAgent 串流輸出\n\n正在生成 **${task.title || task.taskType}** 分析...\n\n根據 Hermes 技能庫，本次任務已路由至最優模型。\n\n5T 封印已完成。`;
      for (const line of mockContent.split('\n')) {
        send('chunk', { text: line + '\n' });
        await new Promise(r => setTimeout(r, 80));
      }
    }

    const hash = hashLock({ task, ts: Date.now() });
    send('seal', { hash, status: 'T4_SEALED', provider: gemini ? 'Gemini' : 'Mock' });
    send('done', { message: 'Stream complete' });
    broadcastWS({ type: 'SEAL', source: 'StreamGateway', payload: { hash } });
  } catch (err) {
    logError('STREAM', err);
    send('error', { message: err.message });
  }

  res.end();
});

// POST /omni-jules — OmniJules self-healing (OmniJules lineage)
app.post('/omni-jules', requireAuth, aiLimiter, async (req, res) => {
  const { failureReason, sourceTaskId, context } = req.body;
  if (!failureReason) return res.status(400).json({ error: 'failureReason required' });

  console.log(`[OmniJules] 🛡️ Healing request: ${failureReason.slice(0, 80)}`);
  broadcastWS({ type: 'HEAL', source: 'OmniJules', payload: { sourceTaskId, stage: 'KARMA_INITIATED' } });

  const healTask = {
    id: genId('jules'),
    taskType: 'omni_jules_heal',
    title: `[OmniJules 萬能果因] ${failureReason.slice(0, 60)}`,
    prompt: `你是 OmniJules（前身：OmniJules），執行萬能果因協議。\n\n故障原因：${failureReason}\n上下文：${context || '無'}\n\n請分析並提出修復方案。`,
    failureReason,
    inputData: context,
  };

  try {
    const aiResult = await dispatchAI(healTask, 'omni_jules_heal');
    const hash = hashLock({ failureReason, healed: aiResult.content });

    broadcastWS({ type: 'SEAL', source: 'OmniJules', payload: { sourceTaskId, hash, stage: 'KARMA_SEALED' } });

    res.json({
      jules_version: '1.0.0-esggo',
      origin: 'OmniJules → OmniJules (ESGGO Adapted)',
      karmaProtocol: { phase1: '覺察與導向', phase2: '轉化與顯化', phase3: '確信與進化' },
      healingReport: aiResult.content,
      hash_lock: hash,
      status: 'HEALED',
      provider: aiResult.provider,
    });
  } catch (err) {
    logError('OMNI_JULES', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /evolve — Trigger OmniAgent→OmniAgent evolution
app.post('/evolve', requireAuth, async (req, res) => {
  const { omniagentVersion = 'v3.0.0', notes = [] } = req.body;

  console.log(`[OmniGateway] 🧬 Evolution triggered: OmniAgent ${omniagentVersion} → OmniAgent`);
  broadcastWS({ type: 'OBSERVE', source: 'EvolutionEngine', payload: { omniagentVersion, stage: 'ABSORBING' } });

  await new Promise(r => setTimeout(r, 800));

  const entry = {
    id: genId('evo'),
    ts: new Date().toISOString(),
    fromOmniAgent: omniagentVersion,
    toOmniAgent: '3.0.0',
    skillsAbsorbed: SKILL_REGISTRY.filter(s => s.status !== 'pending').length,
    hash: hashLock({ omniagentVersion, ts: Date.now() }),
    notes,
    status: 'transcended',
  };
  evolutionLog.push(entry);

  broadcastWS({ type: 'MANIFEST', source: 'EvolutionEngine', payload: entry });

  res.json({ message: `OmniAgent ${omniagentVersion} → OmniAgent evolution complete`, entry, total_evolutions: evolutionLog.length });
});

// GET /evolve — Evolution history
app.get('/evolve', (_req, res) => res.json({ total: evolutionLog.length, log: evolutionLog }));

// POST /swarm/broadcast — Swarm task event relay (from Next.js API)
app.post('/swarm/broadcast', async (req, res) => {
  const event = req.body;
  if (!event) return res.status(400).json({ error: 'event body required' });
  busEvents.push({ ...event, ts: Date.now() });
  if (busEvents.length > 200) busEvents.shift(); // ring buffer
  broadcastWS({ type: event.stage || 'SWARM', source: 'SwarmBroadcast', payload: event });
  res.json({ ok: true, clients_notified: wssClients.size });
});

// GET /swarm/events — Recent bus events
app.get('/swarm/events', (_req, res) => res.json({ total: busEvents.length, events: busEvents.slice(-50) }));

app.post('/api/sync/bus', async (req, res) => {
  const event = req.body;
  if (!event) return res.status(400).json({ error: 'event body required' });
  busEvents.push({ ...event, ts: Date.now() });
  if (busEvents.length > 200) busEvents.shift();
  broadcastWS({ type: 'SYNC', source: 'AgentBus', payload: event });
  res.json({ ok: true, clients_notified: wssClients.size });
});

// ── §20.4 OA-Team 30 蜂群控制路由 (萬能CLI live 模式對接) ────────
// 5T-Traceable: source_origin=apps/gateway/oa-swarm-matrix.mjs (單一事實來源)
// 5T-Trustworthy: 簽印記錄進 ring buffer，寫入即凍結不可竄改

// GET /oa/status — 蜂群陣列狀態（MECE 分工 / 負載 / 健康）
app.get('/oa/status', requireAuth, (_req, res) => {
  const body = handleOaStatus({
    mem: process.memoryUsage(),
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    wsClients: wssClients.size,
    totalErrors: errorMetrics.totalErrors,
  });
  body.task_queue = {
    depth: oaTaskLog.length,
    dispatched: oaTaskLog.all().filter((t) => t.status === 'dispatched').length,
    ring_capacity: oaTaskLog.capacity,
  };
  res.json(body);
});

// GET /oa/agents — 30 位代理（?array=1..5 或 all）
app.get('/oa/agents', requireAuth, (req, res) => {
  res.json(handleOaAgents(req.query.array));
});

// POST /oa/task/dispatch — 任務派發（Key-Ω 簽印，5T-Trackable 記錄）
// 邏輯在 oa-swarm-handlers.mjs，供測試直接 import 真實實作
app.post('/oa/task/dispatch', requireAuth, aiLimiter, (req, res) => {
  const result = handleDispatch({ body: req.body, taskLog: oaTaskLog });
  if (result.status !== 200) return res.status(result.status).json(result.body);

  // 5T-Trustworthy: prompt 一律不進 WS 廣播，只送摘要與長度。
  // WS 認證（WS_AUTH_TOKEN）未設定時通道形同公開，此遮蔽是該情況下唯一
  // 的保護；認證啟用後仍維持遮蔽，因為廣播會送給所有已連線的 client，
  // 不宜假設每個連線者都有權看到完整任務內容。
  broadcastWS({ type: 'OA_TASK', source: 'OaDispatch', payload: buildBroadcastPayload(result.task) });

  res.json(result.body);
});

// ── ESGSonar Crawler Routes ──────────────────────────────────────
// Crawl trigger & scheduler status (bridged from crawler-scheduler)

let sonnarCrawlCount = 0;
let sonnarLastCrawlTime = null;

/** Signal esggo-core :3000 to run a crawl */
async function signalCoreCrawl(sourceId) {
  try {
    const res = await fetch('http://localhost:3000/api/sonnar/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sourceId === '__all__' ? { all: true } : { sourceId }),
    });
    return await res.json();
  } catch (err) {
    console.error('[Sonar] Failed to signal core:', err.message);
    return null;
  }
}

// GET /sonnar/status — Crawler scheduler overview
app.get('/sonnar/status', requireAuth, async (_req, res) => {
  try {
    const r = await fetch('http://localhost:3000/api/sonnar/crawl', { signal: AbortSignal.timeout(3000) });
    const data = await r.json();
    res.json({ success: true, scheduler: data.data?.status, jobs: data.data?.jobs, gateway: { crawlCount: sonnarCrawlCount, lastCrawlTime: sonnarLastCrawlTime } });
  } catch {
    res.json({ success: false, scheduler: 'core unreachable', gateway: { crawlCount: sonnarCrawlCount, lastCrawlTime: sonnarLastCrawlTime } });
  }
});

// POST /sonnar/crawl — Trigger crawl from gateway
app.post('/sonnar/crawl', requireAuth, async (req, res) => {
  const { sourceId, all } = req.body || {};
  const target = all ? '__all__' : (sourceId || 'unknown');
  sonnarCrawlCount++;
  sonnarLastCrawlTime = new Date().toISOString();
  const result = await signalCoreCrawl(target);
  res.json({ success: !!result, trigger: target, crawlCount: sonnarCrawlCount, timestamp: sonnarLastCrawlTime, coreResult: result });
});

// GET /sonnar/alerts — Recent alerts
app.get('/sonnar/alerts', requireAuth, async (_req, res) => {
  try {
    const r = await fetch('http://localhost:3000/api/sonnar/alerts', { signal: AbortSignal.timeout(3000) });
    const data = await r.json();
    res.json(data);
  } catch {
    res.json({ success: false, error: 'core unreachable' });
  }
});

// GET /sonnar/radar — Signal radar overview
app.get('/sonnar/radar', requireAuth, async (_req, res) => {
  try {
    const r = await fetch('http://localhost:3000/api/sonnar/radar', { signal: AbortSignal.timeout(3000) });
    const data = await r.json();
    res.json(data);
  } catch {
    res.json({ success: false, error: 'core unreachable' });
  }
});

// Periodic crawl scheduler (default: every 4 hours)
const SONNAR_CRAWL_INTERVAL = 4 * 3600 * 1000;
let sonnarPeriodicTimer = null;

function startSonnarPeriodicCrawl() {
  console.log(`[Sonar] Periodic crawl interval: ${SONNAR_CRAWL_INTERVAL / 3600000}h`);
  sonnarPeriodicTimer = setInterval(async () => {
    console.log('[Sonar] Periodic crawl trigger...');
    const result = await signalCoreCrawl('__all__');
    if (result) {
      sonnarCrawlCount++;
      sonnarLastCrawlTime = new Date().toISOString();
      console.log('[Sonar] Crawl result:', result.success ? 'OK' : 'FAILED');
    }
  }, SONNAR_CRAWL_INTERVAL);
}

// Start after 60s initial delay
setTimeout(startSonnarPeriodicCrawl, 60000);

// 404 + error handlers
app.use((_req, res) => res.status(404).json({ error: 'Not found', endpoints: ['/health','/status','/models','/skills','/execute','/stream','/omni-jules','/evolve','/swarm/broadcast','/swarm/events','/api/sync/bus','/oa/status','/oa/agents','/oa/task/dispatch','/sonar/status','/sonar/crawl','/sonar/alerts','/sonar/radar'] }));
app.use((err, _req, res, _next) => {
  logError('EXPRESS', err);
  res.status(500).json({ error: err.message });
});

// ── Start ─────────────────────────────────────────────────────
httpServer.listen(PORT, '127.0.0.1', () => {
  console.log('═══════════════════════════════════════════════════════');
  console.log(`🚀 OmniAgent Gateway v3.0 — LIVE`);
  console.log(`   Origin : OmniAgent (Open Source) → ESGGO OmniAgent`);
  console.log(`   URL    : http://${VPS_IP}:${PORT}`);
  console.log(`   WS     : ws://${VPS_IP}:${PORT} (OmniAgentBus Bridge)`);
  if (WS_AUTH_ENABLED) {
    console.log(`   WS AUTH: 🔒 已啟用（需 ?token= 或 Sec-WebSocket-Protocol）`);
  } else {
    console.warn(`   WS AUTH: ⚠️ 未啟用 — WS_AUTH_TOKEN 未設定，任何人都可連線（僅適合本機/內網）`);
  }
  console.log(`   Skills : ${SKILL_REGISTRY.length} (${SKILL_REGISTRY.filter(s=>s.status==='transcended').length} transcended)`);
  console.log(`   Sonar  : /sonnar/status /sonnar/crawl /sonnar/alerts /sonnar/radar`);
  console.log('═══════════════════════════════════════════════════════');
});

// ── Global Error Handlers ──────────────────────────────────────
process.on('uncaughtException', (err) => {
  errorMetrics.uncaughtExceptions++;
  logError('UNCAUGHT_EXCEPTION', err);
  
  // 嘗試通知 Telegram
  if (bot) {
    try {
      bot.sendMessage(
        process.env.TELEGRAM_CHAT_ID || '',
        `🚨 [OmniGateway] Uncaught Exception:\n${err.message}\n${err.stack?.slice(0, 300)}`
      ).catch(() => {});
    } catch {}
  }
  
  // 廣播到 WebSocket
  broadcastWS({ type: 'CRITICAL_ERROR', source: 'Process', payload: { error: err.message } });
  
  console.error('[OmniGateway] Process will exit in 5 seconds...');
  setTimeout(() => process.exit(1), 5000);
});

process.on('unhandledRejection', (reason, promise) => {
  errorMetrics.unhandledRejections++;
  logError('UNHANDLED_REJECTION', new Error(String(reason)));
  
  // 廣播到 WebSocket
  broadcastWS({ type: 'UNHANDLED_REJECTION', source: 'Process', payload: { reason: String(reason) } });
});

// ── Telegram Bot ──────────────────────────────────────────────
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID   = process.env.TELEGRAM_CHAT_ID;

let bot = null;
if (TELEGRAM_BOT_TOKEN) {
  try {
    const TelegramBot = (await import('node-telegram-bot-api')).default;
    bot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: true });
    console.log('[Telegram] ✅ Bot started (polling)');

    // Safe send helper with improved newline handling
    async function safeSend(chatId, text, options = {}) {
      const MAX_LEN = 4000;
      let sendText = text;
      
      if (typeof sendText === 'string') {
        sendText = sendText.replace(/\\\\n/g, '\n');
        if (sendText.includes('\\n')) {
          sendText = sendText.replace(/\\n/g, '\n');
        }
      }
      
      if (typeof sendText === 'string' && sendText.length > MAX_LEN) {
        sendText = sendText.slice(0, MAX_LEN) + '\n\n...（訊息已截斷）';
      }
      
      const sendOptions = { ...options };
      
      try {
        const result = await bot.sendMessage(chatId, sendText, sendOptions);
        console.log(`[Telegram] ✓ Message sent successfully to ${chatId}`);
        return result;
      } catch (err) {
        console.warn(`[Telegram] Send failed: ${err.message}`);
        throw err;
      }
    }

    bot.on('message', async (msg) => {
      const chatId = msg.chat.id;
      const text = (msg.text || '').trim();
      console.log(`[Telegram] 📩 Received from ${chatId}: ${text.slice(0, 80)}`);

      try {
        if (!text.startsWith('/')) {
          await safeSend(chatId, '請使用指令：\n/task <任務描述> — 交辦工作\n/status — 查看 Gateway 狀態\n/help — 說明');
          return;
        }

        const [name, ...args] = text.split(' ').filter(Boolean);
        const arg = args.join(' ');

        if (name === '/start' || name === '/help') {
          await safeSend(chatId,
            '🤖 *OmniAgent Gateway*\n' +
            '可直接在這裡交辦工作，Gateway 會排程並回報進度。\n\n' +
            '指令：\n' +
            '/task <描述> — 交辦新任務\n' +
            '/status — 檢視在线狀態\n' +
            '/help — 說明');
          return;
        }

        if (name === '/status') {
          const token = process.env.GATEWAY_API_KEY || process.env.GATEWAY_KEY || '';
          const statusRes = await fetch(`http://127.0.0.1:${PORT}/status`, {
            headers: token ? { 'X-Omni-Token': token } : {},
          });
          const statusData = await statusRes.json().catch(() => ({}));
          const providers = statusData?.providers || {};
          const lines = [
            '📊 *Gateway 狀態*',
            `狀態：${statusData?.status || 'unknown'}`,
            `版本：${statusData?.version || '-'}`,
            `Gemini：${providers.gemini ? '✅' : '❌'}`,
            `OpenRouter：${providers.openrouter ? '✅' : '❌'}`,
            `Groq：${providers.groq ? '✅' : '❌'}`,
            `WS：${statusData?.websocket?.enabled ? 'on' : 'off'} (clients=${statusData?.websocket?.clients ?? 0})`,
          ];
          await safeSend(chatId, lines.join('\n'));
          return;
        }

        if (name === '/task') {
          if (!arg) {
            await safeSend(chatId, '⚠️ 請輸入任務描述，例如：\n/task 分析 2024 碳排盤查報告');
            return;
          }
          const token = process.env.GATEWAY_API_KEY || process.env.GATEWAY_KEY || '';
          if (!token) {
            await safeSend(chatId, '⚠️ Gateway key 未設定，無法交辦。');
            return;
          }
          const taskId = `tg_${Date.now()}`;
          await safeSend(chatId, `📨 已接收任務：${arg}\n任務ID：${taskId}\n狀態： dispatched`);
          try {
            const execRes = await fetch(`http://127.0.0.1:${PORT}/execute`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Omni-Token': token,
              },
              body: JSON.stringify({
                task: {
                  id: taskId,
                  taskType: 'compliance_review',
                  title: arg,
                  prompt: arg,
                },
                skillId: 'compliance_review',
              }),
            });
            const execData = await execRes.json().catch(() => ({}));
            if (!execRes.ok) {
              await safeSend(chatId, `❌ 執行失敗：${execData?.error || execRes.status}`);
              return;
            }
            const content = execData?.artifact?.content || execData?.result || JSON.stringify(execData);
            const preview = typeof content === 'string' ? content.slice(0, 1800) : JSON.stringify(content).slice(0, 1800);
            await safeSend(chatId, `✅ 任務完成：${arg}\n\`\`\`\n${preview}\n\`\`\``);
          } catch (err) {
            await safeSend(chatId, `❌ 任務執行例外：${err.message}`);
          }
          return;
        }

        await safeSend(chatId, '不認識的指令，請用 /help 查看可用指令。');
      } catch (err) {
        console.error(`[Telegram] Error handling message: ${err.message}`);
        try {
          await bot.sendMessage(chatId, '⚠️ 處理訊息時發生錯誤，請稍後再試。');
        } catch {}
      }
    });

    bot.on('polling_error', (err) => {
      console.error(`[Telegram] Polling error: ${err.message}`);
    });

  } catch (err) {
    console.error(`[Telegram] ❌ Failed to init bot: ${err.message}`);
  }
} else {
  console.log('[Telegram] ⚠️ No TELEGRAM_BOT_TOKEN — Telegram bot disabled');
}

// ── Signal Handlers ──────────────────────────────────────────
process.on('SIGTERM', () => { 
  console.log('[OmniGateway] SIGTERM received, shutting down gracefully...');
  httpServer.close(() => process.exit(0)); 
});
process.on('SIGINT',  () => { 
  console.log('[OmniGateway] SIGINT received, shutting down gracefully...');
  httpServer.close(() => process.exit(0)); 
});
