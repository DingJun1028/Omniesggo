/**
 * PriorityQueue — 優先級隊列 (對齊 §12.0 錯誤處理重試: 指數退避)
 *
 * 無作: 空隊列出隊回 null
 * 圓通: 最小優先級值 (數字最小) 先出 (priority 越小越優先)
 * 無礙: enqueue 支援 delay 欄位, 由消費者決定何時執行
 */
import type { RetryTask } from './types.js';

export class PriorityQueue<T = RetryTask> {
  private heap: T[] = [];
  private readonly score: (item: T) => number;

  constructor(score: (item: T) => number = (i) => (i as unknown as RetryTask).priority) {
    this.score = score;
  }

  enqueue(item: T): void {
    this.heap.push(item);
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | null {
    if (this.heap.length === 0) return null;
    const top = this.heap[0];
    const last = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this.bubbleDown(0);
    }
    return top;
  }

  peek(): T | null {
    return this.heap.length ? this.heap[0] : null;
  }

  size(): number {
    return this.heap.length;
  }

  private bubbleUp(i: number): void {
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.score(this.heap[i]) >= this.score(this.heap[p])) break;
      [this.heap[i], this.heap[p]] = [this.heap[p], this.heap[i]];
      i = p;
    }
  }

  private bubbleDown(i: number): void {
    const n = this.heap.length;
    for (;;) {
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      let smallest = i;
      if (l < n && this.score(this.heap[l]) < this.score(this.heap[smallest])) smallest = l;
      if (r < n && this.score(this.heap[r]) < this.score(this.heap[smallest])) smallest = r;
      if (smallest === i) break;
      [this.heap[i], this.heap[smallest]] = [this.heap[smallest], this.heap[i]];
      i = smallest;
    }
  }
}
