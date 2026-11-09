/**
 * 萬能標籤服務 (Omni Tag Service) — Supabase 收合版
 *
 * 5T Traceable — 從 OmniTag 收合而來：
 *  - 原 Prisma (UniversalTag / ESGTag / TagPair) 全數改為 Supabase。
 *  - 表單對應（prisma → supabase 欄位 snake_case）：
 *       UniversalTag → universal_tags（含 label+kind 唯一鍵）
 *       ESGTag       → esg_tags
 *       TagPair      → tag_pairs
 *  - 回傳形狀一律解構 { data, error }，不再誤當陣列（supabase-js 回傳物件非陣列）。
 *
 * 匯出合約（與 pair / universal route 銜接）：
 *  - createOmniTagPair(params)  → { pairId, anchorId, evidenceId? }
 *  - autoPair(params)           → { paired, labels, reason }
 *  - syncEsgTags()              → { synced, labels }
 *  - getEntityTags(entityType, entityId)
 *  - splitThinking / stripGemma4Thinking / extractJsonValue（純邏輯，無 DB）
 *  - computeHashLock（SHA-256 不可逆封印；Traceable / Hash Lock）
 *
 * 5T 對應：
 *  - Traceable：每次寫入帶 source_origin 來源欄位。
 *  - Trackable：syncEsgTags 逐筆追蹤 universal_tags 是否已存在再 upsert。
 *  - Transparent：查詢失敗回傳 null / []，錯誤訊息落 console。
 *  - Trustworthy：computeHashLock 以 SHA-256 封印 uuid+timestamp+seed。
 */

import { createHash } from 'crypto';
import { supabase } from '@/lib/supabase-omni';
import { syncTagPairToOracle } from './oracle-sync-service';
import { publishThought } from '@/lib/bus';

type TagType = 'GRI' | 'TCFD' | 'TNFD' | 'SDG' | 'custom';
type TagStatus = 'proof-anchor' | 'evidence' | 'verified' | 'archived';

/** 5T Trustworthy: hashLock = SHA-256(uuid + timestamp + seed) 不可逆封印 */
function computeHashLock(uuid: string, timestamp: number, seed: string): string {
  return createHash('sha256').update(`${uuid}|${timestamp}|${seed}`).digest('hex');
}

/* ──────────────── 純邏輯 helper（無 DB，5T Transparent）────────────────────── */

/** 把 Gemma 4 輸出拆分為「思考片段 thoughts」與「純淨答案 clean」。 */
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

/** 清理 Gemma 4 思考頻道與 markdown 圍欄，回傳可供 JSON 解析的純文字。 */
export function stripGemma4Thinking(raw: unknown): string {
  return splitThinking(raw).clean;
}

/** 從模型輸出抽取第一個 JSON 值（物件或陣列）。 */
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

/* ──────────────── 純邏輯容器（無 DB，用於 metadata 追溯）─────────────── */

function makeOmniTag(label: string, type: TagType = 'custom', status: TagStatus = 'proof-anchor') {
  const id = `OTAG-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  return {
    id,
    label,
    type,
    status,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    metadata: {} as Record<string, unknown>,
  };
}

function makeTagPair(anchor: ReturnType<typeof makeOmniTag>, evidence: ReturnType<typeof makeOmniTag>) {
  return {
    anchor,
    evidence,
    pairId: `PAIR-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    createdAt: Date.now(),
  };
}

/* ──────────────────────── Supabase 實作（prisma → supabase）────────────────────── */

/**
 * 同步 ESG 標籤為萬能標籤：
 *  1. 查 esg_tags 取得所有 ESG 標籤
 *  2. 逐一查 universal_tags 是否已存在（label + kind='esg'）
 *  3. 不存在才 insert universal_tags（帶 hash_lock）
 */
export async function syncEsgTags(): Promise<{ synced: number; labels: string[] }> {
  const { data, error } = await supabase
    .from('esg_tags')
    .select('id, name, category, description');

  if (error) {
    console.error('[OmniTag] 查詢 ESG 標籤失敗:', error.message);
    return { synced: 0, labels: [] };
  }

  const esgTags = data ?? [];
  let synced = 0;
  const labels: string[] = [];

  for (const t of esgTags) {
    const { data: existing, error: qErr } = await supabase
      .from('universal_tags')
      .select('id')
      .eq('label', t.name)
      .eq('kind', 'esg')
      .limit(1);

    if (qErr) {
      console.error('[OmniTag] 查詢萬能標籤失敗:', qErr.message);
      continue;
    }

    if (existing && existing.length > 0) {
      continue; // 已存在，略過
    }

    const uuid = `UT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const ts = Date.now();
    const { error: insErr } = await supabase
      .from('universal_tags')
      .insert({
        uuid,
        source_origin: 'esg-sync',
        hash_lock: computeHashLock(uuid, ts, t.name),
        lifecycle_hooks: '{}',
        label: t.name,
        kind: 'esg',
        esg_tag_id: t.id,
        metadata: JSON.stringify({
          pillar: t.category ?? '',
          category: t.category ?? '',
          description: t.description ?? '',
        }),
      });

    if (insErr) {
      console.error('[OmniTag] 建立萬能標籤失敗:', insErr.message);
      continue;
    }

    synced++;
    labels.push(t.name);
  }

  return { synced, labels };
}

/**
 * 建立萬能配對（anchor + evidence）：
 *  1. anchor upsert universal_tags（label + kind='omni' 唯一）
 *  2. evidence（若提供）同理，kind='omni'
 *  3. insert tag_pairs（entityType/entityId）
 *  4. 同步信任層進 Oracle ADB（graceful: 失敗不阻斷主流程）
 */
export async function createOmniTagPair(params: {
  anchorLabel: string;
  evidenceLabel?: string;
  entityType: string;
  entityId: string;
  omniType?: TagType;
  confidence?: number;
}): Promise<{ pairId: string; anchorId: string; evidenceId?: string }> {
  const anchor = makeOmniTag(params.anchorLabel, params.omniType ?? 'custom', 'proof-anchor');
  const evidence = params.evidenceLabel
    ? makeOmniTag(params.evidenceLabel, params.omniType ?? 'custom', 'evidence')
    : null;
  makeTagPair(anchor, evidence ?? anchor);

  // 建立 anchor（upsert: label + kind='omni' 已存在就覆寫，回傳 id）
  const { data: anchorDb, error: aErr } = await supabase
    .from('universal_tags')
    .upsert({
      uuid: `UT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      source_origin: 'omni-pair',
      hash_lock: computeHashLock(anchor.id, Date.now(), anchor.label),
      lifecycle_hooks: '{}',
      label: anchor.label,
      kind: 'omni',
      omni_type: params.omniType ?? 'custom',
      status: 'proof-anchor',
      metadata: JSON.stringify({ omniId: anchor.id }),
    })
    .eq('label', anchor.label)
    .eq('kind', 'omni')
    .select('id')
    .single();

  if (aErr) {
    console.error('[OmniTag] 建立 anchor 失敗:', aErr.message);
    return { pairId: '', anchorId: '' };
  }
  const anchorId = anchorDb?.id as string | undefined;

  // 建立 evidence（若提供）
  let evidenceId: string | undefined;
  if (evidence) {
    const { data: evDb, error: eErr } = await supabase
      .from('universal_tags')
      .upsert({
        uuid: `UT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        source_origin: 'omni-pair',
        hash_lock: computeHashLock(evidence.id, Date.now(), evidence.label),
        lifecycle_hooks: '{}',
        label: evidence.label,
        kind: 'omni',
        omni_type: params.omniType ?? 'custom',
        status: 'evidence',
        metadata: JSON.stringify({ omniId: evidence.id }),
      })
      .eq('label', evidence.label)
      .eq('kind', 'omni')
      .select('id')
      .single();

    if (eErr) {
      console.error('[OmniTag] 建立 evidence 失敗:', eErr.message);
    } else {
      evidenceId = evDb?.id as string | undefined;
    }
  }

  // 寫 tag_pairs
  const pairUuid = `PAIR-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const { error: pErr } = await supabase
    .from('tag_pairs')
    .insert({
      uuid: pairUuid,
      source_origin: 'omni-pair',
      hash_lock: computeHashLock(anchorId ?? '', Date.now(), params.entityId),
      lifecycle_hooks: '{}',
      anchor_tag_id: anchorId,
      evidence_tag_id: evidenceId,
      entity_type: params.entityType,
      entity_id: params.entityId,
      confidence: params.confidence ?? 1.0,
    });

  if (pErr) {
    console.error('[OmniTag] 建立配對失敗:', pErr.message);
    return { pairId: '', anchorId: anchorId ?? '', evidenceId };
  }

  // 同步信任層進 Oracle ADB（graceful: 失敗不阻斷主流程）
  syncTagPairToOracle({
    uuid: pairUuid,
    action: 'TRUST_GRANT',
    timestamp: Date.now(),
  }).catch((e) => console.warn('[OmniTag] Oracle sync skipped:', (e as Error).message));

  return { pairId: pairUuid, anchorId: anchorId ?? '', evidenceId };
}

/**
 * autoPair：用本地 Gemma 4 分析內容，自動建議標籤配對。
 *  1. 經 LOCAL_GEMMA_SERVER_URL 取得 JSON 標籤陣列
 *  2. 拆分思考頻道、廣播 thoughts、抽取 JSON
 *  3. 每個標籤 upsert universal_tags（label + kind='esg'）
 *  4. 每個標籤 upsert tag_pairs（anchor_tag_id + entityType + entityId）
 */
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
    'Each tag: {"label": string, "pillar": "environmental" | "social" | "governance", "confidence": number 0-1}. ' +
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

    if (!res.ok) {
      return { paired: false, labels: [], reason: `local model http ${res.status}` };
    }

    const data = (await res.json()) as { response?: string; content?: string };
    const raw = data.response || data.content || '';
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
      const { data: uDb, error: uErr } = await supabase
        .from('universal_tags')
        .upsert({
          uuid: `UT-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          source_origin: 'auto-pair',
          hash_lock: computeHashLock(t.label, Date.now(), params.entityId),
          lifecycle_hooks: '{}',
          label: t.label,
          kind: 'esg',
          status: 'active',
          metadata: JSON.stringify({ pillar: t.pillar ?? 'unknown' }),
        })
        .eq('label', t.label)
        .eq('kind', 'esg')
        .select('id')
        .single();

      if (uErr) {
        console.error('[OmniTag] autoPair 建立萬能標籤失敗:', uErr.message);
        continue;
      }
      const uId = uDb?.id as string | undefined;
      if (!uId) continue;

      const pairUuid = `PAIR-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const { error: pErr } = await supabase
        .from('tag_pairs')
        .upsert({
          uuid: pairUuid,
          source_origin: 'auto-pair',
          hash_lock: computeHashLock(uId, Date.now(), params.entityId),
          lifecycle_hooks: '{}',
          anchor_tag_id: uId,
          entity_type: params.entityType,
          entity_id: params.entityId,
          confidence: t.confidence ?? 1.0,
        });

      if (pErr) {
        console.error('[OmniTag] autoPair 建立配對失敗:', pErr.message);
        continue;
      }

      syncTagPairToOracle({
        uuid: pairUuid,
        action: 'TRUST_GRANT',
        timestamp: Date.now(),
      }).catch((e) => console.warn('[OmniTag] Oracle sync skipped:', (e as Error).message));

      pairedCount++;
    }

    return { paired: true, labels: tags.map((t) => t.label), reason: `paired ${pairedCount} tags` };
  } catch (e) {
    return { paired: false, labels: [], reason: `error: ${(e as Error).message}` };
  }
}

/**
 * 查詢實體的所有配對標籤（按 confidence desc）。
 * Supabase 轉換：prisma tagPair.findMany({ where:{entityType,entityId}, orderBy:{confidence:'desc'} })
 */
export async function getEntityTags(entityType: string, entityId: string) {
  const { data, error } = await supabase
    .from('tag_pairs')
    .select('*')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .order('confidence', { ascending: false });

  if (error) {
    console.error('[OmniTag] 取得實體標籤失敗:', error.message);
    return [];
  }
  return data ?? [];
}
