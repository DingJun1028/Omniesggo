// ============================================================
// 資料庫入口 — Supabase（Prisma 已移除）
// 保留 `prisma.<model>.<method>()` 呼叫形狀，實作於 ./db/prisma-compat。
// 慣性匯出名稱不變，既有 import { prisma } from '@lib/prisma' 免改。
// ============================================================

import { createPrismaCompatClient, type PrismaClient } from './db/prisma-compat';

const globalForDb = globalThis as unknown as { __esggoDb?: PrismaClient };

export const prisma: PrismaClient = globalForDb.__esggoDb ?? createPrismaCompatClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__esggoDb = prisma;
}

export default prisma;
