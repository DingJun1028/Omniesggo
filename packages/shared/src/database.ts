successfully downloaded text file (SHA: 830626c182d0db9a462d1052e3685b449163c50e)
// ═══════════════════════════════════════════════════════════════
// @esggo/shared/database — Unified Database Client
// Single source for Supabase-backed database operations
// ═══════════════════════════════════════════════════════════════

import { getConfig } from './config';

// ── Prisma Client Singleton ────────────────────────────────────

import { createPrismaCompatClient, type PrismaClient } from '@lib/db/prisma-compat';

let _prisma: PrismaClient | null = null;
let _prismaOmni: PrismaClient | null = null;

/**
 * Get the main Prisma client (singleton).
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (_prisma) return _prisma;
  _prisma = createPrismaCompatClient();
  return _prisma;
}

/**
 * Get the OmniDB Prisma client (secondary database).
 */
export async function getPrismaOmni(): Promise<PrismaClient> {
  if (_prismaOmni) return _prismaOmni;
  _prismaOmni = createPrismaCompatClient({
    url: process.env.SUPABASE_OMNI_URL,
    key:
      process.env.SUPABASE_OMNI_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_OMNI_ANON_KEY,
  });
  return _prismaOmni;
}

// ── Database Health Check ──────────────────────────────────────

/**
 * Check database connectivity.
 */
export async function checkDatabaseHealth(): Promise<{
  connected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const start = Date.now();
  try {
    const prisma = await getPrisma();
    await prisma.$queryRaw`SELECT 1`;
    return {
      connected: true,
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

// ── Graceful Shutdown ──────────────────────────────────────────

/**
 * Disconnect all database clients.
 */
export async function shutdownDatabase(): Promise<void> {
  const disconnects: Promise<void>[] = [];

  if (_prisma) {
    disconnects.push(
      _prisma.$disconnect().then(() => { _prisma = null; })
    );
  }

  if (_prismaOmni) {
    disconnects.push(
      _prismaOmni.$disconnect().then(() => { _prismaOmni = null; })
    );
  }

  await Promise.all(disconnects);
  console.log('[Database] Shutdown complete.');
}

// ── Transaction Helper ─────────────────────────────────────────

/**
 * Execute a database transaction.
 *
 * @example
 *   const result = await dbTransaction(async (tx) => {
 *     const user = await tx.user.create({ data: { name: 'test' } });
 *     return user;
 *   });
 */
export async function dbTransaction<T>(
  fn: (prisma: PrismaClient) => Promise<T>
): Promise<T> {
  const prisma = await getPrisma();
  return prisma.$transaction(fn);
}

// ── Query Helpers ──────────────────────────────────────────────

/**
 * Safe query with retry logic.
 */
export async function safeQuery<T>(
  fn: () => Promise<T>,
  options?: { retries?: number; delay?: number }
): Promise<T> {
  const retries = options?.retries ?? 3;
  const delay = options?.delay ?? 1000;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));

      if (attempt < retries) {
        console.warn(
          `[Database] Query failed (attempt ${attempt}/${retries}): ${lastError.message}. Retrying in ${delay}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }

  throw lastError;
}
