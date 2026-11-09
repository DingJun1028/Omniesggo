/**
 * Task Graph — DAG 編排器（Agent Bus v2）
 * 由 60 員軍團的 Task Dispatcher (13-18/43-48) 主導
 * 支援並行/序列/條件分支 + retry + timeout + circuit breaker
 */

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface TaskNode {
  id: string;
  name: string;
  /** 負責的 agent id（60 員軍團） */
  agentId: number;
  /** 陣列 */
  arrayKey: 'sanctum' | 'rune' | 'wing' | 'alchemy' | 'audit';
  /** 依賴的 task id 列表 */
  dependencies: string[];
  /** 執行函式 */
  execute: (context: TaskContext) => Promise<TaskResult>;
  /** 重試次數 */
  maxRetries: number;
  /** 超時（ms） */
  timeout: number;
  /** 狀態 */
  status: TaskStatus;
  /** 結果 */
  result?: TaskResult;
  /** 錯誤 */
  error?: Error;
  /** 開始時間 */
  startTime?: number;
  /** 結束時間 */
  endTime?: number;
}

export interface TaskContext {
  /** 共享上下文（RAG 注入等） */
  shared: Record<string, unknown>;
  /** 前序 task 結果 */
  results: Map<string, TaskResult>;
  /** 60 員 Registry 引用 */
  registry?: unknown;
}

export interface TaskResult {
  success: boolean;
  output: unknown;
  metadata?: Record<string, unknown>;
}

export interface TaskGraphOptions {
  /** 最大並行數 */
  maxConcurrency: number;
  /** 全域超時（ms） */
  globalTimeout: number;
  /** 是否在失敗時繼續 */
  continueOnError: boolean;
}

const DEFAULT_OPTIONS: TaskGraphOptions = {
  maxConcurrency: 5,
  globalTimeout: 300000,
  continueOnError: false,
};

export class TaskGraph {
  private nodes: Map<string, TaskNode> = new Map();
  private options: TaskGraphOptions;
  private context: TaskContext;

  constructor(options: Partial<TaskGraphOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.context = { shared: {}, results: new Map() };
  }

  /** 新增 task */
  addTask(node: Omit<TaskNode, 'status'>): void {
    this.nodes.set(node.id, { ...node, status: 'pending' });
  }

  /** 設定共享上下文 */
  setContext(ctx: Partial<TaskContext>): void {
    Object.assign(this.context, ctx);
  }

  /** 驗證 DAG 無循環 */
  validateDAG(): { valid: boolean; cycle?: string[] } {
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const dfs = (id: string): string[] | null => {
      if (visiting.has(id)) return [id];
      if (visited.has(id)) return null;
      visiting.add(id);
      const node = this.nodes.get(id);
      if (node) {
        for (const dep of node.dependencies) {
          const cycle = dfs(dep);
          if (cycle) return cycle;
        }
      }
      visiting.delete(id);
      visited.add(id);
      return null;
    };

    for (const id of this.nodes.keys()) {
      const cycle = dfs(id);
      if (cycle) return { valid: false, cycle };
    }
    return { valid: true };
  }

  /** 取得可執行的 task（依賴已滿足） */
  private getReadyTasks(): TaskNode[] {
    return Array.from(this.nodes.values()).filter(node => {
      if (node.status !== 'pending') return false;
      return node.dependencies.every(dep => {
        const depNode = this.nodes.get(dep);
        return depNode?.status === 'completed';
      });
    });
  }

  /** 執行單一 task（含 retry + timeout） */
  private async executeTask(node: TaskNode): Promise<void> {
    node.status = 'running';
    node.startTime = Date.now();

    for (let attempt = 0; attempt <= node.maxRetries; attempt++) {
      try {
        const result = await Promise.race([
          node.execute(this.context),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout: ${node.id} exceeded ${node.timeout}ms`)), node.timeout)
          ),
        ]);
        node.result = result;
        node.status = result.success ? 'completed' : 'failed';
        if (result.success) {
          this.context.results.set(node.id, result);
          return;
        }
        if (attempt < node.maxRetries) continue;
      } catch (err) {
        node.error = err as Error;
        if (attempt < node.maxRetries) continue;
        node.status = 'failed';
      }
    }
    node.endTime = Date.now();
  }

  /** 執行整個 Task Graph */
  async run(): Promise<{ success: boolean; results: Map<string, TaskResult>; errors: Map<string, Error> }> {
    const validation = this.validateDAG();
    if (!validation.valid) {
      throw new Error(`DAG 循環偵測: ${validation.cycle?.join(' → ')}`);
    }

    const startTime = Date.now();
    const errors = new Map<string, Error>();

    while (true) {
      if (Date.now() - startTime > this.options.globalTimeout) {
        throw new Error(`全域超時: ${this.options.globalTimeout}ms`);
      }

      const ready = this.getReadyTasks();
      if (ready.length === 0) {
        // 檢查是否全部完成或有失敗
        const pending = Array.from(this.nodes.values()).filter(n => n.status === 'pending');
        if (pending.length > 0) {
          // 有 pending 但無 ready → 依賴失敗
          for (const node of pending) {
            node.status = 'skipped';
            if (node.error) errors.set(node.id, node.error);
          }
        }
        break;
      }

      // 並行執行（限制 concurrency）
      const batch = ready.slice(0, this.options.maxConcurrency);
      await Promise.all(batch.map(node => this.executeTask(node)));

      // 檢查失敗
      const failed = batch.filter(n => n.status === 'failed');
      if (failed.length > 0 && !this.options.continueOnError) {
        for (const node of failed) {
          if (node.error) errors.set(node.id, node.error);
        }
        break;
      }
    }

    const allCompleted = Array.from(this.nodes.values()).every(n => n.status === 'completed');
    return {
      success: allCompleted,
      results: this.context.results,
      errors,
    };
  }

  /** 取得執行摘要 */
  summary(): string {
    const nodes = Array.from(this.nodes.values());
    const completed = nodes.filter(n => n.status === 'completed').length;
    const failed = nodes.filter(n => n.status === 'failed').length;
    const skipped = nodes.filter(n => n.status === 'skipped').length;
    const pending = nodes.filter(n => n.status === 'pending').length;
    return `TaskGraph: ${completed}/${nodes.length} completed, ${failed} failed, ${skipped} skipped, ${pending} pending`;
  }
}


export default TaskGraph;
