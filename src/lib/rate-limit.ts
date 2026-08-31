// [agent:9][squad:符文契約][lifecycle:active][p2][platform:esggo][best-practice:结界]
export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * A lightweight, Redis-backed rate limiter using a fixed window approach.
 * Falls back to in-memory store if Redis is unavailable.
 */
export async function rateLimit(identifier: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const now = Date.now();
  const reset = now + windowSeconds * 1000;
  const key = `ratelimit:${identifier}`;

  // Lazy import Redis to avoid build-time connection issues
  let redis: Awaited<ReturnType<typeof import('@lib/redis/client').getRedis>> = null;
  try {
    const { getRedis } = await import('@lib/redis/client');
    redis = await getRedis();
  } catch {
    // Redis module unavailable — use in-memory fallback
  }

  if (redis) {
    try {
      // Use individual commands since RedisClientType may not have pipeline()
      const countStr = await redis.get(key);
      let count = countStr ? parseInt(countStr, 10) : 0;
      
      count += 1;
      await redis.setex(key, windowSeconds, String(count));
      
      const ttlMs = windowSeconds * 1000; // Approximate since we just set it

      return {
        success: count <= limit,
        limit,
        remaining: Math.max(0, limit - count),
        reset: now + ttlMs
      };
    } catch (error) {
      console.warn('[RateLimit] Redis error, falling back to memory', error);
      return memoryRateLimit(key, limit, windowSeconds, now, reset);
    }
  } else {
    // Memory fallback
    return memoryRateLimit(key, limit, windowSeconds, now, reset);
  }
}

async function memoryRateLimit(key: string, limit: number, windowSeconds: number, now: number, reset: number): Promise<RateLimitResult> {
  const { memoryFallback } = await import('@lib/redis/client');
  const record = (memoryFallback.get(key) as { count: number; reset: number }) || { count: 0, reset: 0 };
  
  if (now > record.reset) {
    // Window expired, reset
    record.count = 1;
    record.reset = reset;
  } else {
    record.count += 1;
  }

  memoryFallback.set(key, record, Math.ceil((record.reset - now) / 1000));

  return {
    success: record.count <= limit,
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: record.reset
  };
}
