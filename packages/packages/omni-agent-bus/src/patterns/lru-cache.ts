/**
 * LRUCache — 近期最少使用快取 (對齊 §12.0 CDN Cache / Lazy Loading)
 *
 * 無作: get 未命中回 null, set 超容自動逐出最舊
 * 圓通: 泛型 K/V, TTL 可選
 * 無礙: 所有寫入可選 TTL, 過期自動失效
 */
export interface CachedItem<V> {
  data: V;
  expiresAt: number; // 0 = 永不過期
}

export class LRUCache<K, V> {
  private map = new Map<K, CachedItem<V>>();
  private readonly cap: number;

  constructor(capacity = 100) {
    this.cap = Math.max(1, capacity);
  }

  get(key: K): V | null {
    const item = this.map.get(key);
    if (!item) return null;
    if (item.expiresAt !== 0 && Date.now() > item.expiresAt) {
      this.map.delete(key);
      return null;
    }
    // 移到末尾 (最近使用)
    this.map.delete(key);
    this.map.set(key, item);
    return item.data;
  }

  set(key: K, data: V, ttlMs = 0): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { data, expiresAt: ttlMs > 0 ? Date.now() + ttlMs : 0 });
    if (this.map.size > this.cap) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }

  has(key: K): boolean {
    return this.get(key) !== null;
  }

  delete(key: K): void {
    this.map.delete(key);
  }

  size(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }
}
