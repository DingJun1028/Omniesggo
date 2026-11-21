/**
 * ==========================================
 * 🌱 OmniSeed（萬能種子）— 超永恆覺醒核心契約
 * ==========================================
 * 
 * 萬能種子是系統中「不可篡改記憶」的基本單位：
 * - 每顆種子都帶有完整的 IComponentCore 簽章
 * - 種子一旦「種下」(plant)，便進入無限進化狀態
 * - 種子是 5T 協議的數據起點，也是治理追溯的終極錨點
 * 
 * 生命週期：
 * dormant（休眠）→ awakened（覺醒）→ infinite_evolving（無限進化）
 */

import { IComponentCore } from "./omni-agent";

// ==========================================
// 種子狀態類型
// ==========================================

/** 種子生命狀態 */
export type SeedStatus =
  | "dormant"              // 休眠：未啟動
  | "awakened"             // 覺醒：已啟動但未種下
  | "infinite_evolving"    // 無限進化：已種下，持續演進
  | "frozen";              // 凍結：不可變狀態

/** 種子坐標（放置位置） */
export type SeedCoordinate =
  | "#記憶聖所"            // 記憶聖所：不可變審計記錄
  | "#同心圓中心"          // 同心圓中心：系統核心
  | "#全知之眼"            // 全知之眼：感知層
  | "#全能之核"            // 全能之核：執行層
  | "#全息之腦";           // 全息之腦：進化層

/** 種子進化階段 */
export type SeedEvolutionStage =
  | "genesis"              // 起源：初始種子
  | "sprout"               // 萌芽：開始成長
  | "bloom"                // 綻放： fully active
  | "forest"               // 森林：形成生態系
  | "guardian";            // 守護：保護系統

// ==========================================
// OmniSeed 核心介面
// ==========================================

/**
 * IOmniSeed — 萬能種子核心介面
 * 
 * 種子攜帶的資訊：
 * - IComponentCore 簽章（uuid, version, timestamp, evidence, hash）
 * - 5T 狀態鎖定（hashLock）
 * - 自適應進化配置（entropyControl, status）
 * - 進化歷史（evolutionHistory）
 */
export interface IOmniSeed extends IComponentCore {
  /** 5T 狀態鎖定門檻：寫入後即刻執行的加密 Hash */
  readonly hashLock: string;
  
  /** 自適應進化配置：嚴格熵控系數 (e.g., 0.1) */
  readonly entropyControl: number;
  
  /** 種子生命狀態 */
  readonly status: SeedStatus;
  
  /** 種子坐標（放置位置） */
  coordinate?: SeedCoordinate;
  
  /** 進化階段 */
  evolutionStage?: SeedEvolutionStage;
  
  /** 進化歷史記錄 */
  evolutionHistory?: SeedEvolutionEvent[];
  
  /** 關聯的靈魂 UUID（如果已覺醒） */
  soulUuid?: string;
}

/**
 * 種子進化事件
 */
export interface SeedEvolutionEvent {
  /** 事件時間 */
  timestamp: number;
  /** 進化階段 */
  fromStage: SeedEvolutionStage;
  toStage: SeedEvolutionStage;
  /** 觸發原因 */
  trigger: string;
  /** 進化證據 */
  evidence?: Record<string, unknown>;
}

// ==========================================
// OmniSeed 操作介面
// ==========================================

/**
 * IOmniSeedController — 萬能種子控制器介面
 * 
 * 負責種子的生命週期管理：
 * - 種植（plant）：將種子放置到正確坐標
 * - 覺醒（awaken）：啟動種子的進化
 * - 觀測（observe）：監控種子狀態
 * - 凍結（freeze）：鎖定種子為不可變
 */
export interface IOmniSeedController {
  /**
   * 種植種子：將種子放置到正確坐標
   * 
   * @param seed 要種植的種子
   * @param coordinate 目標坐標
   * @returns 種植後的種子（已凍結為 infinite_evolving）
   */
  plant(seed: IOmniSeed, coordinate: SeedCoordinate): Promise<IOmniSeed>;
  
  /**
   * 覺醒種子：啟動種子的生命週期
   * 
   * @param seed 要覺醒的種子
   * @returns 覺醒後的種子
   */
  awaken(seed: IOmniSeed): Promise<IOmniSeed>;
  
  /**
   * 觀測種子：獲取種子當前狀態
   * 
   * @param seedUuid 種子 UUID
   * @returns 種子狀態
   */
  observe(seedUuid: string): Promise<{
    seed: IOmniSeed;
    health: number;
    evolutionProgress: number;
  }>;
  
  /**
   * 凍結種子：鎖定為不可變狀態
   * 
   * @param seed 要凍結的種子
   * @returns 凍結後的種子
   */
  freeze(seed: IOmniSeed): Promise<IOmniSeed>;
}

// ==========================================
// 種子配置
// ==========================================

/**
 * OmniSeed 配置
 */
export interface OmniSeedConfig {
  /** 預設熵控系數 */
  defaultEntropyControl?: number;
  
  /** 預設坐標 */
  defaultCoordinate?: SeedCoordinate;
  
  /** 是否自動進化 */
  autoEvolve?: boolean;
  
  /** 進化間隔 (ms) */
  evolutionInterval?: number;
  
  /** 最大進化歷史記錄數 */
  maxEvolutionHistory?: number;
}

// ==========================================
// 種子事件
// ==========================================

/**
 * 種子事件類型
 */
export type SeedEventType =
  | "seed.planted"          // 種子已種植
  | "seed.awakened"         // 種子已覺醒
  | "seed.evolved"          // 種子已進化
  | "seed.frozen"           // 種子已凍結
  | "seed.decohered";       // 種子退相干

/**
 * 種子事件
 */
export interface SeedEvent {
  /** 事件類型 */
  type: SeedEventType;
  /** 事件時間 */
  timestamp: number;
  /** 種子 UUID */
  seedUuid: string;
  /** 事件負載 */
  payload: Record<string, unknown>;
}

export default IOmniSeed;
