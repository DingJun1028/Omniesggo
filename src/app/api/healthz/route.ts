/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Smart AI Router - 健康檢查與監控端點
 * 整合到 Next.js API Route 或 Express 中
 * 路由: /healthz (簡單健康檢查) /health (詳細健康檢查)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSmartAIRouter } from '../../.agents/skills/smart-ai-router';

// 全域路由器實例
let healthRouter: SmartAIRouter | null = null;

/**
 * 健康檢查端點 - Next.js App Router 版本
 * GET /healthz - 簡單存活檢查 (Kubernetes liveness probe)
 * GET /health - 詳細就緒檢查 (Kubernetes readiness probe)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const detail = searchParams.get('detail') === 'true';

  // 簡單存活檢查
  if (!detail) {
    return NextResponse.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      service: 'smart-ai-router'
    }, { status: 200 });
  }

  // 詳細就緒檢查
  try {
    // 初始化路由器 (如果尚未初始化)
    if (!healthRouter) {
      healthRouter = await createSmartAIRouter({
        timeRift: { 
          enabled: true, 
          storeType: process.env.POSTGRES_HOST ? 'postgres' : 'memory',
          storeConfig: process.env.POSTGRES_HOST ? {
            host: process.env.POSTGRES_HOST,
            port: parseInt(process.env.POSTGRES_PORT || '5432'),
            database: process.env.POSTGRES_DATABASE,
            user: process.env.POSTGRES_USER,
            // password loaded from env via connection string, never inline
          } : {}
        },
        gateway: { enabled: true },
        discovery: { 
          enabled: true,
          providers: ['openrouter', 'groq', 'huggingface']
        }
      });
    }

    // 檢查各組件狀態
    const checks = {
      router: 'healthy',
      gateway: 'healthy',
      eventStore: 'healthy',
      modelDiscovery: 'healthy'
    };

    // 檢查事件存儲
    const timeRift = healthRouter.getTimeRiftEngine();
    if (timeRift) {
      try {
        await timeRift.eventStore.healthCheck();
      } catch {
        checks.eventStore = 'unhealthy';
      }
    }

    // 檢查安全網關
    const gateway = healthRouter.getGateway();
    if (gateway) {
      try {
        // 簡單驗證網關可用
        const testContract = await gateway.sealSacredContract({
          uuid: 'health-check',
          version: '1.0.0',
          timestamp: Date.now(),
          evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', check: 'health' }
        }, { uiFeedback: false });
        if (!testContract.verification.isValid) {
          checks.gateway = 'degraded';
        }
      } catch {
        checks.gateway = 'unhealthy';
      }
    }

    // 檢查模型發現
    try {
      const models = await healthRouter.discoverFreeModels();
      if (models.length === 0) {
        checks.modelDiscovery = 'degraded';
      }
    } catch {
      checks.modelDiscovery = 'unhealthy';
    }

    // 委派系統健康檢查（全量日誌 + 監控消費者）
    let delegationHealth: Record<string, unknown> | null = null;
    try {
      const { checkDelegationHealth } = await import('../../../../agents/complete-delegation/health');
      delegationHealth = await checkDelegationHealth();
    } catch {
      delegationHealth = { status: 'unavailable', message: 'Delegation health check skipped' };
    }

    // 判斷整體健康狀態（含委派系統）
    const allChecks = [...Object.values(checks)];
    const delegationStatus = delegationHealth && typeof delegationHealth === 'object'
      ? (delegationHealth as { status?: string }).status
      : 'healthy';
    allChecks.push(delegationStatus);

    const allHealthy = allChecks.every(c => c === 'healthy');
    const hasUnhealthy = allChecks.some(c => c === 'unhealthy');

    const overallStatus = hasUnhealthy ? 'unhealthy' : allHealthy ? 'healthy' : 'degraded';
    const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;

    return NextResponse.json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'smart-ai-router',
      version: '2.0.0',
      checks,
      delegation: delegationHealth,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    }, { status: statusCode });

  } catch {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      service: 'smart-ai-router',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}

/**
 * Prometheus 指標端點
 * GET /metrics
 */
export async function GET_METRICS() {
  if (!healthRouter) {
    healthRouter = await createSmartAIRouter({});
  }

  const _timeRift = healthRouter.getTimeRiftEngine();
  
  // 收集指標 (實際應用可整合 prom-client)
  const metrics = [
    '# HELP smart_ai_router_uptime_seconds Service uptime in seconds',
    '# TYPE smart_ai_router_uptime_seconds gauge',
    `smart_ai_router_uptime_seconds ${process.uptime()}`,
    '',
    '# HELP smart_ai_router_memory_bytes Memory usage in bytes',
    '# TYPE smart_ai_router_memory_bytes gauge',
    `smart_ai_router_memory_bytes{type="heap_used"} ${process.memoryUsage().heapUsed}`,
    `smart_ai_router_memory_bytes{type="heap_total"} ${process.memoryUsage().heapTotal}`,
    `smart_ai_router_memory_bytes{type="rss"} ${process.memoryUsage().rss}`,
    '',
    '# HELP smart_ai_router_requests_total Total requests processed',
    '# TYPE smart_ai_router_requests_total counter',
    'smart_ai_router_requests_total 0', // 實際應從計數器讀取
    '',
    '# HELP smart_ai_router_model_discoveries_total Total models discovered',
    '# TYPE smart_ai_router_model_discoveries_total counter',
    'smart_ai_router_model_discoveries_total 0'
  ].join('\n');

  return new Response(metrics, {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8' }
  });
}

/**
 * 關閉處理 (用於 graceful shutdown)
 */
export async function shutdown() {
  if (healthRouter) {
    await healthRouter.shutdown();
    healthRouter = null;
  }
}

// Export for testing
export { healthRouter };