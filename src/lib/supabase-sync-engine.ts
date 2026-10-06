import { supabase } from './supabase-client';

export type SyncOperation = 'INSERT' | 'UPDATE' | 'DELETE';

export interface SyncTask<T = any> {
  id: string;
  table: string;
  operation: SyncOperation;
  payload: T;
  retryCount: number;
  lastAttemptAt?: number;
}

/**
 * 萬能核心同步引擎 (OmniCore Sync Engine)
 * 解決資料庫同步穩定性，實作：
 * 1. 斷線重試與離線暫存 (Exponential Backoff)
 * 2. Supabase Realtime 狀態監聽與自動重連
 * 3. 確保 5T 協議的資料完整性
 */
export class SupabaseSyncEngine {
  private queue: SyncTask[] = [];
  private isProcessing = false;
  private readonly MAX_RETRIES = 5;
  private readonly BASE_DELAY_MS = 1000;
  private queueFilePath = '.esggo-sync-queue.json';
  private dlqFilePath = '.esggo-dlq.json';

  constructor() {
    this.loadQueue();
    this.initRealtimeListener();
  }

  private isServer() {
    return typeof window === 'undefined';
  }

  /**
   * 從本地檔案載入未完成的佇列 (確保重啟不掉單)
   */
  private loadQueue() {
    try {
      if (this.isServer()) {
        const fs = eval('require("fs")');
        const path = eval('require("path")');
        const qp = path.join(process.cwd(), this.queueFilePath);
        if (fs.existsSync(qp)) {
          this.queue = JSON.parse(fs.readFileSync(qp, 'utf8'));
        }
      } else {
        const stored = localStorage.getItem('omni-sync-queue');
        if (stored) this.queue = JSON.parse(stored);
      }
      
      if (this.queue.length > 0) {
        console.log(`[SyncEngine] 已從本地恢復 ${this.queue.length} 筆待同步任務`);
        this.processQueue().catch(console.error);
      }
    } catch (error) {
      console.warn('[SyncEngine] 載入本地佇列失敗:', error);
    }
  }

  /**
   * 保存佇列到本地檔案
   */
  private saveQueue() {
    try {
      if (this.isServer()) {
        const fs = eval('require("fs")');
        const path = eval('require("path")');
        const qp = path.join(process.cwd(), this.queueFilePath);
        fs.writeFileSync(qp, JSON.stringify(this.queue, null, 2), 'utf8');
      } else {
        localStorage.setItem('omni-sync-queue', JSON.stringify(this.queue));
      }
    } catch (error) {
      console.warn('[SyncEngine] 保存本地佇列失敗:', error);
    }
  }

  /**
   * 將失敗任務移至 Dead Letter Queue (死信佇列)
   */
  private moveToDLQ(task: SyncTask) {
    try {
      let dlq: SyncTask[] = [];
      if (this.isServer()) {
        const fs = eval('require("fs")');
        const path = eval('require("path")');
        const dp = path.join(process.cwd(), this.dlqFilePath);
        if (fs.existsSync(dp)) dlq = JSON.parse(fs.readFileSync(dp, 'utf8'));
        dlq.push({ ...task, lastAttemptAt: Date.now() });
        fs.writeFileSync(dp, JSON.stringify(dlq, null, 2), 'utf8');
      } else {
        const stored = localStorage.getItem('omni-dlq');
        if (stored) dlq = JSON.parse(stored);
        dlq.push({ ...task, lastAttemptAt: Date.now() });
        localStorage.setItem('omni-dlq', JSON.stringify(dlq));
      }
    } catch (error) {
      console.warn('[SyncEngine] 寫入死信佇列失敗:', error);
    }
  }

  /**
   * 推送同步任務至佇列
   */
  public async pushTask<T>(table: string, operation: SyncOperation, payload: T) {
    const task: SyncTask<T> = {
      id: crypto.randomUUID(),
      table,
      operation,
      payload,
      retryCount: 0,
    };
    
    this.queue.push(task);
    this.saveQueue();
    console.log(`[SyncEngine] 任務已加入佇列: [${operation}] ${table} (TaskID: ${task.id})`);
    
    // 非同步啟動處理，避免阻塞主線程
    this.processQueue().catch(console.error);
  }

  /**
   * 處理同步佇列
   */
  private async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;
    this.isProcessing = true;

    while (this.queue.length > 0) {
      const task = this.queue[0]; // Peek

      // 檢查是否需要延遲重試
      if (task.lastAttemptAt) {
        const delay = this.BASE_DELAY_MS * Math.pow(2, task.retryCount);
        const timeToWait = (task.lastAttemptAt + delay) - Date.now();
        if (timeToWait > 0) {
          // 等待後再試，暫時中斷處理循環
          setTimeout(() => this.processQueue(), timeToWait);
          this.isProcessing = false;
          return;
        }
      }

      task.lastAttemptAt = Date.now();

      try {
        await this.executeTask(task);
        this.queue.shift(); // 執行成功，移除任務
        this.saveQueue();
        console.log(`[SyncEngine] 任務執行成功: [${task.operation}] ${task.table}`);
      } catch (error: any) {
        task.retryCount++;
        console.warn(`[SyncEngine] 任務執行失敗 (重試次數: ${task.retryCount}/${this.MAX_RETRIES}):`, error.message);
        
        if (task.retryCount >= this.MAX_RETRIES) {
          console.error(`[SyncEngine] 任務已達最大重試次數，將移至死信佇列 (Dead Letter Queue): ${task.id}`);
          const failedTask = this.queue.shift();
          if (failedTask) this.moveToDLQ(failedTask);
          this.saveQueue();
        } else {
          this.saveQueue();
          // 保留在佇列最前方，中斷本次處理循環以等待下一次 Backoff
          this.isProcessing = false;
          return;
        }
      }
    }

    this.isProcessing = false;
  }

  /**
   * 執行實際的 Supabase API 呼叫
   */
  private async executeTask(task: SyncTask) {
    const { table, operation, payload } = task;
    let response;

    switch (operation) {
      case 'INSERT':
        response = await supabase.from(table).insert(payload);
        break;
      case 'UPDATE':
        response = await supabase.from(table).update(payload).eq('id', payload.id || payload.uuid);
        break;
      case 'DELETE':
        response = await supabase.from(table).delete().eq('id', payload.id || payload.uuid);
        break;
    }

    if (response?.error) {
      throw new Error(response.error.message);
    }
    
    return response?.data;
  }

  /**
   * 初始化 Realtime 網路監聽與自動重連
   */
  private initRealtimeListener() {
    supabase.channel('system_sync_health')
      .on('system', { event: '*' }, (payload) => {
        console.log('[SyncEngine] Supabase Realtime 系統事件:', payload);
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[SyncEngine] Supabase Realtime 已連線，準備處理積壓佇列');
          this.processQueue().catch(console.error);
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          console.warn('[SyncEngine] Supabase Realtime 連線異常，將觸發自動重試機制');
        }
      });
  }
}

export const syncEngine = new SupabaseSyncEngine();
