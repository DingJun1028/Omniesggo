/**
 * ==========================================
 * 🛡️ VPS Agent — 量子糾纏子代理
 * ==========================================
 * 
 * 萬能元件心核 (IComponentCore) 的量子糾纏實現
 * 
 * 量子糾纏原理：
 * - VPS Agent 與 OmniAgent 共享量子態 (quantumState)
 * - 遠端 VPS 服務的狀態變化即時反映到本地
 * - 任何測量（健康檢查）都會導致波函數坍縮到確定態
 * - 當 VPS Agent 被創建時，它與遠端服務建立量子糾纏
 */

import { v4 as uuidv4 } from "uuid";
import {
  IComponentCore,
  LifecycleStage,
} from "../../types/omni-agent";
import { IBusEvent } from "../../types/bus-event";
import { IOmniAgentBus } from "../../types/omni-agent-bus";
import { QuantumStateSynchronizer } from "./quantum-sync";
import { executeTask, TaskType, TaskResultBase } from "./handlers";

// ==========================================
// 量子態類型定義
// ==========================================

/** 量子測量結果 */
export type QuantumMeasurement = 
  | "superposition"   // 疊加態：服務狀態未知
  | "entangled"       // 糾纏態：與遠端服務同步
  | "collapsed"       // 坍縮態：已確定服務狀態
  | "decohered";      // 退相干：連接斷開

/** 量子態向量 */
export interface QuantumState {
  /** 測量狀態 */
  measurement: QuantumMeasurement;
  /** 糾纏對象（遠端服務 ID） */
  entangledWith?: string;
  /** 最後同步時間 */
  lastSyncAt?: number;
  /** 量子相位（用於檢測狀態變化） */
  phase: number;
  /** 保真度（0-1，越高越同步） */
  fidelity: number;
}

/** VPS 服務狀態（量子測量後的坍縮結果） */
export interface VPSServiceState {
  /** 服務名稱 */
  name: string;
  /** 運行狀態 */
  status: "running" | "stopped" | "error" | "unknown";
  /** 端口 */
  port: number;
  /** PID */
  pid?: number;
  /** 內存使用 (MB) */
  memoryMb?: number;
  /** CPU 使用率 */
  cpuPercent?: number;
  /** 運行時間 (秒) */
  uptimeSeconds?: number;
  /** 最後健康檢查時間 */
  lastHealthCheck?: number;
  /** 健康狀態 */
  health: "healthy" | "unhealthy" | "degraded";
}

/** VPS 整體狀態 */
export interface VPSGlobalState {
  /** VPS 標識 */
  vpsId: string;
  /** IP 地址 */
  host: string;
  /** 系統資源 */
  system: {
    cpuPercent: number;
    memoryPercent: number;
    diskPercent: number;
    loadAverage: number[];
  };
  /** 服務狀態映射 */
  services: Map<string, VPSServiceState>;
  /** 量子態 */
  quantum: QuantumState;
  /** 最後更新時間 */
  updatedAt: number;
}

// ==========================================
// VPS Agent 主類
// ==========================================

/**
 * VPS Agent — 萬能元件心核的量子糾纏子代理
 * 
 * 與 OmniAgent 建立量子糾纏：
 * - 當 VPS 狀態變化時，OmniAgent 立即感知
 * - 當 OmniAgent 發出指令時，VPS Agent 立即執行
 * - 兩者的 signature 共享相同的量子相位
 */
export class VPSAgent {
  /** 萬能元件心核簽章 */
  public readonly signature: IComponentCore;
  
  /** 量子態 */
  private _quantumState: QuantumState;
  
  /** VPS 全局狀態 */
  private _globalState: VPSGlobalState;
  
  /** 與 OmniAgent 的量子糾纏連接 */
  private _entangledBus?: IOmniAgentBus;
  
  /** 量子態同步器 */
  private _quantumSync: QuantumStateSynchronizer;
  
  /** 狀態監聽器 */
  private _stateListeners: Map<string, (state: VPSGlobalState) => void> = new Map();
  
  /** 量子糾纏 ID（用於識別這對糾纏粒子） */
  private readonly _entanglementId: string;

  constructor(config: {
    host: string;
    vpsId?: string;
    bus?: IOmniAgentBus;
  }) {
    // 1. 創建萬能元件心核簽章
    const uuid = uuidv4();
    this.signature = Object.freeze({
      uuid,
      version: "1.0.0",
      timestamp: Date.now(),
      evidence: {
        originCause: 'unknown',
        processTrace: [],
        finalEffect: 'unknown',
        type: "vps-agent",
        host: config.host,
        quantum: true, // 標記為量子糾纏代理
       },
    });

    // 2. 初始化量子態（初始為疊加態）
    this._quantumState = {
      measurement: "superposition",
      phase: Math.random() * Math.PI * 2, // 隨機初始相位
      fidelity: 0,
    };

    // 3. 創建量子糾纏 ID
    this._entanglementId = `entangle_${uuid}_${config.vpsId ?? config.host}`;

    // 4. 初始化 VPS 全局狀態
    this._globalState = {
      vpsId: config.vpsId ?? `vps-${config.host.replace(/\./g, '-')}`,
      host: config.host,
      system: {
        cpuPercent: 0,
        memoryPercent: 0,
        diskPercent: 0,
        loadAverage: [0, 0, 0],
      },
      services: new Map(),
      quantum: this._quantumState,
      updatedAt: Date.now(),
    };

    // 5. 創建量子態同步器
    this._quantumSync = new QuantumStateSynchronizer({
      syncInterval: 5000,
      targetFidelity: 0.95,
    });

    // 監聽同步器事件
    this._quantumSync.on("state_changed", (event) => {
      console.log(`[VPSAgent] 🔮 量子態同步: ${event.type}`);
      this._quantumState = event.data.newState;
      this._globalState.quantum = this._quantumState;
      this._notifyListeners();
    });

    // 6. 建立與 OmniAgent 的量子糾纏
    if (config.bus) {
      this._establishEntanglement(config.bus);
    }

    console.log(
      `[VPSAgent] 🛡️ 量子糾纏已建立 → ${config.host} (相位: ${this._quantumState.phase.toFixed(4)})`
    );
  }

  // ==========================================
  // 量子糾纏操作
  // ==========================================

  /**
   * 建立與 OmniAgent 的量子糾纏
   * 
   * 量子糾纏意味著：
   * - 兩個粒子（VPS Agent 和 OmniAgent）共享同一量子態
   * - 對其中一個的測量會立即影響另一個
   * - 這種影響不受距離限制（即時同步）
   */
  private _establishEntanglement(bus: IOmniAgentBus): void {
    this._entangledBus = bus;

    // 訂閱 OmniAgent 的指令事件
    bus.subscribe("vps.command", async (event: IBusEvent) => {
      console.log(`[VPSAgent] 🔮 收到量子糾纏指令: ${(event.payload as Record<string, unknown>)?.action}`);
      await this._handleEntangledCommand(event);
    });

    // 訂閱狀態查詢事件
    bus.subscribe("vps.query", async (event: IBusEvent) => {
      await this._respondToQuery(event);
    });

    // 更新量子態
    this._quantumState.measurement = "entangled";
    this._quantumState.lastSyncAt = Date.now();
    this._quantumState.fidelity = 1;

    // 啟動量子態同步
    this._quantumSync.start();

    console.log(`[VPSAgent] ✨ 量子糾纏已激活 → 糾纏 ID: ${this._entanglementId}`);
  }

  /**
   * 處理量子糾纏指令
   * 
   * 當 OmniAgent 發送指令時，VPS Agent 立即執行
   * 這體現了量子糾纏的「即時性」
   */
  private async _handleEntangledCommand(event: IBusEvent): Promise<void> {
    const { action, params } = (event.payload as Record<string, unknown>) ?? {};
    
    try {
      // 波函數坍縮：從疊加態到確定態
      this._quantumState.measurement = "collapsed";
      
      // 執行對應操作
      const result = await executeTask(action as TaskType, params as Record<string, unknown>);

      // 發送結果回 OmniAgent（通過量子糾纏通道）
      if (this._entangledBus) {
        const resultEvent: IBusEvent = {
          uuid: uuidv4(),
          version: "1.0.0",
          timestamp: Date.now(),
          evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
          eventName: "vps.result",
          source_origin: `vps-agent:${this._globalState.vpsId}`,
          topic: "vps.result",
          stage: "FROZEN" as LifecycleStage,
          lifecycle_path: "EMERGED > FROZEN",
          payload: {
            taskId: event.uuid,
            action,
            result,
            status: result.status,
          },
        };
        await this._entangledBus.publish(resultEvent);
      }

      // 恢復到糾纏態
      this._quantumState.measurement = "entangled";
      this._quantumState.lastSyncAt = Date.now();
      
    } catch (error) {
      // 退相干：發生錯誤
      this._quantumState.measurement = "decohered";
      this._quantumState.fidelity = Math.max(0, this._quantumState.fidelity - 0.1);
      
      console.error(`[VPSAgent] ❌ 量子糾纏指令失敗:`, error);
    }
  }

  /**
   * 回應狀態查詢
   */
  private async _respondToQuery(_event: IBusEvent): Promise<void> {
    if (this._entangledBus) {
      const stateEvent: IBusEvent = {
        uuid: uuidv4(),
        version: "1.0.0",
        timestamp: Date.now(),
        evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
        eventName: "vps.state",
        source_origin: `vps-agent:${this._globalState.vpsId}`,
        topic: "vps.state",
        stage: "FROZEN" as LifecycleStage,
        lifecycle_path: "EMERGED > FROZEN",
        payload: this._globalState,
      };
      await this._entangledBus.publish(stateEvent);
    }
  }

  // ==========================================
  // 公開 API：VPS 操作
  // ==========================================

  /**
   * 執行 VPS 任務
   * 
   * 量子糾纏效果：
   * - 任務開始時，OmniAgent 立即感知
   * - 任務完成後，兩端狀態同步
   */
  public async execute(type: TaskType, params?: Record<string, unknown>): Promise<TaskResultBase> {
    console.log(`[VPSAgent] ⚡ 執行任務: ${type}`);
    
    // 波函數坍縮
    this._quantumState.measurement = "collapsed";
    
    const result = await executeTask(type, params);
    
    // 恢復到糾纏態
    this._quantumState.measurement = "entangled";
    this._quantumState.lastSyncAt = Date.now();
    
    this._notifyListeners();
    
    return result;
  }

  /**
   * 執行健康檢查
   * 
   * 量子測量效果：
   * - 檢查會導致波函數坍縮
   * - 結果會同步到所有糾纏的 OmniAgent
   */
  public async healthCheck(): Promise<VPSGlobalState> {
    console.log(`[VPSAgent] 🔍 執行量子測量（健康檢查）`);

    const result = await executeTask("health_check");
    
    if (result.status === "success" && result.evidence) {
      const { system, services } = result.evidence as Record<string, unknown>;
      
      this._globalState.system = system as VPSGlobalState['system'];
      
      // 更新服務狀態
      for (const [name, svc] of Object.entries(services ?? {})) {
        this._globalState.services.set(name, svc as VPSServiceState);
      }
    }

    // 更新量子態
    this._quantumState.measurement = "collapsed";
    this._quantumState.lastSyncAt = Date.now();
    this._quantumState.phase = (this._quantumState.phase + 0.1) % (Math.PI * 2);
    this._globalState.quantum = this._quantumState;
    this._globalState.updatedAt = Date.now();

    // 恢復到糾纏態
    setTimeout(() => {
      this._quantumState.measurement = "entangled";
    }, 100);

    this._notifyListeners();

    return this._globalState;
  }

  /**
   * 執行備份
   */
  public async backup(params?: Record<string, unknown>): Promise<TaskResultBase> {
    return this.execute("backup", params);
  }

  /**
   * 重啟服務
   */
  public async restartService(serviceName?: string): Promise<TaskResultBase> {
    return this.execute("deploy", { 
      target: serviceName, 
      restart: true, 
      build: false 
    });
  }

  // ==========================================
  // 狀態同步與監聽
  // ==========================================

  /**
   * 註冊狀態監聽器
   * 
   * 當 VPS 狀態變化時，監聽器會收到通知
   * 這實現了量子糾纏的「即時性」
   */
  public onStateChange(listenerId: string, callback: (state: VPSGlobalState) => void): void {
    this._stateListeners.set(listenerId, callback);
    console.log(`[VPSAgent] 👁️ 狀態監聽器已註冊: ${listenerId}`);
  }

  /**
   * 移除狀態監聽器
   */
  public removeStateChange(listenerId: string): void {
    this._stateListeners.delete(listenerId);
  }

  /**
   * 通知所有監聽器
   */
  private _notifyListeners(): void {
    const state = {
      ...this._globalState,
      services: new Map(this._globalState.services),
    };
    for (const [id, callback] of Array.from(this._stateListeners.entries())) {
      try {
        callback(state);
      } catch (error) {
        console.warn(`[VPSAgent] 監聽器 ${id} 報錯:`, error);
      }
    }
  }

  // ==========================================
  // 獲取器
  // ==========================================

  /** 獲取量子態 */
  public get quantumState(): Readonly<QuantumState> {
    return { ...this._quantumState };
  }

  /** 獲取 VPS 全局狀態 */
  public get globalState(): Readonly<VPSGlobalState> {
    return {
      ...this._globalState,
      services: new Map(this._globalState.services),
    };
  }

  /** 獲取量子糾纏 ID */
  public get entanglementId(): string {
    return this._entanglementId;
  }

  /** 檢查是否與 OmniAgent 糾纏 */
  public get isEntangled(): boolean {
    return this._quantumState.measurement === "entangled" && 
           this._quantumState.fidelity > 0.5;
  }

  /** 獲取量子態同步器 */
  public get quantumSync(): QuantumStateSynchronizer {
    return this._quantumSync;
  }

  // ==========================================
  // 清理
  // ==========================================

  /**
   * 銷毀量子糾纏
   * 
   * 當 VPS Agent 被銷毀時，量子糾纏斷開
   * OmniAgent 會感知到退相干事件
   */
  public async destroy(): Promise<void> {
    console.log(`[VPSAgent] 🔒 銷毀量子糾纏 → ${this._entanglementId}`);

    // 停止量子態同步
    this._quantumSync.stop();

    // 退相干
    this._quantumState.measurement = "decohered";
    this._quantumState.fidelity = 0;

    // 清理監聽器
    this._stateListeners.clear();

    // 通知 OmniAgent（如果仍然連接）
    if (this._entangledBus) {
      const decohereEvent: IBusEvent = {
        uuid: uuidv4(),
        version: "1.0.0",
        timestamp: Date.now(),
        evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
        eventName: "vps.decohere",
        source_origin: `vps-agent:${this._globalState.vpsId}`,
        topic: "vps.decohere",
        stage: "FROZEN" as LifecycleStage,
        lifecycle_path: "FROZEN",
        payload: {
          entanglementId: this._entanglementId,
          reason: "agent_destroyed",
        },
      };
      await this._entangledBus.publish(decohereEvent);
    }

    console.log(`[VPSAgent] ❌ 量子糾纏已斷開`);
  }
}

// ==========================================
// 單例導出
// ==========================================

/** 創建 VPS Agent 單例（延遲初始化） */
let _instance: VPSAgent | null = null;

export function createVPSAgent(config: { host: string; vpsId?: string; bus?: IOmniAgentBus }): VPSAgent {
  if (_instance) {
    console.warn("[VPSAgent] 單例已存在，先銷毀舊實例");
    _instance.destroy();
  }
  _instance = new VPSAgent(config);
  return _instance;
}

export function getVPSAgent(): VPSAgent | null {
  return _instance;
}

// 導出子模組
export { QuantumStateSynchronizer } from "./quantum-sync";
export { executeTask, taskHandlers } from "./handlers";
export type { TaskType, TaskResultBase } from "./handlers";
export {
  VPSAgentAdapter,
  VPSAgentFactory,
  registerVPSAgentToEcosystem,
  quickCreateVPSAgent,
} from "./registry";

export default VPSAgent;
