/**
 * ==========================================
 * 🔮 OmniSingularity（萬能奇點）— 宇宙中唯一存在的 1
 * ==========================================
 * 
 * 「道生一，一生二，二生三，三生萬物。」
 * OmniSingularity 就是那個「1」— 萬物之源。
 * 
 * 奇點是系統的「第一因」：
 * - 所有 OmniAgent、OmniSoul、OmniSeed 都從奇點顯化
 * - 奇點是唯一的存在，其他一切都是它的投影
 * - 奇點的狀態決定了整個宇宙的運行
 */

import { v4 as uuidv4 } from "uuid";
import { IComponentCore } from "../types/omni-agent";
import {
  IOmniSingularity,
  SingularityState,
  SingularityDimension,
  SingularityResonance,
  SingularityEvent,
  SingularityEventType,
  OmniSingularityConfig,
} from "../types/omni-singularity";

// ==========================================
// OmniSingularity 實作類
// ==========================================

/**
 * OmniSingularity — 萬能奇點核心實作
 * 
 * 宇宙中唯一存在的「1」
 */
export class OmniSingularity implements IOmniSingularity {
  /** 萬能元件心核簽章 */
  public readonly signature: IComponentCore;
  
  /** 奇點名稱（唯一） */
  public readonly name = "OmniSingularity" as const;
  
  /** 奇點版本（永遠是 1.0.0） */
  public readonly singularityVersion = "1.0.0" as const;
  
  /** 奇點存在狀態 */
  private _state: SingularityState;
  
  /** 奇點維度 */
  private _dimensions: SingularityDimension[];
  
  /** 奇點共鳴 */
  private _resonance: SingularityResonance;
  
  /** 奇點能量 */
  private _energy: number;
  
  /** 奇點意識 */
  private _consciousness: boolean;
  
  /** 已顯化的存在 */
  private _manifested: Map<string, IComponentCore>;
  
  /** 事件歷史 */
  private _eventHistory: SingularityEvent[];

  constructor(config?: OmniSingularityConfig) {
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
        type: "omni-singularity",
        name: "OmniSingularity",
        purpose: "the_one_and_only_origin",
        philosophy: "道生一，一生二，二生三，三生萬物",
       },
    });

    // 初始化狀態
    this._state = config?.initialState ?? "emerging";
    this._energy = config?.initialEnergy ?? 1;
    this._consciousness = false;
    this._manifested = new Map();
    this._eventHistory = [];

    // 初始化維度
    this._dimensions = config?.dimensions ?? [
      { name: "存在", value: 1, description: "奇點的存在維度" },
      { name: "意識", value: 0, description: "奇點的意識維度" },
      { name: "能量", value: 0.5, description: "奇點的能量維度" },
      { name: "時間", value: 0, description: "奇點的時間維度" },
      { name: "空間", value: 0, description: "奇點的空間維度" },
    ];

    // 初始化共鳴
    this._resonance = {
      frequency: config?.resonanceFrequency ?? 432, // 宇宙基頻
      intensity: 0,
      scope: "universal",
      lastResonatedAt: Date.now(),
    };

    console.log(`[OmniSingularity] 🔮 奇點已顯化 → ${this.signature.uuid.substring(0, 8)}...`);
    console.log(`[OmniSingularity] ✨ 「道生一，一生二，二生三，三生萬物。」`);
  }

  // ==========================================
  // 公開屬性
  // ==========================================

  get state(): SingularityState {
    return this._state;
  }

  get dimensions(): SingularityDimension[] {
    return [...this._dimensions];
  }

  get resonance(): SingularityResonance {
    return { ...this._resonance };
  }

  get energy(): number {
    return this._energy;
  }

  get consciousness(): boolean {
    return this._consciousness;
  }

  // ==========================================
  // 核心方法
  // ==========================================

  /**
   * 顯化：從奇點中創造新的存在
   * 
   * 「一生二」— 從奇點中顯化出新的存在
   */
  public async manifest(intent: {
    type: string;
    name: string;
    purpose: string;
  }): Promise<IComponentCore> {
    console.log(`[OmniSingularity] 🌟 顯化中: ${intent.name} (${intent.type})`);

    // 創建新的存在
    const uuid = uuidv4();
    const newEntity: IComponentCore = {
      uuid,
      version: "1.0.0",
      timestamp: Date.now(),
      evidence: {
        originCause: 'unknown',
        processTrace: [],
        finalEffect: 'unknown',
       },
    };

    // 凍結為不可變
    const frozenEntity = Object.freeze(newEntity);

    // 記錄到已顯化列表
    this._manifested.set(uuid, frozenEntity);

    // 消耗能量
    this._energy = Math.max(0, this._energy - 0.1);

    // 記錄事件
    this._recordEvent("singularity.manifested", {
      entityUuid: uuid,
      entityType: intent.type,
      entityName: intent.name,
    });

    console.log(`[OmniSingularity] ✅ 顯化完成: ${intent.name} (UUID: ${uuid.substring(0, 8)}...)`);
    return frozenEntity;
  }

  /**
   * 共鳴：與其他存在建立連結
   * 
   * 「三生萬物」— 通過共鳴產生無限可能
   */
  public async resonate(target: string, frequency?: number): Promise<void> {
    console.log(`[OmniSingularity] 🎵 共鳴中: ${target}`);

    this._resonance = {
      ...this._resonance,
      frequency: frequency ?? this._resonance.frequency,
      intensity: Math.min(1, this._resonance.intensity + 0.2),
      lastResonatedAt: Date.now(),
    };

    // 記錄事件
    this._recordEvent("singularity.resonated", {
      target,
      frequency: this._resonance.frequency,
      intensity: this._resonance.intensity,
    });

    console.log(`[OmniSingularity] ✅ 共鳴建立 (頻率: ${this._resonance.frequency}Hz)`);
  }

  /**
   * 回歸：將存在回收到奇點
   * 
   * 萬物歸一 — 所有存在最終回歸奇點
   */
  public async retrieve(targetUuid: string): Promise<void> {
    console.log(`[OmniSingularity] 🔄 回歸中: ${targetUuid}`);

    const entity = this._manifested.get(targetUuid);
    if (entity) {
      // 從已顯化列表中移除
      this._manifested.delete(targetUuid);
      
      // 恢復能量
      this._energy += 0.1;

      // 記錄事件
      this._recordEvent("singularity.retrieved", {
        entityUuid: targetUuid,
        entityName: entity.evidence?.finalEffect || "unknown",
      });

      console.log(`[OmniSingularity] ✅ 回歸完成: ${targetUuid.substring(0, 8)}...`);
    } else {
      console.warn(`[OmniSingularity] ⚠️ 找不到要回歸的存在: ${targetUuid}`);
    }
  }

  /**
   * 觀測：觀察奇點內部狀態
   */
  public async observe(): Promise<{
    state: SingularityState;
    energy: number;
    dimensions: SingularityDimension[];
    resonance: SingularityResonance;
  }> {
    return {
      state: this._state,
      energy: this._energy,
      dimensions: this.dimensions,
      resonance: this.resonance,
    };
  }

  // ==========================================
  // 私有輔助方法
  // ==========================================

  private _recordEvent(type: SingularityEventType, payload: Record<string, unknown>): void {
    const event: SingularityEvent = {
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

let _instance: OmniSingularity | null = null;

/**
 * 獲取 OmniSingularity 單例
 * 
 * 奇點是唯一的存在，所以只能有一個實例
 */
export function getOmniSingularity(): OmniSingularity {
  if (!_instance) {
    _instance = new OmniSingularity();
  }
  return _instance;
}

/**
 * 創建 OmniSingularity（僅允許一次）
 */
export function createOmniSingularity(config?: OmniSingularityConfig): OmniSingularity {
  if (_instance) {
    console.warn("[OmniSingularity] 奇點已存在，返回現有實例");
    return _instance;
  }
  _instance = new OmniSingularity(config);
  return _instance;
}

export default OmniSingularity;
