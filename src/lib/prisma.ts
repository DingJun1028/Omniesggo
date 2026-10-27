// ============================================================
// 資料庫入口 — Supabase（Prisma 已移除）
// 保留 `prisma.<model>.<method>()` 呼叫形狀，實作於 ./db/prisma-compat。
// 慣性匯出名稱不變，既有 import { prisma } from '@lib/prisma' 免改。
//
// 2026-10-27 延遲建構：next build 於 page-data collection 會載入路由模組，
// Docker 等無 secrets 的建置環境沒有 SUPABASE_* 環境變數；若在模組載入時
// 即建構相容客戶端（makeSupabase 會拋錯），建置會失敗。改為 Proxy 延遲至
// 首次屬性存取才建構，模組匯入永不拋錯。
// ============================================================

import { createPrismaCompatClient, type PrismaClient } from './db/prisma-compat';

const globalForDb = globalThis as unknown as { __esggoDb?: PrismaClient };

function createLazyDb(): PrismaClient {
  const holder: { instance?: PrismaClient } = {};
  return new Proxy({} as PrismaClient, {
    get(_target, prop) {
      if (!holder.instance) holder.instance = createPrismaCompatClient();
      const client = holder.instance as unknown as Record<string | symbol, unknown>;
      const value = client[prop as string];
      return typeof value === 'function'
        ? (value as (...args: unknown[]) => unknown).bind(holder.instance)
        : value;
    },
  }) as PrismaClient;
}

export const prisma: PrismaClient = globalForDb.__esggoDb ?? createLazyDb();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__esggoDb = prisma;
}

export default prisma;
