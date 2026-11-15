// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
 
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
  // ─── Daily Report System ────────────────────────────────
  listRegulations,
  listCompanyReports,
  listAlerts,
  listDailyReports,
  listDailyReportItems,
  deleteDailyReportItems,
  createDailyReportItem,
  getDailyReport,
  createDailyReport,
  updateDailyReport,
  // ─── Tag Pair Matrix ─────────────────────────────────────
  findTagPair,
  updateTagPair,
  listTagPairs,
  // ─── 統計查詢 ─────────────────────────────────────────────
  countAlerts,
  countRegulations,
  countCompanyReports,
  // ─── 成長紀錄 ─────────────────────────────────────────────
  listUserGrowth,
  updateUserGrowth,
  // ─── 警示系統 ─────────────────────────────────────────────
  createAlert,
  // ─── 爬蟲歷史 ─────────────────────────────────────────────
  listCrawlHistory,
} from './storage-supabase';

import type { DelegationPermission } from '../types/complete-delegation';

// ─── Supabase client (lazy proxy, per supabase-client.ts) ─────
import { supabase } from './supabase-client';
// NOTE: Prisma 已全面停用（2026-08-25 Supabase 遷移）。此 barrel 不再匯出 prisma，
// 需要計數的呼叫端請改用 storage-supabase 的 count* / list* Supabase 函式。

// ─── Readiness gate ───────────────────────────────────────────
// NOTE: 實作請以 src/lib/storage-supabase.ts 的 verifyStorage 為唯一正本（與 Supabase 收合一致）。
// 此處為歷史重複定義，已移除；barrel 會從 storage-supabase 匯出單一版本。

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



export interface OmniConsoleSnapshot {
  id?: string;
  functionName: string;
  input: unknown[];
  output: unknown;
  actor: string;
  createdAt?: Date;
}



// ─── OmniCenter Notes ────────────────────────────────────────





