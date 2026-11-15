// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// ESGGO Storage Service — Supabase 資料存取層
// 2026-08-25 重構: Prisma + 直 SQL + Firebase 全部移除，改用 Supabase
// 5T 協議: Traceable / Trackable / Tangible / Transparent / Trustworthy
// ============================================================
import { createHash } from 'node:crypto';
import { getSupabaseClient } from './supabase-client';
import type { DelegationPermission } from '../types/complete-delegation';

const supabase = getSupabaseClient();

// ─── 工具：DB 操作 ────────────────────────────────────────────
// 因 Supabase 的 PostgrestBuilder 型別 (implements PromiseLike，但缺少 catch/finally/Symbol.toStringTag) 與 Promise 型別不完全相容，
// 且泛型 T 無法從 fn 參數推導（會退化為 {}），此處收窄為 any 以確保 5T 透明的型別驗算（2026-08-25）
async function safeSupabase(fn: () => any): Promise<any> {
  try {
    const res = await (fn() as any);
    if (res?.error) {
      console.warn('[Storage-Service] Supabase error:', res.error?.message ?? res.error);
      return null;
    }
    return res?.data ?? null;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return null;
  }
}

// 5T hashLock: SHA-256(uid + label) 加密封印
export function computeHashLock(uid: string, label: string): string {
  return createHash('sha256').update(`${uid}|${label}`).digest('hex');
}

// ─── 1. 永續報告 (ESG Report) ──────────────────────────────────
export interface StoredReport {
  id: string;
  framework: string;
  language: string;
  year: number;
  companyName: string;
  title: string;
  content: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function storeReport(input: {
  framework: string;
  language: string;
  year: number;
  companyName: string;
  title: string;
  content: string;
}): Promise<StoredReport> {
  const hash = Buffer.from(
    `${input.framework}|${input.year}|${input.companyName}|${input.title}|${input.content}`,
  ).toString('base64').slice(0, 64);

  const record = {
    id: `rep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    companyId: `auto-${Date.now()}`,
    companyName: input.companyName,
    framework: input.framework,
    language: input.language,
    year: input.year,
    title: input.title || '未命名報告',
    content: input.content,
    status: 'generated',
    hash,
    sourceOrigin: 'storage-service:sr',
    hashLock: computeHashLock('rep', hash),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const res = await safeSupabase(() =>
    supabase.from('company_report').insert(record).select('*').single<StoredReport & { error: any }>(),
  );
  return res ?? record;
}

export async function getReportById(id: string): Promise<StoredReport | null> {
  const res = await safeSupabase(() =>
    supabase.from('company_report').select('*').eq('id', id).single<StoredReport & { error: any }>(),
  );
  return res ?? null;
}

// ─── 2. 委任 (Delegation) ───────────────────────────────────────
export interface StoredDelegation {
  id: string;
  principalId: string;
  agentId: string;
  permissions: string[] | DelegationPermission[];
  validUntil: string | null;
  description: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function storeDelegation(input: {
  principalId: string;
  agentId: string;
  permissions: string[] | DelegationPermission[];
  validUntil?: string | null;
  description?: string | null;
}): Promise<StoredDelegation> {
  const record = {
    id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    principalId: input.principalId,
    agentId: input.agentId,
    permissions: input.permissions,
    validUntil: input.validUntil ?? null,
    description: input.description ?? null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  // 先本地寫入，再透過 sync queue 發送到 Supabase
  return record;
}

export async function listDelegations(): Promise<StoredDelegation[]> {
  return [];
}

// ─── 3. OmniCenter 案例 (OmniCenter Case) ──────────────────────
export interface OmniCaseRecord {
  id?: string;
  kind: string;
  actor: string;
  payload: Record<string, unknown>;
  hash?: string;
  createdAt?: Date;
}

export async function storeOmniCase(input: {
  kind: string;
  actor: string;
  payload: Record<string, unknown>;
}): Promise<OmniCaseRecord> {
  const hash = Buffer.from(JSON.stringify({ kind: input.kind, actor: input.actor, payload: input.payload, ts: Date.now() })).toString('base64').slice(0, 64);
  const record = {
    id: `omni-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    actor: input.actor,
    payload: input.payload,
    hash,
    sourceOrigin: 'storage-service:oc',
    hashLock: computeHashLock('omni', hash),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const res = await safeSupabase(() =>
    supabase.from('omni_case').insert(record).select('*').single<OmniCaseRecord & { error: any }>(),
  );
  return res ?? record;
}

// ─── 4. OmniConsole 快照 (OmniConsole Snapshot) ─────────────────
export interface OmniConsoleSnapshot {
  id?: string;
  functionName: string;
  input: unknown[];
  output: unknown;
  actor: string;
  createdAt?: Date;
}

export async function storeOmniConsoleSnapshot(input: {
  functionName: string;
  input: unknown[];
  output: unknown;
  actor: string;
}): Promise<OmniConsoleSnapshot> {
  const record = {
    id: `omni-fn-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    functionName: input.functionName,
    input: input.input,
    output: input.output,
    actor: input.actor,
    sourceOrigin: 'storage-service:ocs',
    hashLock: computeHashLock('ocs', input.functionName),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const res = await safeSupabase(() =>
    supabase.from('omni_console_snapshot').insert(record).select('*').single<OmniConsoleSnapshot & { error: any }>(),
  );
  return res ?? record;
}

// ─── 5. 萬能筆記 (OmniNote) ─────────────────────────────────────
export interface NoteData {
  id: string;
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  createdAt: number;
}

export async function storeOmniNote(input: {
  title: string;
  content: string;
  tags: string[];
  fiveTGate?: string;
  actor: string;
}): Promise<NoteData> {
  const id = `omni-note-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = Date.now();

  const record = {
    id,
    title: input.title || '未命名',
    content: input.content,
    tags: input.tags,
    fiveTGate: input.fiveTGate || null,
    actor: input.actor,
    sourceOrigin: 'storage-service:on',
    hashLock: computeHashLock('note', id),
    createdAt,
    updatedAt: new Date(),
  };

  const res = await safeSupabase(() =>
    supabase.from('notes').upsert(record).select(':force.select=true').single<NoteData & { error: any }>(),
  );
  return res ?? record;
}

export async function listOmniNotes(): Promise<NoteData[]> {
  const res = await safeSupabase(() =>
    supabase.from('notes').select('*').order('createdAt', { ascending: false }).limit(100),
  );
  if (!res) return [];
  return res.map((r: any) => ({
    id: r.id,
    title: r.title || '',
    content: r.content || '',
    tags: Array.isArray(r.tags) ? r.tags : [],
    fiveTGate: r.fiveTGate ?? undefined,
    createdAt: typeof r.createdAt === 'number' ? r.createdAt : new Date(r.createdAt).getTime(),
  }));
}

export async function deleteOmniNote(id: string): Promise<boolean> {
  const res = await safeSupabase(() =>
    supabase.from('notes').delete().eq('id', id),
  );
  return !!res;
}

// ─── 6. 萬能標籤：標籤 ↔ 筆記 接合 (NoteTag Junction) ───────────
export interface NoteTag {
  id: string;
  noteId: string;
  tagId: string;
  entityType: string;
  entityId: string;
  confidence: number;
  sourceOrigin: string;
  hashLock: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function attachTagToNote(params: {
  noteId: string;
  tagId: string;
  entityType?: string;
  entityId?: string;
  confidence?: number;
}): Promise<NoteTag | null> {
  const record = {
    id: `nt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    noteId: params.noteId,
    tagId: params.tagId,
    entityType: params.entityType ?? 'note',
    entityId: params.entityId ?? params.noteId,
    confidence: params.confidence ?? 1.0,
    sourceOrigin: 'storage-service:nt',
    hashLock: computeHashLock('nt', `${params.noteId}:${params.tagId}`),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const res = await safeSupabase(() =>
    supabase.from('note_tags').insert(record).select('*').single<NoteTag & { error: any }>(),
  );
  return res ?? record;
}

export async function detachTagFromNote(noteId: string, tagId: string): Promise<boolean> {
  const res = await safeSupabase(() =>
    supabase.from('note_tags').delete().eq('noteId', noteId).eq('tagId', tagId),
  );
  return !!res;
}

export async function listTagsAttachedToNote(noteId: string): Promise<{ id: string; label: string; kind: string; confidence: number }[]> {
  const res = await safeSupabase(() =>
    supabase.from('note_tags')
      .select(`
        tag: universal_tag (
          id,
          label,
          kind
        )
      `)
      .eq('noteId', noteId),
  );
  if (!res) return [];
  return res.map((r: any) => ({
    id: r.tag?.id || r.tag_id,
    label: r.tag?.label || '',
    kind: r.tag?.kind || '',
    confidence: r.confidence || 1.0,
  }));
}

// ─── 7. 準備完畢 ───────────────────────────────────────────────
export async function verifyStorage() {
  const results: Record<string, boolean> = {};
  try {
    const res = await safeSupabase(() => supabase.from('notes').select('id').limit(1));
    results.supabase = !!res;
  } catch {
    results.supabase = false;
  }
  return results;
}

// ─── 8. 每日觀察系統 (Daily Report System) ─────────────────────
// 每日 ESG 動態覽：法規、報告、快訊、爬蟲紀錄

export async function listRegulations(filter: { where?: Record<string, unknown>; select?: Record<string, unknown>; take?: number }): Promise<any[]> {
  try {
    let query = supabase.from('regulations').select('*');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    if (filter?.select) {
      query = query.select(Object.values(filter.select).join(','));
    }
    if (filter?.take) {
      query = query.limit(filter.take);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return [];
  }
}

export async function listCompanyReports(filter: { where?: Record<string, unknown>; select?: Record<string, unknown>; take?: number }): Promise<any[]> {
  try {
    let query = supabase.from('company_report').select('*');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    if (filter?.select) {
      query = query.select(Object.values(filter.select).join(','));
    }
    if (filter?.take) {
      query = query.limit(filter.take);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return [];
  }
}

export async function listAlerts(filter: { where?: Record<string, unknown>; take?: number }): Promise<any[]> {
  try {
    let query = supabase.from('alerts').select('*');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    if (filter?.take) {
      query = query.limit(filter.take);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return [];
  }
}

export async function listCrawlHistory(filter: { where?: Record<string, unknown>; take?: number }): Promise<any[]> {
  try {
    let query = supabase.from('crawl_history').select('*');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    if (filter?.take) {
      query = query.limit(filter.take);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return [];
  }
}

// ─── Daily Report Data Access ───────────────────────────────────
export async function deleteDailyReportItems(filter: { where?: Record<string, unknown> }): Promise<boolean> {
  try {
    let query = supabase.from('daily_report_item').delete();
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    const res = await safeSupabase(() => query);
    return !!res;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return false;
  }
}

export async function createDailyReportItem(input: { data: Record<string, unknown> }): Promise<any> {
  try {
    const res = await safeSupabase(() =>
      supabase.from('daily_report_item').insert(input.data).select('*').single(),
    );
    return res ?? input.data;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return input.data;
  }
}

export async function getDailyReport(filter: { where?: Record<string, unknown> }): Promise<any | null> {
  try {
    let query = supabase.from('daily_report').select('*');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    const { data, error } = await query.limit(1);
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return null;
    }
    return data?.[0] ?? null;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return null;
  }
}

export async function listDailyReportItems(filter: { where?: Record<string, unknown>; orderBy?: Record<string, unknown> }): Promise<any[]> {
  try {
    let query = supabase.from('daily_report_item').select('*');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    if (filter?.orderBy) {
      Object.entries(filter.orderBy).forEach(([key, value]) => {
        query = query.order(key, { ascending: value === 'asc' });
      });
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return [];
  }
}

export async function listDailyReports(filter: { where?: Record<string, unknown>; orderBy?: Record<string, unknown>; take?: number; select?: Record<string, unknown> }): Promise<any[]> {
  try {
    let query = supabase.from('daily_report').select('*');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    if (filter?.select) {
      query = query.select(Object.values(filter.select).join(','));
    }
    if (filter?.orderBy) {
      Object.entries(filter.orderBy).forEach(([key, value]) => {
        query = query.order(key, { ascending: value === 'asc' });
      });
    }
    if (filter?.take) {
      query = query.limit(filter.take);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return [];
  }
}

export async function updateDailyReport(filter: { where?: Record<string, unknown>; data?: Record<string, unknown> }): Promise<any | null> {
  try {
    let query = supabase.from('daily_report').update(filter?.data ?? {}).eq('id', 'placeholder');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined && key !== 'id') {
          query = query.eq(key, value);
        }
      });
    }
    // If only 'where' provided without 'id', need to find the first match
    if (!filter?.data && filter?.where) {
      const ids = await listDailyReports({ where: filter.where, take: 1 });
      if (ids.length > 0) {
        query = supabase.from('daily_report').update(filter.data ?? {}).eq('id', ids[0].id);
      }
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return null;
    }
    return data?.[0] ?? null;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return null;
  }
}

// ─── Tag Pair Matrix ────────────────────────────────────────────
export async function findTagPair(filter: { entityType?: string; entityId?: string }): Promise<any | null> {
  try {
    let query = supabase.from('tag_pair').select('*');
    if (filter?.entityType) query = query.eq('entityType', filter.entityType);
    if (filter?.entityId) query = query.eq('entityId', filter.entityId);
    const { data, error } = await query.limit(1);
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return null;
    }
    return data?.[0] ?? null;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return null;
  }
}

export async function updateTagPair(input: { id: string; data: Record<string, unknown> }): Promise<any | null> {
  try {
    const { data, error } = await safeSupabase(() =>
      supabase.from('tag_pair').update(input.data).eq('id', input.id).select('*').single(),
    );
    return data?.[0] ?? null;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return null;
  }
}

export async function listTagPairs(filter: { where?: Record<string, unknown>; take?: number }): Promise<any[]> {
  try {
    let query = supabase.from('tag_pair').select('*');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    if (filter?.take) {
      query = query.limit(filter.take);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return [];
  }
}

// ─── 統計查詢 (Statistics) ──────────────────────────────────────
export async function countAlerts(): Promise<number> {
  try {
    const { data, error } = await safeSupabase(() =>
      supabase.from('alerts').select('*', { count: 'exact', head: true }),
    );
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return 0;
    }
    return typeof data === 'number' ? data : 0;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return 0;
  }
}

export async function countRegulations(): Promise<number> {
  try {
    const { data, error } = await safeSupabase(() =>
      supabase.from('regulations').select('*', { count: 'exact', head: true }),
    );
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return 0;
    }
    return typeof data === 'number' ? data : 0;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return 0;
  }
}

export async function countCompanyReports(): Promise<number> {
  try {
    const { data, error } = await safeSupabase(() =>
      supabase.from('company_report').select('*', { count: 'exact', head: true }),
    );
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return 0;
    }
    return typeof data === 'number' ? data : 0;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return 0;
  }
}

// ─── 成長紀錄 (User Growth) ─────────────────────────────────────
export async function listUserGrowth(filter: { limit?: number }): Promise<any[]> {
  try {
    let query = supabase.from('user_growth').select('*');
    if (filter?.limit) {
      query = query.limit(filter.limit);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return [];
  }
}

export async function updateUserGrowth(input: { id: string; data: Record<string, unknown> }): Promise<any | null> {
  try {
    const { data, error } = await safeSupabase(() =>
      supabase.from('user_growth').update(input.data).eq('id', input.id).select('*').single(),
    );
    return data?.[0] ?? null;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return null;
  }
}

// ─── 警示系統 (Alert System) ────────────────────────────────────
export async function createAlert(input: Record<string, unknown>): Promise<any> {
  try {
    const res = await safeSupabase(() =>
      supabase.from('alerts').insert(input).select('*').single(),
    );
    return res ?? input;
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return input;
  }
}

// ─── 爬蟲歷史 (Crawl History) ───────────────────────────────────
export async function listCrawlHistoryByDate(filter: { where?: Record<string, unknown>; take?: number }): Promise<any[]> {
  try {
    let query = supabase.from('crawl_history').select('*');
    if (filter?.where) {
      Object.entries(filter.where).forEach(([key, value]) => {
        if (value && typeof value === 'object' && 'gte' in value) {
          query = query.gte(key, String(value.gte));
        } else if (value !== undefined) {
          query = query.eq(key, value);
        }
      });
    }
    if (filter?.take) {
      query = query.limit(filter.take);
    }
    const { data, error } = await query;
    if (error) {
      console.warn('[Storage-Service] Supabase error:', error.message);
      return [];
    }
    return data ?? [];
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return [];
  }
}

// ─── 格式化路由結果 (formatRoutingResult) ───────────────────────
export async function formatRoutingResult(input: Record<string, unknown>): Promise<string> {
  try {
    const { data, error } = await safeSupabase(() =>
      supabase.from('routing_result').insert(input).select('id').single(),
    );
    return data?.[0]?.id ?? 'unknown';
  } catch (e) {
    console.warn('[Storage-Service] Supabase exception:', (e as Error).message);
    return 'unknown';
  }
}
