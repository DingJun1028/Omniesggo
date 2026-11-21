// ═══════════════════════════════════════════════════════════════
// @esggo/shared/redis — Unified Redis Client
// Re-exports from lib/redis/client with additional helpers
// ═══════════════════════════════════════════════════════════════

// Re-export all from the main Redis client
export {
  getRedis,
  isRedisReady,
  shutdownRedis,
  getRedisHealth,
  memoryFallback,
  safeParse,
  safeStringify,
} from '@lib/redis/client';

import { getConfig } from './config';

// ── Additional Helpers ─────────────────────────────────────────

/**
 * Get Redis URL from config.
 */
export function getRedisUrl(): string | null {
  const config = getConfig();
  if (config.redis.url) return config.redis.url;
  if (config.redis.upstashRestUrl) return config.redis.upstashRestUrl;
  return null;
}

/**
 * Check if Redis is configured (not just available).
 */
export function isRedisConfigured(): boolean {
  const config = getConfig();
  return !!(config.redis.url || config.redis.host !== 'localhost');
}

/**
 * Get Redis config summary (safe to log, no secrets).
 */
export function getRedisConfigSummary(): {
  configured: boolean;
  provider: 'redis' | 'upstash' | 'memory';
  host?: string;
  port?: number;
} {
  const config = getConfig();

  if (config.redis.upstashRestUrl) {
    return { configured: true, provider: 'upstash' };
  }
  if (config.redis.url || config.redis.host !== 'localhost') {
    return {
      configured: true,
      provider: 'redis',
      host: config.redis.host,
      port: config.redis.port,
    };
  }
  return { configured: false, provider: 'memory' };
}
