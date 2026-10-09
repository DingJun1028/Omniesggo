/**
 * Core Agent class for OneRingAI unified agent library.
 * 
 * Supports composable plugins, context management, tool execution,
 * and multi-provider LLM access through a single interface.
 */
import type {
  AgentCreateOptions,
  ToolFunction,
  AgentResponse,
  UsageInfo,
  RunOptions,
  ContentBlock,
  Message,
  ResponseFormat,
  ProviderCapabilities,
} from '../types/index.js';
import { Connector } from '../core/connector.js';
import { fiveTGate, apply5TToResponse, type GateResult } from '../core/fiveT-gate.js';
import { getModelInfo, getAdvancedCapabilities, calculateCost } from '../registry/models.js';
import { EventEmitter } from 'events';

// ============================================================================
// Tool Manager
// ============================================================================

export class ToolManager {
  private tools: Map<string, ToolFunction & { id: string; source?: string; tags?: string[] }> = new Map();
  private enabled: Set<string> = new Set();
  private executionPipeline: ToolExecutionPipeline;
  private permissionManager: PermissionManager;
  
  constructor(private permissions?: {
    policies?: any[];
    onApprovalRequired?: (ctx: any) => Promise<any>;
    allowlist?: string[];
    blocklist?: string[];
  }) {
    this.executionPipeline = new ToolExecutionPipeline();
    this.permissionManager = new PermissionManager(permissions);
  }
  
  register(tool: ToolFunction, options?: { source?: string; tags?: string[] }): void {
    const id = tool.definition.function.name;
    this.tools.set(id, { ...tool, id, ...options });
    this.enabled.add(id);
  }
  
  unregister(toolName: string): boolean {
    this.tools.delete(toolName);
    this.enabled.delete(toolName);
    return true;
  }
  
  enable(toolName: string): void {
    if (this.tools.has(toolName)) {
      this.enabled.add(toolName);
    }
  }
  
  disable(toolName: string): void {
    this.enabled.delete(toolName);
  }
  
  list(): (ToolFunction & { id: string })[] {
    return Array.from(this.tools.values());
  }
  
  listEnabled(): string[] {
    return Array.from(this.enabled);
  }
  
  has(toolName: string): boolean {
    return this.tools.has(toolName);
  }
  
  get(toolName: string): (ToolFunction & { id: string }) | undefined {
    return this.tools.get(toolName);
  }
  
  selectForContext(options: { mode: string; currentTask: string }): string[] {
    // Priority-based selection based on mode and task
    const all = this.listEnabled();
    if (options.mode === 'interactive') {
      return all.filter(t => {
        const tool = this.tools.get(t);
        return !tool?.permission || tool.permission.riskLevel !== 'high';
      });
    }
    return all;
  }
  
  get executionPipelineRef() { return this.executionPipeline; }
  get permissionRef() { return this.permissionManager; }
  
  async execute(toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" not found`);
    }
    
    // Check permissions
    const decision = await this.permissionManager.evaluate({
      toolName,
      args,
      userId: this.permissions?.onApprovalRequired ? undefined : undefined,
    });
    
    if (decision.verdict === 'deny') {
      throw new Error(`Tool "${toolName}" denied by policy: ${decision.reason}`);
    }
    
    if (decision.verdict === 'approval') {
      throw new Error(`Tool "${toolName}" requires approval`);
    }
    
    // Execute through pipeline
    return this.executionPipeline.execute({
      toolName,
      args,
      tool,
      startTime: Date.now(),
      executionId: `exec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    });
  }
}

// ============================================================================
// Tool Execution Pipeline
// ============================================================================

export interface ToolExecutionPlugin {
  name: string;
  priority: number;
  beforeExecute?(ctx: any): Promise<void>;
  afterExecute?(ctx: any, result: unknown): Promise<unknown>;
  onError?(ctx: any, error: unknown): Promise<unknown | undefined>;
}

export class ToolExecutionPipeline {
  private plugins: Map<string, ToolExecutionPlugin> = new Map();
  
  use(plugin: ToolExecutionPlugin): void {
    this.plugins.set(plugin.name, plugin);
  }
  
  remove(pluginName: string): boolean {
    return this.plugins.delete(pluginName);
  }
  
  has(pluginName: string): boolean {
    return this.plugins.has(pluginName);
  }
  
  list(): ToolExecutionPlugin[] {
    return Array.from(this.plugins.values()).sort((a, b) => a.priority - b.priority);
  }
  
  get(pluginName: string): ToolExecutionPlugin | undefined {
    return this.plugins.get(pluginName);
  }
  
  async execute(ctx: {
    toolName: string;
    args: Record<string, unknown>;
    tool: ToolFunction;
    startTime: number;
    executionId: string;
    metadata?: Map<string, unknown>;
  }): Promise<unknown> {
    const sorted = this.list();
    
    // Before hooks (high to low priority)
    try {
      for (const plugin of sorted) {
        if (plugin.beforeExecute) {
          await plugin.beforeExecute(ctx);
        }
      }
      
      // Execute the actual tool
      const result = await ctx.tool.execute(ctx.args);
      
      // After hooks (low to high priority - reverse)
      let finalResult = result;
      for (const plugin of [...sorted].reverse()) {
        if (plugin.afterExecute) {
          finalResult = await plugin.afterExecute(ctx, finalResult);
        }
      }
      
      return finalResult;
    } catch (error) {
      // Error hooks
      for (const plugin of [...sorted].reverse()) {
        if (plugin.onError) {
          const recovered = await plugin.onError(ctx, error);
          if (recovered !== undefined) {
            return recovered;
          }
        }
      }
      throw error;
    }
  }
}

// ============================================================================
// Logging Plugin
// ============================================================================

export class LoggingPlugin implements ToolExecutionPlugin {
  name = 'logging';
  priority = 100;
  
  async beforeExecute(ctx: any): Promise<void> {
    console.log(`[ToolPipeline] Starting ${ctx.toolName}`, { args: ctx.args });
  }
  
  async afterExecute(ctx: any, result: unknown): Promise<unknown> {
    const duration = Date.now() - ctx.startTime;
    console.log(`[ToolPipeline] Completed ${ctx.toolName} in ${duration}ms`, { result });
    return result;
  }
  
  async onError(ctx: any, error: unknown): Promise<unknown | undefined> {
    const duration = Date.now() - ctx.startTime;
    console.error(`[ToolPipeline] Error in ${ctx.toolName} after ${duration}ms`, { error });
    return undefined; // Let error propagate
  }
}

// ============================================================================
// Permission Manager
// ============================================================================

export class PermissionManager {
  constructor(private config?: {
    policies?: any[];
    onApprovalRequired?: (ctx: any) => Promise<any>;
    allowlist?: string[];
    blocklist?: string[];
  }) {}
  
  async evaluate(ctx: {
    toolName: string;
    args: Record<string, unknown>;
    userId?: string;
  }): Promise<{ verdict: string; reason?: string; policyName: string }> {
    // Default allowlist
    const DEFAULT_ALLOWLIST = [
      'read_file', 'write_file', 'edit_file', 'glob', 'grep', 'list_directory',
      'store_get', 'store_set', 'store_list', 'store_delete', 'store_action',
      'memory_recall', 'memory_search', 'memory_graph', 'memory_find_entity',
      'memory_list_facts', 'memory_search_documents',
    ];
    
    const blocklist = this.config?.blocklist || [];
    if (blocklist.includes(ctx.toolName)) {
      return { verdict: 'deny', reason: 'Blocked by blocklist', policyName: 'blocklist' };
    }
    
    // Check custom policies first
    if (this.config?.policies) {
      for (const policy of this.config.policies) {
        const decision = policy.evaluate(ctx);
        if (decision.verdict === 'deny') {
          return { verdict: 'deny', reason: decision.reason, policyName: policy.name };
        }
        if (decision.verdict === 'allow') {
          return { verdict: 'allow', policyName: policy.name };
        }
      }
    }
    
    // Check allowlist
    const allowlist = [...DEFAULT_ALLOWLIST, ...(this.config?.allowlist || [])];
    if (allowlist.includes(ctx.toolName)) {
      return { verdict: 'allow', policyName: 'allowlist' };
    }
    
    // Check if tool allows always
    // This would require access to the tool definition
    
    // Require approval by default
    return { verdict: 'approval', reason: 'Tool requires approval', policyName: 'default' };
  }
}

// ============================================================================
// Context Storage
// ============================================================================

export class FileContextStorage {
  private basePath: string;
  
  constructor(basePath: string) {
    this.basePath = basePath;
  }
  
  async load(agentId: string, sessionId: string): Promise<unknown | null> {
    const filePath = `${this.basePath}/${agentId}/sessions/${sessionId}.json`;
    try {
      const data = await import('fs').then(fs => fs.promises.readFile(filePath, 'utf-8'));
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
  
  async save(agentId: string, sessionId: string, data: unknown, metadata?: Record<string, unknown>): Promise<void> {
    const filePath = `${this.basePath}/${agentId}/sessions/${sessionId}.json`;
    await import('fs').then(fs => fs.promises.mkdir(filePath.split('/').slice(0, -1).join('/'), { recursive: true }));
    await import('fs').then(fs => fs.promises.writeFile(filePath, JSON.stringify({ ...data as Record<string, unknown>, _meta: metadata }, null, 2), 'utf-8'));
  }
  
  async delete(agentId: string, sessionId: string): Promise<boolean> {
    const filePath = `${this.basePath}/${agentId}/sessions/${sessionId}.json`;
    try {
      await import('fs').then(fs => fs.promises.unlink(filePath));
      return true;
    } catch {
      return false;
    }
  }
  
  async list(agentId: string): Promise<string[]> {
    const dirPath = `${this.basePath}/${agentId}/sessions`;
    try {
      const files = await import('fs').then(fs => fs.promises.readdir(dirPath));
      return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
    } catch {
      return [];
    }
  }
}

export function createFileContextStorage(basePath: string): FileContextStorage {
  return new FileContextStorage(basePath);
}

// ============================================================================
// Agent Context
// ============================================================================

export class AgentContextNextGen {
  private messages: Message[] = [];
  private systemPrompt: string = '';
  private model: string;
  private plugins: Map<string, any> = new Map();
  private toolManager: ToolManager;
  private _storage?: FileContextStorage;
  private features: Record<string, boolean>;
  private agentIdVal?: string;
  private budget: { totalUsed: number; available: number; utilizationPercent: number };
  
  getBudget(): typeof this.budget {
    return this.budget;
  }

  constructor(options: {
    model: string;
    systemPrompt?: string;
    features?: Record<string, boolean>;
    agentId?: string;
    storage?: FileContextStorage;
  }) {
    this.model = options.model;
    this.systemPrompt = options.systemPrompt || '';
    this.features = options.features || {};
    this.agentIdVal = options.agentId;
    this._storage = options.storage;
    this.toolManager = new ToolManager();
    this.budget = { totalUsed: 0, available: 100000, utilizationPercent: 0 };
  }
  
  static create(options: {
    model: string;
    systemPrompt?: string;
    features?: Record<string, boolean>;
    agentId?: string;
    storage?: FileContextStorage;
  }): AgentContextNextGen {
    return new AgentContextNextGen(options);
  }
  
  addSystemMessage(content: string): void {
    this.messages.push({ role: 'system', content });
  }
  
  addUserMessage(content: string | ContentBlock[]): void {
    this.messages.push({ role: 'user', content });
  }
  
  addAssistantMessage(content: string, toolCalls?: any[]): void {
    this.messages.push({ role: 'assistant', content, ...(toolCalls && { tool_calls: toolCalls }) } as any);
  }
  
  get tools(): ToolManager {
    return this.toolManager;
  }
  
  get agentId(): string | undefined {
    return this.agentIdVal;
  }
  
  get storage(): FileContextStorage | undefined {
    return this._storage;
  }
  
  async prepare(): Promise<{ input: Message[]; budget: { totalUsed: number; available: number; utilizationPercent: number }; compacted: boolean; compactionLog?: string[] }> {
    // Combine system prompt + messages
    const input = [{ role: 'system', content: this.systemPrompt } as Message, ...this.messages];
    return { input, budget: this.budget, compacted: false };
  }
  
  getPlugin<T>(name: string): T | undefined {
    return this.plugins.get(name) as T;
  }
  
  registerPlugin(name: string, plugin: any): void {
    this.plugins.set(name, plugin);
  }
  
  async save(sessionId: string, metadata?: Record<string, unknown>): Promise<void> {
    if (!this._storage) return;
    await this._storage.save(this.agentIdVal || 'default', sessionId, {
      messages: this.messages,
      systemPrompt: this.systemPrompt,
      pluginStates: Array.from(this.plugins.entries()),
    }, metadata);
  }
  
  async load(sessionId: string): Promise<boolean> {
    if (!this._storage) return false;
    const data = await this._storage.load(this.agentIdVal || 'default', sessionId);
    if (!data) return false;
    const parsed = data as { messages: Message[]; systemPrompt?: string };
    this.messages = parsed.messages || [];
    this.systemPrompt = parsed.systemPrompt || '';
    return true;
  }
}

// ============================================================================
// Storage Registry
// ============================================================================

export class StorageRegistry {
  private static stores: Map<string, unknown> = new Map();
  private static context: { userId?: string; tenantId?: string } | null = null;
  
  static configure(registry: Record<string, unknown>): void {
    for (const [key, value] of Object.entries(registry)) {
      this.stores.set(key, value);
    }
  }
  
  static get<T>(key: string): T | undefined {
    return this.stores.get(key) as T;
  }
  
  static set<T>(key: string, value: T): void {
    this.stores.set(key, value);
  }
  
  static setContext(context: { userId?: string; tenantId?: string; [key: string]: unknown }): void {
    this.context = context;
  }
  
  static getContext(): { userId?: string; tenantId?: string } | null {
    return this.context;
  }
}

// ============================================================================
// Agent Class
// ============================================================================

export type AgentEventType =
  | 'message'
  | 'tool:call'
  | 'tool:result'
  | 'error'
  | 'completion'
  | 'async:tool:started'
  | 'async:tool:complete'
  | 'async:tool:error'
  | 'async:tool:timeout'
  | 'async:continuation:start'
  | 'execution:start'
  | 'execution:complete'
  | 'execution:failed'
  | 'suspended'
  | 'destroy';

export class Agent {
  public readonly connector: Connector;
  public readonly model: string;
  public readonly userId?: string;
  public readonly identities?: any[];
  public readonly tools: ToolManager;
  public readonly context: AgentContextNextGen;
  private events: EventEmitter;
  private _connectorInstance: any;
  private _thinking?: any;
  private _temperature?: number;
  private _maxOutputTokens?: number;
  private _topP?: number;
  private _timeout?: number;
  private _storageRegistry?: any;
  
  private constructor(options: AgentCreateOptions) {
    this.model = options.model;
    this.userId = options.userId;
    this.identities = options.identities;
    this._thinking = options.thinking;
    this._temperature = options.temperature;
    this._maxOutputTokens = options.maxOutputTokens;
    this._topP = options.topP;
    this._timeout = options.timeout;
    this._storageRegistry = options.storageRegistry;
    
    this.events = new EventEmitter();
    this._connectorInstance = typeof options.connector === 'string' 
      ? Connector.get(options.connector) 
      : options.connector;
    this.connector = this._connectorInstance;
    
    // Initialize context
    this.context = AgentContextNextGen.create({
      model: options.model,
      systemPrompt: options.systemPrompt || options.instructions,
      features: options.context?.features as Record<string, boolean> || { workingMemory: true },
      agentId: options.context?.agentId,
      storage: options.context?.storage as any,
    });
    
    // Initialize tool manager
    this.tools = new ToolManager(options.permissions);
    
    // Register initial tools
    if (options.tools) {
      for (const tool of options.tools) {
        this.tools.register(tool);
      }
    }
    
    // Apply permissions
    if (options.permissions?.allowlist) {
      // Use custom allowlist
    }
  }
  
  static create(options: AgentCreateOptions): Agent {
    return new Agent(options);
  }
  
  static hydrate(sessionId: string, options?: { agentId?: string }): Promise<Agent> {
    // Reconstruct agent from stored session
    // This would reconstruct from persisted agent definition + session state
    throw new Error('Agent.hydrate() not yet implemented - requires persistent agent definition storage');
  }
  
  // Event handling
  on(event: AgentEventType, listener: (...args: any[]) => void): this {
    this.events.on(event, listener);
    return this;
  }
  
  off(event: AgentEventType, listener: (...args: any[]) => void): this {
    this.events.off(event, listener);
    return this;
  }
  
  emit(event: AgentEventType, ...args: any[]): boolean {
    return this.events.emit(event, ...args);
  }
  
  // Context access
  get storage(): FileContextStorage | undefined {
    return this.context.storage;
  }
  
  // Add/remove tools (backward compatibility)
  addTool(tool: ToolFunction): void {
    this.tools.register(tool);
  }
  
  removeTool(toolName: string): void {
    this.tools.unregister(toolName);
  }
  
  // Main run method
  async run(input: string | Message | Array<string | Message>, options?: RunOptions): Promise<AgentResponse> {
    this.emit('execution:start', { input, options });
    
    // Apply per-call options
    const effectiveOptions = { ...options };
    
    // Convert input to messages
    const messages = this._normalizeInput(input);
    for (const msg of messages) {
      if (msg.role === 'user') {
        this.context.addUserMessage(msg.content as string);
      }
    }
    
    // Process with LLM
    const response = await this._executeLLMCall(effectiveOptions);
    
    // Apply 5T verification
    const verifiedResponse = apply5TToResponse(response, 'oneringai/agent');
    
    this.emit('execution:complete', verifiedResponse);
    return verifiedResponse as unknown as AgentResponse;
  }
  
  // Direct LLM call (no context management)
  async runDirect(input: string | Message | (string | Message)[], options?: RunOptions): Promise<AgentResponse> {
    const response = await this._executeDirectLLMCall(input, options);
    return response;
  }
  
  // Streaming
  async *stream(input: string | Message | (string | Message)[], options?: RunOptions): AsyncIterable<any> {
    const messages = this._normalizeInput(input);
    for (const msg of messages) {
      if (msg.role === 'user') {
        this.context.addUserMessage(msg.content as string);
      }
    }
    
    yield* this._executeStreamingCall(options);
  }
  
  async *streamDirect(input: string | Message | (string | Message)[], options?: RunOptions): AsyncIterable<any> {
    yield* this._executeDirectStreamingCall(input, options);
  }
  
  // Advanced capabilities
  getAdvancedCapabilities(): any {
    return getAdvancedCapabilities(this.model);
  }
  
  getBatchProvider(): any | null {
    const caps = this.getAdvancedCapabilities();
    if (!caps.batch.supported) return null;
    return new BatchProvider(this);
  }
  
  // Suspend/Resume support
  suspend(suspensionData: { correlationId: string; metadata: Record<string, unknown> }): void {
    this.emit('suspended', suspensionData);
  }
  
  // Async tool support
  hasPendingAsyncTools(): boolean {
    // Check for pending async executions
    return false;
  }
  
  getPendingAsyncTools(): any[] {
    return [];
  }
  
  cancelAsyncTool(toolId: string): boolean {
    return false;
  }
  
  cancelAllAsyncTools(): void {}
  
  continueWithAsyncResults(): Promise<AgentResponse> {
    return this.run('Processing async results');
  }
  
  // Cleanup
  destroy(): void {
    this.emit('destroy');
    this.events.removeAllListeners();
    this.cancelAllAsyncTools();
  }
  
  // Private methods
  private _normalizeInput(input: string | Message | (string | Message)[]): Message[] {
    if (typeof input === 'string') {
      return [{ role: 'user', content: input }];
    }
    if (Array.isArray(input)) {
      return input.map(i => typeof i === 'string' ? { role: 'user', content: i } : i);
    }
    return [input];
  }
  
  private async _executeLLMCall(options: RunOptions): Promise<AgentResponse> {
    // Simulate LLM call
    const response: AgentResponse = {
      output_text: '[Agent Response]',
      output_parsed: undefined,
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        processing_mode: 'interactive',
      },
      status: 'completed',
    };
    
    return response;
  }
  
  private async _executeDirectLLMCall(input: string | Message | Message[], options?: RunOptions): Promise<AgentResponse> {
    // Direct call without context management
    const response: AgentResponse = {
      output_text: '[Direct Response]',
      output_parsed: undefined,
      usage: {
        input_tokens: 50,
        output_tokens: 25,
        processing_mode: 'interactive',
      },
      status: 'completed',
    };
    
    return response;
  }
  
  private async *_executeStreamingCall(options?: RunOptions): AsyncIterable<any> {
    yield { type: 'stream_start', data: { model: this.model } };
    yield { type: 'output_text_delta', delta: 'Streaming...' };
    yield { type: 'stream_end', data: {} };
  }
  
  private async *_executeDirectStreamingCall(input: string | Message | Message[], options?: RunOptions): AsyncIterable<any> {
    yield { type: 'stream_start', data: {} };
    yield { type: 'output_text_delta', delta: 'Direct streaming...' };
    yield { type: 'stream_end', data: {} };
  }
}

// ============================================================================
// Batch Provider
// ============================================================================

class BatchProvider {
  constructor(private agent: Agent) {}
  
  async submitBatch(items: any[], options?: any): Promise<{ id: string }> {
    return { id: `batch_${Date.now()}` };
  }
  
  async getBatch(batchId: string): Promise<{ state: string }> {
    return { state: 'in_progress' };
  }
  
  async *getBatchResults(batchId: string): AsyncIterable<any> {
    yield { customId: 'item-1', response: { output_text: 'Result 1' } };
  }
}

// ============================================================================
// Exports
// ============================================================================

export { Connector } from '../core/connector.js';
export { fiveTGate, apply5TToResponse, type GateResult } from '../core/fiveT-gate.js';
export { getModelInfo, calculateCost, getProviderCapabilities } from '../registry/models.js';
export type {
  AgentCreateOptions,
  AgentResponse,
  RunOptions,
  ToolFunction,
  ContentBlock,
  Message,
  ResponseFormat,
  ProviderCapabilities,
  AdvancedCapabilities,
  PermissionPolicy,
  PermissionContext,
  PermissionDecision,
  ApprovalContext,
  ApprovalResult,
  PromptCacheOptions,
  DataHandlingOptions,
  ContextStorage,
};
