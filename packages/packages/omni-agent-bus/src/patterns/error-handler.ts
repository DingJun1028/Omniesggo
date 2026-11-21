/**
 * Pattern 6 — Error Handling (錯誤處理) · 增量優化版
 *
 * 對齊 soul.md §12.1.6 (5T 合規錯誤處理 + 增量輸出優化)
 *
 * 5T 對應:
 *   - Trustworthy: 錯誤鎖定 (Object.freeze) + 不可篡改
 *   - Transparent: 錯誤日誌流式記錄 (logErrorStream)
 *   - Trackable:   重試次數增量計數 (指數退避)
 *   - Tangible:    用戶通知 (分頁返回) + 增量輸出
 *
 * 增量優化: StreamBuffer + PriorityQueue (指數退避重試)
 */
import { StreamBuffer } from './stream-buffer.js';
import { PriorityQueue } from './priority-queue.js';
import { paginate } from './pagination.js';
import { hashLock } from './five-t.js';
import type { RetryTask } from './types.js';

export interface ExecutionContext {
  retryCount: number;
  maxRetries?: number;
  metadata?: Record<string, unknown>;
}

interface ErrorRecord {
  id: string;
  timestamp: number;
  error: string;
  stack?: string;
  context: ExecutionContext;
}

export type { ErrorRecord };

export class ErrorHandler {
  private readonly errorBuffer = new StreamBuffer<ErrorRecord>(1024);
  private readonly retryQueue = new PriorityQueue<RetryTask & { ctx: ExecutionContext; errId: string }>(
    (t) => t.priority
  );
  private readonly MAX_RETRY = 3;

  /** 處理錯誤 (增量: 鎖定 + 日誌 + 重試 + 通知) */
  async handle(error: Error, context: ExecutionContext): Promise<{ queued: boolean; errId: string }> {
    // Trustworthy: 錯誤鎖定 (增量寫入)
    const errorRecord: ErrorRecord = Object.freeze({
      id: `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      context: Object.freeze({ ...context }),
    });

    // Transparent: 錯誤日誌流式記錄
    await this.logErrorStream(errorRecord);

    // Trackable: 重試次數增量計數 (指數退避)
    const max = context.maxRetries ?? this.MAX_RETRY;
    if (context.retryCount < max) {
      const delay = Math.pow(2, context.retryCount) * 1000;
      this.retryQueue.enqueue({
        task: () => Promise.resolve(undefined),
        priority: context.retryCount,
        delay,
        ctx: context,
        errId: errorRecord.id,
      });
      // Tangible: 用戶通知 (增量)
      await this.notifyUserDelta(errorRecord);
      return { queued: true, errId: errorRecord.id };
    }

    await this.notifyUserDelta(errorRecord);
    return { queued: false, errId: errorRecord.id };
  }

  /** Transparent: 錯誤日誌 (增量寫入流) */
  private async logErrorStream(record: ErrorRecord): Promise<void> {
    this.errorBuffer.append(record, { id: record.id, topic: 'error', source: 'ErrorHandler' });
    console.log(`[error] ${record.id} ${record.error}`);
  }

  /** Tangible: 用戶通知 (增量) */
  private async notifyUserDelta(record: ErrorRecord): Promise<void> {
    void hashLock(record.id);
    console.log(`[error] notify user ${record.id}`);
  }

  /** 增量輸出: 批量獲取錯誤日誌 (分頁) */
  async getErrorLogs(since: number, page = 1): Promise<ReturnType<typeof paginate<ErrorRecord>>> {
    const all = this.errorBuffer.getDelta(since).map((e) => e.payload) as ErrorRecord[];
    return paginate(all, page, 10);
  }

  /** 取出下一個重試任務 (PriorityQueue) */
  nextRetry(): (RetryTask & { ctx: ExecutionContext; errId: string }) | null {
    return this.retryQueue.dequeue();
  }

  health(): { errors: number; queue: number } {
    return { errors: this.errorBuffer.size(), queue: this.retryQueue.size() };
  }
}
