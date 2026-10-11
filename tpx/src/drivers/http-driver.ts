import { AgentDriver, AgentSession, AgentRun, AgentEvent } from './driver.js';

export class HttpDriver implements AgentDriver {
  name = 'http';

  async validate(): Promise<boolean> {
    return true;
  }

  async createSession(nodeId: string): Promise<AgentSession> {
    return { id: 'http-sess-' + Date.now(), nodeId, createdAt: Date.now() };
  }

  async startRun(session: AgentSession, input: string): Promise<AgentRun> {
    return {
      id: 'http-run-' + Date.now(),
      sessionId: session.id,
      status: 'completed',
      events: (async function* (): AsyncIterable<AgentEvent> {
        yield { type: 'sync-event', data: { request: input } };
        yield { type: 'sync-success', data: { method: 'POST' } };
      })(),
    };
  }

  cancelRun(sessionId: string, runId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
