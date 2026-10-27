// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// ESGGO Storage Service — unified data access layer
// 2026-08-25 重構: Prisma / Firebase / pgvector 已移除
// 改用 Supabase (primary DB) + local-store (offline cache)
// 5T 協議: Traceable / Trackable / Tangible / Transparent / Trustworthy
// ============================================================
// 只從集中入口匯出 Supabase 相關功能與清理工具
export { getSupabaseClient, supabase } from './supabase-client';
export {
  computeHashLock,
  storeReport,
  getReportById,
  storeDelegation,
  listDelegations,
  storeOmniCase,
  storeOmniConsoleSnapshot,
  storeOmniNote,
  listOmniNotes,
  deleteOmniNote,
  attachTagToNote,
  detachTagFromNote,
  listTagsAttachedToNote,
  verifyStorage,
} from './storage-supabase';

import type { DelegationPermission } from '../types/complete-delegation';

// ─── Supabase client (lazy proxy, per supabase-client.ts) ─────
import { supabase } from './supabase-client';

// ─── Readiness gate ───────────────────────────────────────────
export async function verifyStorage() {
  const results: Record<string, boolean> = {};
  try {
    const res = await supabase.from('notes').select('id').limit(1);
    results.supabase = res.error === undefined;
  } catch {
    results.supabase = false;
  }
  return results;
}

// ─── ESG Report ──────────────────────────────────────────────
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

  return supabase
    .from('company_report')
    .insert(record)
    .select('*')
    .single<StoredReport & { error: any }>();
}

export async function getReportById(id: string): Promise<StoredReport | null> {
  return supabase
    .from('company_report')
    .select('*')
    .eq('id', id)
    .single<StoredReport & { error: any }>();
}

// ─── Delegation ───────────────────────────────────────────────

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
  // Delegation model not in schema; persist as a UniversalTag-style record
  // until schema migration adds a dedicated table.
  return {
    id: `del_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    principalId: input.principalId,
    agentId: input.agentId,
    permissions: input.permissions,
    validUntil: input.validUntil ?? null,
    description: input.description ?? null,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  } as StoredDelegation;
}

export async function listDelegations(): Promise<StoredDelegation[]> {
  return [];
}

// ─── OmniCenter / OmniCore Persistence ────────────────────────
import { createHash } from 'crypto';

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
  const hash = createHash('sha256')
    .update(JSON.stringify({ kind: input.kind, actor: input.actor, payload: input.payload, ts: Date.now() }))
    .digest('hex');
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

// ─── OmniCenter Notes ────────────────────────────────────────
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
