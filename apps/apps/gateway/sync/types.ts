// apps/gateway/sync/types.ts
// ============================================================================
// 全域 / 全端 / 全量 雙向同步 — 共享型別契約
// ESGGO (Next.ts) <-> OmniAgent 萬能系統 (gateway 8642) <-> Relay (9999)
// ============================================================================

/** 節點種類：ESGGO 應用端、萬能系統閘道、中繼、未知 */
export type NodeKind = 'esggo' | 'omni' | 'relay' | 'unknown';

/** 同步傳輸層 */
export type Transport = 'ws' | 'http' | 'relay';

/**
 * 代理（agent）運行態 — 與 v3 閘道 /agent/* 契約相容
 */
export interface AgentState {
  agentId: string;
  name: string;
  host: string;
  channel: string;
  capabilities: string[];
  status: 'online' | 'offline' | 'summoned' | 'busy';
  registeredAt: number;
  lastHeartbeat: number;
  /** OA-Summon 覺醒層（L2..L5） */
  layers?: string[];
  summonedAt?: string;
  awakeningAuth?: string;
  fruitSeal?: string;
  system?: Record<string, unknown>;
}

/**
 * ESGGO 應用（Next.ts）對外公開/內部的同步視圖
 */
export interface ESGGOState {
  appVersion: string;
  buildId: string | null;
  activeWorkers: number;
  agents: AgentState[];
  lastSyncAt: number;
}

/**
 * 萬能系統（OmniAgent）對外公開/內部的同步視圖
 */
export interface OmniState {
  gatewayVersion: string;
  platform: string;
  vpsIp: string;
  activeWorkers: number;
  providers: Record<string, boolean>;
  agents: AgentState[];
  websocket: { enabled: boolean; clients: number };
  skills: { total: number; transcended: number };
  lastSyncAt: number;
}

/**
 * 雙向同步封包 — 所有傳輸層共用同一 envelope
 */
export interface SyncPacket<T = unknown> {
  /** envelope 版本 */
  v: 1;
  /** 來源節點 */
  from: NodeKind;
  /** 目標節點（'*' = 廣播） */
  to: NodeKind | '*';
  /** 封包種類 */
  kind:
    | 'state'        // 全量狀態快照
    | 'patch'        // 增量補丁
    | 'heartbeat'    // 心跳/健康
    | 'summon'       // OA-Summon 儀式觸發
    | 'cmd'          // 指令（經 relay 轉發）
    | 'result'       // 指令結果
    | 'ack';         // 確認
  /**  monotonic 序號，用於去重與排序 */
  seq: number;
  /** 發送端時戳（ms） */
  ts: number;
  /** 負載 */
  payload: T;
  /** 來源實例 ID（全域唯一） */
  originId: string;
}

/** 雙向同步引擎健康指標 */
export interface SyncHealth {
  connectedNodes: NodeKind[];
  lastPacketAt: Record<NodeKind, number>;
  packetsSent: number;
  packetsRecv: number;
  conflictsResolved: number;
  conflictsUnresolved: number;
}
