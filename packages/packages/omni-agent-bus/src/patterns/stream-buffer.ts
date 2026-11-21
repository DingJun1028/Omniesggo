/**
 * StreamBuffer — 增量流式緩衝 (對齊 §12.0 流式緩衝 Chunked Processing)
 *
 * 無作: 緩衝區未初始化 / 超界 append 靜默略過
 * 圓通: 支援 delta 增量讀取 (since 時間戳), 僅回傳變更
 * 無礙: 所有條目自帶 timestamp, 便於增量同步
 */
import type { StreamEntry } from './types.js';

export class StreamBuffer<T = unknown> {
  private buf: StreamEntry<T>[] = [];
  private readonly cap: number;

  constructor(capacity = 1024) {
    this.cap = Math.max(1, capacity);
  }

  /** 追加一條 (增量寫入) — 超界時丟棄最舊 (FIFO 環形) */
  append(payload: T, meta?: { id?: string; topic?: string; source?: string }): StreamEntry<T> {
    const entry: StreamEntry<T> = {
      id: meta?.id ?? `e_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      topic: meta?.topic,
      source: meta?.source,
      timestamp: Date.now(),
      payload,
    };
    this.buf.push(entry);
    if (this.buf.length > this.cap) this.buf.shift();
    return entry;
  }

  /** 增量讀取: 僅回傳 timestamp > since 的條目 */
  getDelta(since: number): StreamEntry<T>[] {
    if (!Number.isFinite(since)) return [];
    return this.buf.filter((e) => e.timestamp > since);
  }

  /** 全量讀取 (謹慎使用) */
  all(): StreamEntry<T>[] {
    return [...this.buf];
  }

  size(): number {
    return this.buf.length;
  }

  clear(): void {
    this.buf = [];
  }
}
