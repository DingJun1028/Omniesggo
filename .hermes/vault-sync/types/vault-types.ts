// 🧬 Auto-generated Vault Lifeform Types
// Generated: 2026-09-08T21:54:23.086323
// 5T Compliant: Traceable ← sourced from vault pages

import type { UUID, HashDigest, ISO8601 } from './types';

// ==================== 5T Protocol ====================
export interface Traceable {
  readonly sourceOrigin: string;
  readonly createdAt: ISO8601;
  readonly sourcePage: string;
}

export interface Trackable {
  readonly lifecycleHooks: string[];
  readonly dataFlowPath: string[];
  readonly auditTrail: UUID;
}

export interface Tangible {
  readonly uiFeedback: boolean;
  readonly visualElements: number;
  readonly userMetrics: Record<string, number>;
}

export interface Transparent {
  readonly logicPublic: boolean;
  readonly hallucinationScore: number;  // < 0.1 required
  readonly auditLog: string;
}

export interface Trustworthy {
  readonly hashLock: HashDigest;
  readonly frozen: boolean;
  readonly tamperEvident: boolean;
}

// ==================== OA-Team Soul ====================
export interface SoulCore {
  queenBee: QueenBee;
  swarmMatrix: SwarmMatrix;
  protocol: '5T';
}

export interface QueenBee {
  id: '01';
  role: 'strategic-lead';
  tags: string[];  // #strategy, #planning, #coercion
}

export interface SwarmMatrix {
  agents: AgentProfile[];
  collaboration: GravitationalProtocol;
}

export interface AgentProfile {
  id: string;    // '01' through '30'
  name: string;  // e.g., '萬能規劃蜂'
  tags: string[];
  role: string;
  responsibilities: string[];
}

// ==================== AI Station Sushi ====================
export interface AIStationPipeline {
  modules: ProductionModule[];
  5tValidation: boolean;
  brandPreset: BrandPreset;
}

export interface ProductionModule {
  id: '01' | '02' | '03' | '04' | '05' | '06' | '07';
  name: string;
  freeTier: ToolConfig;
  paidTier?: ToolConfig;
}

export interface ToolConfig {
  command: string;
  fallback?: string;
}

export interface BrandPreset {
  name: '壽司博士';
  colors: {
    primary: '#10243f';    // Deep blue
    secondary: '#c9a24b';   // Warm gold
    text: '#f3ede1';        // Off-white
  };
  intro: string;  // "大家好，我是壽司博士"
  prohibited: string[];  // Blue-purple neon, robot brains, floating data
}

// ==================== Vault Sync Metadata ====================
export interface VaultSyncEvent {
  timestamp: ISO8601;
  action: 'sync_started' | 'page_synced' | 'sync_completed' | 'warning';
  data: Record<string, any>;
}

export interface VaultSyncState {
  pagesSynced: number;
  stateHash: HashDigest;
  lastRun: ISO8601;
}
