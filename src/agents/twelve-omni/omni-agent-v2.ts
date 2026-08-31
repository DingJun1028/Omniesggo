/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * ==========================================
 * 🌌 OmniAgent — 萬能代理實現 (增強版)
 * ==========================================
 * Autonomous agent with clone, backpressure, and flow monitoring.
 * OA + OAB: 細胞分裂、背壓監控、動態增殖
 */

import { randomUUID } from 'crypto';
import {
  IOmniAgentV2,
  AgentConfig,
  AgentMetrics,
  AgentTask,
  AgentResult,
  AgentHook,
  BackpressureMetrics,
  FlowMetrics,
} from '../../types/twelve-omni';
import { IComponentCore, LifecycleStage } from '../../lib/omni-core/contracts';

/**
 * OmniAgentV2 實現
 * 自主代理，支持細胞分裂和背壓監控
 */
export class OmniAgentV2 implements IOmniAgentV2 {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
  } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  readonly signature: IComponentCore;
  readonly config: AgentConfig;
  readonly metrics: AgentMetrics;

  /** 任務歷史 */
  private taskHistory: Array<{ task: AgentTask; result: AgentResult; timestamp: number }> = [];

  /** 鉤子註冊表 */
  private hooks: Map<LifecycleStage, AgentHook[]> = new Map();

  /** 背壓指標 (mutable) */
  private _backpressure: BackpressureMetrics = {
    queueDepth: 0,
    processingRate: 0,
    memoryUsage: 0,
    pressureLevel: 'normal',
  };

  constructor(config?: Partial<AgentConfig>) {
    this.uuid = randomUUID();
    this.timestamp = Date.now();

    this.config = {
      name: config?.name || `Agent-${this.uuid.slice(0, 8)}`,
      maxConcurrency: config?.maxConcurrency || 10,
      timeout: config?.timeout || 30000,
      retryPolicy: config?.retryPolicy || {
        maxRetries: 3,
        backoffMs: 1000,
        maxBackoffMs: 30000,
      },
      hooks: config?.hooks || new Map(),
    };

    this.metrics = {
      tasksExecuted: 0,
      tasksSucceeded: 0,
      tasksFailed: 0,
      avgExecutionTime: 0,
      uptime: 0,
    };

    this.signature = {
      uuid: this.uuid,
      version: this.version,
      timestamp: this.timestamp,
      evidence: this.evidence,
    };
  }

  /**
   * 執行任務
   */
  async execute(task: AgentTask): Promise<AgentResult> {
    const startTime = Date.now();

    // 觸發 EMERGED 鉤子
    await this.triggerHooks('EMERGED', { task });

    try {
      // 模擬任務執行
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));

      const result: AgentResult = {
        taskId: task.id,
        success: true,
        data: { processed: true },
        executionTimeMs: Date.now() - startTime,
      };

      // 更新指標 (使用 mutable 版本)
      const m = this.metrics as AgentMetrics & Record<string, unknown>;
      m.tasksExecuted++;
      m.tasksSucceeded++;
      m.avgExecutionTime =
        (m.avgExecutionTime * (m.tasksExecuted - 1) +
          result.executionTimeMs) /
        m.tasksExecuted;
      m['lastExecutedAt'] = Date.now();
      m.uptime = Date.now() - this.timestamp;

      // 記錄歷史
      this.taskHistory.push({ task, result, timestamp: Date.now() });

      // 觸發 FROZEN 鉤子 (代替 COMPLETED)
      await this.triggerHooks('FROZEN', { task, result });

      return result;
    } catch (error) {
      const result: AgentResult = {
        taskId: task.id,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTimeMs: Date.now() - startTime,
      };

      const m = this.metrics as AgentMetrics & Record<string, unknown>;
      m.tasksExecuted++;
      m.tasksFailed++;

      await this.triggerHooks('FROZEN', { task, result, error: error as Error });

      return result;
    }
  }

  /**
   * 註冊鉤子
   */
  registerHook(stage: LifecycleStage, hook: AgentHook): void {
    const existing = this.hooks.get(stage) || [];
    existing.push(hook);
    this.hooks.set(stage, existing);
  }

  /**
   * 戒嚴模式
   */
  onMartialLaw(reason: string): void {
    this._backpressure = { ...this._backpressure, pressureLevel: 'critical' };
    Object.assign((this as any).evidence, { martial_law: { reason, timestamp: Date.now() } });
  }

  /**
   * 克隆代理 (細胞分裂)
   */
  clone(_newUuid: string): IOmniAgentV2 {
    const cloned = new OmniAgentV2({
      name: `${this.config.name}-clone`,
      maxConcurrency: this.config.maxConcurrency,
      timeout: this.config.timeout,
      retryPolicy: { ...this.config.retryPolicy },
    });

    // 複製鉤子
    const entries = Array.from(this.hooks.entries());
    for (const [stage, hooks] of entries) {
      for (const hook of hooks) {
        cloned.registerHook(stage, hook);
      }
    }

    return cloned;
  }

  /**
   * 背壓監控
   */
  async monitorBackpressure(): Promise<BackpressureMetrics> {
    this._backpressure = {
      queueDepth: Math.floor(Math.random() * 100),
      processingRate: Math.random() * 50,
      memoryUsage: Math.random() * 100,
      pressureLevel:
        this._backpressure.queueDepth > 80
          ? 'critical'
          : this._backpressure.queueDepth > 50
          ? 'elevated'
          : 'normal',
    };

    return { ...this._backpressure };
  }

  /**
   * 獲取近期流量
   */
  async getRecentFlow(windowMs: number = 60000): Promise<FlowMetrics> {
    const now = Date.now();
    const recentTasks = this.taskHistory.filter(
      (t) => t.timestamp > now - windowMs
    );

    const latencies = recentTasks.map((t) => t.result.executionTimeMs);
    latencies.sort((a, b) => a - b);

    return {
      windowMs,
      totalTasks: recentTasks.length,
      throughput: recentTasks.length / (windowMs / 1000),
      latencyP50: latencies[Math.floor(latencies.length * 0.5)] || 0,
      latencyP99: latencies[Math.floor(latencies.length * 0.99)] || 0,
    };
  }

  /**
   * 更新配置
   */
  async updateConfig(delta: Partial<AgentConfig>): Promise<void> {
    Object.assign(this.config, delta);
  }

  /**
   * 觸發鉤子 (內部輔助)
   */
  private async triggerHooks(
    stage: LifecycleStage,
    ctx: { task?: AgentTask; result?: AgentResult; error?: Error }
  ): Promise<void> {
    const hooks = this.hooks.get(stage) || [];
    for (const hook of hooks) {
      try {
        await hook(ctx);
      } catch (error) {
        console.error(`Hook error at stage ${stage}:`, error);
      }
    }
  }
}

/**
 * OmniAgentV2 工廠
 */
export function createOmniAgent(config?: Partial<AgentConfig>): OmniAgentV2 {
  return new OmniAgentV2(config);
}
