/* eslint-disable @typescript-eslint/no-explicit-any */
// ============================================================
// Oracle ADB Sync Service — 萬能標籤配對合成層的 Oracle 雙向同步
// src/core/tags/oracle-sync-service.ts
// ============================================================
// 呼叫 scripts/oracle-sync.py (oci-cli venv 的 oracledb thin mode)
// 將 TagPair 雙向同步進 OMNI_TRUST_LEDGER (hash-chain) + 終始矩陣 sync_matrix。
//
// 雙向同步模型 (全域 / 全端 / 全量 / 終始矩陣)：
//   - 全域 (global):      涵蓋所有實體 (universalTag / tagPair / regulation / profile)
//   - 全端 (every-end):   所有 entry point (API / cron / 啟動 / agent) 都走同一合約
//   - 全量 (full-volume): 整表級對帳, 非單筆 per-request
//   - 雙向 (bidirectional): app->oracle 寫入 + oracle->app 回拉 (hydration)
//   - 終始矩陣 (origin-terminal matrix): 每實體追蹤 origin_seq / terminal_seq / status
//
// 前置（VPS 需具備，否則 graceful skip）：
//   - OMNI_DB_PWD 設於 gateway/app .env
//   - OMNI_PYTHON 指向 oci-cli venv python (含 oracledb) — 必須絕對路徑 (execFile 不展開 ~)
//   - ~/.oci/config + pem (OCI CLI 憑證)
//   - ADB wallet 下載至 OMNI_WALLET_DIR

import { execFile } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);
const SCRIPT = path.resolve(process.cwd(), 'scripts/oracle-sync.py');
// execFile 不經 shell, ~ 不會展開 -> 用 os.homedir() 兜底 (避免 ENOENT 靜默 skip)
const PYTHON = (process.env.OMNI_PYTHON || 'python3').replace(/^~/, os.homedir());

export function hasOracleCreds(): boolean {
  return !!process.env.OMNI_DB_PWD;
}

export interface OracleSyncResult {
  ok: boolean;
  synced?: number;
  reason?: string;
}

// 終始矩陣單筆狀態 — 雙向對帳的核心資料結構
export type SyncStatus =
  | 'synced'        // 一致
  | 'behind_app'    // Oracle 有新增, app 落後 -> 應 pull oracle->app
  | 'behind_oracle' // app 有新增, Oracle 落後 -> 應 push app->oracle
  | 'conflict'      // 雙方皆非 0 且 hash 不一致 -> 不強蓋, 報警
  | 'frozen';       // 人工凍結, 停止自動同步

export interface SyncMatrixRow {
  uuid: string;
  originSeq: number;   // 源端 (app/Prisma) 最後寫入序號
  terminalSeq: number; // 端端 (Oracle) 最後確認序號
  status: SyncStatus;
  direction: 'app->oracle' | 'oracle->app' | 'bidirectional';
}

export interface ReconcileResult {
  ok: boolean;
  summary: { total: number; synced: number; behindApp: number; behindOracle: number };
  push: SyncMatrixRow[]; // => caller 應 push app->oracle
  pull: SyncMatrixRow[]; // => caller 應 pull oracle->app
  matrix: SyncMatrixRow[];
}

// 初始化 Oracle schema (建 omni_trust/omni_profile/omni_lifecycle + 表, 含 sync_matrix)
export async function initOracleSchema(): Promise<OracleSyncResult> {
  if (!hasOracleCreds()) {
    return { ok: false, reason: 'OMNI_DB_PWD not set — skipping Oracle init' };
  }
  try {
    const { stdout } = await execFileAsync(PYTHON, [SCRIPT, 'init'], {
      env: { ...process.env },
      timeout: 60000,
    });
    const out = JSON.parse(stdout.trim());
    return { ok: !!out.ok, reason: out.ok ? undefined : out.error };
  } catch (e) {
    return { ok: false, reason: `oracle init failed: ${(e as Error).message}` };
  }
}

// 確保終始矩陣表存在 (冪等)
export async function ensureSyncMatrix(): Promise<OracleSyncResult> {
  if (!hasOracleCreds()) {
    return { ok: false, reason: 'OMNI_DB_PWD not set — skipping matrix init' };
  }
  try {
    const { stdout } = await execFileAsync(PYTHON, [SCRIPT, 'matrix'], {
      env: { ...process.env },
      timeout: 60000,
    });
    const out = JSON.parse(stdout.trim());
    return { ok: !!out.ok, reason: out.ok ? undefined : out.error };
  } catch (e) {
    return { ok: false, reason: `oracle matrix init failed: ${(e as Error).message}` };
  }
}

// 同步一組 TagPair 進 Oracle (hash-chain 信任帳本) — app->oracle 寫入端
export async function syncTagPairToOracle(pair: {
  pairId?: string;
  anchorId?: string;
  uuid?: string;
  action?: string;
  timestamp?: number;
}): Promise<OracleSyncResult> {
  if (!hasOracleCreds()) {
    return { ok: false, reason: 'OMNI_DB_PWD not set — skipping Oracle sync' };
  }
  try {
    const { stdout } = await execFileAsync(PYTHON, [SCRIPT, 'sync', JSON.stringify(pair)], {
      env: { ...process.env },
      timeout: 60000,
    });
    const out = JSON.parse(stdout.trim());
    return { ok: !!out.ok, reason: out.ok ? undefined : out.error };
  } catch (e) {
    return { ok: false, reason: `oracle sync failed: ${(e as Error).message}` };
  }
}

// 雙向讀取端 — 全量回拉 omni_trust.entry (Oracle->app hydration 用)
export async function pullFromOracle(limit = 0): Promise<{ ok: boolean; count: number; entries: any[]; reason?: string }> {
  if (!hasOracleCreds()) {
    return { ok: false, count: 0, entries: [], reason: 'OMNI_DB_PWD not set — skipping pull' };
  }
  try {
    const args = limit > 0 ? [SCRIPT, 'read', String(limit)] : [SCRIPT, 'read'];
    const { stdout } = await execFileAsync(PYTHON, args, {
      env: { ...process.env },
      timeout: 60000,
    });
    const out = JSON.parse(stdout.trim());
    return { ok: !!out.ok, count: out.count ?? 0, entries: out.entries ?? [], reason: out.ok ? undefined : out.error };
  } catch (e) {
    return { ok: false, count: 0, entries: [], reason: `oracle pull failed: ${(e as Error).message}` };
  }
}

// 雙向對帳 — 比對 app 端 origin_seq vs Oracle 端 terminal_seq
// entities: [{ uuid, originSeq, terminalSeq, direction? }]
//   回傳 push (behind_oracle) / pull (behind_app) 清單 + 全矩陣
export async function reconcileBidirectional(
  entities: Array<{ uuid: string; originSeq: number; terminalSeq: number; direction?: SyncMatrixRow['direction'] }>,
  autoWrite = false,
): Promise<ReconcileResult> {
  if (!hasOracleCreds()) {
    return {
      ok: false,
      summary: { total: entities.length, synced: 0, behindApp: 0, behindOracle: 0 },
      push: [],
      pull: [],
      matrix: [],
    };
  }
  const payload = {
    entities: entities.map((e) => ({
      uuid: e.uuid,
      origin_seq: e.originSeq,
      terminal_seq: e.terminalSeq,
      direction: e.direction ?? 'bidirectional',
    })),
    auto: autoWrite,
  };
  try {
    const { stdout } = await execFileAsync(PYTHON, [SCRIPT, 'reconcile', JSON.stringify(payload)], {
      env: { ...process.env },
      timeout: 60000,
    });
    const out = JSON.parse(stdout.trim());
    const toRow = (r: any): SyncMatrixRow => ({
      uuid: r.uuid,
      originSeq: r.origin_seq,
      terminalSeq: r.terminal_seq,
      status: r.status,
      direction: r.direction ?? 'bidirectional',
    });
    return {
      ok: !!out.ok,
      summary: {
        total: out.summary?.total ?? entities.length,
        synced: out.summary?.synced ?? 0,
        behindApp: out.summary?.behind_app ?? 0,
        behindOracle: out.summary?.behind_oracle ?? 0,
      },
      push: (out.push ?? []).map(toRow),
      pull: (out.pull ?? []).map(toRow),
      matrix: (out.matrix ?? []).map(toRow),
    };
  } catch (e) {
    return {
      ok: false,
      summary: { total: entities.length, synced: 0, behindApp: 0, behindOracle: 0 },
      push: [],
      pull: [],
      matrix: [],
      reason: `reconcile failed: ${(e as Error).message}`,
    } as ReconcileResult & { reason?: string };
  }
}

// 寫入單筆終始矩陣狀態 (對帳後固化)
export async function upsertSyncMatrix(row: SyncMatrixRow): Promise<OracleSyncResult> {
  if (!hasOracleCreds()) {
    return { ok: false, reason: 'OMNI_DB_PWD not set — skipping matrix upsert' };
  }
  // 複用 reconcile 的 auto 路徑: 傳單筆 entities + auto=true
  try {
    const payload = {
      entities: [{ uuid: row.uuid, origin_seq: row.originSeq, terminal_seq: row.terminalSeq, direction: row.direction }],
      auto: true,
    };
    const { stdout } = await execFileAsync(PYTHON, [SCRIPT, 'reconcile', JSON.stringify(payload)], {
      env: { ...process.env },
      timeout: 60000,
    });
    const out = JSON.parse(stdout.trim());
    return { ok: !!out.ok, reason: out.ok ? undefined : out.error };
  } catch (e) {
    return { ok: false, reason: `matrix upsert failed: ${(e as Error).message}` };
  }
}
