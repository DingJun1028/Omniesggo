import { Connector as ConnectorImpl } from '../core/connector.js';
import { fiveTGate, apply5TToResponse } from '../core/fiveT-gate.js';
import { getModelInfo, getAdvancedCapabilities, calculateCost } from '../registry/models.js';
import { EventEmitter } from 'events';
// ============================================================================
// Tool Manager
// ============================================================================
export class ToolManager {
    permissions;
    tools = new Map();
    enabled = new Set();
    executionPipeline;
    permissionManager;
    constructor(permissions) {
        this.permissions = permissions;
        this.executionPipeline = new ToolExecutionPipeline();
        this.permissionManager = new PermissionManager(permissions);
    }
    register(tool, options) {
        const id = tool.definition.function.name;
        this.tools.set(id, { ...tool, id, ...options });
        this.enabled.add(id);
    }
    unregister(toolName) {
        this.tools.delete(toolName);
        this.enabled.delete(toolName);
        return true;
    }
    enable(toolName) {
        if (this.tools.has(toolName)) {
            this.enabled.add(toolName);
        }
    }
    disable(toolName) {
        this.enabled.delete(toolName);
    }
    list() {
        return Array.from(this.tools.values());
    }
    listEnabled() {
        return Array.from(this.enabled);
    }
    has(toolName) {
        return this.tools.has(toolName);
    }
    get(toolName) {
        return this.tools.get(toolName);
    }
    selectForContext(options) {
        // Priority-based selection based on mode and task
        const all = this.listEnabled();
        if (options.mode === 'interactive') {
            return all.filter(t => !t.permission || t.permission.scope !== 'high').map(t => t.id);
        }
        return all.map(t => t.id);
    }
    get executionPipelineRef() { return this.executionPipeline; }
    get permissionRef() { return this.permissionManager; }
    async execute(toolName, args) {
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
export class ToolExecutionPipeline {
    plugins = new Map();
    use(plugin) {
        this.plugins.set(plugin.name, plugin);
    }
    remove(pluginName) {
        return this.plugins.delete(pluginName);
    }
    has(pluginName) {
        return this.plugins.has(pluginName);
    }
    list() {
        return Array.from(this.plugins.values()).sort((a, b) => a.priority - b.priority);
    }
    get(pluginName) {
        return this.plugins.get(pluginName);
    }
    async execute(ctx) {
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
        }
        catch (error) {
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
export class LoggingPlugin {
    name = 'logging';
    priority = 100;
    async beforeExecute(ctx) {
        console.log(`[ToolPipeline] Starting ${ctx.toolName}`, { args: ctx.args });
    }
    async afterExecute(ctx, result) {
        const duration = Date.now() - ctx.startTime;
        console.log(`[ToolPipeline] Completed ${ctx.toolName} in ${duration}ms`, { result });
        return result;
    }
    async onError(ctx, error) {
        const duration = Date.now() - ctx.startTime;
        console.error(`[ToolPipeline] Error in ${ctx.toolName} after ${duration}ms`, { error });
        return undefined; // Let error propagate
    }
}
// ============================================================================
// Permission Manager
// ============================================================================
export class PermissionManager {
    config;
    constructor(config) {
        this.config = config;
    }
    async evaluate(ctx) {
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
    basePath;
    constructor(basePath) {
        this.basePath = basePath;
    }
    async load(agentId, sessionId) {
        const filePath = `${this.basePath}/${agentId}/sessions/${sessionId}.json`;
        try {
            const data = await import('fs').then(fs => fs.promises.readFile(filePath, 'utf-8'));
            return JSON.parse(data);
        }
        catch {
            return null;
        }
    }
    async save(agentId, sessionId, data, metadata) {
        const filePath = `${this.basePath}/${agentId}/sessions/${sessionId}.json`;
        await import('fs').then(fs => fs.promises.mkdir(filePath.split('/').slice(0, -1).join('/'), { recursive: true }));
        await import('fs').then(fs => fs.promises.writeFile(filePath, JSON.stringify({ ...data, _meta: metadata }, null, 2), 'utf-8'));
    }
    async delete(agentId, sessionId) {
        const filePath = `${this.basePath}/${agentId}/sessions/${sessionId}.json`;
        try {
            await import('fs').then(fs => fs.promises.unlink(filePath));
            return true;
        }
        catch {
            return false;
        }
    }
    async list(agentId) {
        const dirPath = `${this.basePath}/${agentId}/sessions`;
        try {
            const files = await import('fs').then(fs => fs.promises.readdir(dirPath));
            return files.filter(f => f.endsWith('.json')).map(f => f.replace('.json', ''));
        }
        catch {
            return [];
        }
    }
}
export function createFileContextStorage(basePath) {
    return new FileContextStorage(basePath);
}
// ============================================================================
// Agent Context
// ============================================================================
export class AgentContextNextGen {
    messages = [];
    systemPrompt = '';
    model;
    plugins = new Map();
    toolManager;
    storage;
    features;
    budget;
    constructor(options) {
        this.model = options.model;
        this.systemPrompt = options.systemPrompt || '';
        this.features = options.features || {};
        this.storage = options.storage;
        this.toolManager = new ToolManager();
        this.budget = { totalUsed: 0, available: 100000, utilizationPercent: 0 };
    }
    static create(options) {
        return new AgentContextNextGen(options);
    }
    addSystemMessage(content) {
        this.messages.push({ role: 'system', content });
    }
    addUserMessage(content) {
        this.messages.push({ role: 'user', content });
    }
    addAssistantMessage(content, toolCalls) {
        this.messages.push({ role: 'assistant', content, ...(toolCalls && { tool_calls: toolCalls }) });
    }
    get tools() {
        return this.toolManager;
    }
    get agentId() {
        return this.features.agentId;
    }
    async prepare() {
        // Combine system prompt + messages
        const input = [{ role: 'system', content: this.systemPrompt }, ...this.messages];
        return { input, budget: this.budget, compacted: false };
    }
    getPlugin(name) {
        return this.plugins.get(name);
    }
    registerPlugin(name, plugin) {
        this.plugins.set(name, plugin);
    }
    async save(sessionId, metadata) {
        if (!this.storage)
            return;
        await this.storage.save(this.features.agentId || 'default', sessionId, {
            messages: this.messages,
            systemPrompt: this.systemPrompt,
            pluginStates: Array.from(this.plugins.entries()),
        }, metadata);
    }
    async load(sessionId) {
        if (!this.storage)
            return false;
        const data = await this.storage.load(this.features.agentId || 'default', sessionId);
        if (!data)
            return false;
        const parsed = data;
        this.messages = parsed.messages || [];
        this.systemPrompt = parsed.systemPrompt || '';
        return true;
    }
}
// ============================================================================
// Storage Registry
// ============================================================================
export class StorageRegistry {
    static stores = new Map();
    static context = null;
    static configure(registry) {
        for (const [key, value] of Object.entries(registry)) {
            this.stores.set(key, value);
        }
    }
    static get(key) {
        return this.stores.get(key);
    }
    static set(key, value) {
        this.stores.set(key, value);
    }
    static setContext(context) {
        this.context = context;
    }
    static getContext() {
        return this.context;
    }
}
export class Agent {
    connector;
    model;
    userId;
    identities;
    tools;
    context;
    events;
    _connectorInstance;
    _thinking;
    _temperature;
    _maxOutputTokens;
    _topP;
    _timeout;
    _storageRegistry;
    constructor(options) {
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
            ? ConnectorImpl.get(options.connector)
            : options.connector;
        this.connector = this._connectorInstance;
        // Initialize context
        this.context = AgentContextNextGen.create({
            model: options.model,
            systemPrompt: options.systemPrompt || options.instructions,
            features: options.context?.features || { workingMemory: true },
            agentId: options.context?.agentId,
            storage: options.context?.storage,
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
    static create(options) {
        return new Agent(options);
    }
    static hydrate(sessionId, options) {
        // Reconstruct agent from stored session
        // This would reconstruct from persisted agent definition + session state
        throw new Error('Agent.hydrate() not yet implemented - requires persistent agent definition storage');
    }
    // Event handling
    on(event, listener) {
        this.events.on(event, listener);
        return this;
    }
    off(event, listener) {
        this.events.off(event, listener);
        return this;
    }
    emit(event, ...args) {
        return this.events.emit(event, ...args);
    }
    // Context access
    get storage() {
        return this.context.storage;
    }
    // Add/remove tools (backward compatibility)
    addTool(tool) {
        this.tools.register(tool);
    }
    removeTool(toolName) {
        this.tools.unregister(toolName);
    }
    // Main run method
    async run(input, options) {
        this.emit('execution:start', { input, options });
        // Apply per-call options
        const effectiveOptions = { ...options };
        // Convert input to messages
        const messages = this._normalizeInput(input);
        for (const msg of messages) {
            if (msg.role === 'user') {
                this.context.addUserMessage(msg.content);
            }
        }
        // Process with LLM
        const response = await this._executeLLMCall(effectiveOptions);
        // Apply 5T verification
        const verifiedResponse = apply5TToResponse(response, 'oneringai/agent');
        this.emit('execution:complete', verifiedResponse);
        return verifiedResponse;
    }
    // Direct LLM call (no context management)
    async runDirect(input, options) {
        const response = await this._executeDirectLLMCall(input, options);
        return response;
    }
    // Streaming
    async *stream(input, options) {
        const messages = this._normalizeInput(input);
        for (const msg of messages) {
            if (msg.role === 'user') {
                this.context.addUserMessage(msg.content);
            }
        }
        yield* this._executeStreamingCall(options);
    }
    async *streamDirect(input, options) {
        yield* this._executeDirectStreamingCall(input, options);
    }
    // Advanced capabilities
    getAdvancedCapabilities() {
        return getAdvancedCapabilities(this.model);
    }
    getBatchProvider() {
        const caps = this.getAdvancedCapabilities();
        if (!caps.batch.supported)
            return null;
        return new BatchProvider(this);
    }
    // Suspend/Resume support
    suspend(suspensionData) {
        this.emit('suspended', suspensionData);
    }
    // Async tool support
    hasPendingAsyncTools() {
        // Check for pending async executions
        return false;
    }
    getPendingAsyncTools() {
        return [];
    }
    cancelAsyncTool(toolId) {
        return false;
    }
    cancelAllAsyncTools() { }
    continueWithAsyncResults() {
        return this.run('Processing async results');
    }
    // Cleanup
    destroy() {
        this.emit('destroy');
        this.events.removeAllListeners();
        this.cancelAllAsyncTools();
    }
    // Private methods
    _normalizeInput(input) {
        if (typeof input === 'string') {
            return [{ role: 'user', content: input }];
        }
        if (Array.isArray(input)) {
            return input.map(i => typeof i === 'string' ? { role: 'user', content: i } : i);
        }
        return [input];
    }
    async _executeLLMCall(options) {
        // Simulate LLM call
        const response = {
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
    async _executeDirectLLMCall(input, options) {
        // Direct call without context management
        const response = {
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
    async *_executeStreamingCall(options) {
        yield { type: 'stream_start', data: { model: this.model } };
        yield { type: 'output_text_delta', delta: 'Streaming...' };
        yield { type: 'stream_end', data: {} };
    }
    async *_executeDirectStreamingCall(input, options) {
        yield { type: 'stream_start', data: {} };
        yield { type: 'output_text_delta', delta: 'Direct streaming...' };
        yield { type: 'stream_end', data: {} };
    }
}
// ============================================================================
// Batch Provider
// ============================================================================
class BatchProvider {
    agent;
    constructor(agent) {
        this.agent = agent;
    }
    async submitBatch(items, options) {
        return { id: `batch_${Date.now()}` };
    }
    async getBatch(batchId) {
        return { state: 'in_progress' };
    }
    async getBatchResults(batchId) {
        yield;
        {
            customId: 'item-1', response;
            {
                output_text: 'Result 1';
            }
        }
        ;
    }
}
// ============================================================================
// Exports
// ============================================================================
export { Connector } from '../core/connector.js';
export { fiveTGate, apply5TToResponse } from '../core/fiveT-gate.js';
export { getModelInfo, calculateCost, getProviderCapabilities } from '../registry/models.js';
//# sourceMappingURL=agent.js.map