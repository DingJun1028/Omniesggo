/**
 * 5T 合規錯誤處理 (增量優化版) — 圣典 §12.1.6
 * Trustworthy: 錯誤鎖定 | Transparent: 日誌流式
 * Trackable: 重試計數 | Tangible: 用戶通知分頁
 */
import { StreamBuffer, hashLock, generateTraceableId } from './stream-buffer.js';

export interface ErrorRecord {
  id: string;
  timestamp: number;
  message: string;
  context?: unknown;
}

export class ErrorHandler {
  private readonly errorBuffer = new StreamBuffer<ErrorRecord>();
  private readonly retryCount = new Map<string, number>();

  async handle(error: Error, context?: unknown): Promise<string> {
    const rec: ErrorRecord = hashLock({ // Trustworthy
      id: generateTraceableId('err'),
      timestamp: Date.now(),
      message: error.message,
      context: hashLock(context ?? null),
    });
    this.errorBuffer.append(rec); // Transparent: 流式記錄
    return rec.id;
  }

  async retry(key: string, fn: () => Promise<unknown>): Promise<unknown> {
    const cnt = (this.retryCount.get(key) ?? 0) + 1; // Trackable: 增量計數
    this.retryCount.set(key, cnt);
    if (cnt > 3) throw new Error('max retries exceeded');
    return fn();
  }

  async getErrorLogs(since: number): Promise<ErrorRecord[]> {
    return this.errorBuffer.getDelta(since); // 增量輸出: 批量獲取
  }
}
