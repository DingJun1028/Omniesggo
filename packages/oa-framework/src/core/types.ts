/**
 * OA Framework — 萬能分身元框架核心型別
 * 整合: ADK + Genkit + Agent0 + CrewAI + Agent Reach + DeerFlow + 騰訊 Agent 記憶
 * 對齊 soul.md IComponentCore 與 omni-agent 5T 驗證
 */

/** 子框架識別碼 */
export type SubFrameId =
  | 'adk'        // Google Agent Development Kit (TS)
  | 'genkit'     // Google Genkit (Firebase)
  | 'agent0'     // Agent Zero organic framework
  | 'crewai'     // CrewAI multi-agent
  | 'agentreach' // Agent Reach (Panniantong/agent-reach, 本地聯網能力層)
  | 'deerflow'   // DeerFlow research flow
  | 'tencent-mem' // 騰訊 Agent 記憶 (TencentDB Agent Memory)
  | 'openmontage' // OpenMontage 本地 AI 影片生產 (Ollama+FFmpeg+HyperFrames) — UNVERIFIED: repo 404
  | 'omniroute'  // OmniRoute 統一 AI 閘道 (237+ providers, localhost:20128/v1) — UNVERIFIED: repo 本輪無法核實
  | 'turbovec'  // TurboVec/PotatoRAG 本地 4-bit RAG 檢索層 (Ollama+nomic-embed-text) — UNVERIFIED: google/turbovec 回 404
  | 'oneringai'; // OneRingAI 統一多供應商 agent 庫 (@everworker/oneringai) — adapter, scaffold 待安裝啟用

/** 5T 協議狀態 (來自 soul.md) */
export type T5State = {
  traceable: boolean;   // 可溯源
  trackable: boolean;   // 可追蹤
  tangible: boolean;    // 可感知
  transparent: boolean; // 可透明
  trustworthy: boolean; // 不可篡改 (Hash Lock)
};

/** 萬能永憶主體唯一識別 (soul.md IComponentCore) */
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

/** 子框架統一適配器介面 */
export interface ISubFrameAdapter {
  readonly id: SubFrameId;
  readonly label: string;
  readonly runtime: 'ts' | 'python' | 'docker';
  /** 啟動此子框架實例 */
  bootstrap(config: OAFrameConfig): Promise<{ ok: boolean; endpoint?: string; error?: string }>;
  /** 提交一個任務給此框架 (回傳中間產出, 由 Orchestrator 經 forgeT5 鑄造 5T) */
  dispatch(task: OATask): Promise<{ output: string }>;
  /** 健康檢查 */
  health(): Promise<{ status: 'ok' | 'down'; detail?: string }>;
}

/** OA 元框架配置 */
export interface OAFrameConfig {
  /** 預設 LLM 端點 (OpenAI-compatible) */
  llmBaseUrl?: string;
  llmApiKey?: string;
  llmModel?: string;
  /** 騰訊 Agent 記憶 gateway (預設 127.0.0.1:8420) */
  memoryGateway?: string;
  /** Agent0 docker 端點 (預設 http://127.0.0.1:50001) */
  agent0Endpoint?: string;
  /** 是否啟用 5T 驗證攔截 */
  enforce5T?: boolean;
}

/** 一個 OA 任務 */
export interface OATask {
  id: string;
  prompt: string;
  /** 指定子框架 (不指定則由 Orchestrator 路由) */
  routeTo?: SubFrameId[];
  requireT5?: boolean;
  /** 深貫鏈輸入 (chain 模式下上一跳產出會注入此欄) */
  input?: string;
}

/** 任務結果 (帶 5T 狀態與 Hash Lock) */
export interface OATaskResult extends IComponentCore {
  subFrame: SubFrameId;
  output: string;
  t5: T5State;
  hashLock: string;
}
