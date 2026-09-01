/**
 * Agent Orchestrator - Multi-agent teams with shared workspace
 *
 * Provides conversational delegation, shared workspace for artifacts,
 * and async execution with monitoring and auto-reclaim.
 */
import type { Agent } from '../core/agent.js';
import type { AgentResponse, ToolFunction } from '../types/index.js';
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
export declare class SharedWorkspace {
    private entries;
    private events;
    post(entry: Omit<WorkspaceEntry, 'id' | 'createdAt' | 'updatedAt'>): WorkspaceEntry;
    get(key: string): WorkspaceEntry | undefined;
    getById(id: string): WorkspaceEntry | undefined;
    update(id: string, content: string): boolean;
    list(options?: {
        owner?: string;
        type?: string;
        tags?: string[];
    }): WorkspaceEntry[];
    on(event: string, listener: (...args: any[]) => void): void;
    off(event: string, listener: (...args: any[]) => void): void;
}
export interface AgentTypeDefinition {
    systemPrompt: string;
    description: string;
    scenarios: string[];
    capabilities: string[];
    tools?: ToolFunction[];
}
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
export declare class AgentOrchestrator {
    private connector;
    private model;
    private agentTypesConfig;
    private tools;
    private agents;
    private workspace;
    private agentTypes;
    private events;
    private delegationStack;
    constructor(connector: string, model: string, agentTypesConfig: Record<string, AgentTypeDefinition> | string[], tools?: ToolFunction[]);
    /**
     * Create or get an agent by type name
     */
    getOrCreateAgent(typeName: string): Promise<Agent>;
    /**
     * Run orchestration - decide routing then execute
     */
    run(query: string): Promise<AgentResponse>;
    /**
     * Route a query to the appropriate handler
     */
    private routeQuery;
    /**
     * Orchestrate multiple agents
     */
    private orchestrateMultiAgent;
    /**
     * Delegate interactive control to a sub-agent
     */
    delegateInteractive(agentType: string, briefing: string): Promise<{
        agent: Agent;
        sessionToken: string;
    }>;
    /**
     * Get workspace
     */
    getWorkspace(): SharedWorkspace;
    /**
     * Event handling
     */
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    /**
     * List all orchestration tools
     */
    getOrchestrationTools(): ToolFunction[];
}
export declare function createOrchestrator(options: {
    connector: string;
    model: string;
    agentTypes: Record<string, AgentTypeDefinition> | string[];
    tools?: ToolFunction[];
}): Promise<AgentOrchestrator>;
//# sourceMappingURL=orchestrator.d.ts.map