/**
 * RateLimiter — 滑動窗口速率限制 (對齊 §12.0 發送速率限制: Telegram 30/s, Slack 1/s)
 *
 * 無作: limit<=0 時視為無限制 (永遠放行)
 * 圓通: 滑動窗口語意, 過窗自動釋放
 * 無礙: 提供剩餘額度查詢, 便於下游調度
 */
export class RateLimiter {
  private hits: number[] = [];
  private readonly limit: number;
  private readonly windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = Math.max(0, limit);
    this.windowMs = Math.max(1, windowMs);
  }

  /** 嘗試放行一次 (增量: 清掉過窗記錄) */
  tryAcquire(): boolean {
    if (this.limit === 0) return true;
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    if (this.hits.length >= this.limit) return false;
    this.hits.push(now);
    return true;
  }

  /** 增量計數 (不阻擋, 僅記錄) */
  increment(key = 'default'): void {
    if (this.limit === 0) return;
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    this.hits.push(now);
  }

  remaining(): number {
    const now = Date.now();
    this.hits = this.hits.filter((t) => now - t < this.windowMs);
    return Math.max(0, this.limit - this.hits.length);
  }
}
