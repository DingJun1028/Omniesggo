/**
 * Agent Orchestrator - Multi-agent teams with shared workspace
 * 
 * Provides conversational delegation, shared workspace for artifacts,
 * and async execution with monitoring and auto-reclaim.
 */
import type { Agent } from '../core/agent.js';
import type { AgentResponse, ToolFunction } from '../types/index.js';
import { AgentRegistry } from './registry.js';
import { EventEmitter } from 'events';

// ============================================================================
// Workspace
// ============================================================================

export interface WorkspaceEntry {
  id: string;
  key: string;
  content: string;
  owner: string;
  type: 'artifact' | 'status' | 'note' | 'task';
  createdAt: number;
  updatedAt: number;
  tags: string[];
}

export class SharedWorkspace {
  private entries: Map<string, WorkspaceEntry> = new Map();
  private events: EventEmitter = new EventEmitter();
  
  post(entry: Omit<WorkspaceEntry, 'id' | 'createdAt' | 'updatedAt'>): WorkspaceEntry {
    const id = `ws_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = Date.now();
    const workspaceEntry: WorkspaceEntry = { ...entry, id, createdAt: now, updatedAt: now };
    this.entries.set(id, workspaceEntry);
    this.events.emit('entry:posted', workspaceEntry);
    return workspaceEntry;
  }
  
  get(key: string): WorkspaceEntry | undefined {
    return Array.from(this.entries.values()).find(e => e.key === key);
  }
  
  getById(id: string): WorkspaceEntry | undefined {
    return this.entries.get(id);
  }
  
  update(id: string, content: string): boolean {
    const entry = this.entries.get(id);
    if (!entry) return false;
    entry.content = content;
    entry.updatedAt = Date.now();
    this.events.emit('entry:updated', entry);
    return true;
  }
  
  list(options?: { owner?: string; type?: string; tags?: string[] }): WorkspaceEntry[] {
    let entries = Array.from(this.entries.values());
    if (options?.owner) entries = entries.filter(e => e.owner === options.owner);
    if (options?.type) entries = entries.filter(e => e.type === options.type);
    if (options?.tags) {
      entries = entries.filter(e => options.tags!.some(tag => e.tags.includes(tag)));
    }
    return entries.sort((a, b) => b.createdAt - a.createdAt);
  }
  
  on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }
  
  off(event: string, listener: (...args: any[]) => void): void {
    this.events.off(event, listener);
  }
}

// ============================================================================
// Agent Type Definition
// ============================================================================

export interface AgentTypeDefinition {
  systemPrompt: string;
  description: string;
  scenarios: string[];
  capabilities: string[];
  tools?: ToolFunction[];
}

// ============================================================================
// Orchestration Tasks
// ============================================================================

export type RoutingDecision = 'DIRECT' | 'DELEGATE' | 'ORCHESTRATE';

export interface OrchestrationContext {
  userQuery: string;
  agents: Map<string, Agent>;
  workspace: SharedWorkspace;
  currentTurn: number;
  delegationHistory: Array<{
    from: string;
    to: string;
    task: string;
    timestamp: number;
  }>;
}

// ============================================================================
// Agent Orchestrator
// ============================================================================

export class AgentOrchestrator {
  private agents: Map<string, Agent> = new Map();
  private workspace: SharedWorkspace = new SharedWorkspace();
  private agentTypes: Map<string, AgentTypeDefinition> = new Map();
  private events: EventEmitter = new EventEmitter();
  private delegationStack: string[] = [];
  
  constructor(
    private connector: string,
    private model: string,
    private agentTypesConfig: Record<string, AgentTypeDefinition> | string[],
    private tools: ToolFunction[] = []
  ) {
    // Register agent types
    if (Array.isArray(agentTypesConfig)) {
      for (const name of agentTypesConfig) {
        this.agentTypes.set(name, {
          systemPrompt: `You are a ${name} agent.`,
          description: name,
          scenarios: [],
          capabilities: [],
        });
      }
    } else {
      this.agentTypes = new Map(Object.entries(agentTypesConfig));
    }
    
    this.events = new EventEmitter();
  }
  
  /**
   * Create or get an agent by type name
   */
  async getOrCreateAgent(typeName: string): Promise<Agent> {
    const key = `agent_${typeName}`;
    let agent = this.agents.get(key);
    
    if (!agent) {
      const typeDef = this.agentTypes.get(typeName);
      if (!typeDef) {
        throw new Error(`Unknown agent type: ${typeName}`);
      }
      
      const { Agent } = await import('../core/agent.js');
      const { Connector } = await import('../core/connector.js');
      
      agent = Agent.create({
        connector: this.connector,
        model: this.model,
        instructions: typeDef.systemPrompt,
        tools: [...this.tools, ...(typeDef.tools || [])],
        context: {
          agentId: key,
          features: { workingMemory: true, inContextMemory: true },
        },
      });
      
      // Register in global registry
      this.agents.set(key, agent);
      AgentRegistry.register(agent, `orch_${key}`, typeName);
      
      this.events.emit('agent:created', { typeName, agentId: key });
    }
    
    return agent;
  }
  
  /**
   * Run orchestration - decide routing then execute
   */
  async run(query: string): Promise<AgentResponse> {
    this.events.emit('run:start', { query });
    
    // Route the query
    const routing = await this.routeQuery(query);
    
    if (routing.decision === 'DIRECT') {
      // Orchestrator handles directly
      const orchestratorAgent = await this.getOrCreateAgent('orchestrator');
      const response = await orchestratorAgent.run(query);
      this.events.emit('run:complete', { response });
      return response;
    }
    
    if (routing.decision === 'DELEGATE') {
      const agent = await this.getOrCreateAgent(routing.agentType);
      
      // Post delegation to workspace
      this.workspace.post({
        key: `task_${Date.now()}`,
        content: query,
        owner: routing.agentType,
        type: 'task',
        tags: ['delegated'],
      });
      
      const response = await agent.run(query);
      
      // Post result to workspace
      this.workspace.post({
        key: `result_${Date.now()}`,
        content: response.output_text,
        owner: routing.agentType,
        type: 'artifact',
        tags: ['result'],
      });
      
      this.events.emit('task:delegated', { agentType: routing.agentType, response });
      this.events.emit('run:complete', { response });
      return response;
    }
    
    // ORCHESTRATE - multi-agent
    const response = await this.orchestrateMultiAgent(query, routing.plan);
    this.events.emit('run:complete', { response });
    return response;
  }
  
  /**
   * Route a query to the appropriate handler
   */
  private async routeQuery(query: string): Promise<{
    decision: RoutingDecision;
    agentType: string;
    plan?: Array<{ agentType: string; task: string; dependencies: string[] }>;
  }> {
    // Simple routing logic - in production this would use an LLM
    const lowerQuery = query.toLowerCase();
    
    if (lowerQuery.includes('design') || lowerQuery.includes('architect')) {
      return { decision: 'DELEGATE', agentType: 'architect' };
    }
    
    if (lowerQuery.includes('code') || lowerQuery.includes('implement') || lowerQuery.includes('build')) {
      return { decision: 'DELEGATE', agentType: 'developer' };
    }
    
    if (lowerQuery.includes('research') || lowerQuery.includes('search')) {
      return { decision: 'DELEGATE', agentType: 'researcher' };
    }
    
    // Multi-step tasks
    if (lowerQuery.includes('and') || lowerQuery.includes('also')) {
      return {
        decision: 'ORCHESTRATE',
        agentType: 'orchestrator',
        plan: [
          { agentType: 'researcher', task: `Research part of: ${query}`, dependencies: [] },
          { agentType: 'architect', task: `Design solution for: ${query}`, dependencies: ['researcher'] },
          { agentType: 'developer', task: `Implement solution for: ${query}`, dependencies: ['architect'] },
        ],
      };
    }
    
    return { decision: 'DIRECT', agentType: 'orchestrator' };
  }
  
  /**
   * Orchestrate multiple agents
   */
  private async orchestrateMultiAgent(query: string, plan?: Array<{ agentType: string; task: string; dependencies: string[] }>): Promise<AgentResponse> {
    if (!plan) {
      const orchestrator = await this.getOrCreateAgent('orchestrator');
      return orchestrator.run(query);
    }
    
    const completedTasks = new Set<string>();
    let lastResponse: AgentResponse | null = null;
    
    for (const task of plan) {
      // Check dependencies
      if (!task.dependencies.every(dep => completedTasks.has(dep))) {
        continue;
      }
      
      const agent = await this.getOrCreateAgent(task.agentType);
      this.delegationStack.push(task.agentType);
      
      try {
        this.workspace.post({
          key: `task_${Date.now()}_${task.agentType}`,
          content: task.task,
          owner: task.agentType,
          type: 'task',
          tags: ['orchestrated'],
        });
        
        lastResponse = await agent.run(task.task);
        completedTasks.add(task.agentType);
        
        this.workspace.post({
          key: `result_${Date.now()}_${task.agentType}`,
          content: lastResponse.output_text,
          owner: task.agentType,
          type: 'artifact',
          tags: ['result'],
        });
        
        this.events.emit('task:completed', { agentType: task.agentType, task: task.task });
      } catch (error) {
        this.events.emit('task:failed', { agentType: task.agentType, error });
      } finally {
        this.delegationStack.pop();
      }
    }
    
    if (lastResponse) {
      return lastResponse;
    }
    
    // Fallback to orchestrator
    const orchestrator = await this.getOrCreateAgent('orchestrator');
    return orchestrator.run(query);
  }
  
  /**
   * Delegate interactive control to a sub-agent
   */
  async delegateInteractive(agentType: string, briefing: string): Promise<{
    agent: Agent;
    sessionToken: string;
  }> {
    const agent = await this.getOrCreateAgent(agentType);
    
    this.workspace.post({
      key: `delegate_${Date.now()}`,
      content: briefing,
      owner: agentType,
      type: 'status',
      tags: ['delegated', 'interactive'],
    });
    
    return {
      agent,
      sessionToken: `session_${Date.now()}`,
    };
  }
  
  /**
   * Get workspace
   */
  getWorkspace(): SharedWorkspace {
    return this.workspace;
  }
  
  /**
   * Event handling
   */
  on(event: string, listener: (...args: any[]) => void): this {
    this.events.on(event, listener);
    return this;
  }
  
  off(event: string, listener: (...args: any[]) => void): this {
    this.events.off(event, listener);
    return this;
  }
  
  /**
   * List all orchestration tools
   */
  getOrchestrationTools(): ToolFunction[] {
    const that = this;
    
    return [
      {
        definition: {
          type: 'function',
          function: {
            name: 'assign_turn',
            description: 'Assign a turn to a specific agent type for execution',
            parameters: {
              type: 'object',
              properties: {
                agent: { type: 'string', description: 'The agent type to assign the turn to' },
                type: { type: 'string', description: 'The type of assignment' },
                instruction: { type: 'string', description: 'The instruction for the agent' },
                autoDestroy: { type: 'boolean', description: 'Whether to auto-destroy the agent after completion' },
              },
              required: ['agent', 'instruction'],
            },
          },
        },
        execute: async (args) => {
          const agentType = args.agent as string;
          const instruction = args.instruction as string;
          const agent = await that.getOrCreateAgent(agentType);
          const response = await agent.run(instruction);
          return response;
        },
        permission: { scope: 'always', riskLevel: 'low' },
      },
      {
        definition: {
          type: 'function',
          function: {
            name: 'list_agents',
            description: 'List all available agent types and their status',
            parameters: { type: 'object', properties: {}, required: [] },
          },
        },
        execute: async () => {
          return Array.from(that.agents.keys()).map(key => ({
            id: key,
            type: key.replace('agent_', ''),
            status: 'ready',
          }));
        },
        permission: { scope: 'always', riskLevel: 'low' },
      },
    ];
  }
}

// ============================================================================
// Factory function
// ============================================================================

export async function createOrchestrator(options: {
  connector: string;
  model: string;
  agentTypes: Record<string, AgentTypeDefinition> | string[];
  tools?: ToolFunction[];
}): Promise<AgentOrchestrator> {
  return new AgentOrchestrator(
    options.connector,
    options.model,
    options.agentTypes,
    options.tools || []
  );
}
