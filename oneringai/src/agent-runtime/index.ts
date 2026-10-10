/**
 * Agent Runtime - Preview
 * 
 * A vendor-neutral layer for running complete, pre-built agent systems through
 * one observable workflow API. Applications can select native OneRingAI agents
 * or OpenAI Codex SDK agents without flattening either system into a text-model
 * provider.
 */
import type { Vendor, ToolFunction, AgentResponse } from '../types/index.js';
import { EventEmitter } from 'events';

// ============================================================================
// Agent Specification
// ============================================================================

export interface AgentSpec {
  id: string;
  driver: string;
  connector: string;
  model: string;
  thinking?: { enabled: boolean; effort?: 'low' | 'medium' | 'high'; budgetTokens?: number };
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

// ============================================================================
// Agent Session & Run
// ============================================================================

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

// ============================================================================
// Events
// ============================================================================

export type AgentEventType =
  | 'session:created'
  | 'session:started'
  | 'session:completed'
  | 'session:failed'
  | 'run:started'
  | 'run:completed'
  | 'run:failed'
  | 'message'
  | 'tool:call'
  | 'tool:result'
  | 'reasoning'
  | 'command:output'
  | 'file:activity'
  | 'usage'
  | 'error'
  | 'warning'
  | 'cancelled'
  | 'recovered';

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

// ============================================================================
// Driver Interface
// ============================================================================

export interface AgentDriver {
  readonly name: string;
  readonly supportedDrivers: string[];
  readonly capabilities: AgentCapability[];
  
  /**
   * Validate that this driver can handle the given spec
   */
  validate(spec: AgentSpec): Promise<boolean>;
  
  /**
   * Inspect available capabilities for a spec
   */
  inspect(spec: AgentSpec): Promise<{
    capabilities: AgentCapability[];
    limitations: string[];
    modelInfo: {
      maxTokens?: number;
      contextWindow?: number;
      modality?: string[];
    };
  }>;
  
  /**
   * Create a session
   */
  createSession(spec: AgentSpec): Promise<AgentSession>;
  
  /**
   * Start a run within a session
   */
  startRun(session: AgentSession, input: string, options?: RunOptions): Promise<AgentRun>;
  
  /**
   * Cancel a running agent
   */
  cancelRun(sessionId: string, runId: string, reason?: string): Promise<boolean>;
  
  /**
   * Subscribe to events from a run
   */
  subscribeToRun(session: AgentSession, runId: string): EventSubscription;
  
  /**
   * Get all events for a run (for replay)
   */
  getRunEvents(session: AgentSession, runId: string, limit?: number): Promise<AgentEvent[]>;
}

export interface RunOptions {
  thinking?: { enabled: boolean; effort?: 'low' | 'medium' | 'high'; budgetTokens?: number };
  maxSteps?: number;
  timeout?: number;
  onEvent?: (event: AgentEvent) => void;
  [key: string]: unknown;
}

// ============================================================================
// Policy
// ============================================================================

export interface AgentRuntimePolicy {
  /**
   * Allowed drivers (fail-closed)
   */
  allowedDrivers?: string[];
  
  /**
   * Allowed connectors per driver
   */
  allowedConnectors?: Record<string, string[]>;
  
  /**
   * Maximum concurrent sessions per agent
   */
  maxSessionsPerAgent?: number;
  
  /**
   * Maximum concurrent runs
   */
  maxConcurrentRuns?: number;
  
  /**
   * Default timeout for runs (ms)
   */
  defaultTimeoutMs?: number;
  
  /**
   * Workspace restrictions
   */
  workspace?: {
    allowedPaths?: string[];
    readOnly?: boolean;
  };
}

// ============================================================================
// Execution Backend
// ============================================================================

export interface ExecutionBackend {
  registerDriver(driver: AgentDriver): void;
  getDriver(name: string): AgentDriver | undefined;
  listDrivers(): AgentDriver[];
}

// ============================================================================
// Local Execution Backend
// ============================================================================

export class LocalExecutionBackend implements ExecutionBackend {
  private drivers: Map<string, AgentDriver> = new Map();
  
  constructor(options?: { drivers?: AgentDriver[] }) {
    if (options?.drivers) {
      for (const driver of options.drivers) {
        this.registerDriver(driver);
      }
    }
  }
  
  registerDriver(driver: AgentDriver): void {
    for (const supported of driver.supportedDrivers) {
      this.drivers.set(supported, driver);
    }
  }
  
  getDriver(name: string): AgentDriver | undefined {
    return this.drivers.get(name);
  }
  
  listDrivers(): AgentDriver[] {
    return Array.from(this.drivers.values());
  }
}

// ============================================================================
// Agent Runtime
// ============================================================================

let _sequence = 0;

export class AgentRuntime {
  private backend: ExecutionBackend;
  private events: EventEmitter = new EventEmitter();
  private sessions: Map<string, AgentSession> = new Map();
  private runs: Map<string, AgentRun> = new Map();
  private policy: AgentRuntimePolicy;
  private agentSpecs: Map<string, AgentSpec> = new Map();
  
  constructor(options: {
    backend: ExecutionBackend;
    policy?: AgentRuntimePolicy;
  }) {
    this.backend = options.backend;
    this.policy = options.policy || {};
    
    // Apply policy restrictions
    if (this.policy.allowedDrivers) {
      // Filter registered drivers
    }
  }
  
  /**
   * Register an agent specification
   */
  agent(spec: AgentSpec): RegisteredAgent {
    this.agentSpecs.set(spec.id, spec);
    
    const runtime = this;
    return new RegisteredAgent(spec, runtime);
  }
  
  /**
   * Create a session for an agent
   */
  async createSession(agentId: string, options?: { metadata?: Record<string, unknown> }): Promise<AgentSession> {
    const spec = this.agentSpecs.get(agentId);
    if (!spec) {
      throw new Error(`Agent spec "${agentId}" not found`);
    }
    
    // Check policy
    if (this.policy.allowedDrivers) {
      const driverName = spec.driver.replace(/(.*?)\..*/, '$1');
      if (!this.policy.allowedDrivers.includes(driverName)) {
        throw new Error(`Driver "${driverName}" not allowed by policy`);
      }
    }
    
    const driver = this.backend.getDriver(spec.driver);
    if (!driver) {
      // Try exact match first, then prefix match
      const prefix = spec.driver.split('.')[0];
      const altDriver = this.backend.getDriver(prefix);
      if (!altDriver) {
        throw new Error(`Driver "${spec.driver}" not found in backend`);
      }
      Object.assign(driver, { driver: altDriver });
    }
    
    const session = await driver!.createSession(spec);
    session.metadata = options?.metadata || {};
    
    this.sessions.set(session.id, session);
    this.events.emit('session:created', session);
    
    return session;
  }
  
  /**
   * Start a run
   */
  async startRun(sessionId: string, input: string, options?: RunOptions): Promise<{ runId: string; events: AsyncIterable<AgentEvent> }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" not found`);
    }
    
    const driver = this.backend.getDriver(session.spec.driver);
    if (!driver) {
      throw new Error(`Driver not found for session`);
    }
    
    // Check concurrent run limits
    if (this.policy.maxConcurrentRuns) {
      const activeRuns = Array.from(this.runs.values()).filter(r => r.status === 'running').length;
      if (activeRuns >= this.policy.maxConcurrentRuns) {
        throw new Error('Maximum concurrent runs exceeded');
      }
    }
    
    // Set default timeout
    const timeout = options?.timeout || this.policy.defaultTimeoutMs || 3600000;
    
    const run = await driver.startRun(session, input, {
      ...options,
      timeout: Math.min(options?.timeout || timeout, timeout),
    });
    
    this.runs.set(run.id, run);
    session.status = 'running';
    this.events.emit('run:started', { sessionId, runId: run.id });
    
    // Return events stream
    const events = this._eventStream(session, run, options?.onEvent);
    
    return { runId: run.id, events };
  }
  
  /**
   * Cancel a run
   */
  async cancelRun(sessionId: string, runId: string, reason?: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    const driver = this.backend.getDriver(session.spec.driver);
    if (!driver) return false;
    
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
  
  /**
   * Get all events for a run (replay)
   */
  async getRunEvents(sessionId: string, runId: string, options?: { limit?: number; since?: number }): Promise<AgentEvent[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session "${sessionId}" not found`);
    }
    
    const driver = this.backend.getDriver(session.spec.driver);
    if (!driver) {
      throw new Error(`Driver not found`);
    }
    
    return driver.getRunEvents(session, runId, options?.limit);
  }
  
  /**
   * Inspect an agent
   */
  async inspect(agentId: string): Promise<{
    spec: AgentSpec;
    capabilities: AgentCapability[];
    limitations: string[];
    modelInfo: unknown;
  }> {
    const spec = this.agentSpecs.get(agentId);
    if (!spec) {
      throw new Error(`Agent "${agentId}" not found`);
    }
    
    const driver = this.backend.getDriver(spec.driver);
    if (!driver) {
      throw new Error(`Driver "${spec.driver}" not found`);
    }
    
    return driver.inspect(spec);
  }
  
  /**
   * List all registered agents
   */
  listAgents(): AgentSpec[] {
    return Array.from(this.agentSpecs.values());
  }
  
  /**
   * List all sessions
   */
  listSessions(): AgentSession[] {
    return Array.from(this.sessions.values());
  }
  
  /**
   * Get a session
   */
  getSession(sessionId: string): AgentSession | undefined {
    return this.sessions.get(sessionId);
  }
  
  /**
   * Event subscription
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
   * Internal event stream generator
   */
  private async *_eventStream(
    session: AgentSession,
    run: AgentRun,
    onEvent?: (event: AgentEvent) => void
  ): AsyncIterable<AgentEvent> {
    const driver = this.backend.getDriver(session.spec.driver);
    if (!driver) return;
    
    const subscription = driver.subscribeToRun(session, run.id);
    
    // Re-emit events from the run's event log
    for (const event of run.events) {
      if (onEvent) onEvent(event);
      yield event;
    }
    
    // Subscribe to new events
    const cleanup = (event: AgentEvent) => {
      if (onEvent) onEvent(event);
    };
    
    // The actual event streaming would be connected to the driver's event source
    // For now, we yield existing events and complete
  }
}

// ============================================================================
// Registered Agent
// ============================================================================

export class RegisteredAgent {
  constructor(
    private spec: AgentSpec,
    private runtime: AgentRuntime
  ) {}
  
  get id(): string { return this.spec.id; }
  get driver(): string { return this.spec.driver; }
  get model(): string { return this.spec.model; }
  
  async createSession(options?: { metadata?: Record<string, unknown> }): Promise<AgentSession> {
    return this.runtime.createSession(this.spec.id, options);
  }
  
  async run(input: string, options?: RunOptions): Promise<AgentResponse> {
    const session = await this.createSession();
    const { runId, events } = await this.runtime.startRun(session.id, input, options);
    
    // Consume events until run completes
    let result: AgentResponse | undefined;
    for await (const event of events) {
      if (event.type === 'run:completed') {
        const data = event.data as { result?: AgentResponse };
        result = data.result;
      }
    }
    
    if (!result) {
      throw new Error('Run did not complete with a result');
    }
    
    return result;
  }
  
  async runStreaming(input: string, options?: RunOptions): Promise<{
    runId: string;
    sessionId: string;
    events: AsyncIterable<AgentEvent>;
  }> {
    const session = await this.createSession();
    return {
      runId: '',
      sessionId: session.id,
      events: (await this.runtime.startRun(session.id, input, options)).events,
    };
  }
  
  async inspect(): Promise<{
    capabilities: AgentCapability[];
    limitations: string[];
    modelInfo: unknown;
  }> {
    return this.runtime.inspect(this.spec.id);
  }
  
  getSpec(): AgentSpec {
    return this.spec;
  }
}

// ============================================================================
// Codex SDK Driver (Optional)
// ============================================================================

export class CodexSdkDriver implements AgentDriver {
  readonly name = 'openai.codex.sdk';
  readonly supportedDrivers = ['openai.codex.sdk', 'codex'];
  readonly capabilities: AgentCapability[] = [
    { id: 'code-execution', name: 'Code Execution', description: 'Execute code in sandbox', type: 'tool' },
    { id: 'file-editing', name: 'File Editing', description: 'Read/write/edit files', type: 'permission' },
    { id: 'web-browsing', name: 'Web Browsing', description: 'Browse web pages', type: 'tool' },
    { id: 'git', name: 'Git', description: 'Git operations', type: 'tool' },
  ];
  
  async validate(spec: AgentSpec): Promise<boolean> {
    // Check that required environment variables are set
    return true;
  }
  
  async inspect(spec: AgentSpec): Promise<{
    capabilities: AgentCapability[];
    limitations: string[];
    modelInfo: { maxTokens?: number; contextWindow?: number; modality?: string[] };
  }> {
    return {
      capabilities: this.capabilities,
      limitations: ['Server container execution not yet implemented'],
      modelInfo: { maxTokens: 16384, contextWindow: 200000, modality: ['text', 'image'] },
    };
  }
  
  async createSession(spec: AgentSpec): Promise<AgentSession> {
    _sequence++;
    return {
      id: `sess_${Date.now()}_${_sequence}`,
      agentId: spec.id,
      spec,
      createdAt: Date.now(),
      status: 'idle',
      metadata: {},
    };
  }
  
  async startRun(session: AgentSession, input: string, options?: RunOptions): Promise<AgentRun> {
    _sequence++;
    return {
      id: `run_${Date.now()}_${_sequence}`,
      sessionId: session.id,
      agentId: session.agentId,
      input,
      createdAt: Date.now(),
      status: 'running',
      events: [],
    };
  }
  
  async cancelRun(sessionId: string, runId: string, reason?: string): Promise<boolean> {
    // In a real implementation, this would cancel the Codex agent process
    return true;
  }
  
  subscribeToRun(session: AgentSession, runId: string): EventSubscription {
    return { unsubscribe: () => {} };
  }
  
  async getRunEvents(session: AgentSession, runId: string, limit?: number): Promise<AgentEvent[]> {
    return [];
  }
}

// ============================================================================
// OneRingAI Native Driver
// ============================================================================

export class OneRingAIDriver implements AgentDriver {
  readonly name = 'oneringai';
  readonly supportedDrivers = ['oneringai'];
  readonly capabilities: AgentCapability[] = [
    { id: 'reasoning', name: 'Reasoning', description: 'Step-by-step reasoning with think blocks', type: 'tool' },
    { id: 'memory', name: 'Memory', description: 'Persistent context across sessions', type: 'resource' },
    { id: 'tools', name: 'Custom Tools', description: 'Agent-defined tool execution', type: 'tool' },
  ];
  
  async validate(spec: AgentSpec): Promise<boolean> {
    return true;
  }
  
  async inspect(spec: AgentSpec): Promise<{
    capabilities: AgentCapability[];
    limitations: string[];
    modelInfo: { maxTokens?: number; contextWindow?: number; modality?: string[] };
  }> {
    const modelInfo = spec.model ? { maxTokens: 16384, contextWindow: 1000000, modality: ['text', 'image', 'audio'] } : {};
    return {
      capabilities: this.capabilities,
      limitations: [],
      modelInfo,
    };
  }
  
  async createSession(spec: AgentSpec): Promise<AgentSession> {
    _sequence++;
    return {
      id: `sess_${Date.now()}_${_sequence}`,
      agentId: spec.id,
      spec,
      createdAt: Date.now(),
      status: 'idle',
      metadata: {},
    };
  }
  
  async startRun(session: AgentSession, input: string, options?: RunOptions): Promise<AgentRun> {
    _sequence++;
    const run: AgentRun = {
      id: `run_${Date.now()}_${_sequence}`,
      sessionId: session.id,
      agentId: session.agentId,
      input,
      createdAt: Date.now(),
      status: 'running',
      events: [],
    };
    
    // In a real implementation, this would start the agent loop
    // For now, simulate completion
    run.status = 'completed';
    run.completedAt = Date.now();
    run.result = {
      output_text: `Processed: ${input}`,
      usage: { input_tokens: 10, output_tokens: 10 },
      status: 'completed' as const,
    };
    
    return run;
  }
  
  async cancelRun(sessionId: string, runId: string, reason?: string): Promise<boolean> {
    return true;
  }
  
  subscribeToRun(session: AgentSession, runId: string): EventSubscription {
    return { unsubscribe: () => {} };
  }
  
  async getRunEvents(session: AgentSession, runId: string, limit?: number): Promise<AgentEvent[]> {
    return [];
  }
}

// ============================================================================
// Convenience: Create runtime with default drivers
// ============================================================================

export function createAgentRuntime(options?: {
  drivers?: AgentDriver[];
  policy?: AgentRuntimePolicy;
}): AgentRuntime {
  const backend = new LocalExecutionBackend({
    drivers: options?.drivers || [new OneRingAIDriver()],
  });
  
  return new AgentRuntime({ backend, policy: options?.policy });
}
