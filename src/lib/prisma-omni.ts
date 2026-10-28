// ============================================================
// OmniDB secondary client — Supabase（Prisma 已移除）
// 次要資料庫以 SUPABASE_OMNI_URL / SUPABASE_OMNI_ANON_KEY（或 SERVICE_ROLE）
// 指定；未設定時回退主連線。
// ============================================================

import { createPrismaCompatClient, type PrismaClient } from './db/prisma-compat';

let _omniClient: PrismaClient | null = null;

export function getOmniPrisma(): PrismaClient {
  if (!_omniClient) {
    _omniClient = createPrismaCompatClient({
      url: process.env.SUPABASE_OMNI_URL,
      key:
        process.env.SUPABASE_OMNI_SERVICE_ROLE_KEY ||
        process.env.SUPABASE_OMNI_ANON_KEY,
    });
  }
  return _omniClient;
}

export async function withOmni<T>(fn: (client: PrismaClient) => Promise<T>): Promise<T> {
  return fn(getOmniPrisma());
}
