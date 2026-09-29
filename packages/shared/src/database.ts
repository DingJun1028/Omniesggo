// ═══════════════════════════════════════════════════════════════
// @esggo/shared/database — Unified Database Client
// Single source for Prisma + database operations
// ═══════════════════════════════════════════════════════════════

import { getConfig } from './config';

// ── Prisma Client Singleton ────────────────────────────────────

type PrismaClient = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
  $queryRaw: (template: TemplateStringsArray) => Promise<unknown>;
  $transaction: <T>(fn: (tx: PrismaClient) => Promise<T>) => Promise<T>;
  [key: string]: unknown;
};

let _prisma: PrismaClient | null = null;
let _prismaOmni: PrismaClient | null = null;

/**
 * Get the main Prisma client (singleton).
 */
export async function getPrisma(): Promise<PrismaClient> {
  if (_prisma) return _prisma;

  const config = getConfig();
  if (!config.database.url) {
    throw new Error('DATABASE_URL not configured');
  }

  const { PrismaClient: PrismaClass } = await import('@prisma/client');

  _prisma = new PrismaClass({
    log: config.app.isDevelopment
      ? ['query', 'error', 'warn']
      : ['error'],
  }) as unknown as PrismaClient;

  return _prisma;
}

/**
 * Get the OmniDB Prisma client (secondary database).
 */
export async function getPrismaOmni(): Promise<PrismaClient> {
  if (_prismaOmni) return _prismaOmni;

  const config = getConfig();
  if (!config.database.omniUrl) {
    throw new Error('OMNI_DATABASE_URL not configured');
  }

  const { PrismaClient: PrismaClass } = await import('@prisma/client');

  _prismaOmni = new PrismaClass({
    log: config.app.isDevelopment ? ['error'] : [],
  }) as unknown as PrismaClient;

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
