#!/usr/bin/env node
/**
 * apps/oneringai/index.mjs — OneRingAI 實裝專案 (CLI 入口)
 *
 * 直接消費 @everworker/oneringai (已實裝 v1.0.1), 走本地 Ollama 免費算立路徑.
 * 這是 OneRingAI 的「實裝項目」: 把套件做成一個可獨立執行的 agent 助手,
 * 而非僅作為 oa-framework 的 adapter.
 *
 * 用法:
 *   node index.mjs "你的問題"
 *   node index.mjs                    # 預設問題
 *   OA_PROMPT="..." node index.mjs   # 環境變數傳入
 *
 * 前置: ollama serve + ollama pull qwen2.5:3b-instruct-q4_K_M
 */
import { Connector, Agent, Vendor } from '@everworker/oneringai';

const MODEL = process.env.OA_MODEL || 'qwen2.5:3b-instruct-q4_K_M';
const BASE_URL = process.env.OA_BASE_URL || 'http://localhost:11434/v1';
const API_KEY = process.env.OA_API_KEY || 'ollama';
const SYSTEM = process.env.OA_SYSTEM
  || '你是一個專精 ESG 永續發展與循環經濟的 AI 助手, 回答需具體、有日常例子。';

const prompt = process.argv[2] || process.env.OA_PROMPT
  || '什麼是永續發展？請舉一個家庭可執行的日常例子。';

// OneRingAI Agent.create 不收受 systemPrompt 欄位 (照 adapter 實測), 角色前綴併入 prompt
const fullPrompt = `${SYSTEM}\n\n使用者問題: ${prompt}`;

async function main() {
  console.log('══════════════════════════════════════════════════');
  console.log(' OneRingAI 實裝專案 (apps/oneringai)');
  console.log(` model: ${MODEL}`);
  console.log(` base : ${BASE_URL}`);
  console.log(` query: ${prompt}`);
  console.log('══════════════════════════════════════════════════\n');

  // 1) Connector — 本機 Ollama (OpenAI 協議, Vendor 枚舉)
  const vendor = BASE_URL.includes('11434') ? Vendor.Ollama : Vendor.OpenAI;
  const connector = Connector.create({
    name: 'oa-oneringai',
    vendor,
    auth: { type: 'api_key', apiKey: API_KEY },
    baseURL: BASE_URL,
  });

  // 2) Agent — 指向 connector + 模型
  const agent = Agent.create({
    connector: 'oa-oneringai',
    model: MODEL,
  });

  // 3) run — 真實推論
  const t0 = Date.now();
  const res = await agent.run(fullPrompt);
  const result = res?.output_text ?? res?.output ?? JSON.stringify(res);
  const dt = ((Date.now() - t0) / 1000).toFixed(1);

  console.log('── 回應 ──');
  console.log(result);
  console.log(`\n── 耗時 ${dt}s, connector=oa-oneringai ──`);
}

main().catch((e) => {
  console.error('[oneringai-app] 執行失敗:', e.message);
  process.exit(1);
});
