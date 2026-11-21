/**
 * 增量輸出優化 — 共用型別 (Incremental Output Optimization)
 *
 * 對齊 soul.md §12.0 增量輸出優化架構:
 *   Input → Chunked Processing → 5T Validation → Output Optimization → Delivery
 *
 * 設計哲學 (無作妙德圓通無礙):
 *   - 所有組件皆 graceful: 空/未初始化不報錯, 靜默略過
 *   - 所有寫入皆過 5T Gate (對齊 bus.ts bus5TGate) 才向後游廣播
 *   - 增量語意: 僅同步/回傳變更 (delta), 不重傳全量
 */

/** 可凍結核心 (IComponentCore 對齊 types.ts) */
export interface IFrozenCore {
  readonly uuid: string;
  readonly version: string;
  readonly timestamp: number;
}

/** 分頁設定 */
export interface PaginationConfig {
  size: number;
}

/** 分頁結果包裝 */
export interface PaginatedResult<T> {
  page: number;
  size: number;
  total: number;
  items: T[];
}

/** 頁面結果 */
export interface PageResult<T> {
  page: number;
  size: number;
  total: number;
  items: T[];
}

/** 5T 維度 (對齊 bus.ts) */
export type FiveTDimension =
  | 'traceable'
  | 'transparent'
  | 'tangible'
  | 'trustworthy'
  | 'trackable';

/** 5T Gate 結果 */
export interface FiveTResult {
  pass: boolean;
  failed: FiveTDimension[];
}

/** 流式記錄項 (用於 StreamBuffer) */
export interface StreamEntry<T> {
  id: string;
  topic?: string;
  source?: string;
  timestamp: number;
  payload: T;
}

/** 重試任務 (用於 PriorityQueue / ErrorHandler) */
export interface RetryTask {
  task: () => Promise<unknown>;
  priority: number;
  delay: number;
}

/** 壓縮引擎介面 (可注入輕量實作, 不依賴 zlib 之外的外部套件) */
export interface CompressionSink {
  compress(data: unknown): Buffer;
  decompress(buf: Buffer): unknown;
}
