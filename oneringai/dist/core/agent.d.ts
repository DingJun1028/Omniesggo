/**
 * Core Agent class for OneRingAI unified agent library.
 *
 * Supports composable plugins, context management, tool execution,
 * and multi-provider LLM access through a single interface.
 */
import type { AgentCreateOptions, Connector, ToolFunction, AgentResponse, RunOptions, ContentBlock, Message, ResponseFormat, ProviderCapabilities } from '../types/index.js';
export declare class ToolManager {
    private permissions?;
    private tools;
    private enabled;
    private executionPipeline;
    private permissionManager;
    constructor(permissions?: {
        policies?: any[];
        onApprovalRequired?: (ctx: any) => Promise<any>;
        allowlist?: string[];
        blocklist?: string[];
    } | undefined);
    register(tool: ToolFunction, options?: {
        source?: string;
        tags?: string[];
    }): void;
    unregister(toolName: string): boolean;
    enable(toolName: string): void;
    disable(toolName: string): void;
    list(): (ToolFunction & {
        id: string;
    })[];
    listEnabled(): string[];
    has(toolName: string): boolean;
    get(toolName: string): (ToolFunction & {
        id: string;
    }) | undefined;
    selectForContext(options: {
        mode: string;
        currentTask: string;
    }): string[];
    get executionPipelineRef(): ToolExecutionPipeline;
    get permissionRef(): PermissionManager;
    execute(toolName: string, args: Record<string, unknown>): Promise<unknown>;
}
export interface ToolExecutionPlugin {
    name: string;
    priority: number;
    beforeExecute?(ctx: any): Promise<void>;
    afterExecute?(ctx: any, result: unknown): Promise<unknown>;
    onError?(ctx: any, error: unknown): Promise<unknown | undefined>;
}
export declare class ToolExecutionPipeline {
    private plugins;
    use(plugin: ToolExecutionPlugin): void;
    remove(pluginName: string): boolean;
    has(pluginName: string): boolean;
    list(): ToolExecutionPlugin[];
    get(pluginName: string): ToolExecutionPlugin | undefined;
    execute(ctx: {
        toolName: string;
        args: Record<string, unknown>;
        tool: ToolFunction;
        startTime: number;
        executionId: string;
        metadata?: Map<string, unknown>;
    }): Promise<unknown>;
}
export declare class LoggingPlugin implements ToolExecutionPlugin {
    name: string;
    priority: number;
    beforeExecute(ctx: any): Promise<void>;
    afterExecute(ctx: any, result: unknown): Promise<unknown>;
    onError(ctx: any, error: unknown): Promise<unknown | undefined>;
}
export declare class PermissionManager {
    private config?;
    constructor(config?: {
        policies?: any[];
        onApprovalRequired?: (ctx: any) => Promise<any>;
        allowlist?: string[];
        blocklist?: string[];
    } | undefined);
    evaluate(ctx: {
        toolName: string;
        args: Record<string, unknown>;
        userId?: string;
    }): Promise<{
        verdict: string;
        reason?: string;
        policyName: string;
    }>;
}
export declare class FileContextStorage {
    private basePath;
    constructor(basePath: string);
    load(agentId: string, sessionId: string): Promise<unknown | null>;
    save(agentId: string, sessionId: string, data: unknown, metadata?: Record<string, unknown>): Promise<void>;
    delete(agentId: string, sessionId: string): Promise<boolean>;
    list(agentId: string): Promise<string[]>;
}
export declare function createFileContextStorage(basePath: string): FileContextStorage;
export declare class AgentContextNextGen {
    private messages;
    private systemPrompt;
    private model;
    private plugins;
    private toolManager;
    private storage?;
    private features;
    private budget;
    constructor(options: {
        model: string;
        systemPrompt?: string;
        features?: Record<string, boolean>;
        agentId?: string;
        storage?: FileContextStorage;
    });
    static create(options: {
        model: string;
        systemPrompt?: string;
        features?: Record<string, boolean>;
        agentId?: string;
        storage?: FileContextStorage;
    }): AgentContextNextGen;
    addSystemMessage(content: string): void;
    addUserMessage(content: string | ContentBlock[]): void;
    addAssistantMessage(content: string, toolCalls?: any[]): void;
    get tools(): ToolManager;
    get agentId(): string | undefined;
    prepare(): Promise<{
        input: Message[];
        budget: typeof this.budget;
        compacted: boolean;
        compactionLog?: string[];
    }>;
    getPlugin<T>(name: string): T | undefined;
    registerPlugin(name: string, plugin: any): void;
    save(sessionId: string, metadata?: Record<string, unknown>): Promise<void>;
    load(sessionId: string): Promise<boolean>;
}
export declare class StorageRegistry {
    private static stores;
    private static context;
    static configure(registry: Record<string, unknown>): void;
    static get<T>(key: string): T | undefined;
    static set<T>(key: string, value: T): void;
    static setContext(context: {
        userId?: string;
        tenantId?: string;
        [key: string]: unknown;
    }): void;
    static getContext(): {
        userId?: string;
        tenantId?: string;
    } | null;
}
export type AgentEventType = 'message' | 'tool:call' | 'tool:result' | 'error' | 'completion' | 'async:tool:started' | 'async:tool:complete' | 'async:tool:error' | 'async:tool:timeout' | 'async:continuation:start' | 'execution:start' | 'execution:complete' | 'execution:failed';
export declare class Agent {
    readonly connector: Connector;
    readonly model: string;
    readonly userId?: string;
    readonly identities?: any[];
    readonly tools: ToolManager;
    readonly context: AgentContextNextGen;
    private events;
    private _connectorInstance;
    private _thinking?;
    private _temperature?;
    private _maxOutputTokens?;
    private _topP?;
    private _timeout?;
    private _storageRegistry?;
    private constructor();
    static create(options: AgentCreateOptions): Agent;
    static hydrate(sessionId: string, options?: {
        agentId?: string;
    }): Promise<Agent>;
    on(event: AgentEventType, listener: (...args: any[]) => void): this;
    off(event: AgentEventType, listener: (...args: any[]) => void): this;
    emit(event: AgentEventType, ...args: any[]): boolean;
    get storage(): FileContextStorage | undefined;
    addTool(tool: ToolFunction): void;
    removeTool(toolName: string): void;
    run(input: string | Message | Array<string | Message>, options?: RunOptions): Promise<AgentResponse>;
    runDirect(input: string | Message | Array<string | Message>, options?: RunOptions): Promise<AgentResponse>;
    stream(input: string | Message | Array<string | Message>, options?: RunOptions): AsyncIterable<any>;
    streamDirect(input: string | Message | Array<string | Message>, options?: RunOptions): AsyncIterable<any>;
    getAdvancedCapabilities(): any;
    getBatchProvider(): any | null;
    suspend(suspensionData: {
        correlationId: string;
        metadata: Record<string, unknown>;
    }): void;
    hasPendingAsyncTools(): boolean;
    getPendingAsyncTools(): any[];
    cancelAsyncTool(toolId: string): boolean;
    cancelAllAsyncTools(): void;
    continueWithAsyncResults(): Promise<AgentResponse>;
    destroy(): void;
    private _normalizeInput;
    private _executeLLMCall;
    private _executeDirectLLMCall;
    private _executeStreamingCall;
    private _executeDirectStreamingCall;
}
export { Connector } from '../core/connector.js';
export { fiveTGate, apply5TToResponse, type GateResult } from '../core/fiveT-gate.js';
export { getModelInfo, calculateCost, getProviderCapabilities } from '../registry/models.js';
export type { AgentCreateOptions, AgentResponse, RunOptions, ToolFunction, ContentBlock, Message, ResponseFormat, ProviderCapabilities, AdvancedCapabilities, PermissionPolicy, PermissionContext, PermissionDecision, ApprovalContext, ApprovalResult, PromptCacheOptions, DataHandlingOptions, ContextStorage, };
//# sourceMappingURL=agent.d.ts.map