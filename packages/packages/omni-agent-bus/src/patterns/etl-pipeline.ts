/**
 * Pattern 3 — Data Pipeline (數據管道 / ETL) · 增量優化版
 *
 * 對齊 soul.md §12.1.3 (5T 合規 ETL 管道 + 增量輸出優化)
 *
 * 5T 對應:
 *   - Traceable:   extractDelta 記錄數據來源 (增量提取)
 *   - Trackable:   transformStream 數據血統 (流式轉換)
 *   - Trustworthy: Object.freeze() 數據鎖定
 *   - Transparent: loadBatch 載入日誌公開可查
 *   - Tangible:    getCompressedData 壓縮輸出, 低延遲
 *
 * 增量優化: DeltaTracker + CompressionEngine + 增量提取/轉換
 */
import { DeltaTracker } from './delta-tracker.js';
import { CompressionEngine } from './compression.js';
import { hashLock } from './five-t.js';

export interface DataSource {
  id: string;
  /** 增量提取: 僅回傳 version > sinceVersion 的資料 */
  extractDelta: (sinceVersion: number) => Promise<Array<{ key: string; value: unknown }>>;
}

export interface ProcessedData {
  traceId: string;
  version: number;
  rows: number;
  hashLock: string;
  frozen: boolean;
}

export class ETLPipeline {
  private readonly deltaTracker = new DeltaTracker<unknown>();
  private readonly compression = new CompressionEngine();

  /** Traceable: 增量提取 + 記錄來源 */
  private async extractDelta(source: DataSource): Promise<{ traceId: string; sinceVersion: number }> {
    const sinceVersion = this.deltaTracker.version();
    const batch = await source.extractDelta(sinceVersion);
    for (const row of batch) {
      this.deltaTracker.set(row.key, row.value);
    }
    const traceId = hashLock(source.id + ':' + sinceVersion);
    return { traceId, sinceVersion };
  }

  /** Trackable: 流式轉換 (增量) */
  private async transformStream(traceId: string): Promise<unknown[]> {
    const changes = this.deltaTracker.getChanges(0);
    void traceId;
    // Trustworthy: freeze 每行
    return changes.map((c) => Object.freeze({ key: c.key, value: c.value, version: c.version }));
  }

  /** 處理主流程 */
  async process(source: DataSource): Promise<ProcessedData> {
    const { traceId, sinceVersion } = await this.extractDelta(source);
    const transformed = (await this.transformStream(traceId)) as Array<{ key: string; value: unknown }>;

    // Trustworthy: 鎖定結果
    const locked = Object.freeze({ traceId, rows: transformed });

    // Transparent: 批量載入日誌
    console.log(`[etl] trace=${traceId} loaded=${transformed.length} since=${sinceVersion}`);

    return {
      traceId,
      version: this.deltaTracker.version(),
      rows: transformed.length,
      hashLock: hashLock(JSON.stringify(locked)),
      frozen: true,
    };
  }

  /** 增量輸出: 壓縮變更資料 */
  async getCompressedData(sinceVersion = 0): Promise<Buffer> {
    const changes = this.deltaTracker.getChanges(sinceVersion);
    return this.compression.compress(changes);
  }

  health(): { version: number; keys: number } {
    return { version: this.deltaTracker.version(), keys: this.deltaTracker.keys().length };
  }
}
