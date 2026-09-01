/**
 * Agent Registry - Global tracking of all active agents
 * 
 * Provides deep inspection, parent/child hierarchy, event fan-in,
 * and external control capabilities.
 */
import { EventEmitter } from 'events';
import type { Agent } from '../core/agent.js';
import type { AgentResponse } from '../types/index.js';

export interface AgentRecord {
  readonly id: string;
  readonly name?: string;
  readonly registryId: string;
  status: 'idle' | 'running' | 'suspended' | 'paused' | 'stopped' | 'destroyed';
  readonly model: string;
  readonly connector: string;
  readonly createdAt: number;
  readonly lastActivity: number;
  parentAgentId?: string;
  childIds: string[];
}

export interface AgentStats {
  total: number;
  byStatus: Record<string, number>;
  byModel: Record<string, number>;
  byConnector: Record<string, number>;
  totalToolCalls: number;
  totalTokens: number;
}

export interface AgentInspection {
  agentId: string;
  registryId: string;
  name?: string;
  status: string;
  model: string;
  connector: string;
  context: {
    plugins: Record<string, unknown>;
    tools: Array<{ id: string; name: string; callCount: number; enabled: boolean }>;
  };
  conversation: unknown[];
  execution?: {
    metrics: {
      tokens: { input: number; output: number };
      toolCalls: number;
      errors: number;
      duration: number;
    };
  };
  children: string[];
}

/**
 * Global Agent Registry
 * All Agent instances automatically register on creation and unregister on destroy.
 */
export class AgentRegistry {
  private static registry: Map<string, Agent> = new Map();
  private static records: Map<string, AgentRecord> = new Map();
  private static eventSource: EventEmitter = new EventEmitter();
  private static stats: {
    totalToolCalls: number;
    totalTokens: { input: number; output: number };
  } = { totalToolCalls: 0, totalTokens: { input: 0, output: 0 } };
  
  static register(agent: Agent, registryId: string, name?: string): void {
    this.registry.set(registryId, agent);
    this.records.set(registryId, {
      id: agent.userId || 'unknown',
      name,
      registryId,
      status: 'idle',
      model: agent.model,
      connector: typeof agent.connector === 'string' ? agent.connector : agent.connector?.name || 'unknown',
      createdAt: Date.now(),
      lastActivity: Date.now(),
      childIds: [],
    });
    this.eventSource.emit('agent:registered', { registryId, name });
  }
  
  static unregister(registryId: string): boolean {
    const agent = this.registry.get(registryId);
    if (!agent) return false;
    
    const record = this.records.get(registryId);
    if (record) {
      record.status = 'destroyed';
    }
    
    this.registry.delete(registryId);
    this.records.delete(registryId);
    this.eventSource.emit('agent:unregistered', { registryId });
    return true;
  }
  
  static get(registryId: string): Agent | undefined {
    return this.registry.get(registryId);
  }
  
  static getByName(name: string): Agent[] {
    const result: Agent[] = [];
    for (const [id, agent] of this.registry) {
      const record = this.records.get(id);
      if (record && record.name && record.name === name) {
        result.push(agent);
      }
    }
    return result;
  }
  
  static getAll(): Map<string, Agent> {
    return this.registry;
  }
  
  static get count(): number {
    return this.registry.size;
  }
  
  static filter(criteria: Partial<AgentRecord>): Agent[] {
    return Array.from(this.registry.entries()).filter(([id, agent]) => {
      const record = this.records.get(id);
      if (!record) return false;
      
      for (const [key, value] of Object.entries(criteria)) {
        if (record[key as keyof AgentRecord] !== value) return false;
      }
      return true;
    }).map(([, agent]) => agent);
  }
  
  static getStats(): AgentStats {
    const byStatus: Record<string, number> = {};
    const byModel: Record<string, number> = {};
    const byConnector: Record<string, number> = {};
    
    for (const record of this.records.values()) {
      byStatus[record.status] = (byStatus[record.status] || 0) + 1;
      byModel[record.model] = (byModel[record.model] || 0) + 1;
      byConnector[record.connector] = (byConnector[record.connector] || 0) + 1;
    }
    
    return {
      total: this.registry.size,
      byStatus,
      byModel,
      byConnector,
      totalToolCalls: this.stats.totalToolCalls,
      totalTokens: this.stats.totalTokens.input + this.stats.totalTokens.output,
    };
  }
  
  static async inspect(registryId: string): Promise<AgentInspection | null> {
    const agent = this.registry.get(registryId);
    if (!agent) return null;
    
    const record = this.records.get(registryId);
    return {
      agentId: record?.id || 'unknown',
      registryId,
      name: record?.name,
      status: record?.status || 'unknown',
      model: agent.model,
      connector: typeof agent.connector === 'string' ? agent.connector : agent.connector?.name || 'unknown',
      context: {
        plugins: {},
        tools: agent.tools.list().map(t => ({
          id: t.id,
          name: t.definition.function.name,
          callCount: 0,
          enabled: agent.tools.listEnabled().includes(t.id),
        })),
      },
      conversation: [],
      children: record?.childIds || [],
    };
  }
  
  // Parent/Child hierarchy
  static setParent(childId: string, parentId: string): void {
    const childRecord = this.records.get(childId);
    const parentRecord = this.records.get(parentId);
    
    if (childRecord && parentRecord) {
      childRecord.parentAgentId = parentId;
      parentRecord.childIds.push(childId);
    }
  }
  
  static getChildren(parentId: string): Agent[] {
    const parent = this.records.get(parentId);
    if (!parent) return [];
    
    return parent.childIds
      .map(id => this.registry.get(id))
      .filter(Boolean) as Agent[];
  }
  
  static getTree(parentId: string): { agent: Agent; children: any[] } | null {
    const agent = this.registry.get(parentId);
    if (!agent) return null;
    
    const children = this.getChildren(parentId);
    return {
      agent,
      children: children.map(child => {
        // We'd need child registry IDs - for now return simplified
        return { agent: child, children: [] };
      }),
    };
  }
  
  // Event fan-in
  static onAgentEvent(handler: (agentId: string, name: string | undefined, event: string, data: unknown) => void): void {
    this.eventSource.on('agent:event', handler);
  }
  
  static emitAgentEvent(agentId: string, name: string | undefined, event: string, data: unknown): void {
    this.eventSource.emit('agent:event', agentId, name, event, data);
  }
  
  // External control
  static pauseAgent(registryId: string): void {
    const record = this.records.get(registryId);
    if (record) {
      record.status = 'paused';
      this.eventSource.emit('agent:paused', { registryId });
    }
  }
  
  static resumeAgent(registryId: string): void {
    const record = this.records.get(registryId);
    if (record) {
      record.status = 'idle';
      this.eventSource.emit('agent:resumed', { registryId });
    }
  }
  
  static cancelAll(reason: string): void {
    for (const [id, agent] of this.registry) {
      agent.destroy();
      this.unregister(id);
    }
    this.eventSource.emit('agents:cancelled', { reason });
  }
  
  static destroyMatching(criteria: Partial<AgentRecord>): void {
    const agents = this.filter(criteria);
    for (const agent of agents) {
      agent.destroy();
      // Find and unregister
      for (const [id, a] of this.registry) {
        if (a === agent) {
          this.unregister(id);
          break;
        }
      }
    }
  }
  
  // Update stats
  static _updateStats(tokens: { input: number; output: number }): void {
    this.stats.totalToolCalls++;
    this.stats.totalTokens.input += tokens.input;
    this.stats.totalTokens.output += tokens.output;
  }
  
  // Update status
  static _updateStatus(registryId: string, status: AgentRecord['status']): void {
    const record = this.records.get(registryId);
    if (record) {
      record.status = status;
      (record as any).lastActivity = Date.now();
    }
  }
}
