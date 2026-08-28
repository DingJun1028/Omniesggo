/**
 * OA-Team 30 · §12 進階整合模式 (Advanced Integration Patterns)
 * 六件套: EventBus / ServiceOrchestrator / ETLPipeline /
 *         APIGateway / CacheManager / ErrorHandler
 * 全部對齊 §1.1 5T 協議 + §15.5 增量輸出優化。
 *
 * 本檔為共享 5T 原語 (自 src/incremental-output 提升).
 */
export type FiveT =
  | 'Traceable'
  | 'Trackable'
  | 'Tangible'
  | 'Transparent'
  | 'Trustworthy';

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

function fnv1a(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function hashLock(payload: unknown): string {
  return fnv1a(typeof payload === 'string' ? payload : JSON.stringify(payload));
}

export function freeze<T extends object>(obj: T): Readonly<T> {
  return Object.freeze(obj);
}

export function uuidV4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const OA_VERSION = '0.7.3';
