 
// Core TypeScript API Contract for OmniAgent ecosystem (OA, OAB, OAG)

/**
 * 基礎元件介面 – 所有核心物件皆繼承此介面
 */
export interface IComponentCore {
  /** 唯一識別碼 */
  readonly uuid: string;
  /** 語義化版本號 */
  readonly version: string;
  /** 時間戳（毫秒） */
  readonly timestamp: number;
  /** 證據庫，存放驗算、簽章等額外資訊 */
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
  };
}

/** 系統生命週期階段 */
export type LifecycleStage =
  | "EMERGED"
  | "ROUTING"
  | "VERIFIED"
  | "FROZEN"
  | "COMPLETED";

/**
 * 事件模型 – OAB 內部傳遞的最小單位
 */
export interface IBusEvent<T = unknown> extends IComponentCore {
  /** 事件名稱（例：user.signup） */
  readonly eventName: string;
  /** 每筆資料的原始起點 */
  readonly source_origin: string;
  /** 事件主題通道 */
  readonly topic: string;
  /** 生命週期階段 */
  readonly stage: LifecycleStage;
  /** 生命週期路徑追蹤 (stage, timestamp, node) */
  readonly lifecycle_path: Array<{
    stage: LifecycleStage;
    timestamp: number;
    node: string;
  }>;
  /** 業務負載 */
  readonly payload: T;
  /** 可選的 Hash Lock，用於驗算與防篡改 */
  readonly hashLock?: string;
}

/** 任務規範 – OA 執行的最小工作單位 */
export interface ITaskSpec {
  name: string;
  uuid: string;
  version: string;
  payload?: unknown;
}

/** 任務結果 */
export interface ITaskResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

/**
 * OA – OmniAgent 主體
 */
export interface IOmniAgent extends IComponentCore {
  /** 執行事件 */
  execute(event: IBusEvent): Promise<void>;

  /** 註冊生命週期 Hook */
  registerHook(
    stage: LifecycleStage,
    hook: (ctx: { event?: IBusEvent }) => Promise<void>
  ): void;

  /** 系統進入全域戒嚴時的回呼 */
   onMartialLaw(reason: string): void;

  /** 代理克隆（細胞分裂） – 由 OAB Factory 呼叫 */
  clone(newUuid: string): IOmniAgent;

  /**
   * 簽名資訊 – 與 IComponentCore 保持一致的不可變屬性，用於完整核心描述。
   */
  readonly signature: IComponentCore;
}

/**
 * OAB – OmniAgentBus
 */
// OAB: 代理數據總線契約 (整合細胞分裂與時空裂縫)
export interface IOmniAgentBus {
  /** 基礎事件發佈與訂閱 */
  publish(event: IBusEvent): Promise<void>;
  subscribe(topic: string, handler: (event: IBusEvent) => Promise<void>): void;
  /** 奇效四：時空裂縫 - 歷史事件重放 */
  replayEvents(startTime: number, endTime: number, topic?: string): Promise<void>;
  /** 影子測試入口 – 自動加 version:"shadow-test" 並入列 */
  shadowTestIngress(event: IBusEvent): Promise<void>;
  /** 奇效七：細胞分裂 - 監聽負載背壓與動態增殖 */
  monitorBackpressure(topic: string, threshold: number): Promise<void>;

  /** 若背壓持續過高，動態克隆 Agent */
  cloneAgentIfNeeded(topic: string, threshold: number): Promise<void>;
}

/**
 * OAG – OmniAgentGateway
 */
export interface IOmniAgentGateway extends IComponentCore {
  /** 入口驗證 – 簽章/ evidence 檢查，失敗則 broadcast martial_law */
  ingress(event: IBusEvent): Promise<IBusEvent>;

  /** 安全轉發 – Hash Lock、Object.freeze 後對外發送 */
  secureForward(event: IBusEvent): Promise<IBusEvent>;

  /** 全域戒嚴控制 */
  onMartialLaw(reason: string): void;
  liftMartialLaw(): void;
  isUnderMartialLaw(): boolean;
}

/**
 * 時空裂縫 Registry – 負責事件持久化與重放、影子測試
 */
export interface ITimeTravelRegistry {
  /** 記錄事件（由 OAB publish 後呼叫） */
  record(event: IBusEvent): Promise<void>;

  /** 重放事件 – 與 IOmniAgentBus.replayEvents 參數保持一致 */
  replay(
    startTime: number,
    endTime?: number,
    topic?: string
  ): Promise<IBusEvent[]>;

  /** 影子測試入口（同 OAB.shadowTestIngress） */
  shadow(event: IBusEvent): Promise<void>;
}

/** 全域戒嚴事件（系統廣播） */
export interface IMartialLawEvent extends IComponentCore {
  readonly reason: string;
  readonly source: string; // 發起者（如 OAG）
  readonly relatedEvent: IBusEvent; // 觸發戒嚴的原始事件
}
