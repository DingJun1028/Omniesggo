/**
 * GET /api/health/metrics
 * Minimal Prometheus-style metrics for core ESGGO processes.
 */
import os from 'os';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
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
    headers: {
      'Content-Type': 'text/plain; version=0.0.4',
    },
  });
}
