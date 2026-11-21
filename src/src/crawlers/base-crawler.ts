// ============================================================
// ESGSonar Crawler Core — BaseCrawler
// Pure Node.js fetch + Cheerio (no Playwright, free-tier safe)
// Location: src/crawlers/base-crawler.ts
// ============================================================

import * as crypto from 'crypto';
import { extractListItems } from './html-parser';

export interface CrawlItem {
  id: string;
  title: string;
  url: string;
  content: string;
  hash: string;
  sourceId: string;
  crawledAt: string;
  metadata?: Record<string, string>;
}

export interface CrawlResult {
  sourceId: string;
  url: string;
  itemsFound: number;
  items: CrawlResultItem[];
  duration: number;
  timestamp: string;
}

export interface CrawlResultItem {
  title: string;
  url: string;
  summary: string;
  hash: string;
  publishedAt?: string;
}

export interface CrawlerConfig {
  sourceId: string;
  name: string;
  baseUrl: string;
  listUrl: string;
  selectors: {
    list: string;       // CSS selector for list container items
    title: string;      // selector within item for title
    link: string;       // selector within item for link
    date?: string;      // selector within item for date
    summary?: string;   // selector within item for summary
  };
  maxItems?: number;
  requestDelay?: number;  // ms between requests
}

export interface CrawlOptions {
  url?: string;
  maxItems?: number;
  since?: string;  // ISO date — only items after this date
}

export abstract class BaseCrawler {
  protected config: CrawlerConfig;

  /** Public read-only access to config (for factory/scheduler) */
  get sourceConfig(): CrawlerConfig { return this.config; }
  protected retryCount = 3;
  protected retryDelay = 2000; // ms, exponential backoff

  constructor(config: CrawlerConfig) {
    this.config = {
      maxItems: 20,
      requestDelay: 1000,
      ...config,
    };
  }

  /** Fetch HTML — uses global fetch (Node 18+) or native https fallback */
  protected async fetchHTML(url: string): Promise<string> {
    // Node 18+ has built-in fetch
    if (typeof globalThis.fetch === 'function') {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 15000);
      try {
        const res = await globalThis.fetch(url, {
          headers: {
            'User-Agent': 'ESGSonar-Bot/1.0 (+https://esggo.app)',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'zh-TW,zh;q=0.9',
          },
          signal: controller.signal,
          redirect: 'follow',
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return res.text();
      } finally {
        clearTimeout(timer);
      }
    }
    // Fallback for older Node: native https.get
    return this.httpsFetch(url);
  }

  /** Native https.get fallback — zero extra deps */
  private async httpsFetch(url: string): Promise<string> {
    const proto = url.startsWith('https') ? await import('node:https') : await import('node:http');
    return new Promise((resolve, reject) => {
      const req = proto.get(url, {
        headers: {
          'User-Agent': 'ESGSonar-Bot/1.0 (+https://esggo.app)',
          'Accept': 'text/html',
          'Accept-Language': 'zh-TW,zh;q=0.9',
        },
      }, (res: import('http').IncomingMessage) => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return resolve(this.httpsFetch(res.headers.location));
        }
        if (!res.statusCode || res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      });
      req.on('error', reject);
      req.setTimeout(15000, () => { req.destroy(); reject(new Error(`Timeout: ${url}`)); });
    });
  }

  /** Compute SHA-256 hash for content dedup / change detection */
  protected computeHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  /** Delay between requests (rate limiting) */
  protected async delay(ms?: number): Promise<void> {
    const wait = ms ?? this.config.requestDelay ?? 1000;
    return new Promise(resolve => setTimeout(resolve, wait));
  }

  /** Retry wrapper with exponential backoff */
  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: unknown;
    for (let i = 0; i < this.retryCount; i++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        const wait = this.retryDelay * Math.pow(2, i);
        await this.delay(wait);
      }
    }
    throw lastError;
  }

  /** Main crawl entry point */
  async crawl(opts?: CrawlOptions): Promise<CrawlResult> {
    const start = Date.now();
    const url = opts?.url ?? this.config.listUrl;
    const maxItems = opts?.maxItems ?? this.config.maxItems ?? 20;

    const html = await this.withRetry(() => this.fetchHTML(url));
    const items = this.extractItems(html, maxItems, opts);

    return {
      sourceId: this.config.sourceId,
      url,
      itemsFound: items.length,
      items,
      duration: Date.now() - start,
      timestamp: new Date().toISOString(),
    };
  }

  /** Extract items from raw HTML — regex-based, zero deps */
  protected extractItems(html: string, maxItems: number, _opts?: CrawlOptions): CrawlResultItem[] {
    const parsed = extractListItems(html, {
      baseUrl: this.config.baseUrl,
      maxItems,
      titleMinLength: 5,
    });

    return parsed.map(item => ({
      title: item.title,
      url: item.url,
      summary: item.summary || '',
      hash: this.computeHash(`${item.title}${item.url}`),
      publishedAt: item.date,
    }));
  }

  /** Get source identifier */
  getSourceId(): string {
    return this.config.sourceId;
  }

  /** Get source name */
  getSourceName(): string {
    return this.config.name;
  }
}
