import { AgentDriver, AgentSession, AgentRun, AgentEvent } from './driver.js';

export class WebSocketDriver implements AgentDriver {
  name = 'websocket';

  ws?: WebSocket;

  async validate(): Promise<boolean> {
    // client-side only
    return typeof WebSocket !== 'undefined';
  }

  async createSession(nodeId: string): Promise<AgentSession> {
    return { id: 'ws-sess-' + Date.now(), nodeId, createdAt: Date.now() };
  }

  async startRun(session: AgentSession, input: string): Promise<AgentRun> {
    return {
      id: 'ws-run-' + Date.now(),
      sessionId: session.id,
      status: 'completed',
      events: (async function* (): AsyncIterable<AgentEvent> {
        yield { type: 'sync-event', data: { message: input } };
        yield { type: 'sync-success', data: { id: 'ws' } };
      })(),
    };
  }

  cancelRun(sessionId: string, runId: string): Promise<boolean> {
    return Promise.resolve(true);
  }
}
