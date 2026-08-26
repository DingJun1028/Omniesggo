// Omni-Blueprint Hub - Core Types (IComponentCore)
// 5T Protocol + Single Data Table + Hash Lock

export interface IComponentCore {
  // 萬能永憶主體唯一識別碼 (Immutable)
  readonly uuid: string;
  // 語義化版本控制
  readonly version: string;
  // 刻印時間戳 (溯源起點)
  readonly timestamp: number;
  // 證據左證庫 (儲存觀因循果的執行軌跡)
  evidence: {
    originCause: string;    // 因：原始觸發條件
    processTrace: string[]; // 循：InfoOne 流轉路徑
    finalEffect: string;    // 果：最終執行結果與狀態
  };
}

export type BlueprintType = 'LIVE_BROADCAST' | 'DESIGNATED_URL_BROADCAST';

export interface BlueprintDefinition extends IComponentCore {
  type: BlueprintType;
  name: string;
  sourceEndpoint: string;
  targetLanguages: string[];
  hostEmail: string;
  hashLock?: string;
}

export interface BlueprintProduct extends IComponentCore {
  blueprintId: string;
  productName: string;
  broadcastUrl?: string;
  status: 'INITIALIZED' | 'RUNNING' | 'FROZEN' | 'TERMINATED';
  activeViewers: number;
  payloadStream: BroadcastPayload[];
}

export interface BroadcastPayload {
  id: string;
  originText: string;
  translatedText: Record<string, string>;
  sourceOrigin: string;
  hash: string;
  timestamp: string;
}

// Single Data Table Protocol
export interface UnifiedBlueprintEntity {
  id: string;
  entityType: 'BLUEPRINT' | 'PRODUCT' | 'BROADCAST_LOG';
  blueprintType: BlueprintType;
  hostEmail: string;
  payload: Record<string, unknown>;
  hashLock: string;
  createdAt: string;
}
