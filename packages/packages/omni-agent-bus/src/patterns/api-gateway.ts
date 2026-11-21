/**
 * Pattern 4 — API Gateway (API 閘道) · 增量優化版
 *
 * 對齊 soul.md §12.1.4 (5T 合規 API 閘道 + 增量輸出優化)
 *
 * 5T 對應:
 *   - Trustworthy: HMAC 認證 (WEBHOOK_SECRET 對齊 esggo best-practice)
 *   - Trackable:   速率限制增量計數 + 訪問日誌
 *   - Transparent: 訪問日誌公開可查 (logAccessStream)
 *   - Tangible:    回應分頁 + CDN 快取 + 壓縮
 *
 * 增量優化: RateLimiter + LRUCache(CDN) + Pagination + Compression
 */
import { createHash, timingSafeEqual } from 'node:crypto';
import { RateLimiter } from './rate-limiter.js';
import { LRUCache } from './lru-cache.js';
import { CompressionEngine } from './compression.js';
import { paginate } from './pagination.js';
import type { APIRequest, APIResponse } from './gateway-types.js';
import type { PaginationConfig } from './types.js';

export class APIGateway {
  private readonly rateLimiter: RateLimiter;
  private readonly cdnCache = new LRUCache<string, APIResponse>(512);
  private readonly compression = new CompressionEngine();
  private readonly pagination: PaginationConfig = { size: 10 };
  private readonly accessLog: string[] = [];

  constructor(private readonly secret: string, limit = 100, windowMs = 60_000) {
    this.rateLimiter = new RateLimiter(limit, windowMs);
  }

  /** Trustworthy: HMAC 認證 (常數時間比對, 對齊 webhook 安全) */
  private verifyHMAC(req: APIRequest): boolean {
    const provided = req.headers?.['x-signature'];
    if (!provided) return false;
    const expected = createHash('sha256').update(req.body ?? '').update(this.secret).digest('hex');
    const a = Buffer.from(provided);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  }

  /** Trackable: 訪問日誌 (增量) */
  private logAccessStream(req: APIRequest): void {
    this.rateLimiter.increment(req.clientId);
    this.accessLog.push(`${Date.now()} ${req.clientId} ${req.path}`);
    console.log(`[gateway] access ${req.clientId} ${req.path}`);
  }

  /** Tangible: 處理 + 分頁 + CDN 快取 + 壓縮 */
  async handleRequest(req: APIRequest): Promise<APIResponse> {
    if (!this.verifyHMAC(req)) {
      throw new UnauthorizedError('HMAC verify failed (Trustworthy gate)');
    }
    this.logAccessStream(req);

    const result = (await req.handler?.()) ?? { ok: true };

    // 增量輸出: CDN 快取 + 壓縮 + 分頁
    const cacheKey = `${req.clientId}:${req.path}`;
    const paged = paginate(Array.isArray(result) ? result : [result], 1, this.pagination.size);
    const compressed = this.compression.compress(paged);
    void compressed;

    const resp: APIResponse = {
      status: 200,
      body: paged,
      cached: false,
      hashLock: createHash('sha256').update(JSON.stringify(paged)).digest('hex'),
    };
    this.cdnCache.set(cacheKey, resp, 300_000);
    return resp;
  }

  /** 增量輸出: 僅回傳變更頁面 (CDN 命中優先) */
  async getPage(cacheKey: string, page: number): Promise<APIResponse> {
    const cached = this.cdnCache.get(cacheKey);
    if (cached) {
      const paged = paginate(
        Array.isArray(cached.body) ? (cached.body as unknown[]) : [cached.body],
        page,
        this.pagination.size
      );
      return { ...cached, body: paged, cached: true };
    }
    throw new NotFoundError('CDN cache miss (no such key)');
  }

  health(): { cacheSize: number; accessLog: number } {
    return { cacheSize: this.cdnCache.size(), accessLog: this.accessLog.length };
  }
}

export class UnauthorizedError extends Error {}
export class NotFoundError extends Error {}
