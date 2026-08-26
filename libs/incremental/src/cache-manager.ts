/**
 * 5T 合規快取策略 (增量優化版) — 圣典 §12.1.5
 * Trackable: 命中率增量 | Tangible: 用戶回饋
 * Transparent: 日誌增量 | Trustworthy: 快取驗證
 */
import { hashLock } from './stream-buffer.js';

interface CachedItem {
  data: unknown;
  version: number;
  hits: number;
}

export class CacheManager {
  private readonly cache = new Map<string, CachedItem>();
  private hits = 0;
  private misses = 0;

  async get<T>(key: string): Promise<T | null> {
    const item = this.cache.get(key);
    if (!item) {
      this.misses++; // Trackable: 增量計數
      return null;
    }
    this.hits++; // Trackable
    return hashLock(item.data) as T; // Trustworthy
  }

  set(key: string, data: unknown, version: number): void {
    this.cache.set(key, { data: hashLock(data), version, hits: 0 }); // Trustworthy
  }

  get hitRate(): number {
    const total = this.hits + this.misses;
    return total ? this.hits / total : 0; // Trackable: 命中率
  }

  /** 增量輸出: 批量更新 (僅合併 delta) */
  batchUpdateDelta(updates: { key: string; delta: Record<string, unknown>; version: number }[]): void {
    for (const u of updates) {
      const existing = this.cache.get(u.key);
      if (existing) {
        this.cache.set(u.key, {
          ...existing,
          data: hashLock({ ...(existing.data as object), ...u.delta }),
          version: u.version,
        });
      }
    }
  }
}
