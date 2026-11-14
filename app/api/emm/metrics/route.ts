// ============================================================
// EMM Metrics API — Aggregate gateway proxy + Sonnar data
// app/api/emm/metrics/route.ts
// ============================================================

import { jsonResponse } from '@lib/api-utils';

const GATEWAY_URL = process.env.EMM_GATEWAY_URL || 'http://omniagent-gateway:8642';

interface SonnarAggregate {
  crawlCount: number;
  lastCrawl: string | null;
  jobsActive: number;
  sourcesMonitored: number;
  alertsActive: number;
  signalStrength: number;
  newItems: number;
}

interface CrawlJob {
  successfulRuns: number;
  lastRun: string | null;
  enabled: boolean;
}

// GET /api/emm/metrics — Full snapshot
export async function GET() {
  let gatewayData: Record<string, unknown> | null = null;
  let gatewayError: string | null = null;

  // 1) Try external gateway
  try {
    const res = await fetch(`${GATEWAY_URL}/metrics`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) gatewayData = await res.json();
    else gatewayError = `Gateway HTTP ${res.status}`;
  } catch (e: unknown) {
    gatewayError = e instanceof Error ? e.message : 'Gateway unreachable';
  }

  // 2) Sonnar aggregate from internal API
  const sonnar: SonnarAggregate = {
    crawlCount: 0,
    lastCrawl: null,
    jobsActive: 0,
    sourcesMonitored: 0,
    alertsActive: 0,
    signalStrength: 0,
    newItems: 0,
  };
  try {
    const base = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const [crawlRes, radarRes] = await Promise.allSettled([
      fetch(`${base}/api/sonnar/crawl`, { signal: AbortSignal.timeout(4000) }),
      fetch(`${base}/api/sonnar/radar`, { signal: AbortSignal.timeout(4000) }),
    ]);

    if (crawlRes.status === 'fulfilled' && crawlRes.value.ok) {
      const crawl = await crawlRes.value.json();
      if (crawl.success && crawl.data) {
        sonnar.crawlCount = crawl.data.jobs?.filter((j: CrawlJob) => j.successfulRuns > 0).length || 0;
        sonnar.lastCrawl = crawl.data.jobs?.reduce((latest: string | null, j: CrawlJob) => {
          return j.lastRun && (!latest || j.lastRun > latest) ? j.lastRun : latest;
        }, null) || null;
        sonnar.jobsActive = crawl.data.jobs?.filter((j: CrawlJob) => j.enabled).length || 0;
      }
    }
    if (radarRes.status === 'fulfilled' && radarRes.value.ok) {
      const radar = await radarRes.value.json();
      if (radar.success && radar.data) {
        sonnar.sourcesMonitored = radar.data.healthCheck?.monitoredSources || 0;
        sonnar.signalStrength = radar.data.summary?.totalSignals || 0;
        sonnar.newItems = radar.data.summary?.totalNewItems || 0;
        sonnar.alertsActive = radar.data.summary?.activeAlerts || 0;
      }
    }
  } catch {
    // Sonnar aggregate best-effort
  }

  // 3) Compose response
  return jsonResponse({
    timestamp: Date.now(),
    gateway: gatewayData || null,
    gatewayError,
    sonnar,
    gatewayUrl: GATEWAY_URL,
  });
}
