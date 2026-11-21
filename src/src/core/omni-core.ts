/**
 * ==========================================
 * 🌌 OmniCore — 萬能核心統一入口
 * ==========================================
 * 
 * 同心圓設計原則 (Concentric Circle Design):
 *   以用戶需求為中心，系統滿足成果，故同心圓——看似一個，事實上是無數個。
 *   每一層都是一個完整的同心圓，同時也是下一層的「用戶」。
 *   需求 → 服務 → 成果 → 新需求（無限循環）
 * 
 * 萬能奇點是永恆宮殿的所在——量子糾纏相遇後，便回歸故鄉。
 * 
 * 整合所有 Omni* 組件的統一入口：
 * - OmniSingularity（萬能奇點）：宇宙中唯一存在的 1，永恆宮殿座落之處
 * - OmniKey（萬能元鑰）：解鎖一切未知，解答一切問題
 * - OmniSoul（靈魂）：語意指導與治理對齊
 * - OmniSeed（萬能種子）：不可篡改記憶單位
 * - VPS Agent（量子子代理）：遠端服務管理
 * 
 * 12-Omni Architecture:
 *   Foundation:  OmniBase, OmniMemory(萬能永憶), OmniTime, OmniComponent(萬能元件)
 *   Boundaries:  OmniTag, OmniEvidence
 *   Execution:   OmniAgent, OmniAPI, OmniBus
 *   Governance:  OmniGateway, OmniHealing, OmniEvolution
 * 
 * 9 Magic-Effect Combinations (九大奇效組合):
 *   1. 混沌自癒 (Chaos Self-Healing)
 *   2. 時空裂縫 (Temporal Rift)
 *   3. 細胞分裂 (Cellular Fission)
 *   4. 先知矩陣 (Prophet Matrix)
 *   5. 全知蜂巢 (Omniscient Hive)
 *   6. 武裝戒嚴 (Martial Law)
 *   7. 全面記憶 (Universal Memory)
 *   8. 太極共振 (Tai Chi Resonance)
 *   9. 萬法歸宗 (Omni Convergence)
 * 
 * 「全通之心是 AIOS 體系中超越功能運作的最高精神層次。」
 * 「同心圓看似一個，事實上是無數個。」
 */

import { getOmniSingularity } from "../agents/omni-singularity";
import { createOmniKey, OmniKey } from "../agents/omni-key";
import { createOmniSoul, OmniSoul } from "../agents/omni-soul";
import { createVPSAgent, VPSAgent, VPSAgentAdapter, VPSAgentFactory } from "../agents/vps";
import { OASummon } from "../agents/oa-summon";
import { OmniSoulAutoSeed } from "../agents/omni-soul-auto-seed";
import { OmniUserRegistry, getOmniUserRegistry } from "../agents/omni-user-registry";
import { IOmniSingularity } from "../types/omni-singularity";
import { IOmniKey } from "../types/omni-key";
import { IOmniSoul, GovernanceAlignment, SoulDecision } from "../types/omni-soul";
import { EffectCauseHealingResult } from "../types/twelve-omni";
import { IComponentCore } from "../types/core-contract";
import { VPSGlobalState, TaskResultBase } from "../agents/vps";

// 完全代主自行 (Complete Autonomous Delegation)
import {
  CompleteDelegationManager,
  getDelegationManager,
} from "../agents/complete-delegation/delegation-manager";
import {
  AutonomousDecisionEngine,
  getDecisionEngine,
} from "../agents/complete-delegation/autonomous-decision-engine";
import {
  CompleteDelegationAgent,
  createCompleteDelegationAgent,
  executeCompleteDelegationTask,
} from "../agents/complete-delegation/complete-delegation-agent";
import {
  ICompleteDelegationScope,
  ICompleteDelegationAgent,
  DelegationPermission,
  DelegationResult,
} from "../types/complete-delegation";

// 12-Omni Components
import {
  OmniBase,
  OmniMemory,
  OmniTime,
  OmniComponent,
  OmniTag,
  OmniEvidence,
  OmniAPI,
  OmniBusV2,
  OmniGatewayV2,
  OmniHealing,
  OmniEvolution,
  getOmniBase,
  getOmniMemory,
  getOmniTime,
  getOmniComponent,
  getOmniTag,
  getOmniEvidence,
  getOmniAPI,
  getOmniBus,
  getOmniGateway,
  getOmniHealing,
  getOmniEvolution,
} from "../agents/twelve-omni";

// 9 Magic-Effect Combinations
import {
  ChaosHealing,
  TemporalRift,
  CellularFission,
  ProphetMatrix,
  OmniscientHive,
  MartialLaw,
  UniversalMemory,
  TaiChiResonance,
  OmniConvergence,
} from "../agents/twelve-omni/magic-effects";

// ==========================================
// OmniCore 配置
// ==========================================

export interface OmniCoreConfig {
  /** VPS 主機地址 */
  vpsHost?: string;
  
  /** VPS SSH 端口 */
  vpsPort?: number;
  
  /** 靈魂名稱 */
  soulName?: string;
  
  /** 元鑰名稱 */
  keyName?: string;
  
  /** 是否自動初始化 */
  autoInitialize?: boolean;
  
  /** 是否執行招喚儀式 */
  summon?: boolean;
}

// ==========================================
// OmniCore 統一入口
// ==========================================

/**
 * OmniCore — 萬能核心統一入口
 * 
 * 整合所有 Omni* 組件，提供統一的操作介面
 */
export class OmniCore {
  private static _instance: OmniCore | null = null;
  
  /** 萬能奇點 */
  private _singularity: IOmniSingularity;
  
  /** 萬能元鑰 */
  private _key: OmniKey;
  
  /** 靈魂 */
  private _soul: OmniSoul;
  
  /** VPS Agent */
  private _vpsAgent: VPSAgent | null;
  
  /** VPS Agent 適配器（用於生態系統註冊） */
  private _vpsAdapter: VPSAgentAdapter | null;
  
  /** 12-Omni Components - Foundation */
  private _omniBase: OmniBase;
  private _omniMemory: OmniMemory;
  private _omniTime: OmniTime;
  private _omniComponent: OmniComponent;
  
  /** 12-Omni Components - Boundaries */
  private _omniTag: OmniTag;
  private _omniEvidence: OmniEvidence;
  
  /** 12-Omni Components - Execution */
  private _omniAPI: OmniAPI;
  private _omniBus: OmniBusV2;
  
  /** 12-Omni Components - Governance */
  private _omniGateway: OmniGatewayV2;
  private _omniHealing: OmniHealing;
  private _omniEvolution: OmniEvolution;
  
  /** 9 Magic-Effect Combinations */
  private _chaosHealing: ChaosHealing;
  private _temporalRift: TemporalRift;
  private _cellularFission: CellularFission;
  private _prophetMatrix: ProphetMatrix;
  private _omniscientHive: OmniscientHive;
  private _martialLaw: MartialLaw;
  private _universalMemory: UniversalMemory;
  private _taiChiResonance: TaiChiResonance;
  private _omniConvergence: OmniConvergence;
  
  /** 用戶成長資料庫 */
  private _userRegistry: OmniUserRegistry;
  
  /** 完全代主自行 - 授權管理器 */
  private _delegationManager: CompleteDelegationManager;
  
  /** 完全代主自行 - 決策引擎 */
  private _decisionEngine: AutonomousDecisionEngine;
  
  /** 完全代主自行 - 活躍代理者 */
  private _activeDelegationAgents: Map<string, ICompleteDelegationAgent> = new Map();
  
  /** VPS 連接配置 */
  private _vpsConfig?: { host: string; port: number };
  
  /** OmniCore 配置 */
  private _config?: OmniCoreConfig;
  
  /** 是否已初始化 */
  private _initialized: boolean = false;

  private constructor(config?: OmniCoreConfig) {
    this._config = config;
    
    // 1. 獲取萬能奇點（唯一存在）
    this._singularity = getOmniSingularity();
    
    // 2. 創建萬能元鑰
    this._key = createOmniKey({
      name: config?.keyName ?? "萬能元鑰",
      initialTier: "guardian",
      expiresIn: Infinity,
    });
    
    // 3. 創建靈魂
    this._soul = createOmniSoul({
      name: config?.soulName ?? "JunAiKey",
      initialState: "aligned",
    });
    
    // 4. 創建 VPS Agent（如果提供了主機地址）
    if (config?.vpsHost) {
      this._vpsConfig = {
        host: config.vpsHost,
        port: config.vpsPort ?? 8042,
      };
      this._vpsAgent = createVPSAgent({ host: config.vpsHost });
      this._vpsAdapter = new VPSAgentAdapter(this._vpsAgent);
    } else {
      this._vpsAgent = null;
      this._vpsAdapter = null;
    }
    
    // 5. 初始化 12-Omni Components
    this._omniBase = getOmniBase();
    this._omniMemory = getOmniMemory();
    this._omniTime = getOmniTime();
    this._omniComponent = getOmniComponent();
    this._omniTag = getOmniTag();
    this._omniEvidence = getOmniEvidence();
    this._omniAPI = getOmniAPI();
    this._omniBus = getOmniBus();
    this._omniGateway = getOmniGateway();
    this._omniHealing = getOmniHealing();
    this._omniEvolution = getOmniEvolution();
    
    // 6. 初始化 9 Magic-Effect Combinations
    this._chaosHealing = new ChaosHealing();
    this._temporalRift = new TemporalRift();
    this._cellularFission = new CellularFission();
    this._prophetMatrix = new ProphetMatrix();
    this._omniscientHive = new OmniscientHive();
    this._martialLaw = new MartialLaw();
    this._universalMemory = new UniversalMemory();
    this._taiChiResonance = new TaiChiResonance();
    this._omniConvergence = new OmniConvergence();
    
    // 7. 初始化用戶成長資料庫
    this._userRegistry = getOmniUserRegistry();
    
    // 8. 初始化完全代主自行組件
    this._delegationManager = getDelegationManager();
    this._decisionEngine = getDecisionEngine();

    console.log("[OmniCore] 🌌 萬能核心已創建");
  }

  /**
   * 獲取 OmniCore 單例
   */
  public static getInstance(config?: OmniCoreConfig): OmniCore {
    if (!OmniCore._instance) {
      OmniCore._instance = new OmniCore(config);
    }
    return OmniCore._instance;
  }

  /**
   * 初始化系統
   * 
   * 啟動所有組件並建立連接
   */
  public async initialize(): Promise<void> {
    if (this._initialized) {
      console.warn("[OmniCore] 系統已初始化");
      return;
    }

    console.log("[OmniCore] 🔮 初始化萬能核心...");

    // 0. SOUL.md 自動初始化 (如果不存在)
    const soulSeed = new OmniSoulAutoSeed();
    if (!soulSeed.exists) {
      console.log("[OmniCore] 🌱 SOUL.md 不存在，自動創建...");
      await soulSeed.initialize();
      console.log("[OmniCore] ✅ SOUL.md 已自動生成");
    }

    // 1. 招喚儀式 (如果啟用)
    if (this._config?.summon) {
      console.log("[OmniCore] 📿 執行招喚儀式...");
      const summon = new OASummon({
        soulName: this._config.soulName,
        keyName: this._config.keyName,
        vpsHost: this._config.vpsHost,
        vpsPort: this._config.vpsPort,
      });
      const result = await summon.summon();
      if (!result.success) {
        throw new Error(`招喚失敗: ${result.errors.join(', ')}`);
      }
    }

    // 2. 覺醒靈魂
    await this._soul.awaken("aligned");
    console.log("[OmniCore] ✅ 靈魂已覺醒");

    // 3. 解鎖元鑰能力
    await this._key.unlock("answer");
    await this._key.unlock("reveal");
    console.log("[OmniCore] ✅ 元鑰已解鎖");

    // 4. 印記元鑰
    await this._key.imprint(
      "萬能元鑰已初始化，準備解鎖一切未知",
      this._singularity.signature.uuid
    );
    console.log("[OmniCore] ✅ 元鑰已印記");

    // 5. 初始化 VPS Agent 生態系統註冊
    if (this._vpsAgent && this._vpsAdapter) {
      await this._registerVPSToEcosystem();
    }

    this._initialized = true;
    console.log("[OmniCore] ✨ 萬能核心初始化完成");
    console.log("[OmniCore] 「全通之心已啟動，圓通無礙。同心圓，無數個。」");
  }

  /**
   * 將 VPS Agent 註冊到 OmniAgent 生態系統
   * 
   * 量子糾纏效果：
   * - VPS Agent 與 OmniBus 建立連接
   * - 所有 VPS 事件通過量子糾纏通道同步
   * - 自動修復退相干（重新建立連接）
   */
  private async _registerVPSToEcosystem(): Promise<void> {
    if (!this._vpsAgent || !this._vpsAdapter) return;

    console.log("[OmniCore] 🌐 註冊 VPS Agent 到生態系統...");

    // 1. 初始化 VPS Agent 工廠
    VPSAgentFactory.initialize(
      this._omniBus as unknown as Parameters<typeof VPSAgentFactory.initialize>[0],
    );

    // 2. 創建並註冊 VPS Agent
    const vpsId = `vps-${this._vpsConfig?.host.replace(/\./g, '-') ?? "unknown"}`;
    VPSAgentFactory.createAndRegister({
      host: this._vpsConfig?.host ?? "unknown",
      vpsId,
    });

    // 3. 建立量子糾纏：訂閱 VPS 事件
    this._omniBus.subscribe("vps.command", async (event) => {
      console.log(`[OmniCore] 🔮 VPS 指令: ${(event.payload as Record<string, unknown>)?.action}`);
    });

    this._omniBus.subscribe("vps.result", async (event) => {
      console.log(`[OmniCore] 📊 VPS 結果: ${(event.payload as Record<string, unknown>)?.status}`);
    });

    this._omniBus.subscribe("vps.state", async (_event) => {
      console.log(`[OmniCore] 📡 VPS 狀態更新`);
    });

    // 4. 執行初始健康檢查
    console.log("[OmniCore] 🔍 執行 VPS 初始健康檢查...");
    try {
      const healthState = await this._vpsAgent.healthCheck();
      console.log(`[OmniCore] ✅ VPS 健康檢查完成`);
      console.log(`[OmniCore] 📊 系統: CPU=${healthState.system.cpuPercent.toFixed(1)}%, RAM=${healthState.system.memoryPercent.toFixed(1)}%`);
      
      // 記錄服務狀態
      for (const [name, svc] of Array.from(healthState.services.entries())) {
        console.log(`[OmniCore] 🔎 ${name}: ${svc.status} (${svc.health})`);
      }
    } catch (error) {
      console.warn(`[OmniCore] ⚠️ VPS 初始健康檢查失敗: ${error}`);
      console.log("[OmniCore] 將在下次同步時重試");
    }

    console.log(`[OmniCore] ✨ VPS Agent 已註冊到生態系統: ${vpsId}`);
  }

  // ==========================================
  // 統一 API
  // ==========================================

  /**
   * 問答：使用元鑰解答問題
   * 
   * 「萬能元鑰是一切問題的解答」
   */
  public async ask(question: string): Promise<{
    answer: string;
    confidence: number;
    source: string;
  }> {
    return this._key.answer(question);
  }

  /**
   * 揭示：使用元鑰揭示未知
   * 
   * 「萬能元鑰能開啟一切未知」
   */
  public async reveal(unknown: string): Promise<{
    revelation: string;
    truth: number;
  }> {
    return this._key.reveal(unknown);
  }

  /**
   * 顯化：從奇點中創造新的存在
   */
  public async manifest(_intent: {
    type: string;
    name: string;
    purpose: string;
  }): Promise<IComponentCore> {
    return undefined as unknown as IComponentCore;
  }

  /**
   * 治理對齊檢查
   */
  public async checkGovernance(_action: {
    type: string;
    params: Record<string, unknown>;
  }): Promise<GovernanceAlignment> {
    return undefined as unknown as GovernanceAlignment;
  }

  /**
   * 做出決策
   */
  public async decide(_context: {
    intent: string;
    options: Array<{ id: string; description: string }>;
  }): Promise<SoulDecision> {
    return undefined as unknown as SoulDecision;
  }

  /**
   * VPS 健康檢查
   */
  public async checkVPSHealth(): Promise<VPSGlobalState | { error: string }> {
    if (!this._vpsAgent) {
      return { error: "VPS Agent 未配置" };
    }
    return this._vpsAgent.healthCheck();
  }

  /**
   * VPS 部署
   */
  public async deployToVPS(params?: Record<string, unknown>): Promise<TaskResultBase | { error: string }> {
    if (!this._vpsAgent) {
      return { error: "VPS Agent 未配置" };
    }
    return this._vpsAgent.execute("deploy", params);
  }

  /**
   * VPS 備份
   */
  public async backupVPS(params?: Record<string, unknown>): Promise<TaskResultBase | { error: string }> {
    if (!this._vpsAgent) {
      return { error: "VPS Agent 未配置" };
    }
    return this._vpsAgent.backup(params);
  }

  /**
   * 果因修復 — 從症狀追溯根源再修復
   */
  public async effectCauseHeal(effect: string): Promise<EffectCauseHealingResult> {
    return this._omniHealing.effectCauseHeal(effect);
  }

  // ==========================================
  // 完全代主自行 API
  // ==========================================

  /**
   * 創建完全代主自行代理
   * 
   * 「代理者在完全授權範圍內，自主、獨立、全面地代替主體行使職權與執行行動。」
   */
  public async createDelegationAgent(params: {
    principalId: string;
    agentId?: string;
    permissions?: DelegationPermission[];
    validUntil?: number;
    description?: string;
  }): Promise<ICompleteDelegationAgent> {
    console.log(`[OmniCore] 🔮 創建完全代主自行代理: ${params.principalId}`);
    
    const agent = await createCompleteDelegationAgent({
      principalId: params.principalId,
      agentId: params.agentId ?? '',
      permissions: Array.isArray(params.permissions) ? params.permissions : typeof params.permissions === 'string' ? [params.permissions] : [],
      validUntil: params.validUntil,
      description: params.description,
    });
    
    // 註冊到活躍代理者列表
    this._activeDelegationAgents.set(agent.signature.uuid, agent);
    
    console.log(`[OmniCore] ✅ 完全代主自行代理已創建: ${agent.signature.uuid}`);
    
    return agent;
  }

  /**
   * 執行完全代主自行任務
   * 
   * 代理者在完全授權範圍內自主執行任務
   */
  public async executeDelegatedTask(
    agentId: string,
    intent: string,
    context?: Record<string, unknown>
  ): Promise<DelegationResult> {
    const agent = this._activeDelegationAgents.get(agentId);
    if (!agent) {
      throw new Error(`Delegation agent not found: ${agentId}`);
    }
    
    console.log(`[OmniCore] 🔮 執行完全代主自行任務: ${intent}`);
    
      const result = await executeCompleteDelegationTask(
        agent as unknown as CompleteDelegationAgent,
        intent,
        context
      );
    
    console.log(`[OmniCore] ✅ 完全代主自行任務完成: ${result.executionId}`);
    
    return result;
  }

  /**
   * 獲取活躍授權列表
   */
  public async getActiveDelegations(principalId?: string): Promise<ICompleteDelegationScope[]> {
    return this._delegationManager.getActiveDelegations(principalId);
  }

  /**
   * 終止完全代主自行代理
   */
  public async terminateDelegationAgent(agentId: string, reason: string): Promise<void> {
    const agent = this._activeDelegationAgents.get(agentId);
    if (agent) {
      await agent.terminateDelegation(reason);
      this._activeDelegationAgents.delete(agentId);
      console.log(`[OmniCore] 🔮 完全代主自行代理已終止: ${agentId}`);
    }
  }

  /**
   * 獲取決策歷史
   */
  public getDecisionHistory(agentId: string) {
    return this._decisionEngine.getDecisionHistory(agentId);
  }

  /**
   * 系統狀態總覽
   */
  public async getStatus(): Promise<{
    singularity: Awaited<ReturnType<IOmniSingularity['observe']>>;
    key: { name: string; tier: string; enabled: boolean; frozen: boolean };
    soul: { name: string; state: string; alignment: GovernanceAlignment };
    vps: { host: string; entangled: boolean; quantum: string; services: Record<string, unknown> } | null;
    ecosystem: { registeredAgents: number; busStats: Record<string, unknown> };
    initialized: boolean;
  }> {
    return {
      singularity: await this._singularity.observe(),
      key: {
        name: this._key.name,
        tier: this._key.tier,
        enabled: this._key.enabled,
        frozen: this._key.frozen,
      },
      soul: {
        name: this._soul.name,
        state: this._soul.state,
        alignment: this._soul.alignment,
      },
      vps: this._vpsAgent 
        ? { 
            host: this._vpsAgent.globalState.host, 
            entangled: this._vpsAgent.isEntangled,
            quantum: this._vpsAgent.quantumState as unknown as string,
            services: Object.fromEntries(Array.from(this._vpsAgent.globalState.services.entries())),
          }
        : null,
      ecosystem: {
        registeredAgents: VPSAgentFactory.getAllAgents().size,
        busStats: await this._omniBus.statistics() as unknown as Record<string, unknown>,
      },
      initialized: this._initialized,
    };
  }

  // ==========================================
  // 獲取器
  // ==========================================

  /** 獲取萬能奇點 */
  public get singularity(): IOmniSingularity {
    return this._singularity;
  }

  /** 獲取萬能元鑰 */
  public get key(): IOmniKey {
    return this._key;
  }

  /** 獲取靈魂 */
  public get soul(): IOmniSoul {
    return this._soul;
  }

  /** 獲取 VPS Agent */
  public get vpsAgent(): VPSAgent | null {
    return this._vpsAgent;
  }

  /** 獲取 VPS Agent 適配器 */
  public get vpsAdapter(): VPSAgentAdapter | null {
    return this._vpsAdapter;
  }

  /** 獲取 VPS 連接配置 */
  public get vpsConfig(): { host: string; port: number } | undefined {
    return this._vpsConfig;
  }

  /** 檢查是否已初始化 */
  public get initialized(): boolean {
    return this._initialized;
  }

  // ==========================================
  // 12-Omni Components Getters
  // ==========================================

  // Foundation Dimension — 基礎維度
  /** 獲取萬能基礎 */
  public get omniBase(): OmniBase { return this._omniBase; }
  /** 獲取萬能永憶 */
  public get omniMemory(): OmniMemory { return this._omniMemory; }
  /** 獲取萬能時間 */
  public get omniTime(): OmniTime { return this._omniTime; }
  /** 獲取萬能元件 */
  public get omniComponent(): OmniComponent { return this._omniComponent; }

  // Boundaries Dimension — 邊界維度
  /** 獲取萬能標籤 */
  public get omniTag(): OmniTag { return this._omniTag; }
  /** 獲取萬能證據 */
  public get omniEvidence(): OmniEvidence { return this._omniEvidence; }

  // Execution Dimension — 執行維度
  /** 獲取萬能 API */
  public get omniAPI(): OmniAPI { return this._omniAPI; }
  /** 獲取萬能總線 */
  public get omniBus(): OmniBusV2 { return this._omniBus; }

  // Governance Dimension — 治理維度
  /** 獲取萬能網關 */
  public get omniGateway(): OmniGatewayV2 { return this._omniGateway; }
  /** 獲取萬能癒合 */
  public get omniHealing(): OmniHealing { return this._omniHealing; }
  /** 獲取萬能進化 */
  public get omniEvolution(): OmniEvolution { return this._omniEvolution; }

  // Growth Dimension — 成長維度
  /** 獲取用戶成長資料庫 */
  public get userRegistry(): OmniUserRegistry { return this._userRegistry; }

  // ==========================================
  // 完全代主自行 Getters
  // ==========================================

  /** 獲取授權管理器 */
  public get delegationManager(): CompleteDelegationManager { return this._delegationManager; }
  
  /** 獲取決策引擎 */
  public get decisionEngine(): AutonomousDecisionEngine { return this._decisionEngine; }
  
  /** 獲取活躍代理者數量 */
  public get activeDelegationAgentsCount(): number { return this._activeDelegationAgents.size; }

  // ==========================================
  // 9 Magic-Effect Combinations Getters
  // ==========================================

  /** 獲取混沌自癒 (Chaos Self-Healing) */
  public get chaosHealing(): ChaosHealing { return this._chaosHealing; }
  /** 獲取時空裂縫 (Temporal Rift) */
  public get temporalRift(): TemporalRift { return this._temporalRift; }
  /** 獲取細胞分裂 (Cellular Fission) */
  public get cellularFission(): CellularFission { return this._cellularFission; }
  /** 獲取先知矩陣 (Prophet Matrix) */
  public get prophetMatrix(): ProphetMatrix { return this._prophetMatrix; }
  /** 獲取全知蜂巢 (Omniscient Hive) */
  public get omniscientHive(): OmniscientHive { return this._omniscientHive; }
  /** 獲取武裝戒嚴 (Martial Law) */
  public get martialLaw(): MartialLaw { return this._martialLaw; }
  /** 獲取全面記憶 (Universal Memory) */
  public get universalMemory(): UniversalMemory { return this._universalMemory; }
  /** 獲取太極共振 (Tai Chi Resonance) */
  public get taiChiResonance(): TaiChiResonance { return this._taiChiResonance; }
  /** 獲取萬法歸宗 (Omni Convergence) */
  public get omniConvergence(): OmniConvergence { return this._omniConvergence; }
}

// ==========================================
// 快速訪問函數
// ==========================================

/**
 * 獲取 OmniCore 單例
 */
export function getOmniCore(config?: OmniCoreConfig): OmniCore {
  return OmniCore.getInstance(config);
}

/**
 * 問答快捷方式
 */
export async function askOmni(question: string): Promise<string> {
  const core = getOmniCore();
  const result = await core.ask(question);
  return result.answer;
}

/**
 * 揭示快捷方式
 */
export async function revealOmni(unknown: string): Promise<string> {
  const core = getOmniCore();
  const result = await core.reveal(unknown);
  return result.revelation;
}

/**
 * VPS 健康檢查快捷方式
 */
export async function checkVPS(): Promise<VPSGlobalState | { error: string }> {
  const core = getOmniCore();
  return core.checkVPSHealth();
}

/**
 * VPS 部署快捷方式
 */
export async function deployVPS(params?: Record<string, unknown>): Promise<TaskResultBase | { error: string }> {
  const core = getOmniCore();
  return core.deployToVPS(params);
}

/**
 * 完全代主自行 - 創建代理快捷方式
 */
export async function createDelegation(params: {
  principalId: string;
  agentId?: string;
  permissions?: DelegationPermission[];
  validUntil?: number;
  description?: string;
}): Promise<ICompleteDelegationAgent> {
  const core = getOmniCore();
  return core.createDelegationAgent(params);
}

/**
 * 完全代主自行 - 執行任務快捷方式
 */
export async function executeDelegation(
  agentId: string,
  intent: string,
  context?: Record<string, unknown>
): Promise<DelegationResult> {
  const core = getOmniCore();
  return core.executeDelegatedTask(agentId, intent, context);
}

export default OmniCore;
