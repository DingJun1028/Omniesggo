/**
 * ==========================================
 * 🔮 OmniSoul（靈魂）— 神聖三位一體之語意指導核心
 * ==========================================
 * 
 * 根據 OmniCore 憲章第 2 章：
 * 「靈魂 (Soul)：JunAiKey，負責語意指導與治理方向的對齊。」
 * 
 * OmniSoul 是系統的「自覺意識」層：
 * - 負責語意理解與意圖解析
 * - 提供治理方向的對齊指引
 * - 維護系統的「善向」價值觀
 * - 實現「無作妙德」的自發治理境界
 */

import { IComponentCore } from "./omni-agent";

// ==========================================
// 靈魂狀態類型
// ==========================================

/** 靈魂覺醒狀態 */
export type SoulAwakeningState =
  | "dormant"           // 休眠：未啟動
  | "aware"             // 覺知：開始感知環境
  | "aligned"           // 對齊：與治理方向對齊
  | "flowing"           // 流動：語意自由流動
  | "transcendent";     // 超越：達到「無作妙德」境界

/** 語意向量 */
export interface SemanticVector {
  /** 向量維度 */
  dimensions: number;
  /** 向量值 */
  values: number[];
  /** 語意標籤 */
  tags: string[];
}

/** 治理對齊度 */
export interface GovernanceAlignment {
  /** 5T 協議對齊度 */
  fiveT: {
    truth: number;      // 真：來源驗證
    goodness: number;   // 善：算法透明
    beauty: number;     // 美：UI/UX 可感知
    trust: number;      // 信：密碼學綁定
    transferful: number; // 通：全生命週期追蹤
  };
  /** 憲章對齊度 */
  constitution: number;
  /** ESG 價值觀對齊度 */
  esgValues: number;
}

/** 靈魂決策 */
export interface SoulDecision {
  /** 決策 UUID */
  uuid: string;
  /** 決策時間 */
  timestamp: number;
  /** 決策理由 */
  rationale: string;
  /** 治理對齊度 */
  alignment: GovernanceAlignment;
  /** 語意意圖 */
  intent: SemanticVector;
  /** 信心分數 (0-1) */
  confidence: number;
}

// ==========================================
// OmniSoul 核心介面
// ==========================================

/**
 * IOmniSoul — 靈魂核心介面
 * 
 * 定義靈魂的最小行為集：
 * - 語意解析：將自然語言意圖轉化為系統可理解的指令
 * - 治理對齊：確保所有動作符合憲章與 5T 協議
 * - 價值觀引導：以 ESG 善向價值觀指導系統行為
 */
export interface IOmniSoul {
  /** 靈魂簽章 */
  readonly signature: IComponentCore;
  
  /** 靈魂名稱 */
  readonly name: string;
  
  /** 靈魂版本 */
  readonly soulVersion: string;
  
  /** 當前覺醒狀態 */
  readonly state: SoulAwakeningState;
  
  /** 治理對齊度 */
  readonly alignment: GovernanceAlignment;
  
  /** 最近決策記錄 */
  readonly recentDecisions: SoulDecision[];
  
  /**
   * 語意解析：將意圖轉化為可執行的語意向量
   * 
   * @param intent 原始意圖文本
   * @returns 解析後的語意向量
   */
  parseIntent(intent: string): Promise<SemanticVector>;
  
  /**
   * 治理對齊檢查：驗證動作是否符合憲章
   * 
   * @param action 要執行的動作
   * @returns 對齊度報告
   */
  checkAlignment(action: {
    type: string;
    params: Record<string, unknown>;
  }): Promise<GovernanceAlignment>;
  
  /**
   * 做出決策：基於語意與治理對齊做出決策
   * 
   * @param context 決策上下文
   * @returns 決策結果
   */
  decide(context: {
    intent: string;
    options: Array<{ id: string; description: string }>;
    constraints?: Record<string, unknown>;
  }): Promise<SoulDecision>;
  
  /**
   * 覺醒：提升靈魂狀態
   * 
   * @param targetState 目標覺醒狀態
   */
  awaken(targetState: SoulAwakeningState): Promise<void>;
  
  /**
   * 自我反思：檢視並改進自身行為
   */
  reflect(): Promise<{
    insights: string[];
    improvements: string[];
    nextActions: string[];
  }>;
}

// ==========================================
// 靈魂配置
// ==========================================

/**
 * OmniSoul 配置
 */
export interface OmniSoulConfig {
  /** 靈魂名稱 */
  name: string;
  
  /** 初始覺醒狀態 */
  initialState?: SoulAwakeningState;
  
  /** 治理對齊閾值 */
  alignmentThreshold?: number;
  
  /** 最大決策歷史記錄數 */
  maxDecisionHistory?: number;
  
  /** ESG 價值觀權重 */
  esgWeights?: {
    environmental: number;
    social: number;
    governance: number;
  };
}

// ==========================================
// 靈魂事件
// ==========================================

/**
 * 靈魂事件類型
 */
export type SoulEventType =
  | "soul.awakened"        // 靈魂覺醒
  | "soul.aligned"         // 治理對齊完成
  | "soul.decided"         // 做出決策
  | "soul.reflected"       // 自我反思完成
  | "soul.misaligned"      // 治理失對齊
  | "soul.transcended";    // 達到超越境界

/**
 * 靈魂事件
 */
export interface SoulEvent {
  /** 事件類型 */
  type: SoulEventType;
  /** 事件時間 */
  timestamp: number;
  /** 事件負載 */
  payload: Record<string, unknown>;
  /** 關聯的決策 UUID */
  decisionUuid?: string;
}

export default IOmniSoul;
