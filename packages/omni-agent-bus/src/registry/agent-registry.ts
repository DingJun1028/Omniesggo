/**
 * Agent Registry — 60 員雙蜂軍團動態註冊表
 * 來源: oa-swarm/src/soul-matrix-60.ts (SOUL_MATRIX_60)
 * 將靜態 60 員定義轉換為 Agent Bus 可派遣的 AgentDescriptor
 */

import type { ISoulAgent, HiveSide, ArrayKey } from '../../../../shared/types.js';

// ts-matrix: 透過相對路徑引用 oa-swarm soul-matrix-60
// 注意: 此模組僅在 monorepo 內使用，需確保 oa-swarm 在 workspace 中
export type { ISoulAgent, HiveSide, ArrayKey };

/** 陣列能力映射 — 60 員五陣列 → Agent Bus 能力標籤 */
export const ARRAY_CAPABILITIES: Record<ArrayKey, string[]> = {
  sanctum: ['memory', 'rag', 'knowledge-curation', 'context-management'],
  rune: ['schema', 'contract', 'api-generation', 'testing', 'code-generation'],
  wing: ['task-dispatch', 'adk-orchestration', 'rendering', 'background-task'],
  alchemy: ['repair', 'refactor', 'performance', 'ci-cd', 'self-healing'],
  audit: ['5t-verify', 'hash-lock', 'compliance', 'quality-gate', 'soul-lineage'],
};

/** Agent 描述符 — Agent Bus 可派遣單元 */
export interface AgentDescriptor {
  id: number;
  title: string;
  tags: string[];
  array: ArrayKey;
  side: HiveSide;
  task: string;
  /** 暗系 (umbra) / 光系 (lumen) — 由 side 推導 */
  alignment: 'umbra' | 'lumen';
  /** 記憶端點 */
  memoryEndpoint: string;
  /** 能力標籤 */
  capabilities: string[];
  /** 心跳狀態 */
  heartbeat: boolean;
  /** 最後活動時間 */
  lastActive: number | null;
}

/** side → alignment 映射 */
function sideToAlignment(side: HiveSide): 'umbra' | 'lumen' {
  return side === 'local' ? 'umbra' : 'lumen';
}

/** 建立 Agent Descriptor */
export function createDescriptor(agent: ISoulAgent): AgentDescriptor {
  return {
    id: agent.id,
    title: agent.title,
    tags: agent.tags,
    array: agent.array,
    side: agent.side,
    task: agent.task,
    alignment: sideToAlignment(agent.side),
    memoryEndpoint: sideToAlignment(agent.side) === 'umbra'
      ? '/api/assets?tag=umbra'
      : '/api/assets?tag=lumen',
    capabilities: ARRAY_CAPABILITIES[agent.array] ?? [],
    heartbeat: false,
    lastActive: null,
  };
}

/** 60 員 Registry — 動態實例化 */
export class AgentRegistry {
  private readonly agents: Map<number, AgentDescriptor> = new Map();
  private readonly byArray: Map<ArrayKey, number[]> = new Map();
  private readonly bySide: Map<HiveSide, number[]> = new Map();
  private readonly byAlignment: Map<'umbra' | 'lumen', number[]> = new Map();

  constructor(matrix: ISoulAgent[]) {
    for (const agent of matrix) {
      const desc = createDescriptor(agent);
      if (this.agents.has(desc.id)) {
        throw new Error(`Duplicate agent id: ${desc.id}`);
      }
      this.agents.set(desc.id, desc);

      // 索引
      if (!this.byArray.has(desc.array)) this.byArray.set(desc.array, []);
      this.byArray.get(desc.array)!.push(desc.id);

      if (!this.bySide.has(desc.side)) this.bySide.set(desc.side, []);
      this.bySide.get(desc.side)!.push(desc.id);

      if (!this.byAlignment.has(desc.alignment)) this.byAlignment.set(desc.alignment, []);
      this.byAlignment.get(desc.alignment)!.push(desc.id);
    }
  }

  /** 取得單一 agent */
  get(id: number): AgentDescriptor | undefined {
    return this.agents.get(id);
  }

  /** 取得所有 agent */
  all(): AgentDescriptor[] {
    return Array.from(this.agents.values());
  }

  /** 依陣列取得 agents */
  byArrayKey(array: ArrayKey): AgentDescriptor[] {
    return (this.byArray.get(array) ?? []).map(id => this.agents.get(id)!);
  }

  /** 依部署側取得 agents */
  bySideKey(side: HiveSide): AgentDescriptor[] {
    return (this.bySide.get(side) ?? []).map(id => this.agents.get(id)!);
  }

  /** 依 alignment 取得 agents */
  byAlignmentKey(alignment: 'umbra' | 'lumen'): AgentDescriptor[] {
    return (this.byAlignment.get(alignment) ?? []).map(id => this.agents.get(id)!);
  }

  /** 依能力搜尋 agents */
  byCapability(cap: string): AgentDescriptor[] {
    return this.all().filter(a => a.capabilities.includes(cap));
  }

  /** 更新 heartbeat */
  heartbeat(id: number): void {
    const agent = this.agents.get(id);
    if (agent) {
      agent.heartbeat = true;
      agent.lastActive = Date.now();
    }
  }

  /** 重置 heartbeat（用於健康檢查） */
  resetHeartbeats(): void {
    for (const agent of this.agents.values()) {
      agent.heartbeat = false;
    }
  }

  /** 健康狀態統計 */
  health(): { total: number; alive: number; byArray: Record<string, { total: number; alive: number }> } {
    const byArray: Record<string, { total: number; alive: number }> = {};
    for (const [array, ids] of this.byArray) {
      byArray[array] = {
        total: ids.length,
        alive: ids.filter(id => this.agents.get(id)?.heartbeat).length,
      };
    }
    return {
      total: this.agents.size,
      alive: Array.from(this.agents.values()).filter(a => a.heartbeat).length,
      byArray,
    };
  }

  /** 60 員觸達驗證 */
  verify60(): { pass: boolean; count: number; missing: number[] } {
    const ids = Array.from(this.agents.keys()).sort((a, b) => a - b);
    const expected = Array.from({ length: 60 }, (_, i) => i + 1);
    const missing = expected.filter(id => !ids.includes(id));
    return {
      pass: missing.length === 0 && ids.length === 60,
      count: ids.length,
      missing,
    };
  }
}

/** 陣列能力查詢 */
export function getArrayCapabilities(array: ArrayKey): string[] {
  return ARRAY_CAPABILITIES[array] ?? [];
}

/** 暗光共鳴：umbra 寫入 → lumen 召回 */
export interface ResonanceEvent {
  sourceId: number;       // umbra agent id
  targetId: number;       // lumen agent id
  sourceType: 'codegraph' | 'skill' | 'wiki';
  sessionKey: string;
  timestamp: number;
}

export default AgentRegistry;
