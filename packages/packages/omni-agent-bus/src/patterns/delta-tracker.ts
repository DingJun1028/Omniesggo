/**
 * DeltaTracker — 變更追蹤器 (對齊 §12.0 Delta Sync / 增量輸出)
 *
 * 無作: 未註冊的 key 讀取回傳 undefined, 不報錯
 * 圓通: 僅追蹤變更, applyDelta 合併, getChanges 回傳自某版本以來的差異
 * 無礙: 每筆變更帶 version, 便於下游增量同步
 */
export interface DeltaEntry<V> {
  key: string;
  version: number;
  value: V;
  updatedAt: number;
}

export class DeltaTracker<V = unknown> {
  private store = new Map<string, DeltaEntry<V>>();
  private globalVersion = 0;

  /** 寫入/合併 (增量) */
  set(key: string, value: V, version?: number): DeltaEntry<V> {
    const v = version ?? ++this.globalVersion;
    const entry: DeltaEntry<V> = { key, version: v, value, updatedAt: Date.now() };
    this.store.set(key, entry);
    if (v > this.globalVersion) this.globalVersion = v;
    return entry;
  }

  /** 批量合併 (增量優化: 僅合併 delta 欄位) */
  batchUpdateDelta(updates: { key: string; delta: Partial<V>; version?: number }[]): void {
    for (const u of updates) {
      const existing = this.store.get(u.key);
      if (!existing) {
        this.set(u.key, u.delta as V, u.version);
        continue;
      }
      const merged = { ...(existing.value as object), ...(u.delta as object) } as V;
      this.set(u.key, merged, u.version ?? ++this.globalVersion);
    }
  }

  /** 增量讀取: 僅回傳 version > sinceVersion 的變更 */
  getChanges(sinceVersion = 0): DeltaEntry<V>[] {
    return [...this.store.values()].filter((e) => e.version > sinceVersion);
  }

  get(key: string): V | undefined {
    return this.store.get(key)?.value;
  }

  version(): number {
    return this.globalVersion;
  }

  keys(): string[] {
    return [...this.store.keys()];
  }
}
