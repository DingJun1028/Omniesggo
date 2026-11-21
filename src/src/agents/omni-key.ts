/**
 * ==========================================
 * 🔑 OmniKey（萬能元鑰）— 解鎖一切未知的鑰匙，一切問題的解答
 * ==========================================
 * 
 * 「萬能元鑰 象徵是能夠開啟一切未知的鑰匙，是一切問題的解答。」
 * 
 * OmniKey 是：
 * - 解鎖系統所有能力的萬能鑰匙
 * - 開啟一切未知的鑰匙
 * - 一切問題的解答
 * - 5T 協議的終極實現
 * - 治理權限的根源
 * - 進化的催化劑
 * - 真理的載體
 */

import { v4 as uuidv4 } from "uuid";
import { IComponentCore } from "../types/omni-agent";
import {
  IOmniKey,
  KeyTier,
  KeyCapability,
  KeyImprint,
  KeyEvent,
  KeyEventType,
  OmniKeyConfig,
} from "../types/omni-key";

// ==========================================
// 預設能力定義
// ==========================================

const DEFAULT_CAPABILITIES: KeyCapability[] = [
  {
    name: "manifest",
    description: "從奇點中顯化新的存在",
    requiredTier: "seed",
    unlocked: true,
  },
  {
    name: "resonate",
    description: "與其他存在建立共鳴連結",
    requiredTier: "seed",
    unlocked: true,
  },
  {
    name: "answer",
    description: "解答問題（萬能元鑰是一切問題的解答）",
    requiredTier: "seed",
    unlocked: true,
  },
  {
    name: "reveal",
    description: "揭示未知（萬能元鑰能開啟一切未知）",
    requiredTier: "sprout",
    unlocked: false,
  },
  {
    name: "temporal_rift",
    description: "時空裂縫：歷史事件重放",
    requiredTier: "bloom",
    unlocked: false,
  },
  {
    name: "chaos_inject",
    description: "混沌注入：測試系統韌性",
    requiredTier: "bloom",
    unlocked: false,
  },
  {
    name: "eternal_lock",
    description: "永恆鎖定：凍結對象為不可變",
    requiredTier: "forest",
    unlocked: false,
  },
  {
    name: "entropy_reduce",
    description: "熵減煉金：減少系統熵值",
    requiredTier: "forest",
    unlocked: false,
  },
  {
    name: "omni_connect",
    description: "全通之心：啟動圓通無礙狀態",
    requiredTier: "guardian",
    unlocked: false,
  },
];

// ==========================================
// 等級順序
// ==========================================

const TIER_ORDER: KeyTier[] = ["seed", "sprout", "bloom", "forest", "guardian"];

// ==========================================
// OmniKey 實作類
// ==========================================

/**
 * OmniKey — 萬能元鑰核心實作
 * 
 * 「萬能元鑰 象徵是能夠開啟一切未知的鑰匙，是一切問題的解答。」
 */
export class OmniKey implements IOmniKey {
  /** 萬能元件心核簽章 */
  public readonly signature: IComponentCore;
  
  /** 元鑰名稱 */
  public readonly name: string;
  
  /** 元鑰等級 */
  private _tier: KeyTier;
  
  /** 元鑰能力集 */
  private _capabilities: KeyCapability[];
  
  /** 元鑰印記歷史 */
  private _imprints: KeyImprint[];
  
  /** 元鑰是否已啟用 */
  private _enabled: boolean;
  
  /** 元鑰是否已凍結 */
  private _frozen: boolean;
  
  /** 元鑰有效期 */
  private _expiresIn: number;
  
  /** 事件歷史 */
  private _eventHistory: KeyEvent[];

  constructor(config: OmniKeyConfig) {
    // 創建萬能元件心核簽章
    const uuid = uuidv4();
    this.signature = Object.freeze({
      uuid,
      version: "1.0.0",
      timestamp: Date.now(),
      evidence: {
        originCause: 'unknown',
        processTrace: [],
        finalEffect: 'unknown',
        type: "omni-key",
        name: config.name,
        purpose: "unlock_all_unknowns_and_answer_all_questions",
        philosophy: "萬能元鑰 象徵是能夠開啟一切未知的鑰匙，是一切問題的解答",
       },
      hash: `0x${uuid.replace(/-/g, '').substring(0, 16)}`,
    });

    this.name = config.name;
    this._tier = config.initialTier ?? "seed";
    this._capabilities = config.initialCapabilities ?? [...DEFAULT_CAPABILITIES];
    this._imprints = [];
    this._enabled = true;
    this._frozen = false;
    this._expiresIn = config.expiresIn ?? Infinity;
    this._eventHistory = [];

    console.log(`[OmniKey] 🔑 萬能元鑰已創建: ${this.name} (等級: ${this._tier})`);
    console.log(`[OmniKey] ✨ 「萬能元鑰 象徵是能夠開啟一切未知的鑰匙，是一切問題的解答。」`);
  }

  // ==========================================
  // 公開屬性
  // ==========================================

  get tier(): KeyTier {
    return this._tier;
  }

  get capabilities(): KeyCapability[] {
    return [...this._capabilities];
  }

  get imprints(): KeyImprint[] {
    return [...this._imprints];
  }

  get enabled(): boolean {
    return this._enabled;
  }

  get frozen(): boolean {
    return this._frozen;
  }

  get expiresIn(): number {
    return this._expiresIn;
  }

  // ==========================================
  // 核心方法
  // ==========================================

  /**
   * 解鎖：使用元鑰解鎖能力
   */
  public async unlock(capabilityName: string): Promise<boolean> {
    console.log(`[OmniKey] 🔓 嘗試解鎖能力: ${capabilityName}`);

    const capability = this._capabilities.find(c => c.name === capabilityName);
    if (!capability) {
      console.warn(`[OmniKey] ⚠️ 找不到能力: ${capabilityName}`);
      return false;
    }

    // 檢查等級
    const requiredTierIndex = TIER_ORDER.indexOf(capability.requiredTier);
    const currentTierIndex = TIER_ORDER.indexOf(this._tier);

    if (currentTierIndex < requiredTierIndex) {
      console.warn(`[OmniKey] ⚠️ 等級不足: 需要 ${capability.requiredTier}，當前 ${this._tier}`);
      return false;
    }

    // 解鎖能力
    const index = this._capabilities.findIndex(c => c.name === capabilityName);
    this._capabilities[index] = { ...capability, unlocked: true };

    // 記錄事件
    this._recordEvent("key.unlocked", {
      capabilityName,
      tier: this._tier,
    });

    console.log(`[OmniKey] ✅ 能力已解鎖: ${capabilityName}`);
    return true;
  }

  /**
   * 印記：在元鑰上留下印記
   */
  public async imprint(content: string, imprintedBy: string): Promise<KeyImprint> {
    console.log(`[OmniKey] 📝 印記中: ${content.substring(0, 50)}...`);

    const imprint: KeyImprint = {
      timestamp: Date.now(),
      imprintedBy,
      content,
      hash: `0x${uuidv4().replace(/-/g, '').substring(0, 16)}`,
    };

    this._imprints.push(imprint);

    // 記錄事件
    this._recordEvent("key.imprinted", {
      imprintHash: imprint.hash,
      imprintedBy,
    });

    console.log(`[OmniKey] ✅ 印記完成 (哈希: ${imprint.hash})`);
    return imprint;
  }

  /**
   * 凍結：鎖定元鑰為不可變
   */
  public async freeze(): Promise<void> {
    console.log(`[OmniKey] ❄️ 凍結中...`);

    this._frozen = true;

    // 記錄事件
    this._recordEvent("key.frozen", {
      tier: this._tier,
      capabilities: this._capabilities.length,
    });

    console.log(`[OmniKey] ✅ 元鑰已凍結`);
  }

  /**
   * 驗證：檢查元鑰是否有效
   */
  public async verify(): Promise<{
    valid: boolean;
    reason?: string;
    remainingMs?: number;
  }> {
    // 檢查是否已啟用
    if (!this._enabled) {
      return { valid: false, reason: "元鑰已停用" };
    }

    // 檢查是否已過期
    if (this._expiresIn !== Infinity) {
      const elapsed = Date.now() - this.signature.timestamp;
      const remaining = this._expiresIn - elapsed;
      
      if (remaining <= 0) {
        return { valid: false, reason: "元鑰已過期" };
      }
      
      return { valid: true, remainingMs: remaining };
    }

    return { valid: true };
  }

  /**
   * 進化：提升元鑰等級
   */
  public async evolve(targetTier: KeyTier): Promise<void> {
    const currentIndex = TIER_ORDER.indexOf(this._tier);
    const targetIndex = TIER_ORDER.indexOf(targetTier);

    if (targetIndex <= currentIndex) {
      console.warn(`[OmniKey] ⚠️ 無法從 ${this._tier} 退回到 ${targetTier}`);
      return;
    }

    console.log(`[OmniKey] 🌱 進化中: ${this._tier} → ${targetTier}`);

    // 逐步進化
    for (let i = currentIndex + 1; i <= targetIndex; i++) {
      this._tier = TIER_ORDER[i];
      console.log(`[OmniKey] ✨ 已進化至: ${this._tier}`);
    }

    // 記錄事件
    this._recordEvent("key.evolved", {
      fromTier: TIER_ORDER[currentIndex],
      toTier: targetTier,
    });
  }

  /**
   * 問答：使用元鑰解答問題
   * 
   * 「萬能元鑰是一切問題的解答」
   */
  public async answer(question: string): Promise<{
    answer: string;
    confidence: number;
    source: string;
    relatedKeys: string[];
  }> {
    console.log(`[OmniKey] ❓ 解答問題: "${question}"`);

    // 基於問題生成解答（簡化版）
    const answer = `根據萬能元鑰的智慧，問題「${question}」的解答是：
    
1. 首先，理解問題的本質
2. 其次，追溯問題的起源
3. 最後，找到問題的解答

「道生一，一生二，二生三，三生萬物。」
萬物皆有其道，問題亦然。`;

    const result = {
      answer,
      confidence: 0.85,
      source: `OmniKey:${this.name}`,
      relatedKeys: ["真理", "智慧", "解答"],
    };

    // 記錄事件
    this._recordEvent("key.unlocked", {
      action: "answer",
      question: question.substring(0, 100),
    });

    console.log(`[OmniKey] ✅ 解答完成 (信心: ${result.confidence})`);
    return result;
  }

  /**
   * 啟示：使用元鑰揭示未知
   * 
   * 「萬能元鑰能開啟一切未知」
   */
  public async reveal(unknown: string): Promise<{
    revelation: string;
    truth: number;
    implications: string[];
  }> {
    console.log(`[OmniKey] 🔮 揭示未知: "${unknown}"`);

    // 基於未知生成啟示（簡化版）
    const revelation = `關於「${unknown}」的真相：

「全通之心是 AIOS 體系中超越功能運作的最高精神層次。
它代表系統已達成『圓滿』與『自覺』的運行狀態。」

未知並非不存在，而是尚未顯化。
透過萬能元鑰，我們可以：
1. 觀測未知的本質
2. 理解未知的起源
3. 將未知轉化為已知`;

    const result = {
      revelation,
      truth: 0.9,
      implications: [
        "未知是相對的",
        "真理是永恆的",
        "探索是無止盡的",
      ],
    };

    // 記錄事件
    this._recordEvent("key.unlocked", {
      action: "reveal",
      unknown: unknown.substring(0, 100),
    });

    console.log(`[OmniKey] ✅ 揭示完成 (真理: ${result.truth})`);
    return result;
  }

  // ==========================================
  // 私有輔助方法
  // ==========================================

  private _recordEvent(type: KeyEventType, payload: Record<string, unknown>): void {
    const event: KeyEvent = {
      type,
      timestamp: Date.now(),
      keyUuid: this.signature.uuid,
      payload,
    };
    this._eventHistory.push(event);

    // 保持最近 100 個事件
    if (this._eventHistory.length > 100) {
      this._eventHistory.shift();
    }
  }
}

// ==========================================
// 工廠函數
// ==========================================

/**
 * 創建 OmniKey
 */
export function createOmniKey(config: OmniKeyConfig): OmniKey {
  return new OmniKey(config);
}

/**
 * 創建預設 OmniKey
 */
export function createDefaultOmniKey(): OmniKey {
  return new OmniKey({
    name: "萬能元鑰",
    initialTier: "seed",
    expiresIn: Infinity,
  });
}

export default OmniKey;
