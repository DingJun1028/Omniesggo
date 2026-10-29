// ═══════════════════════════════════════════════════════════════
// @esggo/shared/health — Unified Health Protocol
// Single health check framework for all services
// ═══════════════════════════════════════════════════════════════

import { getConfig, checkConfig } from './config';

// ── Health Status Types ────────────────────────────────────────

export type HealthStatus = 'healthy' | 'degraded' | 'unhealthy';

export interface SharedComponentHealth {
  status: HealthStatus;
  latencyMs?: number;
  message?: string;
  details?: Record<string, unknown>;
}

// [ts-matrix] 對外相容別名：保留原匯出名稱，既有呼叫端不受影響。
export type { SharedComponentHealth as ComponentHealth };

export interface ServiceHealth {
  service: string;
  version: string;
  status: HealthStatus;
  uptime: number;
  timestamp: string;
  components: Record<string, SharedComponentHealth>;
  responseMs: number;
}

// ── Health Check Registry ─────────────────────────────────────

export type HealthCheckFn = () => Promise<SharedComponentHealth>;

const healthChecks = new Map<string, HealthCheckFn>();

/**
 * Register a health check for a component.
 */
export function registerHealthCheck(
  name: string,
  fn: HealthCheckFn
): void {
  healthChecks.set(name, fn);
}

/**
 * Run all registered health checks.
 */
export async function runHealthChecks(): Promise<ServiceHealth> {
  const config = getConfig();
  const startTime = Date.now();
  const components: Record<string, SharedComponentHealth> = {};

  // Run all registered checks in parallel
  const checks = Array.from(healthChecks.entries()).map(async ([name, fn]) => {
    const checkStart = Date.now();
    try {
      const result = await Promise.race([
        fn(),
        new Promise<SharedComponentHealth>((_, reject) =>
          setTimeout(() => reject(new Error('Health check timeout')), 5000)
        ),
      ]);
      result.latencyMs = Date.now() - checkStart;
      components[name] = result;
    } catch (err) {
      components[name] = {
        status: 'unhealthy',
        latencyMs: Date.now() - checkStart,
        message: err instanceof Error ? err.message : 'Unknown error',
 
     };
    }
  });

  await Promise.all(checks);

  // Determine overall status
  const statuses = Object.values(components).map(c => c.status);
  let overallStatus: HealthStatus = 'healthy';
  if (statuses.includes('unhealthy')) {
    overallStatus = 'unhealthy';
  } else if (statuses.includes('degraded')) {
    overallStatus = 'degraded';
  }

  return {
    service: 'esggo',
    version: '5.1.0',
    status: overallStatus,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    components,
    responseMs: Date.now() - startTime,
  };
}

// ── Built-in Health Checks ────────────────────────────────────

/**
 * Check Redis connectivity.
 */
export async function checkRedis(): Promise<SharedComponentHealth> {
  try {
    const { getRedis, isRedisReady } = await import('@lib/redis/client');
    const redis = await getRedis();
    if (redis && await isRedisReady()) {
      const health = await import('@lib/redis/client').then(m => m.getRedisHealth());
      return {
        status: 'healthy',
        message: `Connected (${health.provider})`,
        details: { keys: health.keys, info: health.info },
      };
    }
    return { status: 'degraded', message: 'Using in-memory fallback' };
  } catch {
    return { status: 'unhealthy', message: 'Redis unavailable' };
  }
}

/**
 * Check database connectivity.
 */
export async function checkDatabase(): Promise<SharedComponentHealth> {
  const config = getConfig();
  if (!config.database.url) {
    return { status: 'degraded', message: 'DATABASE_URL not configured' };
  }
  try {
    const { createPrismaCompatClient } = await import('@lib/db/prisma-compat');
    const prisma = createPrismaCompatClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    return { status: 'healthy', message: 'Connected' };
  } catch (err) {
    return {
      status: 'unhealthy',
      message: err instanceof Error ? err.message : 'Connection failed',
    };
  }
}

/**
 * Check Firebase Admin configuration.
 */

export async function checkFirebase(): Promise<SharedComponentHealth> {
  const config = getConfig();
  if (config.firebase.serviceAccountJson || config.firebase.projectId) {
    return {
      status: 'healthy',
      message: 'Configured',
      details: { projectId: config.firebase.projectId },
    };
  }
  return { status: 'degraded', message: 'Not configured' };
}

/**
 * Check AI provider availability.
 */
export async function checkAI(): Promise<SharedComponentHealth> {
  const config = getConfig();
  const providers: string[] = [];
  if (config.ai.openrouterApiKey) providers.push('openrouter');
  if (config.ai.groqApiKey) providers.push('groq');
  if (config.ai.geminiApiKey) providers.push('gemini');

  if (providers.length > 0) {
    return {
      status: 'healthy',
      message: `${providers.length} provider(s) configured`,
      details: { providers },
    };
  }
  return { status: 'degraded', message: 'No AI providers configured' };
}

/**
 * Check OmniAgent Gateway connectivity.
 */
export async function checkGateway(): Promise<SharedComponentHealth> {
  const config = getConfig();
  try {
    const res = await fetch(`${config.gateway.url}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      return { status: 'healthy', message: 'Reachable' };
    }
    return { status: 'degraded', message: `HTTP ${res.status}` };
  } catch {
    return { status: 'unhealthy', message: 'Unreachable' };
  }
}

// ── Register Default Checks ───────────────────────────────────

registerHealthCheck('redis', checkRedis);
registerHealthCheck('database', checkDatabase);
registerHealthCheck('firebase', checkFirebase);
registerHealthCheck('ai', checkAI);
registerHealthCheck('gateway', checkGateway);
