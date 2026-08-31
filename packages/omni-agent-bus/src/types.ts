/**
 * OmniAgentBus — 共用型別 (對齊 oa-framework / omni-agent, 不依賴未 build 的 workspace 包)
 * 目的: 讓 OA 萬能分身的「圓通」骨幹獨立可驗證
 */
export type SubFrameId =
  | 'adk'        // Google Agent Development Kit (TS)
  | 'genkit'     // Google Genkit (Firebase)
  | 'agent0'     // Agent Zero organic framework
  | 'crewai'     // CrewAI multi-agent
  | 'agentreach' // Agent Reach (Panniantong/agent-reach)
  | 'deerflow'   // DeerFlow research flow
  | 'tencent-mem' // Tencent Agent Memory (TencentDB Agent Memory)
  | 'openmontage' // OpenMontage local AI video production
  | 'omniroute'  // OmniRoute unified AI gateway
  | 'turbovec'  // TurboVec 4-bit RAG retrieval layer
  | 'oneringai'; // OneRingAI unified multi-vendor agent

export interface IComponentCore {
  // 萬能永憶主體唯一識別碼 (Immutable)
  readonly uuid: string;
  // 語義化版本控制
  readonly version: string;
  // 刻印時間戳 (溯源起點)
  readonly timestamp: number;
  // 證據左證庫 (儲存觀因循果的執行軌跡)
  evidence: {
    originCause: string;    // 因：原始觸發條件
    processTrace: string[]; // 循：InfoOne 流轉路徑
    finalEffect: string;    // 果：最終執行結果與狀態
  };
}

export interface OATaskResult {
  uuid: string;
  version: string;
  timestamp: number;
  subFrame: SubFrameId;
  output: string;
  t5: {
    traceable: boolean;
    trackable: boolean;
    tangible: boolean;
    transparent: boolean;
    trustworthy: boolean;
  };
  hashLock: string;
  evidence?: Record<string, unknown>;
}

export interface BusMessage<T = unknown> {
  id: string;
  topic: string;
  source: string;
  timestamp: number;
  payload: T;
  /** 5T 閘門標記: 通過為 true */
  passedGate?: boolean;
}

export type BusHandler<T = unknown> = (msg: BusMessage<T>) => void | Promise<void>;
