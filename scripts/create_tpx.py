import os

base = "C:/Project/esggo/tpx"

files = {}

files["package.json"] = '''{
  "name": "@esggo/tpx",
  "version": "0.1.0",
  "description": "Full-end, full-globe, bidirectional-sync terminal matrix (TPX) in TypeScript",
  "license": "AGPL-3.0",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "files": ["src"],
  "scripts": {
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.5.4",
    "vitest": "^2.1.5"
  },
  "peerDependencies": {
    "@types/node": "^22.0.0"
  }
}
'''

files["tsconfig.json"] = '''{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "types": ["node"]
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
'''

files["src/types.ts"] = '''export type NodeState =
  | 'OFFLINE'
  | 'CONNECTING'
  | 'SYNCING'
  | 'ONLINE'
  | 'CONFLICT'
  | 'RESOLVED';

export interface SyncEvent {
  id: string;
  nodeId: string;
  sourceOrigin: string;
  action: 'created' | 'updated' | 'deleted';
  payload: Record<string, unknown>;
  timestamp: number;
  hash: string;
}

export interface Conflict {
  id: string;
  key: string;
  local: unknown;
  remote: unknown;
  sourceOrigin: string;
  timestamp: number;
}

export interface SyncConfig {
  nodeId: string;
  vectorClockKey: string;
  conflictResolver: (a: unknown, b: unknown, meta: SyncMetadata) => unknown;
  maxRetries: number;
  retryDelay: number;
}

export interface NodeInfo {
  id: string;
  state: NodeState;
  version: number;
  updatedAt: number;
  peers: string[];
}

export interface SyncMetadata {
  from: string;
  to: string;
  type: 'push' | 'pull' | 'full';
  retry?: number;
}
'''

files["src/state-machine.ts"] = '''import { NodeState } from './types.js';

export const NODE_STATES: NodeState[] = [
  'OFFLINE',
  'CONNECTING',
  'SYNCING',
  'ONLINE',
  'CONFLICT',
  'RESOLVED',
];

export const STATE_TRANSITIONS: Record<NodeState, Record<string, NodeState | null>> = {
  OFFLINE: { connect: 'CONNECTING', enqueue: null },
  CONNECTING: { connect: 'SYNCING', stop: 'OFFLINE' },
  SYNCING: { sync: 'ONLINE', conflict: 'CONFLICT', queue: null },
  ONLINE: { sync: 'SYNCING', conflict: 'CONFLICT' },
  CONFLICT: { resolve: 'RESOLVED' },
  RESOLVED: { sync: 'ONLINE' },
};

export class StateMachine {
  state: NodeState;

  constructor(initial: NodeState = 'OFFLINE') {
    this.state = initial;
  }

  transition(event: string): NodeState {
    const next = STATE_TRANSITIONS[this.state]?.[event];
    if (next === null) {
      throw new Error(`Cannot transition from ${this.state} on event '${event}'`);
    }
    this.state = next;
    return this.state;
  }

  isTerminal(): boolean {
    return this.state === 'RESOLVED' || this.state === 'OFFLINE';
  }
}
'''

files["src/sync-engine.ts"] = '''import { SyncEvent, NodeInfo, SyncMetadata } from './types.js';

export class SyncEngine {
  private EVENTS: SyncEvent[] = [];
  private NODES = new Map<string, NodeInfo>();

  recordEvent(event: SyncEvent): void {
    this.EVENTS.push(event);
  }

  getEvents(): SyncEvent[] {
    return [...this.EVENTS];
  }

  registerNode(info: NodeInfo): void {
    this.NODES.set(info.id, info);
  }

  getNode(id: string): NodeInfo | undefined {
    return this.NODES.get(id);
  }

  sync(metadata: SyncMetadata): void {
    // Simplified: push to target, pull from source
    if (metadata.type === 'push' || metadata.type === 'full') {
      // push logic here
    }
    if (metadata.type === 'pull' || metadata.type === 'full') {
      // pull logic here
    }
  }
}
'''

files["src/conflict.ts"] = '''import { Conflict } from './types.js';

export class ConflictResolver {
  resolve(a: unknown, b: unknown, meta: { sourceOrigin: string; timestamp: number }): unknown {
    // default: last-write-wins
    return meta.timestamp >= (0 as unknown as number) ? b : a;
  }
}

export function detectConflict(
  local: unknown,
  remote: unknown,
  meta: { timestamp: number; sourceOrigin: string }
): Conflict | null {
  // Placeholder: always treat as conflict for demo
  return {
    id: crypto.randomUUID(),
    key: 'placeholder-key',
    local,
    remote,
    sourceOrigin: meta.sourceOrigin,
    timestamp: meta.timestamp,
  };
}
'''

files["src/node-registry.ts"] = '''import { NodeInfo } from './types.js';

export class NodeRegistry {
  private nodes = new Map<string, NodeInfo>();

  register(node: NodeInfo): void {
    this.nodes.set(node.id, node);
  }

  unregister(id: string): void {
    this.nodes.delete(id);
  }

  get(id: string): NodeInfo | undefined {
    return this.nodes.get(id);
  }

  list(): NodeInfo[] {
    return Array.from(this.nodes.values());
  }
}
'''

files["src/drivers/index.ts"] = '''export { AgentDriver, AgentSession, AgentRun, AgentEvent } from './driver.js';
export { LocalDriver } from './local-driver.js';
export { WebSocketDriver } from './ws-driver.js';
export { HttpDriver } from './http-driver.js';
'''

files["src/drivers/driver.ts"] = '''import { SyncEvent } from '../types.js';

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
  validate(): boolean;
  createSession(nodeId: string): Promise<AgentSession>;
  startRun(session: AgentSession, input: string): Promise<AgentRun>;
  cancelRun(sessionId: string, runId: string): Promise<boolean>;
}
'''

files["src/drivers/local-driver.ts"] = '''import { AgentDriver, AgentSession, AgentRun, AgentEvent } from './driver.js';

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
'''

files["src/drivers/ws-driver.ts"] = '''import { AgentDriver, AgentSession, AgentRun, AgentEvent } from './driver.js';

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
'''

files["src/drivers/http-driver.ts"] = '''import { AgentDriver, AgentSession, AgentRun, AgentEvent } from './driver.js';

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
'''

files["src/index.ts"] = '''export {
  NodeState,
  SyncEvent,
  Conflict,
  SyncConfig,
  NodeInfo,
  SyncMetadata,
} from './types.js';
export { StateMachine, NODE_STATES } from './state-machine.js';
export { SyncEngine } from './sync-engine.js';
export { ConflictResolver, detectConflict } from './conflict.js';
export { NodeRegistry } from './node-registry.js';
export {
  AgentDriver,
  AgentSession,
  AgentRun,
  AgentEvent,
  LocalDriver,
  WebSocketDriver,
  HttpDriver,
} from './drivers/index.js';
'''

files["tests/state-machine.test.ts"] = '''import { describe, it, expect } from 'vitest';
import { StateMachine } from '../src/state-machine.js';

describe('StateMachine', () => {
  it('transits OFFLINE -> CONNECTING -> SYNCING -> ONLINE', () => {
    const sm = new StateMachine('OFFLINE');
    expect(sm.transition('connect')).toBe('CONNECTING');
    expect(sm.transition('connect')).toBe('SYNCING');
    expect(sm.transition('sync')).toBe('ONLINE');
  });

  it('throws on invalid transition', () => {
    const sm = new StateMachine('OFFLINE');
    expect(() => sm.transition('sync')).toThrow();
  });

  it('conflict resolves to RESOLVED', () => {
    const sm = new StateMachine('ONLINE');
    sm.transition('conflict');
    expect(sm.state).toBe('CONFLICT');
    sm.transition('resolve');
    expect(sm.state).toBe('RESOLVED');
  });
});
'''

for rel, content in files.items():
    path = os.path.join(base, rel)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

print('TPX scaffold created:')
for rel in files:
    print(' -', os.path.join(base, rel))
