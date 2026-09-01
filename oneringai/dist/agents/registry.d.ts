import type { Agent } from '../core/agent.js';
export interface AgentRecord {
    readonly id: string;
    readonly name?: string;
    readonly registryId: string;
    readonly status: 'idle' | 'running' | 'suspended' | 'paused' | 'stopped' | 'destroyed';
    readonly model: string;
    readonly connector: string;
    readonly createdAt: number;
    readonly lastActivity: number;
    readonly parentAgentId?: string;
    readonly childIds: string[];
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
        tools: Array<{
            id: string;
            name: string;
            callCount: number;
            enabled: boolean;
        }>;
    };
    conversation: unknown[];
    execution?: {
        metrics: {
            tokens: {
                input: number;
                output: number;
            };
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
export declare class AgentRegistry {
    private static registry;
    private static records;
    private static eventSource;
    private static stats;
    static register(agent: Agent, registryId: string, name?: string): void;
    static unregister(registryId: string): boolean;
    static get(registryId: string): Agent | undefined;
    static getByName(name: string): Agent[];
    static getAll(): Map<string, Agent>;
    static get count(): number;
    static filter(criteria: Partial<AgentRecord>): Agent[];
    static getStats(): AgentStats;
    static inspect(registryId: string): Promise<AgentInspection | null>;
    static setParent(childId: string, parentId: string): void;
    static getChildren(parentId: string): Agent[];
    static getTree(parentId: string): {
        agent: Agent;
        children: any[];
    } | null;
    static onAgentEvent(handler: (agentId: string, name: string | undefined, event: string, data: unknown) => void): void;
    static emitAgentEvent(agentId: string, name: string | undefined, event: string, data: unknown): void;
    static pauseAgent(registryId: string): void;
    static resumeAgent(registryId: string): void;
    static cancelAll(reason: string): void;
    static destroyMatching(criteria: Partial<AgentRecord>): void;
    static _updateStats(tokens: {
        input: number;
        output: number;
    }): void;
    static _updateStatus(registryId: string, status: AgentRecord['status']): void;
}
//# sourceMappingURL=registry.d.ts.map