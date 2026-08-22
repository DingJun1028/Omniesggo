 
// OA: 智慧代理核心抽象 (OmniAgent Core)
// 定義 OA 在系統層面的最小行為介面與相關型別。

/**
 * 基礎核心型別 – 所有可追溯資料的共同屬性。
 */
export interface IComponentCore {
  /** 萬能永憶主體唯一識別碼（UUID v4） */
  readonly uuid: string;
  /** 語義化版本控制 (e.g., "2.1.0") */
  readonly version: string;
  /** 刻印時間戳 (Unix Epoch, ms) */
  readonly timestamp: number;
  /** 證據佐證庫 (用於零幻覺驗算，如 ISO‑14064‑1) */
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
  };
  /** 防篡改雜湊值（SHA‑256、Keccak‑256 …） */
  readonly hash: string;
  /** （可選）雜湊 Salt，用於提升撞庫抗性 */
  readonly salt?: string;
  /** （可選）數位簽章（digital signature） */
  readonly signature?: string;
}

/** 生命週期階段枚舉（全局共用） */
export type LifecycleStage =
  | "EMERGED"
  | "ROUTING"
  | "MUTATED"
  | "VERIFIED"
  | "REPLAYED"
  | "FROZEN";

/** 任務規格 */
export interface ITaskSpec extends IComponentCore {
  /** 任務名稱（唯一） */
  readonly name: string;
  /** 任務參數 */
  readonly params: Record<string, unknown>;
  /** MECE 標籤，用於 OAB 匹配 */
  readonly meceTag: string;
}

/** 任務結果 */
export interface ITaskResult extends IComponentCore {
  /** 對應的任務 UUID（ITaskSpec.uuid） */
  readonly taskId: string;
  /** 執行狀態 */
  readonly status: "success" | "failed" | "cancelled";
  /** 任務輸出 */
  readonly output: unknown;
  /** 性能指標（如耗時） */
  readonly metrics?: Record<string, number>;
}

/** 歷史快照，用於 getRecentFlow */
export interface IFlowSnapshot extends IComponentCore {
  /** 當前所屬的生命週期階段 */
  readonly stage: LifecycleStage;
  /** 該階段發生的時間戳 */
  readonly timestamp: number;
  /** 執行節點（如 "OA", "worker-01"） */
  readonly node: string;
  /** 可選說明文字 */
  readonly note?: string;
}

/** OA（OmniAgent）核心抽象介面 */

export interface IOmniAgent {
  /**
   * 接收全域戒嚴指令，供 OAG 或其他模組呼叫以觸發全局防護。
   * @param reason 戒嚴原因說明
   */
  onMartialLaw(reason: string): void;

  /**
   * 監聽指定 Bus 主題的背壓（事件累積量），在超過閾值時觸發警告或自動增殖。
   * @param topic 需要監控的 Bus 主題
   * @param threshold 事件數量閾值
   */
  monitorBackpressure(topic: string, threshold: number): void;

  /** 代理目前所在的生命週期階段 */
  readonly state: LifecycleStage;

  /** 代理的靜態設定（只讀） */
  readonly config: Readonly<{
    /** 代理唯一識別碼 */
    readonly uuid: string;
    /** 版本號 */
    readonly version: string;
    /** 預設執行環境標籤（如 "worker-01"） */
    readonly environmentTag?: string;
    /** 最大併發任務數 */
    readonly maxConcurrency: number;
    /** 任務超時（毫秒） */
    readonly taskTimeout: number;
    /** 其他自訂設定 */
    readonly extra?: Record<string, unknown>;
  }>;

  /** 基本執行統計（只讀） */
  readonly metrics: Readonly<{
    /** 已接收的任務總數 */
    readonly received: number;
    /** 成功完成的任務數 */
    readonly succeeded: number;
    /** 失敗的任務數 */
    readonly failed: number;
    /** 目前正在執行的任務數 */
    readonly inProgress: number;
    /** 最近一次任務完成的時間戳（若無則為 undefined） */
    readonly lastCompletedAt?: number;
  }>;

  /** 簽章 – 代表 OA 自身的不可變核心資訊 */
  readonly signature: IComponentCore;

  /**
   * 執行一筆任務規格。
   * @param spec 任務規格 (ITaskSpec)
   * @returns 任務執行結果 (ITaskResult)
   */
  execute(spec: ITaskSpec): Promise<ITaskResult>;

  /**
   * 在指定的生命週期階段註冊 Hook。
   * @param stage 目標階段
   * @param hook   Hook 函式，會收到當前任務規格、結果或錯誤
   */
  registerHook(
    stage: LifecycleStage,
    hook: (args: {
      spec?: ITaskSpec;
      result?: ITaskResult;
      error?: Error;
    }) => Promise<void> | void
  ): void;

  /**
   * 取得最近一次執行的完整任務快照（含生命週期路徑）。
   * @returns 按時間順序（舊 → 新）的快照陣列
   */
  getRecentFlow(): Promise<IFlowSnapshot[]>;

  /**
   * 動態調整代理可變配置（不允許變更 uuid、version）。
   * @param partialConfig 部分配置項目
   */
  updateConfig(
    partialConfig: Partial<Omit<IOmniAgent["config"], "uuid" | "version">>
  ): void;
}
