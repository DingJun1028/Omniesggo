import { jsonResponse } from '@lib/api-utils';
import { CelestialController } from '@/lib/celestial/implementation';
import { getRedisHealth } from '@lib/redis/client';
import os from 'os';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get('format');
  const detail = searchParams.get('detail') === 'true';

  if (format === 'metrics') {
    const cpu = os.loadavg()[0];
    const mem = process.memoryUsage();
    const now = new Date().toISOString();
    const body = `# HELP esggo_up Service is up.
# TYPE esggo_up gauge
esggo_up{service="esggo-core"} 1

# HELP esggo_process_memory_bytes Node memory usage for esggo-core.
# TYPE esggo_process_memory_bytes gauge
esggo_process_memory_bytes{type="rss"} ${mem.rss}
esggo_process_memory_bytes{type="heapTotal"} ${mem.heapTotal}
esggo_process_memory_bytes{type="heapUsed"} ${mem.heapUsed}

# HELP esggo_build_info Build information.
# TYPE esggo_build_info gauge
esggo_build_info{timestamp="${now}"} 1
`;
    return new NextResponse(body, {
      status: 200,
      headers: { 'Content-Type': 'text/plain; version=0.0.4' },
    });
  }

  if (!detail) {
    return jsonResponse({ status: 'healthy', timestamp: new Date().toISOString() }, 200);
  }

  const checks: Record<string, string> = {
    app: 'healthy',
    ollama: 'unknown',
    minio: 'unknown',
    database: 'unknown',
  };

  try {
    const ollamaUrl = process.env.AGENTIC_TWIN_OLLAMA_URL || 'http://127.0.0.1:11434';
    const ollamaRes = await fetch(`${ollamaUrl}/api/tags`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    checks.ollama = ollamaRes.ok ? 'healthy' : 'unhealthy';
  } catch {
    checks.ollama = 'unhealthy';
  }

  try {
    const minioEndpoint = process.env.MINIO_ENDPOINT || 'http://127.0.0.1:19001';
    const minioRes = await fetch(minioEndpoint, { method: 'GET', signal: AbortSignal.timeout(5000) });
    checks.minio = minioRes.ok ? 'healthy' : 'unhealthy';
  } catch {
    checks.minio = 'unhealthy';
  }

  try {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_HOST ? 'postgres' : 'memory';
    checks.database = databaseUrl ? 'configured' : 'unconfigured';
  } catch {
    checks.database = 'unhealthy';
  }

  const overall = Object.values(checks).every((v) => v === 'healthy' || v === 'configured')
    ? 'healthy'
    : 'degraded';

  return jsonResponse(
    { status: overall, timestamp: new Date().toISOString(), checks },
    overall === 'healthy' ? 200 : 503
  );
}
