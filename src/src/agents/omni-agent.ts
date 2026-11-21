// 基礎執行 – OmniAgent 核心實作
// ------------------------------------------------------------
// 這個檔案提供一個最小可運作的 OmniAgent 實作，遵循前面定義的 IOmniAgent 介面。
// 主要功能包括：
//   • 任務排程與執行（簡易的模擬工作）
//   • 生命週期 Hook 註冊與觸發
//   • 內部狀態與統計資訊
//   • 最近任務快照 (IFlowSnapshot) 查詢
// ------------------------------------------------------------

import { v4 as uuidv4 } from "uuid";
import {
  IOmniAgent,
  IComponentCore,
  ITaskSpec,
  ITaskResult,
  IFlowSnapshot,
  LifecycleStage,
} from "../types/omni-agent";

/**
 * 簡易的任務執行器 – 以 setTimeout 模擬非同步工作。
 * 在實務上可被替換為真正的業務邏輯或外部服務呼叫。
 */
function simulateWork(params: Record<string, unknown>): Promise<unknown> {
  const duration = (params?.duration as number) ?? 100; // 預設 100ms
  return new Promise((resolve) => setTimeout(() => resolve({ done: true, params }), duration));
}

export class OmniAgent implements IOmniAgent {
  // ---------- 只讀屬性 ----------
  public readonly config: Readonly<{
    uuid: string;
    version: string;
    environmentTag?: string;
    maxConcurrency: number;
    taskTimeout: number;
    extra?: Record<string, unknown>;
  }>;

  public readonly metrics: Readonly<{
    received: number;
    succeeded: number;
    failed: number;
    inProgress: number;
    lastCompletedAt?: number;
  }>;

  public readonly signature: IComponentCore;

  // ---------- 可變內部狀態 ----------
  private _state: LifecycleStage = "EMERGED";
  private _hooks: Map<LifecycleStage, Array<(args: { spec?: ITaskSpec; result?: ITaskResult; error?: Error }) => Promise<void> | void>> = new Map();
  private _recentFlow: IFlowSnapshot[] = [];

  // 用於統計與併發控制的內部計數器
  private _metricsMutable = {
    received: 0,
    succeeded: 0,
    failed: 0,
    inProgress: 0,
    lastCompletedAt: undefined as number | undefined,
  };

  // 任務佇列（簡易）
  private _queue: ITaskSpec[] = [];

  constructor(config?: Partial<Omit<IOmniAgent["config"], "uuid" | "version">>) {
    const uuid = uuidv4();
    const version = "1.0.0";
    this.config = Object.freeze({
      uuid,
      version,
      environmentTag: config?.environmentTag ?? "worker-01",
      maxConcurrency: config?.maxConcurrency ?? 4,
      taskTimeout: config?.taskTimeout ?? 30_000,
      extra: config?.extra ?? {},
    });

    // 初始化 metrics 為可變物件，外部以 readonly 代理
    this.metrics = new Proxy(this._metricsMutable, {
      get: (target, prop) => (prop in target ? (target as Record<string, unknown>)[prop as string] : undefined),
    }) as unknown as Readonly<typeof this._metricsMutable>;

    // 預設 signature 為空的 IComponentCore（可在外部覆寫）
    this.signature = {
      uuid,
      version,
      timestamp: Date.now(),
      evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
      hash: "",
    } as IComponentCore;

    // 初始化所有階段的 hook 容器
    ("EMERGED,ROUTING,MUTATED,VERIFIED,REPLAYED,FROZEN" as const)
      .split(",")
      .forEach((stage) => this._hooks.set(stage as LifecycleStage, []));
  }

  // ---------- 公開屬性 ----------
  public get state(): LifecycleStage {
    return this._state;
  }

  // ---------- Hook 相關 ----------
  public registerHook(
    stage: LifecycleStage,
    hook: (args: { spec?: ITaskSpec; result?: ITaskResult; error?: Error }) => Promise<void> | void
  ): void {
    const bucket = this._hooks.get(stage);
    if (bucket) bucket.push(hook);
  }

  private async _runHooks(stage: LifecycleStage, args: { spec?: ITaskSpec; result?: ITaskResult; error?: Error }): Promise<void> {
    const bucket = this._hooks.get(stage) ?? [];
    for (const h of bucket) {
      try {
        await h(args);
      } catch (e) {
        console.warn(`[OmniAgent] Hook error at stage ${stage}:`, e);
      }
    }
  }

  // ---------- 任務快照 ----------
  public async getRecentFlow(): Promise<IFlowSnapshot[]> {
    // 回傳副本，保持不可變
    return [...this._recentFlow];
  }

  // ---------- 設定更新 ----------
  public updateConfig(
    partialConfig: Partial<Omit<IOmniAgent["config"], "uuid" | "version">>
  ): void {
    // 注意：此實作僅在記憶體層面更新，沒有持久化。
    const mutable = this.config as unknown as Record<string, unknown>;
    if (partialConfig.environmentTag !== undefined) mutable.environmentTag = partialConfig.environmentTag;
    if (partialConfig.maxConcurrency !== undefined) mutable.maxConcurrency = partialConfig.maxConcurrency;
    if (partialConfig.taskTimeout !== undefined) mutable.taskTimeout = partialConfig.taskTimeout;
    if (partialConfig.extra !== undefined) mutable.extra = partialConfig.extra;
  }

  // ---------- 任務執行 ----------
  public async execute(spec: ITaskSpec): Promise<ITaskResult> {
    // 1️⃣ 接收任務 → EMERGED 階段
    this._metricsMutable.received++;
    this._state = "EMERGED";
    await this._runHooks("EMERGED", { spec });

    // 2️⃣ 排程階段 → ROUTING
    this._state = "ROUTING";
    this._metricsMutable.inProgress++;
    await this._runHooks("ROUTING", { spec });

    // 3️⃣ (可選) 突變階段 – 這裡簡化為直接跳過
    // this._state = "MUTATED";
    // await this._runHooks("MUTATED", { spec });

    // 4️⃣ 驗證階段 – 目前直接通過
    this._state = "VERIFIED";
    await this._runHooks("VERIFIED", { spec });

    // 5️⃣ 真正執行工作
    let result: ITaskResult;
    try {
      const workPromise = simulateWork(spec.params);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Task timeout")), this.config.taskTimeout)
      );
      const output = await Promise.race([workPromise, timeoutPromise]);
      result = {
        uuid: uuidv4(),
        version: "1.0.0",
        timestamp: Date.now(),
        evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
        hash: "",
        taskId: spec.uuid,
        status: "success",
        output,
        metrics: { durationMs: Date.now() - spec.timestamp },
      } as ITaskResult;
      this._metricsMutable.succeeded++;
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      result = {
        uuid: uuidv4(),
        version: "1.0.0",
        timestamp: Date.now(),
        evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
        hash: "",
        taskId: spec.uuid,
        status: "failed",
        output: undefined,
        metrics: { durationMs: Date.now() - spec.timestamp },
      } as ITaskResult;
      this._metricsMutable.failed++;
      // 失敗 Hook
      await this._runHooks("FROZEN", { spec, error });
      // 紀錄快照後拋出錯誤讓呼叫端感知
      this._recordSnapshot(spec, "FROZEN", error?.message ?? "error");
      throw error;
    } finally {
      this._metricsMutable.inProgress--;
      this._metricsMutable.lastCompletedAt = Date.now();
    }

    // 6️⃣ 完成階段 → REPLAYED（此階段可視為「結果回顧」）
    this._state = "REPLAYED";
    await this._runHooks("REPLAYED", { spec, result });

    // 7️⃣ 凍結階段 – 任務生命週期結束
    this._state = "FROZEN";
    await this._runHooks("FROZEN", { spec, result });

    // 產生快照（供 later getRecentFlow）
    this._recordSnapshot(spec, "FROZEN", undefined, result);

    return result;
  }

  // ---------- 快照記錄 ----------
  private _recordSnapshot(
    spec: ITaskSpec,
    stage: LifecycleStage,
    errorMessage?: string,
    result?: ITaskResult
  ) {
    const snapshot: IFlowSnapshot = {
      uuid: uuidv4(),
      version: "1.0.0",
      timestamp: Date.now(),
      evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
      hash: "",
      stage,
      // 與 IComponentCore 兼容的最小欄位
      // 這裡把 taskId、status 等放入 evidence 供外部檢索
      // 若有 result，則把 output 也放入 evidence
      //（實務上可自行設計結構）
      // @ts-expect-error – 允許多餘欄位以符合 IComponentCore
      ...{ errorMessage, result },
      node: this.config.environmentTag ?? "unknown",
      note: errorMessage ? `Error: ${errorMessage}` : undefined,
    } as IFlowSnapshot;
    this._recentFlow.push(snapshot);
    // 保持最近 100 筆，過長則截斷
    if (this._recentFlow.length > 100) this._recentFlow.shift();
  }
}
