/**
 * WorkerPool — 並行處理池 (對齊 §12.0 Parallel Workers)
 *
 * 無作: 未提供 worker 時退化為序列執行 (graceful)
 * 圓通: 所有任務並行派發, 結果聚合回傳
 * 無礙: 單任務錯不中斷其他任務 (Promise.allSettled 語意)
 */
export class WorkerPool {
  private readonly concurrency: number;

  constructor(concurrency = 4) {
    this.concurrency = Math.max(1, concurrency);
  }

  /** 並行派發 (增量：分批處理, 避免記憶體爆炸) */
  async processDelta<R, W>(
    items: R[],
    worker: (item: R, index: number) => Promise<W> | W
  ): Promise<W[]> {
    if (items.length === 0) return [];
    const out: W[] = new Array(items.length);
    // 批次大小 = concurrency, 逐批 await (增量: 不一次全開)
    for (let i = 0; i < items.length; i += this.concurrency) {
      const batch = items.slice(i, i + this.concurrency);
      const settled = await Promise.allSettled(
        batch.map((it, j) => Promise.resolve(worker(it, i + j)))
      );
      settled.forEach((r, j) => {
        const idx = i + j;
        if (r.status === 'fulfilled') out[idx] = r.value;
        else out[idx] = undefined as unknown as W; // 無作: 錯誤靜默為 undefined
      });
    }
    return out;
  }
}
