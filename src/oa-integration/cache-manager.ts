/**
 * §12.1.5 快取策略 (Cache Strategy)
 * 5T: Tangible (命中回饋可感知)
 */
import { freeze, uuidV4, OA_VERSION } from './types';

interface CacheItem {
  value: unknown;
  hits: number;
}

export class CacheManager {
  private readonly store = new Map<string, CacheItem>();
  private hits = 0;
  private misses = 0;

  /** Tangible: 命中即回饋計數, 可感知快取效益 */
  get<T>(key: string): T | null {
    const item = this.store.get(key);
    if (item) {
      item.hits++;
      this.hits++;
      return item.value as T;
    }
    this.misses++;
    return null;
  }

  set(key: string, value: unknown): void {
    this.store.set(key, { value, hits: 0 });
  }

  getStats(): Readonly<{ hits: number; misses: number; ratio: number }> {
    const total = this.hits + this.misses;
    return freeze({
      hits: this.hits,
      misses: this.misses,
      ratio: total === 0 ? 0 : this.hits / total,
    });
  }
}
