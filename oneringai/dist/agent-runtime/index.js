import { EventEmitter } from 'events';
// ============================================================================
// Local Execution Backend
// ============================================================================
export class LocalExecutionBackend {
    drivers = new Map();
    constructor(options) {
        if (options?.drivers) {
            for (const driver of options.drivers) {
                this.registerDriver(driver);
            }
        }
    }
    registerDriver(driver) {
        for (const supported of driver.supportedDrivers) {
            this.drivers.set(supported, driver);
        }
    }
    getDriver(name) {
        return this.drivers.get(name);
    }
    listDrivers() {
        return Array.from(this.drivers.values());
    }
}
// ============================================================================
// Agent Runtime
// ============================================================================
let _sequence = 0;
export class AgentRuntime {
    backend;
    events = new EventEmitter();
    sessions = new Map();
    runs = new Map();
    policy;
    agentSpecs = new Map();
    constructor(options) {
        this.backend = options.backend;
        this.policy = options.policy || {};
    }
    agent(spec) {
        this.agentSpecs.set(spec.id, spec);
        return new RegisteredAgent(spec, this);
    }
    async createSession(agentId, options) {
        const spec = this.agentSpecs.get(agentId);
        if (!spec)
            throw new Error(`Agent spec "${agentId}" not found`);
        const driver = this.backend.getDriver(spec.driver);
        if (!driver) {
            const prefix = spec.driver.split('.')[0];
            const altDriver = this.backend.getDriver(prefix);
            if (!altDriver)
                throw new Error(`Driver "${spec.driver}" not found in backend`);
            Object.assign(driver, { driver: altDriver });
        }
        const session = await driver.createSession(spec);
        session.metadata = options?.metadata || {};
        this.sessions.set(session.id, session);
        this.events.emit('session:created', session);
        return session;
    }
    async startRun(sessionId, input, options) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session "${sessionId}" not found`);
        const driver = this.backend.getDriver(session.spec.driver);
        if (!driver)
            throw new Error(`Driver not found for session`);
        const run = await driver.startRun(session, input, options);
        this.runs.set(run.id, run);
        session.status = 'running';
        this.events.emit('run:started', { sessionId, runId: run.id });
        const events = this._eventStream(session, run, options?.onEvent);
        return { runId: run.id, events };
    }
    async cancelRun(sessionId, runId, reason) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return false;
        const driver = this.backend.getDriver(session.spec.driver);
        if (!driver)
            return false;
        const cancelled = await driver.cancelRun(sessionId, runId, reason);
        if (cancelled) {
            const run = this.runs.get(runId);
            if (run) {
                run.status = 'cancelled';
                run.completedAt = Date.now();
            }
        }
        return cancelled;
    }
    async getRunEvents(sessionId, runId, options) {
        const session = this.sessions.get(sessionId);
        if (!session)
            throw new Error(`Session "${sessionId}" not found`);
        const driver = this.backend.getDriver(session.spec.driver);
        if (!driver)
            throw new Error(`Driver not found`);
        return driver.getRunEvents(session, runId, options?.limit);
    }
    async inspect(agentId) {
        const spec = this.agentSpecs.get(agentId);
        if (!spec)
            throw new Error(`Agent "${agentId}" not found`);
        const driver = this.backend.getDriver(spec.driver);
        if (!driver)
            throw new Error(`Driver "${spec.driver}" not found`);
        return driver.inspect(spec);
    }
    listAgents() { return Array.from(this.agentSpecs.values()); }
    listSessions() { return Array.from(this.sessions.values()); }
    getSession(sessionId) { return this.sessions.get(sessionId); }
    on(event, listener) { this.events.on(event, listener); return this; }
    off(event, listener) { this.events.off(event, listener); return this; }
    async *_eventStream(session, run, onEvent) {
        const driver = this.backend.getDriver(session.spec.driver);
        if (!driver)
            return;
        const subscription = driver.subscribeToRun(session, run.id);
        for (const event of run.events) {
            if (onEvent)
                onEvent(event);
            yield event;
        }
    }
}
// ============================================================================
// Registered Agent
// ============================================================================
export class RegisteredAgent {
    spec;
    runtime;
    constructor(spec, runtime) {
        this.spec = spec;
        this.runtime = runtime;
    }
    get id() { return this.spec.id; }
    get driver() { return this.spec.driver; }
    get model() { return this.spec.model; }
    async createSession(options) {
        return this.runtime.createSession(this.spec.id, options);
    }
    async run(input, options) {
        const session = await this.createSession();
        const { runId, events } = await this.runtime.startRun(session.id, input, options);
        let result;
        for await (const event of events) {
            if (event.type === 'run:completed') {
                result = event.data.result;
            }
        }
        if (!result)
            throw new Error('Run did not complete with a result');
        return result;
    }
    async runStreaming(input, options) {
        const session = await this.createSession();
        return { runId: '', sessionId: session.id, events: (await this.runtime.startRun(session.id, input, options)).events };
    }
    async inspect() {
        return this.runtime.inspect(this.spec.id);
    }
    getSpec() { return this.spec; }
}
// ============================================================================
// OneRingAI Native Driver
// ============================================================================
export class OneRingAIDriver {
    name = 'oneringai';
    supportedDrivers = ['oneringai'];
    capabilities = [
        { id: 'reasoning', name: 'Reasoning', description: 'Step-by-step reasoning', type: 'tool' },
        { id: 'memory', name: 'Memory', description: 'Persistent context', type: 'resource' },
        { id: 'tools', name: 'Custom Tools', description: 'Agent-defined tool execution', type: 'tool' },
    ];
    async validate(_spec) { return true; }
    async inspect(_spec) {
        return { capabilities: this.capabilities, limitations: [], modelInfo: { maxTokens: 16384, contextWindow: 1000000, modality: ['text', 'image'] } };
    }
    async createSession(spec) {
        _sequence++;
        return { id: `sess_${Date.now()}_${_sequence}`, agentId: spec.id, spec, createdAt: Date.now(), status: 'idle', metadata: {} };
    }
    async startRun(session, input, _options) {
        _sequence++;
        const run = {
            id: `run_${Date.now()}_${_sequence}`, sessionId: session.id, agentId: session.agentId,
            input, createdAt: Date.now(), status: 'running', events: [],
        };
        run.status = 'completed';
        run.completedAt = Date.now();
        run.result = { output_text: `Processed: ${input}`, usage: { input_tokens: 10, output_tokens: 10 }, status: 'completed' };
        return run;
    }
    async cancelRun(_sessionId, _runId, _reason) { return true; }
    subscribeToRun(_session, _runId) { return { unsubscribe: () => { } }; }
    async getRunEvents(_session, _runId, _limit) { return []; }
}
// ============================================================================
// Codex SDK Driver (Optional - requires @openai/codex-sdk peer dep)
// ============================================================================
export class CodexSdkDriver {
    name = 'openai.codex.sdk';
    supportedDrivers = ['openai.codex.sdk', 'codex'];
    capabilities = [
        { id: 'code-execution', name: 'Code Execution', description: 'Execute code in sandbox', type: 'tool' },
        { id: 'file-editing', name: 'File Editing', description: 'Read/write/edit files', type: 'permission' },
        { id: 'web-browsing', name: 'Web Browsing', description: 'Browse web pages', type: 'tool' },
        { id: 'git', name: 'Git', description: 'Git operations', type: 'tool' },
    ];
    async validate(_spec) { return true; }
    async inspect(_spec) {
        return { capabilities: this.capabilities, limitations: ['Server container execution not yet implemented'], modelInfo: { maxTokens: 16384, contextWindow: 200000, modality: ['text', 'image'] } };
    }
    async createSession(spec) {
        _sequence++;
        return { id: `sess_${Date.now()}_${_sequence}`, agentId: spec.id, spec, createdAt: Date.now(), status: 'idle', metadata: {} };
    }
    async startRun(session, input, _options) {
        _sequence++;
        return {
            id: `run_${Date.now()}_${_sequence}`, sessionId: session.id, agentId: session.agentId,
            input, createdAt: Date.now(), status: 'running', events: [],
        };
    }
    async cancelRun(_sessionId, _runId, _reason) { return true; }
    subscribeToRun(_session, _runId) { return { unsubscribe: () => { } }; }
    async getRunEvents(_session, _runId, _limit) { return []; }
}
// ============================================================================
// Convenience Factory
// ============================================================================
export function createAgentRuntime(options) {
    const backend = new LocalExecutionBackend({
        drivers: options?.drivers || [new OneRingAIDriver()],
    });
    return new AgentRuntime({ backend, policy: options?.policy });
}
//# sourceMappingURL=index.js.map