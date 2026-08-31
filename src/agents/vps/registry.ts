/**
 * ==========================================
 * 🛡️ VPS Agent 生態系統註冊
 * ==========================================
 * 
 * 將 VPS Agent 註冊到 OmniAgent 生態系統
 * 使其可被發現、使用和管理
 */

import { IOmniAgent, IComponentCore, ITaskSpec, ITaskResult, IFlowSnapshot, LifecycleStage } from "../../types/omni-agent";
import { IOmniAgentBus } from "../../types/omni-agent-bus";
import { VPSAgent, createVPSAgent, TaskType } from "./index";

/**
 * 最小生態系統介面（供 registerVPSAgentToEcosystem 使用）
 */
interface IEcosystem {
  getBus(): IOmniAgentBus;
  registerAgent(id: string, agent: IOmniAgent): void;
}

// ==========================================
// VPS Agent 生態系統適配器
// ==========================================

/**
 * VPS Agent 生態系統適配器
 * 
 * 將 VPS Agent 包裝為 IOmniAgent 接口
 * 使其可以註冊到 OmniCoreEcosystem
 */
export class VPSAgentAdapter implements IOmniAgent {
  /** 內部 VPS Agent 實例 */
  private _vpsAgent: VPSAgent;
  
  /** 當前生命週期階段 */
  private _state: LifecycleStage = "EMERGED";
  
  /** 配置 */
  public readonly config: IOmniAgent["config"];
  
  /** 指標 */
  public readonly metrics: IOmniAgent["metrics"];

  constructor(vpsAgent: VPSAgent) {
    this._vpsAgent = vpsAgent;
    
    this.config = {
      uuid: vpsAgent.signature.uuid,
      version: vpsAgent.signature.version,
      environmentTag: `vps-${vpsAgent.globalState.host}`,
      maxConcurrency: 4,
      taskTimeout: 30000,
    };
    
    this.metrics = {
      received: 0,
      succeeded: 0,
      failed: 0,
      inProgress: 0,
    };
  }

  /** 獲取簽章 */
  get signature(): IComponentCore {
    return this._vpsAgent.signature;
  }

  /** 獲取當前狀態 */
  get state(): LifecycleStage {
    return this._state;
  }

  /**
   * 執行任務（實現 IOmniAgent 接口）
   * 
   * 當 OmniAgent 通過生態系統發送任務時
   * VPS Agent 會接收並處理
   */
  async execute(spec: ITaskSpec): Promise<ITaskResult> {
    this._state = "ROUTING";
    
    const { action, params } = spec.params ?? {};
    
    this._state = "VERIFIED";
    
    try {
      const result = await this._vpsAgent.execute(
        action as TaskType,
        params as Record<string, unknown>
      );
      
      this._state = "FROZEN";
      
      return {
        uuid: this._vpsAgent.signature.uuid,
        version: this._vpsAgent.signature.version,
        timestamp: Date.now(),
        evidence: result.evidence ?? {},
        taskId: spec.uuid,
        status: result.status === "success" ? "success" : "failed",
        output: result,
      };
    } catch (error) {
      this._state = "FROZEN";
      
      return {
        uuid: this._vpsAgent.signature.uuid,
        version: this._vpsAgent.signature.version,
        timestamp: Date.now(),
        evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
        taskId: spec.uuid,
        status: "failed",
        output: { error: String(error) },
      };
    }
  }

  /**
   * 註冊生命週期 Hook
   */
  registerHook(
    stage: LifecycleStage,
    _hook: (args: { spec?: ITaskSpec; result?: ITaskResult; error?: Error }) => Promise<void> | void
  ): void {
    // VPS Agent 使用自己的監聽器系統
    console.log(`[VPSAgentAdapter] Hook 註冊: ${stage}`);
  }

  /**
   * 系統進入全域戒嚴時的回呼
   */
  onMartialLaw(reason: string): void {
    console.log(`[VPSAgentAdapter] ⚠️ 全域戒嚴: ${reason}`);
    // 在戒嚴期間，VPS Agent 暫停所有操作
  }

  /**
   * 代理克隆（細胞分裂）
   */
  clone(newUuid: string): IOmniAgent {
    console.log(`[VPSAgentAdapter] 🧬 克隆代理: ${newUuid}`);
    // 返回新的適配器實例
    return new VPSAgentAdapter(this._vpsAgent);
  }

  /**
   * 監聽背壓
   */
  monitorBackpressure(topic: string, threshold: number): void {
    console.log(`[VPSAgentAdapter] 📊 監聽背壓: ${topic} (閾值: ${threshold})`);
  }

  /**
   * 獲取最近執行流
   */
  async getRecentFlow(): Promise<IFlowSnapshot[]> {
    return [];
  }

  /**
   * 更新配置
   */
  updateConfig(_partialConfig: Partial<Omit<IOmniAgent["config"], "uuid" | "version">>): void {
    console.log(`[VPSAgentAdapter] ⚙️ 配置已更新`);
  }

  /**
   * 獲取內部 VPS Agent
   */
  get vpsAgent(): VPSAgent {
    return this._vpsAgent;
  }
}

// ==========================================
// VPS Agent 生態系統工廠
// ==========================================

/**
 * VPS Agent 生態系統工廠
 * 
 * 負責創建、註冊和管理 VPS Agent
 */
export class VPSAgentFactory {
  /** 已註冊的 VPS Agent 映射 */
  private static _agents: Map<string, VPSAgentAdapter> = new Map();
  
  /** 事件總線引用 */
  private static _bus: IOmniAgentBus | null = null;

  /**
   * 初始化 VPS Agent 工廠
   * 
   * @param bus 事件總線（用於量子糾纏通信）
   */
  static initialize(bus: IOmniAgentBus): void {
    VPSAgentFactory._bus = bus;
    console.log("[VPSAgentFactory] 🔮 VPS Agent 工廠已初始化");
  }

  /**
   * 創建並註冊 VPS Agent
   * 
   * @param config VPS 配置
   * @returns VPS Agent 適配器
   */
  static createAndRegister(config: {
    host: string;
    vpsId?: string;
  }): VPSAgentAdapter {
    const vpsId = config.vpsId ?? `vps-${config.host.replace(/\./g, '-')}`;
    
    // 檢查是否已註冊
    if (VPSAgentFactory._agents.has(vpsId)) {
      console.warn(`[VPSAgentFactory] VPS Agent 已存在: ${vpsId}`);
      return VPSAgentFactory._agents.get(vpsId)!;
    }

    // 創建 VPS Agent
    const vpsAgent = createVPSAgent({
      host: config.host,
      vpsId,
      bus: VPSAgentFactory._bus ?? undefined,
    });

    // 包裝為適配器
    const adapter = new VPSAgentAdapter(vpsAgent);

    // 註冊到工廠
    VPSAgentFactory._agents.set(vpsId, adapter);

    console.log(`[VPSAgentFactory] ✅ VPS Agent 已創建並註冊: ${vpsId}`);
    console.log(`[VPSAgentFactory] 🔮 量子糾纏 ID: ${vpsAgent.entanglementId}`);

    return adapter;
  }

  /**
   * 獲取已註冊的 VPS Agent
   * 
   * @param vpsId VPS 標識
   * @returns VPS Agent 適配器（如果存在）
   */
  static getAgent(vpsId: string): VPSAgentAdapter | undefined {
    return VPSAgentFactory._agents.get(vpsId);
  }

  /**
   * 獲取所有已註冊的 VPS Agent
   * 
   * @returns VPS Agent 適配器映射
   */
  static getAllAgents(): ReadonlyMap<string, VPSAgentAdapter> {
    return VPSAgentFactory._agents;
  }

  /**
   * 移除 VPS Agent
   * 
   * @param vpsId VPS 標識
   */
  static async removeAgent(vpsId: string): Promise<boolean> {
    const agent = VPSAgentFactory._agents.get(vpsId);
    if (!agent) {
      return false;
    }

    // 銷毀量子糾纏
    await agent.vpsAgent.destroy();

    // 從映射中移除
    VPSAgentFactory._agents.delete(vpsId);

    console.log(`[VPSAgentFactory] ❌ VPS Agent 已移除: ${vpsId}`);
    return true;
  }

  /**
   * 獲取所有 VPS 的健康狀態
   * 
   * @returns 健康狀態映射
   */
  static async getAllHealthStatus(): Promise<Map<string, Record<string, unknown>>> {
    const statusMap = new Map<string, Record<string, unknown>>();

    for (const [vpsId, agent] of Array.from(VPSAgentFactory._agents.entries())) {
      try {
        const state = await agent.vpsAgent.healthCheck();
        statusMap.set(vpsId, {
          vpsId,
          host: agent.vpsAgent.globalState.host,
          quantum: agent.vpsAgent.quantumState,
          system: state.system,
          services: Object.fromEntries(Array.from(state.services.entries())),
        });
      } catch (error) {
        statusMap.set(vpsId, {
          vpsId,
          host: agent.vpsAgent.globalState.host,
          error: String(error),
        });
      }
    }

    return statusMap;
  }

  /**
   * 廣播命令到所有 VPS Agent
   * 
   * @param action 命令動作
   * @param params 命令參數
   */
  static async broadcastCommand(action: string, params?: Record<string, unknown>): Promise<void> {
    for (const [vpsId, agent] of Array.from(VPSAgentFactory._agents.entries())) {
      try {
        await agent.vpsAgent.execute(action as TaskType, params);
        console.log(`[VPSAgentFactory] ✅ 命令已執行: ${vpsId} -> ${action}`);
      } catch (error) {
        console.error(`[VPSAgentFactory] ❌ 命令執行失敗: ${vpsId} -> ${action}`, error);
      }
    }
  }
}

// ==========================================
// 生態系統集成函數
// ==========================================

/**
 * 將 VPS Agent 註冊到 OmniCoreEcosystem
 * 
 * @param ecosystem OmniCoreEcosystem 實例
 * @param config VPS 配置
 */
export function registerVPSAgentToEcosystem(
  ecosystem: IEcosystem,
  config: { host: string; vpsId?: string }
): VPSAgentAdapter {
  // 初始化工廠（如果尚未初始化）
  if (ecosystem.getBus) {
    VPSAgentFactory.initialize(ecosystem.getBus());
  }

  // 創建並註冊 VPS Agent
  const adapter = VPSAgentFactory.createAndRegister(config);

  // 註冊到生態系統
  const vpsId = config.vpsId ?? `vps-${config.host.replace(/\./g, '-')}`;
  ecosystem.registerAgent(`vps:${vpsId}`, adapter);

  console.log(`[VPSAgent] 🌐 已註冊到生態系統: vps:${vpsId}`);

  return adapter;
}

/**
 * 快速創建 VPS Agent（無需生態系統）
 * 
 * @param host VPS 主機地址
 * @returns VPS Agent 實例
 */
export function quickCreateVPSAgent(host: string): VPSAgent {
  return createVPSAgent({ host });
}

export default VPSAgentFactory;
