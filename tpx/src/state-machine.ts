import { NodeState } from './types.js';

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
    if (next === undefined || next === null) {
      throw new Error(`Cannot transition from ${this.state} on event '${event}'`);
    }
    this.state = next;
    return this.state;
  }

  isTerminal(): boolean {
    return this.state === 'RESOLVED' || this.state === 'OFFLINE';
  }
}
