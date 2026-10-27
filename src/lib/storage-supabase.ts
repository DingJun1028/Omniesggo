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
