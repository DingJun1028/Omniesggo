// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
// ============================================================
// Prisma Client Singleton — Lazy init for Next.js
// src/lib/prisma.ts
// ------------------------------------------------------------
// 平台策略（國策: CF 取代 Vercel）：
//   - Cloudflare Workers：優先 Hyperdrive 綁定；否則 PrismaPg adapter
//     經 nodejs_compat 出站 TLS 直連（DATABASE_URL 需為 worker secret）。
//   - Node（VPS/Docker/Vercel 殘餘）：沿用預設 PrismaClient。
// 以 lazy proxy 匯出，`await prisma.x.y(...)` 用法完全相容。
// ============================================================

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  __prismaPromise?: Promise<PrismaClient>;
};

function isWorkersRuntime(): boolean {
  return typeof (globalThis as { WebSocketPair?: unknown }).WebSocketPair === 'function';
}

function createClient(): Promise<PrismaClient> {
  if (!globalForPrisma.__prismaPromise) {
    globalForPrisma.__prismaPromise = (async () => {
      if (isWorkersRuntime()) {
        try {
          const specifier = 'cloudflare:workers';
          const mod = await import(/* @vite-ignore */ specifier) as {
            env?: { HYPERDRIVE?: { connectionString?: string }; DATABASE_URL?: string };
          };
          const connectionString =
            mod.env?.HYPERDRIVE?.connectionString || mod.env?.DATABASE_URL || process.env.DATABASE_URL;
          if (connectionString) {
            const { PrismaPg } = await import('@prisma/adapter-pg');
            const adapter = new PrismaPg({ connectionString });
            return new PrismaClient({ adapter });
          }
          console.error('[prisma] Workers runtime without HYPERDRIVE/DATABASE_URL binding');
        } catch (error) {
          console.error('[prisma] Workers adapter init failed, falling back to default client', error);
        }
      }
      return new PrismaClient();
    })();
  }
  return globalForPrisma.__prismaPromise;
}

// Lazy deep proxy：`await prisma.model.method(args)` 會在首次呼叫時才建立 client。
function lazyPrisma(pending: Promise<unknown>): unknown {
  return new Proxy(function () {}, {
    get(_target, prop) {
      if (prop === 'then' || typeof prop === 'symbol') return undefined;
      return lazyPrisma(pending.then((client) => (client as Record<string, unknown>)[prop as string]));
    },
    apply(_target, _thisArg, args) {
      return pending.then((client) => (client as (...a: unknown[]) => unknown)(...args));
    },
  });
}

export const prisma = lazyPrisma(createClient()) as PrismaClient;
