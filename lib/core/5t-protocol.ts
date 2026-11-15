import type { IComponentCore } from '../../src/types/core-contract';
/**
 * 萬能元件心核 - 觀因循果修復版
 * 確保數據從因到果的完整性與不可篡改性
 */
// ts-matrix: 收斂至規範型別 (canonical: src/types/core-contract)
export type { IComponentCore };

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
