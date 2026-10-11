import { SyncEvent } from '../types.js';

export interface AgentSession {
  id: string;
  nodeId: string;
  createdAt: number;
}

export interface AgentRun {
  id: string;
  sessionId: string;
  status: 'running' | 'completed' | 'failed';
  events: AsyncIterable<AgentEvent>;
}

export interface AgentEvent {
  type: 'state-change' | 'sync-event' | 'conflict' | 'sync-success';
  data: unknown;
}

export interface AgentDriver {
  name: string;
  validate(): Promise<boolean>;
  createSession(nodeId: string): Promise<AgentSession>;
  startRun(session: AgentSession, input: string): Promise<AgentRun>;
  cancelRun(sessionId: string, runId: string): Promise<boolean>;
}
