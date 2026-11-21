/**
 * ESGGO Redis Client Wrapper
 *
 * Centralised, singleton Redis connection with:
 *  - Lazy connection initialisation
 *  - Automatic reconnection with exponential back-off
 *  - Health-check / ping
 *  - Graceful shutdown
 *  - In-memory fallback for development
 *
 * Usage:
 *   import { getRedis, isRedisReady, shutdownRedis } from '@lib/redis/client';
 *   const redis = await getRedis();
 *   if (redis) { await redis.set('key', 'value'); }
 */

// ─── Configuration ────────────────────────────────────────────────────────────

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  url?: string;              // Full URL takes precedence over host/port
  maxRetriesPerRequest: number;
  retryStrategy: (times: number) => number | null;
  connectTimeout: number;    // ms
  enableOfflineQueue: boolean;
}

const DEFAULT_CONFIG: RedisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  url: process.env.REDIS_URL || undefined,
  maxRetriesPerRequest: 3,
  retryStrategy: (times: number): number | null => {
    if (times > 10) {
      console.warn('[Redis] Max retry attempts reached, giving up.');
      return null; // Stop retrying
    }
    const delay = Math.min(times * 200, 5000);
    console.log(`[Redis] Retrying in ${delay}ms (attempt ${times})`);
    return delay;
  },
  connectTimeout: 10000,
  enableOfflineQueue: true,
};

// ─── State ────────────────────────────────────────────────────────────────────

interface RedisClientType {
  connect(): Promise<void>;
  quit(): Promise<string>;
  disconnect(): void;
  ping(): Promise<string>;
  get(key: string): Promise<string | null>;
  setex(key: string, ttl: number, value: string): Promise<'OK'>;
  del(...keys: string[]): Promise<number>;
  info(section?: string): Promise<string>;
  dbsize(): Promise<number>;
  keys(pattern: string): Promise<string[]>;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

let redisClient: RedisClientType | null = null;
let connectionPromise: Promise<RedisClientType | null> | null = null;
let isConnected = false;
let isShuttingDown = false;

// ─── In-Memory Fallback ──────────────────────────────────────────────────────

interface MemoryEntry {
  value: unknown;
  expiry: number | null; // epoch ms, null = no expiry
}

const memoryStore = new Map<string, MemoryEntry>();

function cleanMemoryStore(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  memoryStore.forEach((entry, key) => {
    if (entry.expiry !== null && now > entry.expiry) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => memoryStore.delete(key));
}

export const memoryFallback = {
  get(key: string): unknown {
    cleanMemoryStore();
    const entry = memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiry !== null && Date.now() > entry.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return entry.value;
  },

  set(key: string, value: unknown, ttlSeconds?: number): void {
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    memoryStore.set(key, { value, expiry });
  },

  del(key: string): boolean {
    return memoryStore.delete(key);
  },

  keys(pattern: string): string[] {
    cleanMemoryStore();
    if (pattern === '*') return Array.from(memoryStore.keys());
    // Simple glob: only supports prefix* patterns
    const prefix = pattern.replace(/\*$/, '');
    return Array.from(memoryStore.keys()).filter(k => k.startsWith(prefix));
  },

  exists(key: string): boolean {
    cleanMemoryStore();
    const entry = memoryStore.get(key);
    if (!entry) return false;
    if (entry.expiry !== null && Date.now() > entry.expiry) {
      memoryStore.delete(key);
      return false;
    }
    return true;
  },

  get size(): number {
    cleanMemoryStore();
    return memoryStore.size;
  },
};

// ─── Connection Management ────────────────────────────────────────────────────

/**
 * Get or create the Redis client singleton.
 * Returns `null` when Redis is unavailable (falls back to in-memory store).
 */
export async function getRedis(): Promise<RedisClientType | null> {
  if (redisClient && isConnected) return redisClient;
  if (isShuttingDown) return null;

  // Deduplicate concurrent connection attempts
  if (connectionPromise) return connectionPromise;

  connectionPromise = _connect();
  try {
    return await connectionPromise;
  } finally {
    connectionPromise = null;
  }
}

async function _connect(): Promise<RedisClientType | null> {
  // If we already have a client that's connected, reuse it
  if (redisClient && isConnected) return redisClient;

  try {
    const Redis = await _loadRedisModule();
    if (!Redis) {
      console.warn('[Redis] ioredis module not available — using in-memory fallback.');
      return null;
    }

    const config = { ...DEFAULT_CONFIG };
    const options: Record<string, unknown> = {
      maxRetriesPerRequest: config.maxRetriesPerRequest,
      retryStrategy: config.retryStrategy,
      connectTimeout: config.connectTimeout,
      enableOfflineQueue: config.enableOfflineQueue,
      lazyConnect: true,
    };

    if (config.url) {
      // URL is passed as positional arg to ioredis constructor below
    } else {
      options.host = config.host;
      options.port = config.port;
      options.db = config.db;
      if (config.password) options.password = config.password;
    }

    // ioredis v5 takes an options object; include url when present
    const client = config.url
      ? new Redis({ ...(options as any), url: config.url })
      : new Redis(options as any);

    // Wire event handlers before connecting
    client.on('error', (err: unknown) => {
      // Don't log ECONNREFUSED repeatedly — retry strategy handles it
      if (err instanceof Error && !err.message.includes('ECONNREFUSED')) {
        console.warn('[Redis] Error:', err.message);
      }
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('[Redis] Connected successfully.');
      isConnected = true;
    });

    client.on('ready', () => {
      isConnected = true;
    });

    client.on('close', () => {
      isConnected = false;
    });

    client.on('reconnecting', () => {
      console.log('[Redis] Reconnecting...');
      isConnected = false;
    });

    client.on('end', () => {
      isConnected = false;
      redisClient = null;
    });

    // Attempt connection
    await client.connect();

    // Verify with PING
    const pong = await client.ping();
    if (pong !== 'PONG') {
      throw new Error('PING did not return PONG');
    }

    redisClient = client;
    isConnected = true;
    console.log('[Redis] Client ready.');
    return client;
  } catch (err: unknown) {
    console.warn(`[Redis] Connection failed: ${err instanceof Error ? err.message : err}. Using in-memory fallback.`);
    isConnected = false;
    redisClient = null;
    return null;
  }
}

/**
 * Dynamically import ioredis so the app doesn't crash if it's not installed.
 */
type RedisModule = { new(opts: Record<string, unknown>): RedisClientType };

async function _loadRedisModule(): Promise<RedisModule | null> {
  try {
    // Use require() instead of import() to avoid Turbopack/webpack chunk resolution issues
    // ioredis is always available in node_modules
    const mod = require('ioredis');
    return (mod.default || mod) as unknown as RedisModule;
  } catch {
    return null;
  }
}

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * Returns `true` when the Redis connection is alive and responsive.
 */
export async function isRedisReady(): Promise<boolean> {
  if (!redisClient || !isConnected) return false;
  try {
    const pong = await redisClient.ping();
    return pong === 'PONG';
  } catch {
    return false;
  }
}

/**
 * Returns a health summary for monitoring endpoints.
 */
export async function getRedisHealth(): Promise<{
  connected: boolean;
  provider: 'redis' | 'memory';
  keys: number;
  info?: string;
}> {
  const client = await getRedis();
  if (client && isConnected) {
    try {
      const serverInfo = await client.info('server');
      const versionLine = serverInfo.split('\r\n').find((l: string) => l.startsWith('redis_version:'));
      return {
        connected: true,
        provider: 'redis',
        keys: await client.dbsize(),
        info: versionLine || 'unknown',
      };
    } catch {
      return { connected: false, provider: 'redis', keys: 0, info: 'error reading info' };
    }
  }
  return { connected: false, provider: 'memory', keys: memoryFallback.size };
}

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

/**
 * Disconnect the Redis client gracefully.
 */
export async function shutdownRedis(): Promise<void> {
  isShuttingDown = true;
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      try { await redisClient.disconnect(); } catch { /* ignore */ }
    }
    redisClient = null;
    isConnected = false;
  }
  console.log('[Redis] Shutdown complete.');
}

// ─── Utility: Safe JSON Helpers ───────────────────────────────────────────────

export function safeParse<T>(data: string | null | undefined): T | null {
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

export function safeStringify(value: unknown): string {
  return JSON.stringify(value);
}
