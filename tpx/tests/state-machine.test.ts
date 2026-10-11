import { describe, it, expect } from 'vitest';
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
