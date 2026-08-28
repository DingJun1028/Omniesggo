// Shared Memory HTTP Proxy — RESTful CRUD
// app/api/memory/route.ts
// Both Next.js (internal) and Gateway (via HTTP) can use this

import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import type { MemoryEntry, MemoryQuery } from '@esggo/shared';
import { jsonResponse, jsonError } from '@lib/api-utils';
import { verifyWebhookSignature } from '@/lib/webhook-auth';

/**
 * 寫入/刪除守門：memory 為對內共享總線（Next.js 內部 + Gateway 經 HTTP 呼叫），
 * GET 保留開放供內部讀取；POST/DELETE 需 MEMORY_API_KEY 或內部使用者上下文。
 * 對齊倉庫令牌式慣例（omni/sync 的 GATEWAY_API_KEY、cron 的 CRON_SECRET）。
 */
function assertMemoryWriteAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.MEMORY_API_KEY;
  const provided = req.headers.get('x-memory-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (secret) {
    if (!provided) {
      return jsonError('UNAUTHORIZED', 'Invalid or missing memory key', 401);
    }
    const payload = `${req.method}:${req.url}`;
    if (verifyWebhookSignature(payload, provided, secret) || provided === secret) {
      return null;
    }
    return jsonError('UNAUTHORIZED', 'Invalid or missing memory key', 401);
  }
  if (!req.headers.get('x-user-id')) {
    return jsonError('UNAUTHORIZED', 'Authentication required', 401);
  }
  return null;
}

// Redis client type definition
interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ...args: unknown[]): Promise<void>;
  del(key: string): Promise<void>;
  keys(pattern: string): Promise<string[]>;
}

// Import Redis client lazily for graceful fallback
let redisClient: RedisClient | null = null;
let memoryFallback: Map<string, { entry: MemoryEntry; expiry: number }> | null = null;

async function getStore(): Promise<RedisClient | Map<string, { entry: MemoryEntry; expiry: number }>> {
  if (!redisClient) {
    try {
      const { getRedis } = await import('@lib/redis');
      redisClient = await getRedis() as unknown as RedisClient;
    } catch { /* no redis */ }
    if (!redisClient) {
      memoryFallback = new Map();
    }
  }
  return redisClient || memoryFallback!;
}

function now() { return new Date().toISOString(); }

// GET /api/memory?key=xxx | ?prefix=abc&tags=... | ?stats=true
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  if (sp.get('stats') === 'true') {
    const { getRedisHealth } = await import('@lib/redis');
    const health = await getRedisHealth();
    return jsonResponse({
      totalEntries: health?.keys || 0,
      totalKeys: health?.keys || 0,
      redisConnected: health?.connected || false,
      provider: health?.connected ? 'redis' : 'memory',
      uptimeSeconds: process.uptime(),
    });
  }

  await getStore();
  const query: MemoryQuery = {
    key: sp.get('key') || undefined,
    prefix: sp.get('prefix') || undefined,
    tags: sp.get('tags')?.split(',').filter(Boolean),
    source: sp.get('source') || undefined,
    limit: Number(sp.get('limit')) || 50,
    offset: Number(sp.get('offset')) || 0,
  };

  if (query.key) {
    if (redisClient) {
      const raw = await redisClient.get(`mem:${query.key}`);
      if (!raw) return jsonResponse([]);
      return jsonResponse([JSON.parse(raw)]);
    }
    const found = memoryFallback!.get(query.key);
    if (!found || found.expiry < Date.now()) {
      memoryFallback!.delete(query.key);
      return jsonResponse([]);
    }
    return jsonResponse([found.entry]);
  }

  // List all matching entries
  if (redisClient) {
    const keys = query.prefix ? await redisClient.keys(`mem:${query.prefix}*`) : await redisClient.keys('mem:*');
    const entries: MemoryEntry[] = [];
    for (const k of keys.slice(query.offset, query.offset! + query.limit!)) {
      const raw = await redisClient.get(k);
      if (raw) entries.push(JSON.parse(raw));
    }
    return jsonResponse(entries);
  }

  // In-memory fallback: filter by prefix/tags
  let entries = Array.from(memoryFallback!.values())
    .filter(e => e.expiry > Date.now())
    .map(e => e.entry);
  if (query.prefix) entries = entries.filter(e => e.key.startsWith(query.prefix!));
  if (query.tags?.length) entries = entries.filter(e => query.tags!.some(t => e.tags?.includes(t)));
  entries = entries.slice(query.offset, query.offset! + query.limit!);
  return jsonResponse(entries);
}

// POST /api/memory — Create/Update entry
export async function POST(req: NextRequest) {
  const authErr = assertMemoryWriteAuth(req);
  if (authErr) return authErr;
  const body = await req.json();
  if (!body.key || body.value === undefined) {
    return jsonError('INVALID_PARAMS', '缺少必要參數: key, value');
  }

  const existing = redisClient ? await redisClient.get(`mem:${body.key}`) : memoryFallback?.get(body.key);
  
  // Parse existing data - Redis returns string, memory fallback returns object
  const existingEntry = existing 
    ? (typeof existing === 'string' ? JSON.parse(existing) : existing.entry)
    : null;

  const entry: MemoryEntry = {
    id: body.id || uuidv4(),
    key: body.key,
    value: typeof body.value === 'string' ? body.value : JSON.stringify(body.value),
    tags: body.tags || [],
    source: body.source || 'web',
    ttlSeconds: body.ttlSeconds || 3600,
    createdAt: existingEntry?.createdAt || now(),
    updatedAt: now(),
  };

  if (redisClient) {
    await redisClient.set(`mem:${entry.key}`, JSON.stringify(entry), 'EX', entry.ttlSeconds!);
  } else {
    memoryFallback!.set(entry.key, { entry, expiry: Date.now() + entry.ttlSeconds! * 1000 });
  }

  return jsonResponse(entry);
}

// DELETE /api/memory?key=xxx
export async function DELETE(req: NextRequest) {
  const authErr = assertMemoryWriteAuth(req);
  if (authErr) return authErr;
  const key = req.nextUrl.searchParams.get('key');
  if (!key) {
    return jsonError('INVALID_PARAMS', '缺少必要參數: key');
  }

  if (redisClient) {
    await redisClient.del(`mem:${key}`);
  } else {
    memoryFallback!.delete(key);
  }
  return jsonResponse({ deleted: true });
}
