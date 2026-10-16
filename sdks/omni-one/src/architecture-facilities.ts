/**
 * OmniSystem Concentric Facilities Architecture
 * 萬能系統 10 層 MECE 同心圓萬能設施抽象介面與調度核心
 * 主題：ESGGO 善向永續與淨零實踐
 */

export enum FacilityLayer {
  IntentCore = 0,        // 第 0 層：萬能意圖心核
  PerceptionRadar = 1,   // 第 1 層：萬能感知雷達
  MemoryHub = 2,         // 第 2 層：萬能記憶樞紐 (5T 治理)
  InferenceBrain = 3,    // 第 3 層：萬能推理大腦 (Groq Qwen)
  GovernanceGate = 4,    // 第 4 層：萬能治理閘門
  OrchestrationHub = 5,  // 第 5 層：萬能編排中樞
  ExecutionWorkshop = 6, // 第 6 層：萬能執行工坊
  IntegrationNetwork = 7,// 第 7 層：萬能整合網絡
  ExperiencePortal = 8,  // 第 8 層：萬能體驗門戶
  EvolutionRing = 9,     // 第 9 層：萬能演化生長環
}

export interface FacilityMetadata {
  layer: FacilityLayer;
  name: string;
  theme: string;
  responsibility: string;
  representative: string;
}

export const OMNI_FACILITIES_CATALOG: Record<FacilityLayer, FacilityMetadata> = {
  [FacilityLayer.IntentCore]: {
    layer: FacilityLayer.IntentCore,
    name: '萬能意圖心核',
    theme: 'ESGGO 善向永續願景導航',
    responsibility: '感應用戶核心目標、業務意圖與永續痛點，作為唯一北極星',
    representative: 'IntentCoreFacility',
  },
  [FacilityLayer.PerceptionRadar]: {
    layer: FacilityLayer.PerceptionRadar,
    name: '萬能感知雷達',
    theme: '多模態即時情境感知與碳排數據監測',
    responsibility: '全管道捕捉多模態文檔、代碼、日誌與環境事件輸入',
    representative: 'PerceptionRadarFacility',
  },
  [FacilityLayer.MemoryHub]: {
    layer: FacilityLayer.MemoryHub,
    name: '萬能記憶樞紐',
    theme: '5T 永續存證與歷史偏好沉澱',
    responsibility: '以 5T 治理架構存證真實數據、歷史案例與因果關係',
    representative: 'MemoryHubFacility',
  },
  [FacilityLayer.InferenceBrain]: {
    layer: FacilityLayer.InferenceBrain,
    name: '萬能推理大腦',
    theme: 'Groq Qwen 極速認知推演',
    responsibility: '驅動情境理解、策略推演與 ESG 減碳路徑生成',
    representative: 'InferenceBrainFacility',
  },
  [FacilityLayer.GovernanceGate]: {
    layer: FacilityLayer.GovernanceGate,
    name: '萬能治理閘門',
    theme: '合規校驗與安全邊界防護',
    responsibility: '執行權限管控、合規校驗、隱私保護與邊界防護',
    representative: 'GovernanceGateFacility',
  },
  [FacilityLayer.OrchestrationHub]: {
    layer: FacilityLayer.OrchestrationHub,
    name: '萬能編排中樞',
    theme: 'DAG 工作流調度與依賴管理',
    responsibility: '將決策策略分解為具體 DAG 工作流與優先順序調度',
    representative: 'OrchestrationHubFacility',
  },
  [FacilityLayer.ExecutionWorkshop]: {
    layer: FacilityLayer.ExecutionWorkshop,
    name: '萬能執行工坊',
    theme: '核心業務運算與程式碼自動修復',
    responsibility: '驅動業務運算、代碼修復與 ESG 評分計算流水線',
    representative: 'ExecutionWorkshopFacility',
  },
  [FacilityLayer.IntegrationNetwork]: {
    layer: FacilityLayer.IntegrationNetwork,
    name: '萬能整合網絡',
    theme: '開放生態與第三方 API 連接',
    responsibility: '對接 GitHub、Cloudflare、SaaS 工具與碳盤查外部生態',
    representative: 'IntegrationNetworkFacility',
  },
  [FacilityLayer.ExperiencePortal]: {
    layer: FacilityLayer.ExperiencePortal,
    name: '萬能體驗門戶',
    theme: 'SSE 即時串流與同心圓雷達可視化',
    responsibility: '透過 SSE 即時串流、演化儀表板與視覺化交互交付價值',
    representative: 'ExperiencePortalFacility',
  },
  [FacilityLayer.EvolutionRing]: {
    layer: FacilityLayer.EvolutionRing,
    name: '萬能演化生長環',
    theme: '自主迭代與雙向閉環反饋',
    responsibility: '收集反饋與成效，動態優化特徵模型與決策鏈',
    representative: 'EvolutionRingFacility',
  },
};

export interface IFacilityNode<TInput = unknown, TOutput = unknown> {
  readonly layer: FacilityLayer;
  readonly metadata: FacilityMetadata;
  process(input: TInput, context?: Record<string, unknown>): Promise<TOutput>;
}

export class OmniSystemConcentricDispatcher {
  private facilities: Map<FacilityLayer, IFacilityNode> = new Map();

  registerFacility(facility: IFacilityNode): void {
    this.facilities.set(facility.layer, facility);
  }

  getFacility(layer: FacilityLayer): IFacilityNode | undefined {
    return this.facilities.get(layer);
  }

  hasFacility(layer: FacilityLayer): boolean {
    return this.facilities.has(layer);
  }

  getAllFacilities(): IFacilityNode[] {
    return Array.from(this.facilities.values()).sort((a, b) => a.layer - b.layer);
  }

  async diffuseOutward(initialInput: unknown): Promise<{
    layerResults: Map<FacilityLayer, unknown>;
    feedbackLoopTriggered: boolean;
  }> {
    const results = new Map<FacilityLayer, unknown>();
    let currentData = initialInput;

    for (let layerIdx = 0; layerIdx <= 9; layerIdx++) {
      const layer = layerIdx as FacilityLayer;
      const facility = this.facilities.get(layer);
      if (facility) {
        currentData = await facility.process(currentData, { layerResults: results });
        results.set(layer, currentData);
      }
    }

    // Layer 9 反向閉環反饋至 Layer 2 (記憶) 與 Layer 0 (意圖)
    const feedbackLoopTriggered = this.facilities.has(FacilityLayer.EvolutionRing);

    return {
      layerResults: results,
      feedbackLoopTriggered,
    };
  }
}

export function createDefaultOmniDispatcher(): OmniSystemConcentricDispatcher {
  const dispatcher = new OmniSystemConcentricDispatcher();
  for (let i = 0; i <= 9; i++) {
    const layer = i as FacilityLayer;
    const meta = OMNI_FACILITIES_CATALOG[layer];
    dispatcher.registerFacility({
      layer,
      metadata: meta,
      async process(input: unknown) {
        return {
          layer,
          name: meta.name,
          received: input,
          status: 'success',
          timestamp: new Date().toISOString(),
        };
      },
    });
  }
  return dispatcher;
}
