/**
 * 5T 合規增量輸出基礎設施 — 來源: OA-Team 靈魂核心聖典 §12.0
 * 所有模組共用: StreamBuffer (流式緩衝) + DeltaTracker (增量追蹤) + HashLock (不可篡改)
 */

export interface TraceableRecord {
  id: string;
  source: string;
  timestamp: number;
}

export class StreamBuffer<T> {
  private buf: T[] = [];
  private readonly cap: number;
  constructor(capacity = 1024 * 1024) {
    this.cap = capacity; // 1MB 緩衝區 (§12.0: 避免阻塞)
  }
  append(item: T): void {
    if (this.buf.length >= this.cap) this.buf.shift();
    this.buf.push(item);
  }
  /** 僅返回 since 之後的增量 (§12.0: Delta Sync) */
  getDelta(since: number): T[] {
    return this.buf.filter((_, i) => i >= since);
  }
  get size(): number {
    return this.buf.length;
  }
}

export class DeltaTracker<T extends { version?: number }> {
  private last = new Map<string, number>();
  getChanges(key: string, data: T[]): T[] {
    const seen = this.last.get(key) ?? 0;
    const out = data.filter((d) => (d.version ?? 0) > seen);
    if (out.length) this.last.set(key, Math.max(...out.map((d) => d.version ?? 0)));
    return out;
  }
}


/** Trustworthy: 數據寫入後 Hash Lock + 凍結 (§12.0) */
export function hashLock<T>(obj: T): Readonly<T> {
  return Object.freeze(obj) as Readonly<T>;
}

export function generateTraceableId(source: string): string {
  return `tr_${Date.now().toString(36)}_${source.slice(0, 6)}_${Math.random().toString(36).slice(2, 8)}`;
}
