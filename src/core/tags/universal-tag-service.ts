/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// Universal Tag Service — 萬能標籤配對合成層
// src/core/tags/universal-tag-service.ts
// ============================================================
// 串接兩套現有標籤體系：
//   - ESGTag (prisma/schema.prisma)  -> UniversalTag(kind='esg')
//   - OmniTag (組件信任標籤)          -> UniversalTag(kind='omni') + TagPair
// 並用本地 Gemma 4 (Ollama) 做 autoPair 自動標籤配對。
//
// 注意：OmniTag 邏輯內聯（不跨目錄 import lib/omni-tag，避免其在
// verify tsconfig 下的模組解析問題）。

import { createHash } from 'crypto';
import { prisma } from '@/lib/storage-service';
import { syncTagPairToOracle } from './oracle-sync-service';
import { publishThought } from '../../lib/bus';

const LOCAL_GEMMA_MODEL = process.env.LOCAL_GEMMA_MODEL || 'qwen3:8b-vision';

// 5T: hashLock = SHA-256(uuid + timestamp + label) 不可逆封印
function computeHashLock(uuid: string, timestamp: number, seed: string): string {
  return createHash('sha256').update(`${uuid}|${timestamp}|${seed}`).digest('hex');
}

// 把 Gemma 4 輸出拆分為「思考片段 thoughts」與「純淨答案 clean」。
// 處理思考頻道變體：<channel>thought ... </channel> | <channel/> | <channel|> | <|channel>thought ... <channel|>
// 以及 markdown code fences：```json ... ``` 或 ``` ... ```，並清掉殘留孤立標籤。
export function splitThinking(raw: unknown): { thoughts: string[]; clean: string } {
  if (typeof raw !== 'string') {
    return { thoughts: [], clean: raw == null ? '' : String(raw) };
  }
  const thoughts: string[] = [];
  const clean = raw
    .replace(
      /<\|?channel>?\s*thought([\s\S]*?)(?:<channel\/>|<\/?channel>|<channel\|>|\|)/gi,
      (_m, body) => {
        thoughts.push(String(body ?? '').trim());
        return '';
      },
    )
    .replace(/```(?:json)?\s*([\s\S]*?)```/gi, '$1')
    .replace(/<\|?channel>?/gi, '')
    .trim();
  return { thoughts, clean };
}

// 清理 Gemma 4 思考頻道與 markdown 圍欄，回傳可供 JSON 解析的純文字。
// （相容舊行為：等同 splitThinking(raw).clean）
export function stripGemma4Thinking(raw: unknown): string {
  return splitThinking(raw).clean;
}

// 從模型輸出抽取第一個 JSON 值（物件或陣列），容許前後綴散文與思考頻道。
export function extractJsonValue(raw: string): unknown | null {
  const cleaned = stripGemma4Thinking(raw);
  const first = cleaned.search(/[[{]/);
  if (first === -1) return null;
  const open = cleaned[first];
  const close = open === '{' ? '}' : ']';
  const last = cleaned.lastIndexOf(close);
  if (last === -1 || last < first) return null;
  const candidate = cleaned.slice(first, last + 1).trim();
  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

// ── 內聯 OmniTag 邏輯（自包含） ─────────────────────────────
type TagType = 'GRI' | 'TCFD' | 'TNFD' | 'SDG' | 'custom';
type TagStatus = 'proof-anchor' | 'evidence' | 'verified' | 'archived';

function makeOmniTag(label: string, type: TagType = 'custom', status: TagStatus = 'proof-anchor') {
  const id = `OTAG-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return { id, label, type, status, createdAt: Date.now(), updatedAt: Date.now(), metadata: {} as Record<string, unknown> };
}
function makeTagPair(anchor: ReturnType<typeof makeOmniTag>, evidence: ReturnType<typeof makeOmniTag>) {
  return {
    anchor,
    evidence,
    pairId: `PAIR-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: Date.now(),
  };
}

// ── 1. 同步 ESGTag 進 UniversalTag ───────────────────────────
export async function syncEsgTags(): Promise<{ synced: number; labels: string[] }> {
  const esgTags = await prisma.eSGTag.findMany();
  let synced = 0;
  const labels: string[] = [];
  for (const t of esgTags) {
    const existing = await prisma.universalTag.findUnique({
      where: { label_kind: { label: t.name, kind: 'esg' } },
    });
    if (!existing) {
      const uuid = `UT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const ts = Date.now();
      await prisma.universalTag.create({
        data: {
          uuid,
          sourceOrigin: 'esg-sync',
          hashLock: computeHashLock(uuid, ts, t.name),
          lifecycleHooks: '{}',
          label: t.name,
          kind: 'esg',
          esgTagId: t.id,
          metadata: JSON.stringify({ pillar: t.pillar, category: t.category, description: t.description }),
        },
      });
      synced++;
      labels.push(t.name);
    }
  }
  return { synced, labels };
}

// ── 2. 建立 OmniTag 信任配對 (anchor + evidence) ─────────────
export async function createOmniTagPair(params: {
  anchorLabel: string;
  evidenceLabel?: string;
  entityType: string;
  entityId: string;
  omniType?: TagType;
  confidence?: number;
}): Promise<{ pairId: string; anchorId: string; evidenceId?: string }> {
  const anchor = makeOmniTag(params.anchorLabel, params.omniType ?? 'custom', 'proof-anchor');
  const evidence = params.evidenceLabel ? makeOmniTag(params.evidenceLabel, params.omniType ?? 'custom', 'evidence') : null;
  makeTagPair(anchor, evidence ?? anchor); // 產生 pairId（用於 metadata 追溯）

  const anchorDb = await prisma.universalTag.upsert({
    where: { label_kind: { label: anchor.label, kind: 'omni' } },
    update: {},
    create: {
      uuid: `UT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      sourceOrigin: 'omni-pair',
      hashLock: computeHashLock(anchor.id, Date.now(), anchor.label),
      lifecycleHooks: '{}',
      label: anchor.label,
      kind: 'omni',
      omniType: params.omniType ?? 'custom',
      status: 'proof-anchor',
      metadata: JSON.stringify({ omniId: anchor.id }),
    },
  });

  let evidenceDb;
  if (evidence) {
    evidenceDb = await prisma.universalTag.upsert({
      where: { label_kind: { label: evidence.label, kind: 'omni' } },
      update: {},
      create: {
        uuid: `UT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        sourceOrigin: 'omni-pair',
        hashLock: computeHashLock(evidence.id, Date.now(), evidence.label),
        lifecycleHooks: '{}',
        label: evidence.label,
        kind: 'omni',
        omniType: params.omniType ?? 'custom',
        status: 'evidence',
        metadata: JSON.stringify({ omniId: evidence.id }),
      },
    });
  }

  const pair = await prisma.tagPair.create({
    data: {
      uuid: `PAIR-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      sourceOrigin: 'omni-pair',
      hashLock: computeHashLock(anchorDb.id, Date.now(), params.entityId),
      lifecycleHooks: '{}',
      anchorTagId: anchorDb.id,
      evidenceTagId: evidenceDb?.id,
      entityType: params.entityType,
      entityId: params.entityId,
      confidence: params.confidence ?? 1.0,
    },
  });

  // 同步信任層進 Oracle ADB (graceful: 失敗不阻斷主流程)
  if (pair.uuid) {
    syncTagPairToOracle({
      uuid: pair.uuid,
      action: 'TRUST_GRANT',
      timestamp: pair.createdAt?.getTime?.() ?? Date.now(),
    }).catch((e) => console.warn('[UniversalTag] Oracle sync skipped:', e.message));
  }

  return { pairId: pair.id, anchorId: anchorDb.id, evidenceId: evidenceDb?.id };
}

// ── 3. autoPair: 用本地 Gemma 4 分析內容，自動建議標籤配對 ──
export async function autoPair(params: {
  entityType: string;
  entityId: string;
  content: string;
  prompt?: string;
}): Promise<{ paired: boolean; labels: string[]; reason: string }> {
  const server = process.env.LOCAL_GEMMA_SERVER_URL;
  if (!server) {
    return { paired: false, labels: [], reason: 'LOCAL_GEMMA_SERVER_URL not set' };
  }
  const systemPrompt =
    'You are an ESG tagging engine. Given a text, return a JSON array of relevant tags. ' +
    'Each tag: {"label": string, "pillar": "environmental"|"social"|"governance", "confidence": number 0-1}. ' +
    'Return ONLY valid JSON, no prose.';
  const userPrompt = params.prompt ?? `Tag this ${params.entityType}: ${params.content.slice(0, 2000)}`;

  try {
    const res = await fetch(`${server}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: process.env.LOCAL_GEMMA_MODEL || 'qwen3:8b-vision',
        prompt: `${systemPrompt}\n\n${userPrompt}`,
        stream: false,
      }),
    });
    if (!res.ok) return { paired: false, labels: [], reason: `local model http ${res.status}` };

    const data = (await res.json()) as { response?: string; content?: string };
    const raw = data.response || data.content || '';
    // 拆分「思考頻道」與「純淨答案」，並把思考流同步發布到 OmniAgentBus
    // （對齊 5T hashLock 溯源；runId 保證同一次推論的步驟可串接）
    const { thoughts, clean } = splitThinking(raw);
    const runId = `run-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    thoughts.forEach((t, i) =>
      publishThought({ agentId: 'gemma4-local', runId, step: i + 1, content: t }),
    );
    const parsed = extractJsonValue(clean);
    let tags: Array<{ label: string; pillar?: string; confidence?: number }> | null = null;
    if (Array.isArray(parsed)) {
      tags = parsed as Array<{ label: string; pillar?: string; confidence?: number }>;
    } else if (parsed && typeof parsed === 'object') {
      // 也接受 { labels: [...] } / { tags: [...] } 等物件包裝形式
      const obj = parsed as Record<string, unknown>;
      const candidate = obj.labels ?? obj.tags ?? obj.tag ?? obj.results ?? obj.data;
      if (Array.isArray(candidate)) {
        tags = candidate as Array<{ label: string; pillar?: string; confidence?: number }>;
      }
    }
    if (!tags) {
      return { paired: false, labels: [], reason: 'no JSON array in model output' };
    }

    let pairedCount = 0;
    for (const t of tags) {
      const u = await prisma.universalTag.upsert({
        where: { label_kind: { label: t.label, kind: 'esg' } },
        update: {},
        create: {
          uuid: `UT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          sourceOrigin: 'auto-pair',
          hashLock: computeHashLock(t.label, Date.now(), params.entityId),
          lifecycleHooks: '{}',
          label: t.label,
          kind: 'esg',
          status: 'active',
          metadata: JSON.stringify({ pillar: t.pillar ?? 'unknown' }),
        },
      });
      const pairRec = await prisma.tagPair.upsert({
        where: { anchorTagId_entityType_entityId: { anchorTagId: u.id, entityType: params.entityType, entityId: params.entityId } },
        update: { confidence: t.confidence ?? 1.0 },
        create: {
          uuid: `PAIR-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          sourceOrigin: 'auto-pair',
          hashLock: computeHashLock(u.id, Date.now(), params.entityId),
          lifecycleHooks: '{}',
          anchorTagId: u.id,
          entityType: params.entityType,
          entityId: params.entityId,
          confidence: t.confidence ?? 1.0,
        },
      });
      // 同步信任層進 Oracle ADB (graceful: 失敗不阻斷主流程)
      if (pairRec?.uuid) {
        syncTagPairToOracle({
          uuid: pairRec.uuid,
          action: 'TRUST_GRANT',
          timestamp: pairRec.createdAt?.getTime?.() ?? Date.now(),
        }).catch((e) => console.warn('[UniversalTag] Oracle sync skipped:', e.message));
      }
      pairedCount++;
    }
    return { paired: true, labels: tags.map((t) => t.label), reason: `paired ${pairedCount} tags` };
  } catch (e) {
    return { paired: false, labels: [], reason: `error: ${(e as Error).message}` };
  }
}

// ── 4. 查詢實體的所有配對標籤 ───────────────────────────────
export async function getEntityTags(entityType: string, entityId: string) {
  return prisma.tagPair.findMany({
    where: { entityType, entityId },
    include: { anchor: true, evidence: true },
    orderBy: { confidence: 'desc' },
  });
}
