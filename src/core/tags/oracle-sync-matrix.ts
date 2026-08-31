/* eslint-disable @typescript-eslint/no-unused-vars */
// ============================================================
// Oracle 雙向同步協調器 — 終始矩陣 / hydration / 定時對帳
// src/core/tags/oracle-sync-matrix.ts
// ============================================================
// 全域全端全量雙向同步的協調層：
//   1. hydrateFromOracle()  — 啟動時從 Oracle 全量 replay (oracle->app 回拉)
//   2. reconcileAll()       — 定時對帳: 比對 app origin_seq vs Oracle terminal_seq
//   3. pushBehindOracle()   — 把 app 落後的實體補推 Oracle (app->oracle)
//   4. pullBehindApp()      — 把 Oracle 落後的實體補拉 app (oracle->app)
//
// 設計原則：
//   - append-only ledger (omni_trust.entry) 不 merge, 衝突不強蓋, 只報警
//   - 每實體一筆 sync_matrix 狀態, 對帳後固化
//   - graceful skip: 無 OMNI_DB_PWD 時全部 no-op (不阻斷主流程)

import { prisma } from '@/lib/storage-service';
import {
  hasOracleCreds,
  pullFromOracle,
  reconcileBidirectional,
  syncTagPairToOracle,
  ensureSyncMatrix,
  type SyncMatrixRow,
} from './oracle-sync-service';

// ── 1. hydration: 啟動從 Oracle 全量回拉, 重組 app 端信任狀態 ──────────
// Oracle 是信任帳本 source of truth。esggo-core 啟動時 replay 全量 entry,
// 把 Oracle 已知的 uuid/action 標記回 app (universalTag/tagPair 的 sourceOrigin)。
// 注意: Oracle entry 只存 uuid+action+hash, 不存 app 欄位內容;
//       hydration 僅補齊「Oracle 已確認但 app 本地缺失」的信任標記, 不覆寫 app 既有資料。
export interface HydrationResult {
  ok: boolean;
  pulled: number;
  matched: number;
  reason?: string;
}

export async function hydrateFromOracle(): Promise<HydrationResult> {
  if (!hasOracleCreds()) {
    return { ok: false, pulled: 0, matched: 0, reason: 'OMNI_DB_PWD not set — skip hydration' };
  }
  const res = await pullFromOracle(0); // 全量
  if (!res.ok) {
    return { ok: false, pulled: 0, matched: 0, reason: res.reason };
  }
  let matched = 0;
  for (const entry of res.entries as Array<{ uuid?: string; seq?: number }>) {
    const uuid = entry.uuid;
    if (!uuid) continue;
    // 在 app 端標記此 uuid 的實體為「Oracle 已確認」(sourceOrigin 補 oracle-confirmed)
    // 若 app 本地已有該 uuid 的 tagPair/universalTag, 更新其 lifecycleHooks 補 oracleConfirmed 標記
    try {
      const existingPair = await prisma.tagPair.findFirst({ where: { uuid } });
      if (existingPair) {
        const meta = (
          existingPair.lifecycleHooks ? JSON.parse(existingPair.lifecycleHooks) : {}
        ) as Record<string, unknown>;
        await prisma.tagPair.update({
          where: { id: existingPair.id },
          data: { lifecycleHooks: JSON.stringify({ ...meta, oracleConfirmed: true, oracleSeq: entry.seq }) },
        });
        matched++;
      }
    } catch {
      // 單筆失敗不中斷整輪 hydration
    }
  }
  return { ok: true, pulled: res.count, matched };
}

// ── 2. 收集 app 端 origin_seq (各實體的最後寫入序號) ──────────────────
// 這裡用 app 本地資料量近似 origin_seq: 以 tagPair 總數 + 各實體 createdAt 序作為代理。
// 真實部署中 origin_seq 應來自 app 端自己的寫入序號 (此處以 count 近似, 足以驅動對帳決策)。
async function collectAppOriginSeq(): Promise<Array<{ uuid: string; originSeq: number }>> {
  const pairs = await prisma.tagPair.findMany({
    select: { uuid: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });
  // uuid 可能為 NULL (舊資料), 過濾避免下游 string|null 型別錯誤
  return pairs
    .filter((p): p is { uuid: string; createdAt: Date } => !!p.uuid)
    .map((p: { uuid: string; createdAt: Date }, i: number) => ({ uuid: p.uuid, originSeq: i + 1 }));
}

// ── 3. 定時對帳: 比對 app origin_seq vs Oracle terminal_seq ───────────
// 回傳需要 push / pull 的實體清單 + 全矩陣摘要。
export async function reconcileAll(): Promise<{
  ok: boolean;
  summary: { total: number; synced: number; behindApp: number; behindOracle: number };
  push: SyncMatrixRow[];
  pull: SyncMatrixRow[];
  reason?: string;
}> {
  if (!hasOracleCreds()) {
    return {
      ok: false,
      summary: { total: 0, synced: 0, behindApp: 0, behindOracle: 0 },
      push: [],
      pull: [],
      reason: 'OMNI_DB_PWD not set — skip reconcile',
    };
  }
  // 確保矩陣表存在
  await ensureSyncMatrix();
  // 拉 Oracle 全量 entry -> terminal_seq 以 seq 計
  const pulled = await pullFromOracle(0);
  if (!pulled.ok) {
    return {
      ok: false,
      summary: { total: 0, synced: 0, behindApp: 0, behindOracle: 0 },
      push: [],
      pull: [],
      reason: pulled.reason,
    };
  }
  const appSeq = await collectAppOriginSeq();
  const appByUuid = new Map(appSeq.map((a) => [a.uuid, a.originSeq]));
  const terminalByUuid = new Map<string, number>();
  for (const e of pulled.entries as Array<{ uuid?: string; seq?: number }>) {
    if (e.uuid) terminalByUuid.set(e.uuid, Math.max(terminalByUuid.get(e.uuid) ?? 0, e.seq ?? 0));
  }
  // 合併所有出現過的 uuid
  const allUuids = Array.from(
    new Set<string>([...Array.from(appByUuid.keys()), ...Array.from(terminalByUuid.keys())]),
  );
  const entities = allUuids.map((uuid) => ({
    uuid,
    originSeq: appByUuid.get(uuid) ?? 0,
    terminalSeq: terminalByUuid.get(uuid) ?? 0,
  }));
  const result = await reconcileBidirectional(entities, true); // autoWrite=true 固化矩陣
  return {
    ok: result.ok,
    summary: result.summary,
    push: result.push,
    pull: result.pull,
  };
}

// ── 4. push: 把 app 落後的實體補推 Oracle (app->oracle) ───────────────
export async function pushBehindOracle(
  rows: SyncMatrixRow[],
): Promise<{ pushed: number; failed: number }> {
  let pushed = 0;
  let failed = 0;
  for (const r of rows) {
    const res = await syncTagPairToOracle({
      uuid: r.uuid,
      action: 'TRUST_GRANT',
      timestamp: Date.now(),
    });
    if (res.ok) pushed++;
    else failed++;
  }
  return { pushed, failed };
}

// ── 5. pull: 把 Oracle 落後的實體補拉 app (oracle->app) ───────────────
// 即 hydration 的子集: 只補拉 app 缺失的 uuid。
export async function pullBehindApp(
  rows: SyncMatrixRow[],
): Promise<{ pulled: number; failed: number }> {
  if (rows.length === 0) return { pulled: 0, failed: 0 };
  const res = await pullFromOracle(0);
  if (!res.ok) return { pulled: 0, failed: rows.length };
  const byUuid = new Map<string, { uuid?: string; seq?: number }>(
    (res.entries as Array<{ uuid?: string; seq?: number }>).map((e) => [e.uuid ?? '', e]),
  );
  let pulled = 0;
  let failed = 0;
  for (const r of rows) {
    const entry = byUuid.get(r.uuid);
    if (!entry) {
      failed++;
      continue;
    }
    try {
      const existing = await prisma.tagPair.findFirst({ where: { uuid: r.uuid } });
      if (existing) {
        // app 已有 -> 補標 oracleConfirmed (不覆寫既有資料)
        const meta = (existing.lifecycleHooks ? JSON.parse(existing.lifecycleHooks) : {}) as Record<string, unknown>;
        const entryData = entry as { seq?: number };
        await prisma.tagPair.update({
          where: { id: existing.id },
          data: { lifecycleHooks: JSON.stringify({ ...meta, oracleConfirmed: true, oracleSeq: entry.seq }) },
        });
        pulled++;
      } else {
        // app 缺失此 uuid 的 anchor -> append-only 不強建 (避免 FK 違反), 標 failed 待人工補 anchor
        failed++;
      }
    } catch {
      failed++;
    }
  }
  return { pulled, failed };
}

// ── 6. 全量雙向對帳 + 自動收斂 (供 cron 呼叫) ───────────────────────
export async function runBidirectionalSync(): Promise<{
  ok: boolean;
  reconciled: { total: number; synced: number; behindApp: number; behindOracle: number };
  pushed: number;
  pulled: number;
  reason?: string;
}> {
  const rec = await reconcileAll();
  if (!rec.ok) {
    return { ok: false, reconciled: rec.summary, pushed: 0, pulled: 0, reason: rec.reason };
  }
  const pushed = await pushBehindOracle(rec.push);
  const pulled = await pullBehindApp(rec.pull);
  return {
    ok: true,
    reconciled: rec.summary,
    pushed: pushed.pushed,
    pulled: pulled.pulled,
  };
}
