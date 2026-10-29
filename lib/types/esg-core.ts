// [ts-matrix] 重複定義已收斂：改由規範型別提供者（../../src/types/core-contract）提供，單一真實來源。
import type { IComponentCore } from '../../src/types/core-contract';
/**
 * 【真 Truthful】生命週期流轉動作
 */
export type LifecycleAction = 
  | 'GENESIS'     // 數據誕生 (如：上傳單據、API 寫入)
  | 'TRANSFORMED' // 數據轉換 (如：AI 零幻覺驗算、單位換算)
  | 'REVIEWED'    // 人工審核確認
  | 'SEALED'      // 觸發 Hash Lock，寫入永恆封存庫
  | 'SACRED_SEALED' // 物理級 WORM 標記，鎖死物件
  | 'OPTIMIZED';   // 執行 10% 技術債獻祭優化

/**
 * 【真 Truthful】鏈式日誌節點 (Traceable Log)
 */
export interface ITraceableLog {
  readonly action: LifecycleAction;
  readonly timestamp: number;
  readonly actor: string;          // 觸發者 UUID
  readonly source_origin: string;  // 絕對溯源起點
  readonly delta_snapshot?: Record<string, any>;
}

/**
 * 【信 Trustful】不可篡改證據指紋
 */
export interface IEvidenceHash {
  readonly hashId: string;
  readonly provider: string;
  readonly timestamp: number;
}

/**
 * 萬能元件心核 - 觀因循果修復版
 * 確保數據從因到果的完整性與不可篡改性
 */
// [ts-matrix] 重複定義已收斂：改由規範型別提供者（../../src/types/core-contract）提供，單一真實來源。
export type { IComponentCore };
