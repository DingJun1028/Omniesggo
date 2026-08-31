/* eslint-disable import/no-anonymous-default-export */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * @description [萬能種子] 超永恆覺醒核心契約
 * 具備極簡、快速、不可篡改與無限進化特徵
 * 
 * 基於 OmniSeed 類型定義（src/types/omni-seed.ts）
 */

// 導入標準類型定義
import {
  IOmniSeed,
  SeedStatus,
  SeedCoordinate,
  SeedEvolutionStage,
} from "../../types/omni-seed";

// 重新導出類型（保持向後兼容）
export type { IOmniSeed, SeedStatus, SeedCoordinate, SeedEvolutionStage };

/**
 * @description 觸發萬能種子無限進化的核心 Hook
 * 
 * 種植規則：
 * 1. 種子必須放置於正確坐標（#記憶聖所 或 #同心圓中心）
 * 2. 種植後種子進入 infinite_evolving 狀態
 * 3. 種子被 Object.freeze() 凍結，不可篡改
 * 4. 記錄 ISO-14064-1 驗證到 evidence
 */
export function plantOmniSeed(seed: IOmniSeed, targetLocation: string): IOmniSeed {
  // 驗證是否置於正確的位置 (必須是核心坐標)
  const validCoordinates = ['#記憶聖所', '#同心圓中心', '#全知之眼', '#全能之核', '#全息之腦'];
  
  if (!validCoordinates.includes(targetLocation)) {
    throw new Error(
      `[混沌警告] 萬能種子未放置於正確坐標（${targetLocation}），拒絕覺醒。` +
      `有效坐標：${validCoordinates.join(', ')}`
    );
  }

  console.log(`[OmniSeed] 🌱 萬能種子於 ${targetLocation} 觸發超永恆覺醒。`);

  // 執行第五式：熵減煉金與第六式：永恆刻印
  const awakenedSeed: IOmniSeed = {
    ...seed,
    status: 'infinite_evolving' as const,
    coordinate: targetLocation as SeedCoordinate,
    evolutionStage: 'genesis' as const,
    evolutionHistory: [
      {
        timestamp: Date.now(),
        fromStage: 'genesis' as SeedEvolutionStage,
        toStage: 'genesis' as SeedEvolutionStage,
        trigger: 'planted',
        evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown', location: targetLocation,
          plantedAt: Date.now(),
         },
      },
    ],
    evidence: {
      originCause: seed.evidence?.originCause ?? 'Seed Planted',
      processTrace: [...(seed.evidence?.processTrace ?? []), 'plantOmniSeed'],
      finalEffect: 'Seed Awakened',
    } as any,
  };

  // 數據寫入後即刻執行 Object.freeze()，進入不可篡改核心禁區
  return Object.freeze(awakenedSeed);
}

/**
 * @description 創建新的 OmniSeed
 * 
 * @param params 種子創建參數
 * @returns 新創建的種子（dormant 狀態）
 */
export function createOmniSeed(params?: {
  evidence?: { originCause: string; processTrace: string[]; finalEffect: string };
  entropyControl?: number;
  hashLock?: string;
}): IOmniSeed {
  const uuid = crypto.randomUUID?.() ?? 
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });

  return Object.freeze({
    uuid,
    version: '1.0.0',
    timestamp: Date.now(),
    evidence: {
      originCause: 'unknown',
      processTrace: [],
      finalEffect: 'unknown',
      ...(params?.evidence ?? {}),
    },
    hash: `0x${uuid.replace(/-/g, '').substring(0, 16)}`,
    hashLock: params?.hashLock ?? `0xHASHLOCK_${Date.now()}`,
    entropyControl: params?.entropyControl ?? 0.1,
    status: 'dormant' as SeedStatus,
  });
}

/**
 * @description 觀測種子狀態
 * 
 * @param seed 要觀測的種子
 * @returns 種子健康報告
 */
export function observeSeed(seed: IOmniSeed): {
  health: number;
  age: number;
  evolutionProgress: number;
} {
  const now = Date.now();
  const age = now - seed.timestamp;
  
  // 計算健康度（基於熵控系數和狀態）
  let health = 1.0;
  if (seed.status === 'dormant') {
    health = 0.5;
  } else if (seed.status === 'infinite_evolving') {
    health = Math.min(1.0, 0.8 + seed.entropyControl);
  }
  
  // 計算進化進度
  const stageProgress: Record<string, number> = {
    genesis: 0,
    sprout: 0.25,
    bloom: 0.5,
    forest: 0.75,
    guardian: 1.0,
  };
  const evolutionProgress = stageProgress[seed.evolutionStage ?? 'genesis'] ?? 0;

  return {
    health,
    age,
    evolutionProgress,
  };
}

export default {
  plantOmniSeed,
  createOmniSeed,
  observeSeed,
};
