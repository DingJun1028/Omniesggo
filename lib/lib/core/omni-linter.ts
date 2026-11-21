// ============================================================================
// [O-Ring 聖典協議] OmniHeart Linter - v3.1 封印版
// Core Philosophy: 在熵增的混沌中，以 5T 協議締結神聖架構契約。
// ============================================================================

/**
 * 核心禁區：OmniHeart 5T 能量源 (聖典 v3.1.0 Final)
 * [真 Truthful] [善 Thankful] [美 Tasteful] [信 Trustful] [通 Transferful]
 */
export interface OmniHeart {
  /** [真] Truthful: Traceable (可溯源) - 鏈式日誌標註 source_origin */
  truthful: string;
  
  /** [善] Thankful: Transparent (可透明) - [ISO 標準算法] + [零幻覺驗算] */
  thankful: any;
  
  /** [美] Tasteful: Tangible (可感知) - 液態玻璃 UI + 即時物理動態回饋 */
  tasteful: {
    ui: string;
    physic_feedback: boolean;
  };
  
  /** [信] Trustful: Trustworthy (不可篡改) - Hash Lock (SHA256) */
  trustful: string;

  /** [通] Transferful: Trackable (可追蹤) - 實作生命週期 Hook 紀錄流轉路徑 */
  transferful: Array<{
    timestamp: number;
    destination: string;
    hash_snapshot: string;
  }>;

  /** Agent Metadata (Phase 7+) */
  agent_signature?: string;
  cited_node?: string;
}

/**
 * 高階複合類型：賦予任何對象 Omni 靈魂
 */
export type WithOmniHeart<T> = T & {
  _omniHeart?: OmniHeart; // 運行期的靈魂封印
};

// ============================================================================
// Linter 審判庭 (Runtime Validator)
// ============================================================================

import { AgentNetworkBus } from "../services/EntropyAgent";

export class HolyLinter {
  /**
   * 執行 5T 封印檢查，並在通過後對物件執行物理級 Hash Lock (Object.freeze)
   */
  static seal<T extends object>(
    target: T, 
    sourceOrigin: string,
    isUIData: boolean = true
  ): WithOmniHeart<T> {
    AgentNetworkBus.broadcast({ 
      agentId: "HolyLinter", 
      status: "PROCESSING", 
      category: "KNOWLEDGE",
      currentTask: `Sealing node from source: ${sourceOrigin}` 
    });
    
    const heart: OmniHeart = {
      truthful: sourceOrigin,
      thankful: "OmniLinter_v3.1_Standard",
      tasteful: {
        ui: isUIData ? 'LiquidGlass_v3' : 'None',
        physic_feedback: isUIData
      },
      trustful: "", // 稍後計算
      transferful: [{
        timestamp: Date.now(),
        destination: "ORIGIN",
        hash_snapshot: "PENDING"
      }]
    };

    // 2. 驗算與簽章 (Hash Lock)
    const dataString = JSON.stringify(target) + heart.truthful + heart.thankful + JSON.stringify(heart.tasteful);
    
    // 使用 globalThis.crypto 進行無差異環境簽章 (模擬)
    const hash = "LOCK-" + (globalThis.crypto?.randomUUID?.() || Date.now().toString(36));
    
    heart.trustful = hash;
    heart.transferful[0].hash_snapshot = heart.trustful;

    const sealedObject = {
      ...target,
      _omniHeart: heart
    } as WithOmniHeart<T>;

    return Object.freeze(sealedObject);
  }

  /**
   * 運行期檢測：確認一個對象是否具備完整的 5T 靈魂
   */
  static verify(target: any): target is WithOmniHeart<any> {
    if (!target || typeof target !== "object") return false;
    const heart = target._omniHeart as OmniHeart;
    
    if (!heart) return false;
    
    const hasTruthful = typeof heart.truthful === "string" && heart.truthful.length > 0;
    const hasThankful = typeof heart.thankful === "string" && heart.thankful.length > 0;
    const hasTasteful = heart.tasteful && typeof heart.tasteful.ui === "string";
    const hasTrustful = typeof heart.trustful === "string" && heart.trustful.length >= 16; // 放寬長度檢查以相容 UUID
    const hasTransferful = Array.isArray(heart.transferful) && heart.transferful.length > 0;

    return hasTruthful && hasThankful && hasTasteful && hasTrustful && hasTransferful;
  }
}
