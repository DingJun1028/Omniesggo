// ============================================================
// ESGSonar Crawl API — Trigger crawls, get status
// app/api/sonnar/crawl/route.ts
// ============================================================

import { NextRequest } from 'next/server';
import { crawlerScheduler } from '@/services/scheduler/crawler-scheduler';
import { jsonError, jsonResponse } from '@lib/api-utils';
import type { SubscriptionMatch } from '@/core/sonnar/sonar-bridge';
import { verifyWebhookSignature } from '@/lib/webhook-auth';

// GET /api/sonnar/crawl — Get scheduler status & job list
export async function GET() {
  const status = crawlerScheduler.getStatus();
  const jobs = crawlerScheduler.getJobs();
  
  return jsonResponse({
    status,
    jobs: jobs.map(j => ({
      id: j.id,
      sourceId: j.sourceId,
      sourceName: j.sourceName,
      cronExpression: j.cronExpression,
      intervalMs: j.intervalMs,
      lastRun: j.lastRun,
      totalRuns: j.totalRuns,
      successfulRuns: j.successfulRuns,
      failedRuns: j.failedRuns,
      enabled: j.enabled,
      lastItemsFound: j.lastResult?.itemsFound,
    })),
  });
}

// POST /api/sonnar/crawl — Trigger crawl (manual)
// Body: { sourceId?: string, all?: boolean }
export async function POST(req: NextRequest) {
  try {
    const secret = process.env.SONNAR_CRAWL_SECRET;
    if (secret) {
      const signature = req.headers.get('x-signature-256');
      const payload = await req.clone().text();
      if (!verifyWebhookSignature(payload, signature, secret)) {
        return jsonError('UNAUTHORIZED', 'Invalid or missing signature', 401);
      }
    }
    const body = await req.json().catch(() => ({}));
    const { sourceId, all } = body;

    if (all) {
      // Crawl all enabled sources
      const results = await crawlerScheduler.crawlAll();
      return jsonResponse({
        message: `Crawl triggered for ${results.length} sources`,
        results,
      });
    }

    if (sourceId) {
      const result = await crawlerScheduler.crawlNow(sourceId);
      if (!result) {
        return jsonError('SOURCE_NOT_FOUND', `Unknown source: ${sourceId}`);
      }
      
      // Get bridge results (last bridge for this source)
      const bridgeHistory = crawlerScheduler.getBridgeResults(sourceId);
      const bridge = bridgeHistory[0] || {
        eventsGenerated: 0,
        matches: [],
        itemsProcessed: 0,
        errors: [],
      };
      
      return jsonResponse({
        message: `Crawl completed for ${sourceId}`,
        result: {
          sourceId: result.sourceId,
          url: result.url,
          itemsFound: result.itemsFound,
          duration: result.duration,
          timestamp: result.timestamp,
        },
        bridge: {
          eventsGenerated: bridge.eventsGenerated,
          subscriptionMatches: bridge.matches.length,
          topMatches: bridge.matches.slice(0, 5).map((m: SubscriptionMatch) => ({
            subscriber: m.subscriberName,
            target: m.subscriptionTarget,
            score: m.relevanceScore,
          })),
        },
      });
    }

    return jsonError('INVALID_PARAMS', 'Provide sourceId or all: true');
  } catch (err) {
    console.error('[Sonar Crawl API] Error:', err);
    return jsonError('CRAWL_ERROR', 'Internal server error');
  }
}
