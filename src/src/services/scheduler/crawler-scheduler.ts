/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-var-requires */
// ============================================================
// Crawler Scheduler — Manages periodic
// src/services/scheduler/crawler-scheduler.ts
// ============================================================

import { createAllCrawlers } from '../../crawlers/crawler-factory';
import type { CrawlResult } from '../../crawlers/base-crawler';

export interface ScheduledJob {
  id: string;
  sourceId: string;
  sourceName: string;
  cronExpression: string;
  intervalMs: number;
  lastRun?: string;
  lastResult?: CrawlResult;
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  enabled: boolean;
}

export interface SchedulerStatus {
  totalJobs: number;
  enabledJobs: number;
  lastResults: Array<{ sourceId: string; itemsFound: number; duration: number; timestamp: string }>;
}
import { processCrawlResult, type BridgeResult } from '../../core/sonnar/sonar-bridge';

// Singleton scheduler instance
class CrawlerScheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, ReturnType<typeof setInterval>> = new Map();
  private results: Map<string, CrawlResult[]> = new Map();
  private bridgeResults: Map<string, BridgeResult[]> = new Map();
  
  constructor() {
    this.init();
  }

  private init(): void {
    const crawlers = createAllCrawlers();
    
    for (const crawler of crawlers) {
      const sourceId = crawler.getSourceId();
      this.jobs.set(sourceId, {
        id: `job_${sourceId}`,
        sourceId,
        sourceName: crawler.getSourceName(),
        cronExpression: this.getDefaultCron(sourceId),
        intervalMs: this.getDefaultInterval(sourceId),
        totalRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        enabled: true,
      });
      this.results.set(sourceId, []);
    }
  }

  private getDefaultCron(sourceId: string): string {
    // Free tier: space out crawls to avoid rate limits
    const cronMap: Record<string, string> = {
      'tw-fsc': '0 */4 * * *',     // Every 4 hours
      'tw-moenv': '0 */6 * * *',   // Every 6 hours
      'tw-twse': '0 */8 * * *',    // Every 8 hours
      'eu-csrd': '0 8,20 * * *',   // Twice daily
      'us-sec': '0 9,21 * * *',    // Twice daily
    };
    return cronMap[sourceId] || '0 */12 * * *';
  }

  private getDefaultInterval(sourceId: string): number {
    // Use sources-config if available, else hardcoded defaults
    try {
      const { getSourceConfig } = require('../../core/sonnar/sources-config');
      const cfg = getSourceConfig(sourceId);
      if (cfg) return cfg.crawlIntervalMs;
    } catch (e) {
      // sources-config not available, fall back to defaults
      console.warn(`[CrawlerScheduler] sources-config unavailable for ${sourceId}:`, e);
    }
    // Fallback
    const intervalMap: Record<string, number> = {
      'tw-fsc': 4 * 3600000,
      'tw-moenv': 6 * 3600000,
      'tw-twse': 8 * 3600000,
      'eu-csrd': 12 * 3600000,
      'us-sec': 12 * 3600000,
    };
    return intervalMap[sourceId] || 12 * 3600000;
  }

  /** Trigger a manual crawl for a specific source */
  async crawlNow(sourceId: string): Promise<CrawlResult | null> {
    const { createCrawler } = await import('../../crawlers/crawler-factory');
    const crawler = createCrawler(sourceId);
    if (!crawler) return null;

    const job = this.jobs.get(sourceId);
    if (job) {
      job.totalRuns++;
      job.lastRun = new Date().toISOString();
    }

    try {
      const result = await crawler.crawl();
      
      if (job) {
        job.successfulRuns++;
        job.lastResult = result;
      }
      
      // Store result history (last 50)
      const history = this.results.get(sourceId) || [];
      history.unshift(result);
      if (history.length > 50) history.pop();
      this.results.set(sourceId, history);
      
      // Bridge to subscription engine
      try {
        const bridgeResult = processCrawlResult(result);
        const bridgeHistory = this.bridgeResults.get(sourceId) || [];
        bridgeHistory.unshift(bridgeResult);
        if (bridgeHistory.length > 50) bridgeHistory.pop();
        this.bridgeResults.set(sourceId, bridgeHistory);
      } catch (bridgeErr) {
        console.error(`[Scheduler] Bridge error for ${sourceId}:`, bridgeErr);
      }
      
      return result;
    } catch (err) {
      if (job) job.failedRuns++;
      console.error(`[Scheduler] Crawl failed for ${sourceId}:`, err);
      return null;
    }
  }

  /** Trigger crawl for all enabled sources */
  async crawlAll(): Promise<Array<{ source: string; success: boolean; items?: number }>> {
    const sources = Array.from(this.jobs.values()).filter(j => j.enabled);
    const results: Array<{ source: string; success: boolean; items?: number }> = [];

    for (const job of sources) {
      const result = await this.crawlNow(job.sourceId);
      results.push({
        source: job.sourceId,
        success: !!result,
        items: result?.itemsFound,
      });
      // Respect rate limits between crawls
      await new Promise(r => setTimeout(r, 2000));
    }

    return results;
  }

  /** Get all scheduled jobs */
  getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /** Get result history for a source */
  getHistory(sourceId: string): CrawlResult[] {
    return this.results.get(sourceId) || [];
  }

  /** Get bridge results for a source */
  getBridgeResults(sourceId: string): BridgeResult[] {
    return this.bridgeResults.get(sourceId) || [];
  }

  /** Toggle job enabled/disabled */
  toggleJob(sourceId: string, enabled: boolean): void {
    const job = this.jobs.get(sourceId);
    if (job) job.enabled = enabled;
  }

  /** Get scheduler status overview */
  getStatus(): SchedulerStatus {
    const jobs = Array.from(this.jobs.values());
    return {
      totalJobs: jobs.length,
      enabledJobs: jobs.filter(j => j.enabled).length,
      lastResults: jobs
        .filter(j => j.lastResult)
        .map(j => ({
          sourceId: j.sourceId,
          itemsFound: j.lastResult?.itemsFound || 0,
          duration: j.lastResult?.duration || 0,
          timestamp: j.lastResult?.timestamp || '',
        })),
    };
  }
}

// Singleton export
export const crawlerScheduler = new CrawlerScheduler();
