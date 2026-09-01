/**
 * Agent Runtime - Preview
 * 
 * A vendor-neutral layer for running complete, pre-built agent systems through
 * one observable workflow API. Applications can select native OneRingAI agents
 * or OpenAI Codex SDK agents without flattening either system into a text-model
 * provider.
 */
import type { AgentResponse } from '../types/index.js';
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
  validate(spec: AgentSpec): Promise<boolean>;
  inspect(spec: AgentSpec): Promise<{
    capabilities: AgentCapability[];
    limitations: string[];
    modelInfo: { maxTokens?: number; contextWindow?: number; modality?: string[] };
  }>;
  createSession(spec: AgentSpec): Promise<AgentSession>;
  startRun(session: AgentSession, input: string, options?: RunOptions): Promise<AgentRun>;
  cancelRun(sessionId: string, runId: string, reason?: string): Promise<boolean>;
  subscribeToRun(session: AgentSession, runId: string): EventSubscription;
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
  
  constructor(options: { backend: ExecutionBackend; policy?: AgentRuntimePolicy }) {
    this.backend = options.backend;
    this.policy = options.policy || {};
  }
  
  agent(spec: AgentSpec): RegisteredAgent {
    this.agentSpecs.set(spec.id, spec);
    return new RegisteredAgent(spec, this);
  }
  
  async createSession(agentId: string, options?: { metadata?: Record<string, unknown> }): Promise<AgentSession> {
    const spec = this.agentSpecs.get(agentId);
    if (!spec) throw new Error(`Agent spec "${agentId}" not found`);
    
    let driver = this.backend.getDriver(spec.driver);
    if (!driver) {
      const prefix = spec.driver.split('.')[0];
      const altDriver = this.backend.getDriver(prefix);
      if (!altDriver) throw new Error('Driver not found in backend');
      driver = altDriver;
    }
    
    const session = await driver.createSession(spec);
    session.metadata = options?.metadata || {};
    this.sessions.set(session.id, session);
    this.events.emit('session:created', session);
    return session;
  }
  
  async startRun(sessionId: string, input: string, options?: RunOptions): Promise<{ runId: string; events: AsyncIterable<AgentEvent> }> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session "${sessionId}" not found`);
    
    const driver = this.backend.getDriver(session.spec.driver);
    if (!driver) throw new Error(`Driver not found for session`);
    
    const run = await driver.startRun(session, input, options);
    this.runs.set(run.id, run);
    session.status = 'running';
    this.events.emit('run:started', { sessionId, runId: run.id });
    
    const events = this._eventStream(session, run, options?.onEvent);
    return { runId: run.id, events };
  }
  
  async cancelRun(sessionId: string, runId: string, reason?: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    const driver = this.backend.getDriver(session.spec.driver);
    if (!driver) return false;
    
    const cancelled = await driver.cancelRun(sessionId, runId, reason);
    if (cancelled) {
      const run = this.runs.get(runId);
      if (run) { run.status = 'cancelled'; run.completedAt = Date.now(); }
    }
    return cancelled;
  }
  
  async getRunEvents(sessionId: string, runId: string, options?: { limit?: number }): Promise<AgentEvent[]> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error(`Session "${sessionId}" not found`);
    const driver = this.backend.getDriver(session.spec.driver);
    if (!driver) throw new Error(`Driver not found`);
    return driver.getRunEvents(session, runId, options?.limit);
  }
  
  async inspect(agentId: string): Promise<{
    capabilities: AgentCapability[];
    limitations: string[];
    modelInfo: unknown;
  }> {
    const spec = this.agentSpecs.get(agentId);
    if (!spec) throw new Error(`Agent "${agentId}" not found`);
    const driver = this.backend.getDriver(spec.driver);
    if (!driver) throw new Error(`Driver "${spec.driver}" not found`);
    return driver.inspect(spec);
  }
  
  listAgents(): AgentSpec[] { return Array.from(this.agentSpecs.values()); }
  listSessions(): AgentSession[] { return Array.from(this.sessions.values()); }
  getSession(sessionId: string): AgentSession | undefined { return this.sessions.get(sessionId); }
  
  on(event: string, listener: (...args: any[]) => void): this { this.events.on(event, listener); return this; }
  off(event: string, listener: (...args: any[]) => void): this { this.events.off(event, listener); return this; }
  
  private async *_eventStream(session: AgentSession, run: AgentRun, onEvent?: (event: AgentEvent) => void): AsyncIterable<AgentEvent> {
    const driver = this.backend.getDriver(session.spec.driver);
    if (!driver) return;
    const subscription = driver.subscribeToRun(session, run.id);
    for (const event of run.events) {
      if (onEvent) onEvent(event);
      yield event;
    }
  }
}

// ============================================================================
// Registered Agent
// ============================================================================

export class RegisteredAgent {
  constructor(private spec: AgentSpec, private runtime: AgentRuntime) {}
  
  get id(): string { return this.spec.id; }
  get driver(): string { return this.spec.driver; }
  get model(): string { return this.spec.model; }
  
  async createSession(options?: { metadata?: Record<string, unknown> }): Promise<AgentSession> {
    return this.runtime.createSession(this.spec.id, options);
  }
  
  async run(input: string, options?: RunOptions): Promise<AgentResponse> {
    const session = await this.createSession();
    const { runId, events } = await this.runtime.startRun(session.id, input, options);
    let result: AgentResponse | undefined;
    for await (const event of events) {
      if (event.type === 'run:completed') {
        result = (event.data as any).result;
      }
    }
    if (!result) throw new Error('Run did not complete with a result');
    return result;
  }
  
  async runStreaming(input: string, options?: RunOptions): Promise<{ runId: string; sessionId: string; events: AsyncIterable<AgentEvent> }> {
    const session = await this.createSession();
    return { runId: '', sessionId: session.id, events: (await this.runtime.startRun(session.id, input, options)).events };
  }
  
  async inspect(): Promise<{ capabilities: AgentCapability[]; limitations: string[]; modelInfo: unknown }> {
    return this.runtime.inspect(this.spec.id);
  }
  
  getSpec(): AgentSpec { return this.spec; }
}

// ============================================================================
// OneRingAI Native Driver
// ============================================================================

export class OneRingAIDriver implements AgentDriver {
  readonly name = 'oneringai';
  readonly supportedDrivers = ['oneringai'];
  readonly capabilities: AgentCapability[] = [
    { id: 'reasoning', name: 'Reasoning', description: 'Step-by-step reasoning', type: 'tool' },
    { id: 'memory', name: 'Memory', description: 'Persistent context', type: 'resource' },
    { id: 'tools', name: 'Custom Tools', description: 'Agent-defined tool execution', type: 'tool' },
  ];
  
  async validate(_spec: AgentSpec): Promise<boolean> { return true; }
  async inspect(_spec: AgentSpec): Promise<any> {
    return { capabilities: this.capabilities, limitations: [], modelInfo: { maxTokens: 16384, contextWindow: 1000000, modality: ['text', 'image'] } };
  }
  
  async createSession(spec: AgentSpec): Promise<AgentSession> {
    _sequence++;
    return { id: `sess_${Date.now()}_${_sequence}`, agentId: spec.id, spec, createdAt: Date.now(), status: 'idle', metadata: {} };
  }
  
  async startRun(session: AgentSession, input: string, _options?: RunOptions): Promise<AgentRun> {
    _sequence++;
    const run: AgentRun = {
      id: `run_${Date.now()}_${_sequence}`, sessionId: session.id, agentId: session.agentId,
      input, createdAt: Date.now(), status: 'running', events: [],
    };
    run.status = 'completed';
    run.completedAt = Date.now();
    run.result = { output_text: `Processed: ${input}`, usage: { input_tokens: 10, output_tokens: 10 }, status: 'completed' as const };
    return run;
  }
  
  async cancelRun(_sessionId: string, _runId: string, _reason?: string): Promise<boolean> { return true; }
  subscribeToRun(_session: AgentSession, _runId: string): EventSubscription { return { unsubscribe: () => {} }; }
  async getRunEvents(_session: AgentSession, _runId: string, _limit?: number): Promise<AgentEvent[]> { return []; }
}

// ============================================================================
// Codex SDK Driver (Optional - requires @openai/codex-sdk peer dep)
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
  
  async validate(_spec: AgentSpec): Promise<boolean> { return true; }
  async inspect(_spec: AgentSpec): Promise<any> {
    return { capabilities: this.capabilities, limitations: ['Server container execution not yet implemented'], modelInfo: { maxTokens: 16384, contextWindow: 200000, modality: ['text', 'image'] } };
  }
  
  async createSession(spec: AgentSpec): Promise<AgentSession> {
    _sequence++;
    return { id: `sess_${Date.now()}_${_sequence}`, agentId: spec.id, spec, createdAt: Date.now(), status: 'idle', metadata: {} };
  }
  
  async startRun(session: AgentSession, input: string, _options?: RunOptions): Promise<AgentRun> {
    _sequence++;
    return {
      id: `run_${Date.now()}_${_sequence}`, sessionId: session.id, agentId: session.agentId,
      input, createdAt: Date.now(), status: 'running', events: [],
    };
  }
  
  async cancelRun(_sessionId: string, _runId: string, _reason?: string): Promise<boolean> { return true; }
  subscribeToRun(_session: AgentSession, _runId: string): EventSubscription { return { unsubscribe: () => {} }; }
  async getRunEvents(_session: AgentSession, _runId: string, _limit?: number): Promise<AgentEvent[]> { return []; }
}

// ============================================================================
// Convenience Factory
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
