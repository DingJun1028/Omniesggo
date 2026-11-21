/**
 * ==========================================
 * 完全代主自行 - 效能優化模組
 * ==========================================
 * 
 * 提供快取、連線池、批次處理等效能優化功能
 */

import { ICompleteDelegationScope } from '../../types/complete-delegation';

// ==========================================
// 快取介面
// ==========================================

interface CacheOptions {
  maxSize: number;
  ttl: number; // 生存時間 (毫秒)
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
}

// ==========================================
// LRU 快取實現
// ==========================================

export class LRUCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private readonly maxSize: number;
  private readonly ttl: number;

  constructor(options: CacheOptions = { maxSize: 1000, ttl: 5 * 60 * 1000 }) {
    this.maxSize = options.maxSize;
    this.ttl = options.ttl;
  }

  /**
   * 獲取快取值
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      return undefined;
    }

    // 檢查是否過期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // 更新訪問資訊
    entry.accessCount++;
    entry.lastAccessed = Date.now();

    return entry.value;
  }

  /**
   * 設置快取值
   */
  set(key: string, value: T): void {
    // 如果已存在，先刪除
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }
    // 如果快取已滿，刪除最久未訪問的項目
    else if (this.cache.size >= this.maxSize) {
      this.evict();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl,
      accessCount: 1,
      lastAccessed: Date.now(),
    });
  }

  /**
   * 刪除快取
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * 檢查快取是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 清空快取
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 獲取快取大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 獲取快取統計
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    avgAccessCount: number;
  } {
    const entries = Array.from(this.cache.values());
    const totalAccess = entries.reduce((sum, e) => sum + e.accessCount, 0);
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.cache.size > 0 ? totalAccess / this.cache.size : 0,
      avgAccessCount: this.cache.size > 0 ? totalAccess / this.cache.size : 0,
    };
  }

  /**
   * 淘汰最久未訪問的項目
   */
  private evict(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }
}

// ==========================================
// 授權快取管理器
// ==========================================

export class DelegationCacheManager {
  private static instance: DelegationCacheManager;
  
  // 授權快取
  private delegationCache: LRUCache<ICompleteDelegationScope>;
  
  // 驗證快取
  private validationCache: LRUCache<boolean>;
  
  // 決策快取
  private decisionCache: LRUCache<Record<string, unknown>>;

  private constructor() {
      this.delegationCache = new LRUCache<ICompleteDelegationScope>({
      maxSize: 500,
      ttl: 10 * 60 * 1000, // 10 分鐘
    });

    this.validationCache = new LRUCache<boolean>({
      maxSize: 1000,
      ttl: 2 * 60 * 1000, // 2 分鐘
    });

    this.decisionCache = new LRUCache<Record<string, unknown>>({
      maxSize: 200,
      ttl: 5 * 60 * 1000, // 5 分鐘
    });
  }

  static getInstance(): DelegationCacheManager {
    if (!DelegationCacheManager.instance) {
      DelegationCacheManager.instance = new DelegationCacheManager();
    }
    return DelegationCacheManager.instance;
  }

  /**
   * 獲取授權快取
   */
  getDelegation(delegationId: string): ICompleteDelegationScope | undefined {
    return this.delegationCache.get(`delegation:${delegationId}`);
  }

  /**
   * 設置授權快取
   */
  setDelegation(delegationId: string, delegation: ICompleteDelegationScope): void {
    this.delegationCache.set(`delegation:${delegationId}`, delegation);
  }

  /**
   * 獲取驗證快取
   */
  getValidation(delegationId: string, permission: string): boolean | undefined {
    return this.validationCache.get(`validation:${delegationId}:${permission}`);
  }

  /**
   * 設置驗證快取
   */
  setValidation(delegationId: string, permission: string, isValid: boolean): void {
    this.validationCache.set(`validation:${delegationId}:${permission}`, isValid);
  }

  /**
   * 獲取決策快取
   */
  getDecision(intent: string, contextHash: string): Record<string, unknown> | undefined {
    return this.decisionCache.get(`decision:${intent}:${contextHash}`);
  }

  /**
   * 設置決策快取
   */
  setDecision(intent: string, contextHash: string, decision: Record<string, unknown>): void {
    this.decisionCache.set(`decision:${intent}:${contextHash}`, decision);
  }

  /**
   * 使快取失效
   */
  invalidateDelegation(delegationId: string): void {
    this.delegationCache.delete(`delegation:${delegationId}`);
    // 使相關驗證快取失效
    for (const key of this.getRelatedKeys(`validation:${delegationId}`)) {
      this.validationCache.delete(key);
    }
  }

  /**
   * 獲取相關快取鍵
   */
  private getRelatedKeys(_prefix: string): string[] {
    const keys: string[] = [];
    // 注意：這裡簡化實現，實際應該維護一個鍵索引
    return keys;
  }

  /**
   * 獲取所有快取統計
   */
  getStats(): {
    delegation: ReturnType<LRUCache['getStats']>;
    validation: ReturnType<LRUCache['getStats']>;
    decision: ReturnType<LRUCache['getStats']>;
  } {
    return {
      delegation: this.delegationCache.getStats(),
      validation: this.validationCache.getStats(),
      decision: this.decisionCache.getStats(),
    };
  }

  /**
   * 清空所有快取
   */
  clearAll(): void {
    this.delegationCache.clear();
    this.validationCache.clear();
    this.decisionCache.clear();
  }
}

// ==========================================
// 批次處理器
// ==========================================

export class BatchProcessor<T, R> {
  private queue: Array<{
    item: T;
    resolve: (result: R) => void;
    reject: (error: Error) => void;
  }> = [];
  
  private processing = false;
  private readonly batchSize: number;
  private readonly batchDelay: number;
  private batchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private processor: (items: T[]) => Promise<R[]>,
    options: { batchSize?: number; batchDelay?: number } = {}
  ) {
    this.batchSize = options.batchSize || 10;
    this.batchDelay = options.batchDelay || 100;
  }

  /**
   * 添加項目到批次佇列
   */
  add(item: T): Promise<R> {
    return new Promise((resolve, reject) => {
      this.queue.push({ item, resolve, reject });
      this.scheduleProcess();
    });
  }

  /**
   * 添加多個項目
   */
  addMany(items: T[]): Promise<R[]> {
    return Promise.all(items.map((item) => this.add(item)));
  }

  /**
   * 調度處理
   */
  private scheduleProcess(): void {
    if (this.processing) {
      return;
    }

    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    if (this.queue.length >= this.batchSize) {
      this.processBatch();
    } else {
      this.batchTimeout = setTimeout(() => this.processBatch(), this.batchDelay);
    }
  }

  /**
   * 處理批次
   */
  private async processBatch(): Promise<void> {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;
    const batch = this.queue.splice(0, this.batchSize);

    try {
      const items = batch.map((b) => b.item);
      const results = await this.processor(items);

      batch.forEach((b, i) => {
        if (i < results.length) {
          b.resolve(results[i]);
        } else {
          b.reject(new Error('No result for item'));
        }
      });
    } catch (error) {
      batch.forEach((b) => {
        b.reject(error instanceof Error ? error : new Error(String(error)));
      });
    } finally {
      this.processing = false;

      if (this.queue.length > 0) {
        this.scheduleProcess();
      }
    }
  }
}

// ==========================================
// 連線池管理器
// ==========================================

export class ConnectionPool<T> {
  private pool: T[] = [];
  private inUse: Set<T> = new Set();
  private waiters: Array<() => void> = [];
  private readonly maxSize: number;
  private readonly minSize: number;

  constructor(
    private factory: () => T,
    private destroyer: (conn: T) => void,
    options: { minSize?: number; maxSize?: number } = {}
  ) {
    this.minSize = options.minSize ?? 0;
    this.maxSize = options.maxSize || 20;
    this.init();
  }

  /**
   * 初始化連線池
   */
  private init(): void {
    for (let i = 0; i < this.minSize; i++) {
      this.pool.push(this.factory());
    }
  }

  /**
   * 獲取連線
   */
  async acquire(): Promise<T> {
    // 優先從池中取得已有的空閒連線
    if (this.pool.length > 0) {
      const conn = this.pool.pop()!;
      this.inUse.add(conn);
      return conn;
    }

    // 池中無空閒連線：若尚未達到上限，建立新連線
    if (this.inUse.size < this.maxSize) {
      const conn = this.factory();
      this.inUse.add(conn);
      return conn;
    }

    // 已達上限：排入等待佇列，待連線釋放時喚醒後重試
    return new Promise<T>((resolve) => {
      this.waiters.push(() => resolve(this.acquire()));
    });
  }

  /**
   * 釋放連線
   */
  release(conn: T): void {
    this.inUse.delete(conn);
    this.pool.push(conn);
    // 喚醒一個等待中的取得者
    const waiter = this.waiters.shift();
    if (waiter) waiter();
  }

  /**
   * 關閉連線池
   */
  close(): void {
    for (const conn of this.pool) {
      this.destroyer(conn);
    }
    for (const conn of this.inUse) {
      this.destroyer(conn);
    }
    this.pool = [];
    this.inUse.clear();
  }

  /**
   * 獲取連線池狀態
   */
  getStatus(): {
    available: number;
    inUse: number;
    total: number;
  } {
    return {
      available: this.pool.length,
      inUse: this.inUse.size,
      total: this.pool.length + this.inUse.size,
    };
  }
}

// ==========================================
// 效能監控器
// ==========================================

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  private metrics: Map<string, {
    count: number;
    totalTime: number;
    minTime: number;
    maxTime: number;
  }> = new Map();

  private constructor() {}

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  /**
   * 記錄操作時間
   */
  record(operation: string, duration: number): void {
    const existing = this.metrics.get(operation);
    
    if (existing) {
      existing.count++;
      existing.totalTime += duration;
      existing.minTime = Math.min(existing.minTime, duration);
      existing.maxTime = Math.max(existing.maxTime, duration);
    } else {
      this.metrics.set(operation, {
        count: 1,
        totalTime: duration,
        minTime: duration,
        maxTime: duration,
      });
    }
  }

  /**
   * 獲取操作統計
   */
  getStats(operation: string): {
    count: number;
    avgTime: number;
    minTime: number;
    maxTime: number;
    totalTime: number;
  } | undefined {
    const metric = this.metrics.get(operation);
    if (!metric) {
      return undefined;
    }

    return {
      count: metric.count,
      avgTime: metric.totalTime / metric.count,
      minTime: metric.minTime,
      maxTime: metric.maxTime,
      totalTime: metric.totalTime,
    };
  }

  /**
   * 獲取所有統計
   */
  getAllStats(): Map<string, ReturnType<PerformanceMonitor['getStats']>> {
    const stats = new Map<string, ReturnType<PerformanceMonitor['getStats']>>();
    
    for (const operation of this.metrics.keys()) {
      stats.set(operation, this.getStats(operation));
    }
    
    return stats;
  }

  /**
   * 清空統計
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * 生成報告
   */
  generateReport(): string {
    const stats = this.getAllStats();
    const lines: string[] = ['效能監控報告', '=' .repeat(50)];

    for (const [operation, metric] of stats.entries()) {
      if (metric) {
        lines.push(`\n操作: ${operation}`);
        lines.push(`  執行次數: ${metric.count}`);
        lines.push(`  平均時間: ${metric.avgTime.toFixed(2)}ms`);
        lines.push(`  最短時間: ${metric.minTime.toFixed(2)}ms`);
        lines.push(`  最長時間: ${metric.maxTime.toFixed(2)}ms`);
        lines.push(`  總時間: ${metric.totalTime.toFixed(2)}ms`);
      }
    }

    return lines.join('\n');
  }
}

// ==========================================
// 匯出單例
// ==========================================

export const cacheManager = DelegationCacheManager.getInstance();
export const performanceMonitor = PerformanceMonitor.getInstance();
