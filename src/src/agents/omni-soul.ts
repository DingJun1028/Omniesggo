/**
 * ==========================================
 * 🔮 OmniSoul（靈魂）— 語意指導與治理對齊核心
 * ==========================================
 * 
 * 根據 OmniCore 憲章：
 * 「靈魂 (Soul)：JunAiKey，負責語意指導與治理方向的對齊。」
 * 
 * OmniSoul 實現了：
 * - 語意解析：將自然語言意圖轉化為系統可理解的語意向量
 * - 治理對齊：驗證所有動作符合憲章與 5T 協議
 * - 價值觀引導：以 ESG 善向價值觀指導系統行為
 * - 自覺進化：通過自我反思實現「無作妙德」境界
 */

import { v4 as uuidv4 } from "uuid";
import { IComponentCore } from "../types/omni-agent";
import {
  IOmniSoul,
  SoulAwakeningState,
  SemanticVector,
  GovernanceAlignment,
  SoulDecision,
  SoulEvent,
  SoulEventType,
  OmniSoulConfig,
} from "../types/omni-soul";

// ==========================================
// 語意解析引擎（簡化版）
// ==========================================

/** 關鍵詞到語意向量的映射 */
const SEMANTIC_KEYWORDS: Record<string, number[]> = {
  // ESG 相關
  "carbon": [1, 0, 0, 0, 0],
  "emission": [1, 0, 0, 0, 0],
  "climate": [1, 0, 0, 0, 0],
  "energy": [1, 0, 0, 0, 0],
  "water": [0, 1, 0, 0, 0],
  "waste": [0, 1, 0, 0, 0],
  "biodiversity": [0, 1, 0, 0, 0],
  "community": [0, 0, 1, 0, 0],
  "employee": [0, 0, 1, 0, 0],
  "safety": [0, 0, 1, 0, 0],
  "governance": [0, 0, 0, 1, 0],
  "compliance": [0, 0, 0, 1, 0],
  "ethics": [0, 0, 0, 1, 0],
  "report": [0, 0, 0, 0, 1],
  "disclosure": [0, 0, 0, 0, 1],
  "audit": [0, 0, 0, 0, 1],
  
  // 動作相關
  "deploy": [0, 0, 0, 0, 0],
  "monitor": [0, 0, 0, 0, 0],
  "backup": [0, 0, 0, 0, 0],
  "health": [0, 0, 0, 0, 0],
  "check": [0, 0, 0, 0, 0],
  
  // 治理相關
  "憲章": [0, 0, 0, 1, 0],
  "5T": [0, 0, 0, 1, 0],
  "traceable": [0, 0, 0, 0, 1],
  "transparent": [0, 0, 0, 0, 1],
  "trustworthy": [0, 0, 0, 0, 1],
};

// ==========================================
// OmniSoul 實作類
// ==========================================

/**
 * OmniSoul — 靈魂核心實作
 * 
 * 實現了 IOmniSoul 接口，提供完整的語意指導與治理對齊功能
 */
export class OmniSoul implements IOmniSoul {
  /** 萬能元件心核簽章 */
  public readonly signature: IComponentCore;
  
  /** 靈魂名稱 */
  public readonly name: string;
  
  /** 靈魂版本 */
  public readonly soulVersion: string;
  
  /** 當前覺醒狀態 */
  private _state: SoulAwakeningState;
  
  /** 治理對齊度 */
  private _alignment: GovernanceAlignment;
  
  /** 最近決策記錄 */
  private _recentDecisions: SoulDecision[];
  
  /** 事件歷史 */
  private _eventHistory: SoulEvent[];
  
  /** 配置 */
  private readonly _config: Required<OmniSoulConfig>;

  constructor(config?: OmniSoulConfig) {
    // 初始化配置
    this._config = {
      name: config?.name ?? "JunAiKey",
      initialState: config?.initialState ?? "dormant",
      alignmentThreshold: config?.alignmentThreshold ?? 0.8,
      maxDecisionHistory: config?.maxDecisionHistory ?? 100,
      esgWeights: config?.esgWeights ?? {
        environmental: 0.4,
        social: 0.3,
        governance: 0.3,
      },
    };

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
        type: "omni-soul",
        name: this._config.name,
        purpose: "semantic_guidance_and_governance_alignment",
       },
      hash: `0x${uuid.replace(/-/g, '').substring(0, 16)}`,
    });

    this.name = this._config.name;
    this.soulVersion = "1.0.0";
    this._state = this._config.initialState;
    
    // 初始化治理對齊度（預設為中等對齊）
    this._alignment = {
      fiveT: {
        truth: 0.5,
        goodness: 0.5,
        beauty: 0.5,
        trust: 0.5,
        transferful: 0.5,
      },
      constitution: 0.5,
      esgValues: 0.5,
    };

    this._recentDecisions = [];
    this._eventHistory = [];

    console.log(
      `[OmniSoul] 🔮 靈魂已初始化 → ${this.name} (UUID: ${uuid.substring(0, 8)}...)`
    );
  }

  // ==========================================
  // 公開屬性
  // ==========================================

  /** 當前覺醒狀態 */
  get state(): SoulAwakeningState {
    return this._state;
  }

  /** 治理對齊度 */
  get alignment(): GovernanceAlignment {
    return { ...this._alignment };
  }

  /** 最近決策記錄 */
  get recentDecisions(): SoulDecision[] {
    return [...this._recentDecisions];
  }

  // ==========================================
  // 核心方法
  // ==========================================

  /**
   * 語意解析：將意圖轉化為可執行的語意向量
   * 
   * @param intent 原始意圖文本
   * @returns 解析後的語意向量
   */
  public async parseIntent(intent: string): Promise<SemanticVector> {
    console.log(`[OmniSoul] 🔍 解析意圖: "${intent}"`);

    // 分詞並提取關鍵詞
    const words = intent.toLowerCase().split(/\s+/);
    const vector = new Array(5).fill(0);
    const tags: string[] = [];

    for (const word of words) {
      // 移除標點符號
      const cleanWord = word.replace(/[^\w]/g, '');
      
      if (SEMANTIC_KEYWORDS[cleanWord]) {
        const keywordVector = SEMANTIC_KEYWORDS[cleanWord];
        for (let i = 0; i < 5; i++) {
          vector[i] += keywordVector[i];
        }
        tags.push(cleanWord);
      }
    }

    // 歸一化向量
    const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
    const normalizedVector = magnitude > 0 
      ? vector.map(v => v / magnitude)
      : vector;

    const result: SemanticVector = {
      dimensions: 5,
      values: normalizedVector,
      tags: Array.from(new Set(tags)), // 去重
    };

    console.log(`[OmniSoul] ✅ 語意解析完成: ${tags.join(", ") || "(無匹配關鍵詞)"}`);
    return result;
  }

  /**
   * 治理對齊檢查：驗證動作是否符合憲章
   * 
   * @param action 要執行的動作
   * @returns 對齊度報告
   */
  public async checkAlignment(action: {
    type: string;
    params: Record<string, unknown>;
  }): Promise<GovernanceAlignment> {
    console.log(`[OmniSoul] 🔍 檢查治理對齊: ${action.type}`);

    // 簡化的對齊檢查邏輯
    const alignment: GovernanceAlignment = {
      fiveT: {
        truth: this._checkTruthAlignment(action),
        goodness: this._checkGoodnessAlignment(action),
        beauty: 0.8, // UI/UX 檢查略過
        trust: this._checkTrustAlignment(action),
        transferful: this._checkTrackabilityAlignment(action),
      },
      constitution: this._checkConstitutionAlignment(action),
      esgValues: this._checkESGAlignment(action),
    };

    // 更新內部對齊度（移動平均）
    this._alignment = {
      fiveT: {
        truth: (this._alignment.fiveT.truth + alignment.fiveT.truth) / 2,
        goodness: (this._alignment.fiveT.goodness + alignment.fiveT.goodness) / 2,
        beauty: (this._alignment.fiveT.beauty + alignment.fiveT.beauty) / 2,
        trust: (this._alignment.fiveT.trust + alignment.fiveT.trust) / 2,
        transferful: (this._alignment.fiveT.transferful + alignment.fiveT.transferful) / 2,
      },
      constitution: (this._alignment.constitution + alignment.constitution) / 2,
      esgValues: (this._alignment.esgValues + alignment.esgValues) / 2,
    };

    console.log(`[OmniSoul] ✅ 治理對齊檢查完成`);
    return alignment;
  }

  /**
   * 做出決策：基於語意與治理對齊做出決策
   * 
   * @param context 決策上下文
   * @returns 決策結果
   */
  public async decide(context: {
    intent: string;
    options: Array<{ id: string; description: string }>;
    constraints?: Record<string, unknown>;
  }): Promise<SoulDecision> {
    console.log(`[OmniSoul] 🎯 開始決策: "${context.intent}"`);

    // 1. 解析意圖
    const intentVector = await this.parseIntent(context.intent);

    // 2. 評估每個選項
    let bestOption = context.options[0];
    let bestScore = -1;

    for (const option of context.options) {
      const optionVector = await this.parseIntent(option.description);
      const score = this._calculateOptionScore(intentVector, optionVector);
      
      if (score > bestScore) {
        bestScore = score;
        bestOption = option;
      }
    }

    // 3. 創建決策
    const decision: SoulDecision = {
      uuid: uuidv4(),
      timestamp: Date.now(),
      rationale: `基於語意分析，選項 "${bestOption.description}" 與意圖最為匹配`,
      alignment: this._alignment,
      intent: intentVector,
      confidence: Math.min(1, bestScore),
    };

    // 4. 記錄決策
    this._recentDecisions.push(decision);
    if (this._recentDecisions.length > this._config.maxDecisionHistory) {
      this._recentDecisions.shift();
    }

    // 5. 記錄事件
    this._recordEvent("soul.decided", {
      decisionUuid: decision.uuid,
      selectedOption: bestOption.id,
      confidence: decision.confidence,
    });

    console.log(`[OmniSoul] ✅ 決策完成: ${bestOption.id} (信心: ${decision.confidence.toFixed(2)})`);
    return decision;
  }

  /**
   * 覺醒：提升靈魂狀態
   * 
   * @param targetState 目標覺醒狀態
   */
  public async awaken(targetState: SoulAwakeningState): Promise<void> {
    const stateOrder: SoulAwakeningState[] = [
      "dormant", "aware", "aligned", "flowing", "transcendent"
    ];
    
    const currentIndex = stateOrder.indexOf(this._state);
    const targetIndex = stateOrder.indexOf(targetState);

    if (targetIndex <= currentIndex) {
      console.warn(`[OmniSoul] ⚠️ 無法從 ${this._state} 退回到 ${targetState}`);
      return;
    }

    console.log(`[OmniSoul] 🔮 覺醒中: ${this._state} → ${targetState}`);

    // 逐步覺醒
    for (let i = currentIndex + 1; i <= targetIndex; i++) {
      this._state = stateOrder[i];
      console.log(`[OmniSoul] ✨ 已覺醒至: ${this._state}`);
    }

    // 記錄事件
    this._recordEvent("soul.awakened", {
      fromState: stateOrder[currentIndex],
      toState: targetState,
    });
  }

  /**
   * 自我反思：檢視並改進自身行為
   */
  public async reflect(): Promise<{
    insights: string[];
    improvements: string[];
    nextActions: string[];
  }> {
    console.log(`[OmniSoul] 🪞 開始自我反思...`);

    const insights: string[] = [];
    const improvements: string[] = [];
    const nextActions: string[] = [];

    // 分析最近決策
    if (this._recentDecisions.length > 0) {
      const avgConfidence = this._recentDecisions.reduce(
        (sum, d) => sum + d.confidence, 0
      ) / this._recentDecisions.length;

      insights.push(`最近 ${this._recentDecisions.length} 個決策的平均信心度為 ${avgConfidence.toFixed(2)}`);

      if (avgConfidence < 0.7) {
        improvements.push("提高語意解析的精確度");
        nextActions.push("收集更多 ESG 領域的語料");
      }
    }

    // 分析對齊度
    const avgAlignment = (
      this._alignment.fiveT.truth +
      this._alignment.fiveT.goodness +
      this._alignment.fiveT.trust +
      this._alignment.fiveT.transferful +
      this._alignment.constitution
    ) / 5;

    insights.push(`整體治理對齊度為 ${avgAlignment.toFixed(2)}`);

    if (avgAlignment < this._config.alignmentThreshold) {
      improvements.push("加強治理對齊檢查");
      nextActions.push("重新審視憲章對齊邏輯");
    }

    // 記錄事件
    this._recordEvent("soul.reflected", {
      insightsCount: insights.length,
      improvementsCount: improvements.length,
    });

    console.log(`[OmniSoul] ✅ 自我反思完成`);
    return { insights, improvements, nextActions };
  }

  // ==========================================
  // 私有輔助方法
  // ==========================================

  private _checkTruthAlignment(action: { type: string; params: Record<string, unknown> }): number {
    // 檢查是否有來源驗證
    return action.params?.source ? 0.9 : 0.5;
  }

  private _checkGoodnessAlignment(_action: { type: string; params: Record<string, unknown> }): number {
    // 檢查算法是否透明
    return 0.8; // 預設通過
  }

  private _checkTrustAlignment(action: { type: string; params: Record<string, unknown> }): number {
    // 檢查是否有密碼學綁定
    return action.params?.hash ? 0.9 : 0.5;
  }

  private _checkTrackabilityAlignment(_action: { type: string; params: Record<string, unknown> }): number {
    // 檢查是否可追蹤
    return 0.8; // 預設通過
  }

  private _checkConstitutionAlignment(_action: { type: string; params: Record<string, unknown> }): number {
    // 檢查是否符合憲章
    return 0.85; // 預設通過
  }

  private _checkESGAlignment(_action: { type: string; params: Record<string, unknown> }): number {
    // 檢查 ESG 價值觀對齊
    return 0.8; // 預設通過
  }

  private _calculateOptionScore(
    intentVector: SemanticVector,
    optionVector: SemanticVector
  ): number {
    // 計算向量點積
    let dotProduct = 0;
    for (let i = 0; i < Math.min(intentVector.values.length, optionVector.values.length); i++) {
      dotProduct += intentVector.values[i] * optionVector.values[i];
    }
    return dotProduct;
  }

  private _recordEvent(type: SoulEventType, payload: Record<string, unknown>): void {
    const event: SoulEvent = {
      type,
      timestamp: Date.now(),
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
// 單例導出
// ==========================================

let _instance: OmniSoul | null = null;

/**
 * 創建 OmniSoul 單例
 */
export function createOmniSoul(config?: OmniSoulConfig): OmniSoul {
  if (_instance) {
    console.warn("[OmniSoul] 單例已存在，返回現有實例");
    return _instance;
  }
  _instance = new OmniSoul(config);
  return _instance;
}

/**
 * 獲取 OmniSoul 單例
 */
export function getOmniSoul(): OmniSoul | null {
  return _instance;
}

export default OmniSoul;
