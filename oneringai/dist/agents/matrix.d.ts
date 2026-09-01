/**
 * 30-Agent Matrix Implementation
 *
 * Based on the OA-Team soul.md 30 Souls Matrix.
 * Each agent is specialized with its unique role, tools, and squad.
 */
import type { AgentCreateOptions } from '../types/index.js';
import { Agent } from '../core/agent.js';
export type Squad = 'strategy' | 'tech' | 'creative' | 'marketing' | 'guard';
export interface SoulAgentSpec {
    no: number;
    id: string;
    zh: string;
    english: string;
    squad: Squad;
    role: string;
    goal: string;
    backstory: string;
    tags: string[];
    tools: string[];
    capabilities: string[];
}
export declare const SWARM_SPEC: SoulAgentSpec[];
export declare class SwarmFactory {
    private defaultConnector;
    private agents;
    constructor(defaultConnector?: string);
    createAgent(spec: SoulAgentSpec, options?: Partial<AgentCreateOptions>): Agent;
    createAll(options?: Partial<AgentCreateOptions>): Map<string, Agent>;
    getAgent(id: string): Agent | undefined;
    getAllAgents(): Map<string, Agent>;
    getAgentsBySquad(squad: Squad): Map<string, Agent>;
    private _buildAgentInstructions;
    private _buildAgentTools;
    private _defaultFeatures;
}
export declare class SwarmOrchestrator {
    private factory;
    private taskQueue;
    constructor(connector?: string);
    initializeSwarm(options?: Partial<AgentCreateOptions>): void;
    createTask(task: {
        name: string;
        description: string;
        agentId: string;
        dependencies?: string[];
    }): string;
    executeSequential(): Promise<void>;
    getFactory(): SwarmFactory;
    getTaskQueue(): {
        id: string;
        name: string;
        description: string;
        agentId: string;
        dependencies: string[];
        status: "pending" | "running" | "completed" | "failed";
    }[];
}
export interface CrossAgentPairing {
    primaryAgentId: string;
    partnerAgentId: string;
    purpose: string;
    sharedTools: string[];
}
export declare const CROSS_AGENT_PAIRINGS: CrossAgentPairing[];
export declare function getSquadMembers(squad: Squad): SoulAgentSpec[];
export declare function getAgentById(id: string): SoulAgentSpec | undefined;
export declare function getAgentByNo(no: number): SoulAgentSpec | undefined;
export declare function getCrossPairingsForAgent(agentId: string): CrossAgentPairing[];
export { SWARM_SPEC, SwarmFactory, SwarmOrchestrator };
//# sourceMappingURL=matrix.d.ts.map