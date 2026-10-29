import type { IComponentCore } from '../../../src/types/core-contract';
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

/**
 * 萬能元件心核 - 觀因循果修復版
 * 確保數據從因到果的完整性與不可篡改性
 */
// ts-matrix: 收斂至規範型別 (canonical: src/types/core-contract)
export type { IComponentCore };

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

export type BusHandlerFn<T = unknown> = (msg: BusMessage<T>) => void | Promise<void>;
// ts-matrix: 對外相容別名 (API 不變)
export type { BusHandlerFn as BusHandler };
