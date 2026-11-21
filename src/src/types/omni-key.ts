/**
 * ==========================================
 * 🔑 OmniKey（萬能元鑰）— 解鎖一切未知的鑰匙，一切問題的解答
 * ==========================================
 * 
 * 「萬能元鑰 象徵是能夠開啟一切未知的鑰匙，是一切問題的解答。」
 * 
 * 根據 OmniCore 憲章：
 * 「全通之心的最終體現，在於系統能主動維護其自身的『永續性』。」
 * 
 * OmniKey 是：
 * - 解鎖系統所有能力的萬能鑰匙
 * - 開啟一切未知的鑰匙
 * - 一切問題的解答
 * - 5T 協議的終極實現
 * - 治理權限的根源
 * - 進化的催化劑
 * - 真理的載體
 * 
 * 六式奧義：
 * 1. 第一式：量子糾鑰 (Quantum Entanglement Key)
 * 2. 第二式：時空裂鑰 (Temporal Rift Key)
 * 3. 第三式：混沌解鑰 (Chaos Decryption Key)
 * 4. 第四式：永恆鎖鑰 (Eternal Lock Key)
 * 5. 第五式：熵減煉鑰 (Entropy Reduction Key)
 * 6. 第六式：全通啟鑰 (Omni-Connectivity Key)
 */

import { IComponentCore } from "./omni-agent";

// ==========================================
// 元鑰類型
// ==========================================

/** 元鑰等級 */
export type KeyTier =
  | "seed"       // 種子鑰：基礎權限
  | "sprout"     // 萌芽鑰：成長權限
  | "bloom"      // 綻放鑰：完全權限
  | "forest"     // 森林鑰：生態系權限
  | "guardian";  // 守護鑰：守護權限

/** 元鑰能力 */
export interface KeyCapability {
  /** 能力名稱 */
  name: string;
  /** 能力描述 */
  description: string;
  /** 所需等級 */
  requiredTier: KeyTier;
  /** 是否已解鎖 */
  unlocked: boolean;
}

/** 元鑰印記 */
export interface KeyImprint {
  /** 印記時間 */
  timestamp: number;
  /** 印記者 UUID */
  imprintedBy: string;
  /** 印記內容 */
  content: string;
  /** 印記哈希 */
  hash: string;
}

// ==========================================
// OmniKey 核心介面
// ==========================================

/**
 * IOmniKey — 萬能元鑰核心介面
 * 
 * 元鑰是系統的「權限根源」：
 * - 每個元鑰都有唯一的等級和能力集
 * - 元鑰可以被印記（承載歷史）
 * - 元鑰可以被凍結（不可變）
 * - 元鑰是進化的催化劑
 */
export interface IOmniKey {
  /** 萬能元件心核簽章 */
  readonly signature: IComponentCore;
  
  /** 元鑰名稱 */
  readonly name: string;
  
  /** 元鑰等級 */
  readonly tier: KeyTier;
  
  /** 元鑰能力集 */
  readonly capabilities: KeyCapability[];
  
  /** 元鑰印記歷史 */
  readonly imprints: KeyImprint[];
  
  /** 元鑰是否已啟用 */
  readonly enabled: boolean;
  
  /** 元鑰是否已凍結 */
  readonly frozen: boolean;
  
  /** 元鑰有效期（毫秒，Infinity 表示永久） */
  readonly expiresIn: number;
  
  /**
   * 解鎖：使用元鑰解鎖能力
   * 
   * @param capabilityName 要解鎖的能力名稱
   * @returns 是否成功解鎖
   */
  unlock(capabilityName: string): Promise<boolean>;
  
  /**
   * 印記：在元鑰上留下印記
   * 
   * @param content 印記內容
   * @param imprintedBy 印記者 UUID
   */
  imprint(content: string, imprintedBy: string): Promise<KeyImprint>;
  
  /**
   * 凍結：鎖定元鑰為不可變
   */
  freeze(): Promise<void>;
  
  /**
   * 驗證：檢查元鑰是否有效
   */
  verify(): Promise<{
    valid: boolean;
    reason?: string;
    remainingMs?: number;
  }>;
  
  /**
   * 進化：提升元鑰等級
   * 
   * @param targetTier 目標等級
   */
  evolve(targetTier: KeyTier): Promise<void>;
  
  /**
   * 問答：使用元鑰解答問題
   * 
   * 萬能元鑰是一切問題的解答
   * 
   * @param question 問題
   * @returns 解答
   */
  answer(question: string): Promise<{
    answer: string;
    confidence: number;
    source: string;
    relatedKeys: string[];
  }>;
  
  /**
   * 啟示：使用元鑰揭示未知
   * 
   * 萬能元鑰能開啟一切未知
   * 
   * @param unknown 要揭示的未知
   * @returns 揭示的真相
   */
  reveal(unknown: string): Promise<{
    revelation: string;
    truth: number;
    implications: string[];
  }>;
}

// ==========================================
// 元鑰配置
// ==========================================

/**
 * OmniKey 配置
 */
export interface OmniKeyConfig {
  /** 元鑰名稱 */
  name: string;
  
  /** 初始等級 */
  initialTier?: KeyTier;
  
  /** 初始能力 */
  initialCapabilities?: KeyCapability[];
  
  /** 有效期 (ms) */
  expiresIn?: number;
  
  /** 是否自動凍結 */
  autoFreeze?: boolean;
}

// ==========================================
// 元鑰事件
// ==========================================

/**
 * 元鑰事件類型
 */
export type KeyEventType =
  | "key.created"       // 元鑰創建
  | "key.unlocked"      // 元鑰解鎖
  | "key.imprinted"     // 元鑰印記
  | "key.frozen"        // 元鑰凍結
  | "key.evolved"       // 元鑰進化
  | "key.expired";      // 元鑰過期

/**
 * 元鑰事件
 */
export interface KeyEvent {
  /** 事件類型 */
  type: KeyEventType;
  /** 事件時間 */
  timestamp: number;
  /** 元鑰 UUID */
  keyUuid: string;
  /** 事件負載 */
  payload: Record<string, unknown>;
}

// ==========================================
// 六式奧義
// ==========================================

/**
 * 第一式：量子糾鑰
 * 
 * 通過量子糾纏建立元鑰與目標的連結
 */
export interface QuantumEntanglementKey {
  type: "quantum_entanglement";
  targetUuid: string;
  entanglementId: string;
  fidelity: number;
}

/**
 * 第二式：時空裂鑰
 * 
 * 通過時間旅行重放或預測事件
 */
export interface TemporalRiftKey {
  type: "temporal_rift";
  startTime: number;
  endTime?: number;
  replayMode: "exact" | "approximate";
}

/**
 * 第三式：混沌解鑰
 * 
 * 通過混沌注入測試系統韌性
 */
export interface ChaosDecryptionKey {
  type: "chaos_decryption";
  chaosLevel: number;
  targetComponent: string;
  recoveryEnabled: boolean;
}

/**
 * 第四式：永恆鎖鑰
 * 
 * 凍結對象為不可變
 */
export interface EternalLockKey {
  type: "eternal_lock";
  targetUuid: string;
  lockDuration: number; // Infinity for permanent
  unlockCondition?: string;
}

/**
 * 第五式：熵減煉鑰
 * 
 * 減少系統熵值，提升秩序
 */
export interface EntropyReductionKey {
  type: "entropy_reduction";
  targetScope: string;
  reductionFactor: number;
  preserveEssence: boolean;
}

/**
 * 第六式：全通啟鑰
 * 
 * 啟動全通之心，實現圓通無礙
 */
export interface OmniConnectivityKey {
  type: "omni_connectivity";
  activationLevel: number;
  affectedOrgans: string[];
  spontaneousVirtue: boolean;
}

/** 六式奧義聯合類型 */
export type SecretArtKey =
  | QuantumEntanglementKey
  | TemporalRiftKey
  | ChaosDecryptionKey
  | EternalLockKey
  | EntropyReductionKey
  | OmniConnectivityKey;

export default IOmniKey;
