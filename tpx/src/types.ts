export type NodeState =
  | 'OFFLINE'
  | 'CONNECTING'
  | 'SYNCING'
  | 'ONLINE'
  | 'CONFLICT'
  | 'RESOLVED';

export interface SyncEvent {
  id: string;
  nodeId: string;
  sourceOrigin: string;
  action: 'created' | 'updated' | 'deleted';
  payload: Record<string, unknown>;
  timestamp: number;
  hash: string;
}

export interface Conflict {
  id: string;
  key: string;
  local: unknown;
  remote: unknown;
  sourceOrigin: string;
  timestamp: number;
}

export interface SyncConfig {
  nodeId: string;
  vectorClockKey: string;
  conflictResolver: (a: unknown, b: unknown, meta: SyncMetadata) => unknown;
  maxRetries: number;
  retryDelay: number;
}

export interface NodeInfo {
  id: string;
  state: NodeState;
  version: number;
  updatedAt: number;
  peers: string[];
}

export interface SyncMetadata {
  from: string;
  to: string;
  type: 'push' | 'pull' | 'full';
  retry?: number;
}
