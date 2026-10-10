import { AgentDriver, AgentSession, AgentRun, AgentEvent } from './driver.js';

export class LocalDriver implements AgentDriver {
  name = 'local';

  async validate(): Promise<boolean> {
    return true;
  }

  async createSession(nodeId: string): Promise<AgentSession> {
    return { id: 'sess-' + Date.now(), nodeId, createdAt: Date.now() };
  }

  async startRun(session: AgentSession, input: string): Promise<AgentRun> {
    const events: AgentEvent[] = [];

    const push = async function* (): AsyncIterable<AgentEvent> {
      yield { type: 'state-change', data: { state: 'SYNCING' } };
      yield { type: 'sync-success', data: { source: 'local', input } };
    };

    const completed = async function* (): AsyncIterable<AgentEvent> {
      yield { type: 'state-change', data: { state: 'ONLINE' } };
    };

    const result: AgentRun = {
      id: 'run-' + Date.now(),
      sessionId: session.id,
      status: 'completed',
      events: completed(),
    };

    return result;
  }

  cancelRun(sessionId: string, runId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
