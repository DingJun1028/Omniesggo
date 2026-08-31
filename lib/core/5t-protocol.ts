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

export interface IIntelNode5T extends IComponentCore {
  category: "S1" | "S2" | "S3" | "S4" | "S5" | "NAV" | "REPORT";
  impact_level: 1 | 2 | 3 | 4 | 5;
  protocol_5T: {
    tangible: boolean; // 🟢 可感知 (UI Rendering Ready)
    traceable: string; // 🟢 可溯源 (source_origin URL)
    trackable: string[]; // 🔵 可追蹤 (Lifecycle Hooks)
    transparent: string; // 🟠 可透明 (Formula / ISO Tag)
    trustworthy: string; // 🔴 不可篡改 (Hash Lock)
  };
  principles_5T: {
    truthful: string; // 真：可溯源追蹤的真實數據
    thankful: string; // 善：[ISO 標準算法] + [零幻覺驗算]
    tasteful: boolean; // 美：液態玻璃 UI + 即時物理回饋
    trustful: string; // 信：不可篡改的信任
    transferful: string; // 通：超越一切的無礙圓通
  };
  payload: {
    title: string;
    decision_ready_insight: string;
    target_entities: string[];
  };
}
