/**
 * Agent Runtime - Preview
 *
 * A vendor-neutral layer for running complete, pre-built agent systems through
 * one observable workflow API. Applications can select native OneRingAI agents
 * or OpenAI Codex SDK agents without flattening either system into a text-model
 * provider.
 */
import type { AgentResponse } from '../types/index.js';
export interface AgentSpec {
    id: string;
    driver: string;
    connector: string;
    model: string;
    thinking?: {
        enabled: boolean;
        effort?: 'low' | 'medium' | 'high';
        budgetTokens?: number;
    };
    instructions?: string;
    tools?: string[];
    capabilities?: string[];
    [key: string]: unknown;
}
export interface AgentCapability {
    id: string;
    name: string;
    description: string;
    type: 'tool' | 'skill' | 'permission' | 'resource';
}
export interface AgentSession {
    id: string;
    agentId: string;
    spec: AgentSpec;
    createdAt: number;
    status: 'idle' | 'running' | 'suspended' | 'completed' | 'failed' | 'cancelled';
    metadata: Record<string, unknown>;
}
export interface AgentRun {
    id: string;
    sessionId: string;
    agentId: string;
    input: string;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    result?: AgentResponse;
    error?: string;
    events: AgentEvent[];
}
export type AgentEventType = 'session:created' | 'session:started' | 'session:completed' | 'session:failed' | 'run:started' | 'run:completed' | 'run:failed' | 'message' | 'tool:call' | 'tool:result' | 'reasoning' | 'command:output' | 'file:activity' | 'usage' | 'error' | 'warning' | 'cancelled' | 'recovered';
export interface AgentEvent {
    type: AgentEventType;
    runId?: string;
    sessionId?: string;
    agentId?: string;
    timestamp: number;
    data: unknown;
    sequence: number;
}
export interface EventSubscription {
    unsubscribe(): void;
}
export interface AgentDriver {
    readonly name: string;
    readonly supportedDrivers: string[];
    readonly capabilities: AgentCapability[];
    validate(spec: AgentSpec): Promise<boolean>;
    inspect(spec: AgentSpec): Promise<{
        capabilities: AgentCapability[];
        limitations: string[];
        modelInfo: {
            maxTokens?: number;
            contextWindow?: number;
            modality?: string[];
        };
    }>;
    createSession(spec: AgentSpec): Promise<AgentSession>;
    startRun(session: AgentSession, input: string, options?: RunOptions): Promise<AgentRun>;
    cancelRun(sessionId: string, runId: string, reason?: string): Promise<boolean>;
    subscribeToRun(session: AgentSession, runId: string): EventSubscription;
    getRunEvents(session: AgentSession, runId: string, limit?: number): Promise<AgentEvent[]>;
}
export interface RunOptions {
    thinking?: {
        enabled: boolean;
        effort?: 'low' | 'medium' | 'high';
        budgetTokens?: number;
    };
    maxSteps?: number;
    timeout?: number;
    onEvent?: (event: AgentEvent) => void;
    [key: string]: unknown;
}
export interface AgentRuntimePolicy {
    allowedDrivers?: string[];
    allowedConnectors?: Record<string, string[]>;
    maxSessionsPerAgent?: number;
    maxConcurrentRuns?: number;
    defaultTimeoutMs?: number;
    workspace?: {
        allowedPaths?: string[];
        readOnly?: boolean;
    };
}
export interface ExecutionBackend {
    registerDriver(driver: AgentDriver): void;
    getDriver(name: string): AgentDriver | undefined;
    listDrivers(): AgentDriver[];
}
export declare class LocalExecutionBackend implements ExecutionBackend {
    private drivers;
    constructor(options?: {
        drivers?: AgentDriver[];
    });
    registerDriver(driver: AgentDriver): void;
    getDriver(name: string): AgentDriver | undefined;
    listDrivers(): AgentDriver[];
}
export declare class AgentRuntime {
    private backend;
    private events;
    private sessions;
    private runs;
    private policy;
    private agentSpecs;
    constructor(options: {
        backend: ExecutionBackend;
        policy?: AgentRuntimePolicy;
    });
    agent(spec: AgentSpec): RegisteredAgent;
    createSession(agentId: string, options?: {
        metadata?: Record<string, unknown>;
    }): Promise<AgentSession>;
    startRun(sessionId: string, input: string, options?: RunOptions): Promise<{
        runId: string;
        events: AsyncIterable<AgentEvent>;
    }>;
    cancelRun(sessionId: string, runId: string, reason?: string): Promise<boolean>;
    getRunEvents(sessionId: string, runId: string, options?: {
        limit?: number;
    }): Promise<AgentEvent[]>;
    inspect(agentId: string): Promise<{
        capabilities: AgentCapability[];
        limitations: string[];
        modelInfo: unknown;
    }>;
    listAgents(): AgentSpec[];
    listSessions(): AgentSession[];
    getSession(sessionId: string): AgentSession | undefined;
    on(event: string, listener: (...args: any[]) => void): this;
    off(event: string, listener: (...args: any[]) => void): this;
    private _eventStream;
}
export declare class RegisteredAgent {
    private spec;
    private runtime;
    constructor(spec: AgentSpec, runtime: AgentRuntime);
    get id(): string;
    get driver(): string;
    get model(): string;
    createSession(options?: {
        metadata?: Record<string, unknown>;
    }): Promise<AgentSession>;
    run(input: string, options?: RunOptions): Promise<AgentResponse>;
    runStreaming(input: string, options?: RunOptions): Promise<{
        runId: string;
        sessionId: string;
        events: AsyncIterable<AgentEvent>;
    }>;
    inspect(): Promise<{
        capabilities: AgentCapability[];
        limitations: string[];
        modelInfo: unknown;
    }>;
    getSpec(): AgentSpec;
}
export declare class OneRingAIDriver implements AgentDriver {
    readonly name = "oneringai";
    readonly supportedDrivers: string[];
    readonly capabilities: AgentCapability[];
    validate(_spec: AgentSpec): Promise<boolean>;
    inspect(_spec: AgentSpec): Promise<any>;
    createSession(spec: AgentSpec): Promise<AgentSession>;
    startRun(session: AgentSession, input: string, _options?: RunOptions): Promise<AgentRun>;
    cancelRun(_sessionId: string, _runId: string, _reason?: string): Promise<boolean>;
    subscribeToRun(_session: AgentSession, _runId: string): EventSubscription;
    getRunEvents(_session: AgentSession, _runId: string, _limit?: number): Promise<AgentEvent[]>;
}
export declare class CodexSdkDriver implements AgentDriver {
    readonly name = "openai.codex.sdk";
    readonly supportedDrivers: string[];
    readonly capabilities: AgentCapability[];
    validate(_spec: AgentSpec): Promise<boolean>;
    inspect(_spec: AgentSpec): Promise<any>;
    createSession(spec: AgentSpec): Promise<AgentSession>;
    startRun(session: AgentSession, input: string, _options?: RunOptions): Promise<AgentRun>;
    cancelRun(_sessionId: string, _runId: string, _reason?: string): Promise<boolean>;
    subscribeToRun(_session: AgentSession, _runId: string): EventSubscription;
    getRunEvents(_session: AgentSession, _runId: string, _limit?: number): Promise<AgentEvent[]>;
}
export declare function createAgentRuntime(options?: {
    drivers?: AgentDriver[];
    policy?: AgentRuntimePolicy;
}): AgentRuntime;
//# sourceMappingURL=index.d.ts.map