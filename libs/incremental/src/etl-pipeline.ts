/**
 * 5T 合規數據管道 ETL (增量優化版) — 圣典 §12.1.3
 * Traceable: 數據來源追蹤 | Trackable: 血統流式轉換
 * Trustworthy: 鎖定 | Transparent: 批量載入
 */
import { DeltaTracker, hashLock, generateTraceableId } from './stream-buffer.js';

export class ETLPipeline {
  private readonly trackers = new Map<string, DeltaTracker<any>>();

  async process<T extends { version?: number }>(source: string, rows: T[]): Promise<T[]> {
    const transformed = rows.map((r) => hashLock(r) as T); // Trustworthy
    const tracker = this.trackers.get(source) ?? new DeltaTracker<T>();
    this.trackers.set(source, tracker); // 同 source 跨呼叫共享追蹤狀態
    return tracker.getChanges(source, transformed); // 增量輸出: 僅變更
  }

  async extractDelta<T>(source: string, all: T[]): Promise<string> {
    return generateTraceableId(source); // Traceable: 增量提取標記
  }
}
