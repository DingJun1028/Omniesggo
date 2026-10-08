/**
 * Smart AI Router - 主入口文件
 * 整合：動態免費模型發現、模型轉換、OmniAgentGateway、時空裂縫引擎
 * 
 * 使用方式：
 * import { SmartAIRouter, TimeRiftEngine, OmniAgentGateway, createEventStore } from './smart-ai-router';
 */

// ============ 核心類型導出 ============
export * from './model-discovery/free-models';
export * from './model-discovery/model-converter';
export * from './model-discovery/providers/openrouter';
export * from './model-discovery/providers/groq';
export * from './model-discovery/event-store';

// ============ 核心類別導出 ============
export { OmniAgentGateway, OAG } from './OmniAgentGateway';
export { TimeRiftEngine, InMemoryEventStore, PostgresEventStore, EventStoreDBStore, createEventStore } from './model-discovery/event-store';
export { SmartAIRouterWithTimeRift } from './integration/time-rift-integration';

// ============ 協議類型導出 ============
export type {
  TimeRiftEvent,
  EventType,
  EventMetadata,
  ShadowTestConfig,
  EventStore,
  EventFilter,
  ShadowComparison,
  ReplaySession
} from './model-discovery/event-store';

// ============ 統一配置介面 ============
export interface SmartAIRouterConfig {
  // 模型發現配置
  discovery: {
    enabled: boolean;
    cacheTTL: number; // 快取時間 (ms)
    providers: ('openrouter' | 'groq' | 'huggingface')[];
    autoRefresh: boolean;
  };
  
  // 路由配置
  routing: {
    defaultTaskType: string;
    enableFallback: boolean;
    maxRetries: number;
    timeoutMs: number;
  };
  
  // 時空裂縫配置
  timeRift: {
    enabled: boolean;
    storeType: 'memory' | 'postgres' | 'eventstoredb';
    storeConfig?: any;
    bufferSize: number;
    flushIntervalMs: number;
  };
  
  // 安全網關配置
  gateway: {
    enabled: boolean;
    requireContractForExternalCalls: boolean;
    defaultComplianceTags: string[];
  };
  
  // 模型轉換配置
  conversion: {
    enabled: boolean;
    tempDir: string;
    maxConcurrent: number;
  };
}

// ============ 預設配置 ============
export const DEFAULT_CONFIG: SmartAIRouterConfig = {
  discovery: {
    enabled: true,
    cacheTTL: 30 * 60 * 1000, // 30 分鐘
    providers: ['openrouter', 'groq', 'huggingface'],
    autoRefresh: true
  },
  
  routing: {
    defaultTaskType: 'general',
    enableFallback: true,
    maxRetries: 3,
    timeoutMs: 60000
  },
  
  timeRift: {
    enabled: true,
    storeType: 'memory',
    bufferSize: 100,
    flushIntervalMs: 100
  },
  
  gateway: {
    enabled: true,
    requireContractForExternalCalls: true,
    defaultComplianceTags: ['ISO-14064-1', 'GRI']
  },
  
  conversion: {
    enabled: true,
    tempDir: '/tmp/model-conversion',
    maxConcurrent: 2
  }
};

// ============ 主要類別 ============

/**
 * Smart AI Router - 統一入口
 * 整合所有功能：模型發現、路由、時空裂縫、安全網關、模型轉換
 */
export class SmartAIRouter {
  private config: SmartAIRouterConfig;
  private timeRiftEngine: TimeRiftEngine | null = null;
  private gateway: OmniAgentGateway | null = null;
  private modelDiscovery: any = null;
  private modelConverter: any = null;
  private initialized = false;

  constructor(config: Partial<SmartAIRouterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 初始化所有組件
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[SmartAIRouter] Already initialized');
      return;
    }

    console.log('[SmartAIRouter] Initializing...');

    // 1. 初始化事件存儲與時空裂縫引擎
    if (this.config.timeRift.enabled) {
      const eventStore = createEventStore({
        type: this.config.timeRift.storeType,
        ...this.config.timeRift.storeConfig
      });
      
      this.timeRiftEngine = new TimeRiftEngine(eventStore);
      console.log('[SmartAIRouter] TimeRift Engine initialized');
    }

    // 2. 初始化安全網關
    if (this.config.gateway.enabled) {
      this.gateway = new OmniAgentGateway();
      console.log('[SmartAIRouter] OmniAgentGateway initialized');
    }

    // 3. 初始化模型發現
    if (this.config.discovery.enabled) {
      const { discoverAllFreeModels, getCachedFreeModels } = await import('./model-discovery/free-models');
      this.modelDiscovery = { discoverAllFreeModels, getCachedFreeModels };
      console.log('[SmartAIRouter] Model Discovery initialized');
    }

    // 4. 初始化模型轉換器
    if (this.config.conversion.enabled) {
      const { ModelConverter } = await import('./model-discovery/model-converter');
      this.modelConverter = ModelConverter.getInstance();
      console.log('[SmartAIRouter] Model Converter initialized');
    }

    this.initialized = true;
    console.log('[SmartAIRouter] Initialization complete');
  }

  /**
   * 獲取時空裂縫引擎
   */
  getTimeRiftEngine(): TimeRiftEngine | null {
    return this.timeRiftEngine;
  }

  /**
   * 獲取安全網關
   */
  getGateway(): OmniAgentGateway | null {
    return this.gateway;
  }

  /**
   * 發現所有免費模型
   */
  async discoverFreeModels(forceRefresh = false): Promise<FreeModel[]> {
    if (!this.modelDiscovery) {
      throw new Error('Model discovery not initialized');
    }
    return this.modelDiscovery.getCachedFreeModels(forceRefresh);
  }

  /**
   * 根據能力過濾模型
   */
  async findModelsByCapability(
    capability: 'chat' | 'reasoning' | 'vision' | 'code' | 'embedding'
  ): Promise<FreeModel[]> {
    const models = await this.discoverFreeModels();
    const { filterModelsByCapability, sortByContextWindow } = await import('./model-discovery/free-models');
    
    const filtered = filterModelsByCapability(models, capability);
    return sortByContextWindow(filtered);
  }

  /**
   * 路由並執行 (含完整追蹤)
   */
  async routeAndExecute(
    taskType: string,
    message: string,
    options: {
      useGateway?: boolean;
      complianceType?: string;
    } = {}
  ): Promise<{ result: any; traceId: string }> {
    if (!this.timeRiftEngine) {
      throw new Error('TimeRift Engine not initialized');
    }

    const traceId = `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // 記錄路由決策
    await this.timeRiftEngine.publish(
      'MODEL_ROUTED',
      'RouteDecision',
      { taskType, messageLength: message.length, traceId },
      { agent_id: 'smart-ai-router', tags: ['routing', taskType], correlation_id: traceId }
    );

    // 選擇模型策略
    const strategy = this.selectStrategy(taskType);
    
    // 嘗試主模型 -> fallback
    for (const tier of ['primary', 'fallback1', 'fallback2'] as const) {
      const model = strategy[tier];
      if (!model) continue;

      try {
        // 記錄調用開始
        await this.timeRiftEngine.publish(
          'MODEL_DISPATCHED',
          'ModelCallStarted',
          { model: model.model, tier },
          { agent_id: 'smart-ai-router', correlation_id: traceId }
        );

        // 經過安全網關 (如啟用)
        let result;
        if (options.useGateway && this.gateway) {
          result = await this.gateway.secureForwardToModel(
            model as FreeModel,
            message,
            taskType
          );
        } else {
          result = await this.callModel(model, message);
        }

        // 記錄成功
        await this.timeRiftEngine.publish(
          'MODEL_RESPONDED',
          'ModelCallSucceeded',
          { model: model.model, tier },
          { agent_id: 'smart-ai-router', correlation_id: traceId }
        );

        return { result, traceId };
      } catch (error) {
        // 記錄失敗並觸發 fallback
        await this.timeRiftEngine.publish(
          'FALLBACK_TRIGGERED',
          'ModelCallFailed',
          { model: model.model, tier, error: (error as Error).message },
          { agent_id: 'smart-ai-router', correlation_id: traceId }
        );
        
        if (tier === 'fallback2') throw error;
      }
    }

    throw new Error('All fallback models failed');
  }

  /**
   * 啟動影子測試
   */
  async startShadowTest(
    newModel: FreeModel,
    trafficPercentage: number = 10,
    durationMinutes: number = 60
  ): Promise<string> {
    if (!this.timeRiftEngine) {
      throw new Error('TimeRift Engine not initialized');
    }

    const channelId = this.timeRiftEngine.createShadowChannel({
      test_id: `shadow_${newModel.id.replace(/[^a-z0-9]/g, '_')}`,
      traffic_percentage: trafficPercentage,
      target_agent_version: 'smart-ai-router-shadow',
      comparison_metrics: ['latency', 'error_rate', 'quality_score'],
      duration_minutes: durationMinutes
    });

    await this.timeRiftEngine.publish(
      'SHADOW_TEST_STARTED',
      'ShadowTestCreated',
      { model: newModel.id, channelId, trafficPercentage, durationMinutes },
      { agent_id: 'smart-ai-router', tags: ['shadow-test'] }
    );

    return channelId;
  }

  /**
   * 時空回溯除錯
   */
  async debugTimeTravel(
    traceId: string,
    options: {
      targetAgent?: string;
      speed?: number;
    } = {}
  ): Promise<any> {
    if (!this.timeRiftEngine) {
      throw new Error('TimeRift Engine not initialized');
    }

    return this.timeRiftEngine.replay({
      startTime: Date.now() - 3600000, // 過去 1 小時
      endTime: Date.now(),
      filters: { correlation_ids: [traceId] },
      targetAgentId: options.targetAgent,
      speed: options.speed
    });
  }

  /**
   * 轉換模型
   */
  async convertModel(
    model: FreeModel,
    config: ModelConverterConfig
  ): Promise<FreeModel> {
    if (!this.modelConverter) {
      throw new Error('Model Converter not initialized');
    }
    return this.modelConverter.convert(model, config);
  }

  /**
   * 關閉所有資源
   */
  async shutdown(): Promise<void> {
    console.log('[SmartAIRouter] Shutting down...');
    
    if (this.timeRiftEngine) {
      await this.timeRiftEngine.shutdown();
    }
    
    this.initialized = false;
    console.log('[SmartAIRouter] Shutdown complete');
  }

  // ============ 私有方法 ============

  private selectStrategy(taskType: string): RoutingStrategy {
    // 這裡應使用原有的路由表邏輯
    // 簡化實作
    return {
      taskType,
      primary: { provider: 'groq', model: 'llama-3.3-70b-versatile', maxTokens: 4096, temperature: 0.3 },
      fallback1: { provider: 'openrouter', model: 'qwen/qwen3-next-80b-a3b-instruct:free', maxTokens: 4096, temperature: 0.3 },
      fallback2: { provider: 'openrouter', model: 'meta-llama/llama-3.2-90b-vision:free', maxTokens: 4096, temperature: 0.3 }
    };
  }

  private async callModel(modelConfig: ModelConfig, prompt: string): Promise<any> {
    // 實際模型調用邏輯
    // 這裡簡化實作
    return { content: `Mock response from ${modelConfig.model}`, model: modelConfig.model };
  }
}

// ============ 便利函數 ============

/**
 * 快速創建並初始化 Smart AI Router
 */
export async function createSmartAIRouter(
  config?: Partial<SmartAIRouterConfig>
): Promise<SmartAIRouter> {
  const router = new SmartAIRouter(config);
  await router.initialize();
  return router;
}

/**
 * 快速發現免費模型 (無需完整初始化)
 */
export async function quickDiscoverFreeModels(): Promise<FreeModel[]> {
  const { discoverAllFreeModels } = await import('./model-discovery/free-models');
  return discoverAllFreeModels();
}

/**
 * 快速建立時空裂縫引擎
 */
export async function createTimeRiftEngine(
  storeType: 'memory' | 'postgres' | 'eventstoredb' = 'memory',
  storeConfig?: any
): Promise<TimeRiftEngine> {
  const eventStore = createEventStore({ type: storeType, ...storeConfig });
  return new TimeRiftEngine(eventStore);
}

// ============ 版本資訊 ============
export const VERSION = '2.0.0';
export const FEATURES = [
  'dynamic-free-model-discovery',
  'model-conversion-pytorch-onnx-tfjs',
  'omniagent-gateway-zero-trust',
  'time-rift-event-sourcing',
  'shadow-testing',
  'time-travel-debugging',
  'multi-provider-support'
] as const;

// ============ 預設導出 ============
export default {
  SmartAIRouter,
  TimeRiftEngine,
  OmniAgentGateway,
  createSmartAIRouter,
  createTimeRiftEngine,
  quickDiscoverFreeModels,
  createEventStore,
  DEFAULT_CONFIG,
  VERSION,
  FEATURES
};