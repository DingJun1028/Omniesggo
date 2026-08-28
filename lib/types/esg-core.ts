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
 * 【信 Trustful】萬能核心介面 (The Core Component Interface)
 */
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
