import type { IComponentCore } from '../../src/types/core-contract';
// Omni-Blueprint Hub - Core Types (IComponentCore)
// 5T Protocol + Single Data Table + Hash Lock

/**
 * 萬能元件心核 - 觀因循果修復版
 * 確保數據從因到果的完整性與不可篡改性
 */
// ts-matrix: 收斂至規範型別 (canonical: src/types/core-contract)
export type { IComponentCore };

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
