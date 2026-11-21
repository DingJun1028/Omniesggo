/**
 * Pattern 2 — Microservices Orchestration (微服務編排) · 增量優化版
 *
 * 對齊 soul.md §12.1.2 (5T 閘區微服務編排 + 增量輸出優化)
 *
 * 5T 對應:
 *   - Trustworthy: 服務認證 (HMAC)
 *   - Trackable:   執行追蹤 (增量更新) + startExecution 日誌
 *   - Transparent: 執行日誌公開可查 (logExecutionStream)
 *   - Tangible:    用戶回饋 (分頁返回) + 增量輸出
 *
 * 增量優化: 壓縮 + 快取 (LRUCache) + 分頁 (Pagination)
 */
import { LRUCache } from './lru-cache.js';
import { CompressionEngine } from './compression.js';
import { paginate } from './pagination.js';
import type { PaginationConfig, PaginatedResult } from './types.js';
import { hashLock } from './five-t.js';

export interface WorkflowDefinition {
  id: string;
  services: string[];
  steps: Array<{ name: string; run: () => Promise<unknown> }>;
}

interface ExecutionRecord {
  id: string;
  status: 'started' | 'running' | 'done' | 'failed';
  startedAt: number;
  steps: string[];
  hashLock: string;
}

export type { ExecutionRecord };

type ExecutionResult = Record<string, unknown>;

export class ServiceOrchestrator {
  private readonly cache = new LRUCache<string, ExecutionResult>(256);
  private readonly compression = new CompressionEngine();
  private readonly pagination: PaginationConfig = { size: 10 };
  private readonly executions = new Map<string, ExecutionRecord>();
  private readonly statusMap = new Map<string, ExecutionRecord['status']>();

  /** Trustworthy: 服務認證 (HMAC 簡版 — 對 service 名做 hash lock) */
  private async authenticateServices(services: string[]): Promise<boolean> {
    if (services.length === 0) return false;
    return services.every((s) => hashLock(s).length >= 16);
  }

  /** Trackable: 啟動執行並記錄 (增量) */
  private async startExecution(wf: WorkflowDefinition): Promise<string> {
    const record: ExecutionRecord = {
      id: wf.id,
      status: 'started',
      startedAt: Date.now(),
      steps: wf.steps.map((s) => s.name),
      hashLock: hashLock(wf.id),
    };
    this.executions.set(wf.id, record);
    this.statusMap.set(wf.id, 'started');
    this.logExecutionStream(wf.id, 'started');
    return wf.id;
  }

  /** Transparent: 執行日誌 (增量寫入 console + 返回) */
  private logExecutionStream(execId: string, phase: string): void {
    // Tangible: 用 console.log 而非 error (對齊 esggo-learning-center CLI 規範)
    console.log(`[orchestrator] exec=${execId} phase=${phase}`);
  }

  /** 執行工作流 (增量: 快取 + 分頁 + 壓縮) */
  async executeWorkflow(wf: WorkflowDefinition): Promise<PaginatedResult<unknown>> {
    if (!(await this.authenticateServices(wf.services))) {
      throw new Error('Service auth failed (Trustworthy gate)');
    }
    const execId = await this.startExecution(wf);
    this.logExecutionStream(execId, 'running');

    const results: unknown[] = [];
    for (const step of wf.steps) {
      const r = await step.run();
      results.push(r);
      // Trackable: 增量更新執行狀態
      this.statusMap.set(execId, 'running');
    }

    const result: ExecutionResult = { execId, results };
    // Tangible: 壓縮 + 快取
    this.compression.compress(result);
    this.cache.set(`${execId}:result`, result, 300_000);

    this.statusMap.set(execId, 'done');
    this.logExecutionStream(execId, 'done');

    // 增量輸出: 分頁返回
    return paginate(results, 1, this.pagination.size);
  }

  /** 增量輸出: 僅回傳變更頁面 (LRU 快取命中優先) */
  async getPage(execId: string, page: number): Promise<PaginatedResult<unknown>> {
    const cached = this.cache.get(`${execId}:result`);
    let results: unknown[] = cached ? (cached.results as unknown[]) : [];
    if (!cached) {
      const rec = this.executions.get(execId);
      if (rec) this.logExecutionStream(execId, 'cache-miss');
    }
    return paginate(results, page, this.pagination.size);
  }

  health(): { executions: number; cacheSize: number } {
    return { executions: this.executions.size, cacheSize: this.cache.size() };
  }
}
