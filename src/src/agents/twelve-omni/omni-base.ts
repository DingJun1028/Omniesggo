 
/**
 * ==========================================
 * 🌌 OmniBase — 萬能基礎實現
 * ==========================================
 * Foundation layer providing type-safe primitives and shared utilities.
 * 
 * 同心圓設計原則 (Concentric Circle Design):
 *   以用戶需求為中心，系統滿足成果，故同心圓——看似一個，事實上是無數個。
 *   每一層都是一個完整的同心圓，同時也是下一層的「用戶」。
 *   需求 → 服務 → 成果 → 新需求（無限循環）
 *   同一個模式，無數個尺度。
 * 
 * 萬能元件 (OmniComponent):
 *   最小分子單位，可無限小亦可無限大，數量可增多或減少。
 *   因為它們都是同一個同心圓的不同尺度投影。
 */

import { createHash, randomUUID } from 'crypto';
import {
  IOmniBase,
  OmniConstants,
  OmniBaseUtils,
} from '../../types/twelve-omni';

/**
 * OmniBase 實現
 * 提供基礎常數、型別守衛和共享工具
 */
export class OmniBase implements IOmniBase {
  readonly uuid: string;
  readonly version: string = '1.0.0';
  readonly timestamp: number;
  evidence: {
    originCause: string;
    processTrace: string[];
    finalEffect: string;
  } = { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' };

  readonly constants: OmniConstants = {
    MAX_EVENT_PAYLOAD: 1024 * 1024, // 1MB
    HASH_ALGORITHM: 'sha256',
    FIVE_T_DIMENSIONS: ['traceable', 'transparent', 'tangible', 'trustworthy', 'trackable'],
    LIFECYCLE_STAGES: ['EMERGED', 'ROUTING', 'MUTATED', 'VERIFIED', 'REPLAYED', 'FROZEN'],
    ENTROPY_THRESHOLD: 0.85,
  };

  readonly utils: OmniBaseUtils = {
    generateUUID: () => randomUUID(),
    generateHash: (data: string) => createHash('sha256').update(data).digest('hex'),
    deepClone: <T>(obj: T): T => JSON.parse(JSON.stringify(obj)),
    mergeDeep: <T extends object>(target: T, source: Partial<T>): T => {
      const result = { ...target } as Record<string, unknown>;
      const src = source as Record<string, unknown>;
      for (const key of Object.keys(src)) {
        if (src[key] !== undefined) {
          result[key] = src[key];
        }
      }
      return result as T;
    },
  };

  constructor() {
    this.uuid = randomUUID();
    this.timestamp = Date.now();
  }

  /**
   * 型別守衛 — 驗證值是否符合指定的 schema
   */
  guard<T>(value: unknown, schema: string): value is T {
    if (!value || typeof value !== 'object') return false;

    switch (schema) {
      case 'IComponentCore':
        return (
          'uuid' in value &&
          'version' in value &&
          'timestamp' in value &&
          'evidence' in value
        );
      case 'IBusEvent':
        return (
          'source_origin' in value &&
          'topic' in value &&
          'lifecycle_path' in value &&
          'payload' in value
        );
      case 'IOmniAgent':
        return 'signature' in value && 'execute' in value;
      default:
        return true;
    }
  }

  /**
   * 凍結 — 時間在那一刻凍結，態昇華了時間，讓那一刻永恆不變
   */
  freeze<T extends object>(obj: T): Readonly<T> {
    return Object.freeze(obj);
  }
}

/**
 * OmniBase 單例工廠
 */
let _instance: OmniBase | null = null;

export function getOmniBase(): OmniBase {
  if (!_instance) {
    _instance = new OmniBase();
  }
  return _instance;
}
