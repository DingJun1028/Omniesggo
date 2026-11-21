import { describe, it, expect } from 'vitest';
import {
  IncrementalOutputOptimizer,
  verifyFiveTGate,
  type DeltaOp,
} from '../index';

describe('§15.5 Incremental Output Optimization', () => {
  const optimizer = new IncrementalOutputOptimizer();

  it('applies line-level delta without full rewrite', () => {
    const base = ['line1', 'line2', 'line3'].join('\n');
    const ops: DeltaOp[] = [
      { line: 2, type: 'replace', content: 'line2-updated', sourceOrigin: 'soul.md§15.5' },
    ];
    const out = optimizer.applyDelta(base, ops);
    expect(out).toBe(['line1', 'line2-updated', 'line3'].join('\n'));
  });

  it('inserts and deletes correctly', () => {
    const base = ['a', 'b', 'c'].join('\n');
    const ops: DeltaOp[] = [
      { line: 2, type: 'insert', content: 'NEW', sourceOrigin: 'test' },
      { line: 3, type: 'delete', content: '', sourceOrigin: 'test' },
    ];
    const out = optimizer.applyDelta(base, ops);
    // insert@line2 在 'b' 前插 NEW, delete@line3 移除 'c' -> a, NEW, b
    expect(out).toBe(['a', 'NEW', 'b'].join('\n'));
  });

  it('seals artifact with Hash Lock + Object.freeze (Trustworthy)', () => {
    const ops: DeltaOp[] = [
      { line: 1, type: 'replace', content: 'x', sourceOrigin: 'soul.md' },
    ];
    const art = optimizer.seal(ops, 'v1', 'Trustworthy', 'soul.md§15.5');
    expect(Object.isFrozen(art)).toBe(true);
    expect(Object.isFrozen(art.ops)).toBe(true);
    expect(art.hashLock).toMatch(/^[0-9a-f]{64}$/); // §18 SHA-256 64-hex
    expect(art.sourceOrigin).toBe('soul.md§15.5');
  });

  it('passes 5T verification gate', () => {
    const ops: DeltaOp[] = [
      { line: 1, type: 'insert', content: 'y', sourceOrigin: 'soul.md' },
    ];
    const art = optimizer.seal(ops, 'v1', 'Traceable', 'soul.md§15.5');
    expect(() => verifyFiveTGate(art)).not.toThrow();
  });

  it('emits Trackable lifecycle hooks', () => {
    const o = new IncrementalOutputOptimizer();
    o.applyDelta('a\nb', [{ line: 1, type: 'replace', content: 'z', sourceOrigin: 't' }]);
    o.seal([{ line: 1, type: 'insert', content: 'z', sourceOrigin: 't' }], 'v1', 'Trackable', 'src');
    const life = o.getLifecycle();
    expect(life.length).toBeGreaterThanOrEqual(4);
    expect(life.map((l) => l.event)).toContain('seal:end');
  });
});
