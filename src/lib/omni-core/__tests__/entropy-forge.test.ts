import { describe, it, expect, beforeEach } from 'vitest';
import { EntropyForge, type ITraceEvent } from '../entropy-forge';

describe('EntropyForge G6 OmniBrain', () => {
  beforeEach(() => {
    EntropyForge.traceEvents.length = 0;
    EntropyForge.traceCounter = 0;
  });

  it('purify 移除零寬／控制字符且保留原有可見文本（向下相容）', () => {
    const input = 'a\u200Bb\u200Bc\u200B';
    expect(EntropyForge.purify(input)).toBe('abc');
    expect(EntropyForge.purify('  x \t\n')).toBe('  x \t\n');
  });

  it('seal 產出帶 hash_lock 的凍結物件（Trustworthy）', () => {
    const { sealed, event } = EntropyForge.seal({ a: 1, b: [1, 2] });
    expect(sealed).toBeInstanceOf(Object);
    expect(Object.isFrozen(sealed)).toBe(true);
    const h = ((sealed as Record<string, unknown>) as { hash_lock: string })
      .hash_lock;
    expect(typeof h).toBe('string');
    expect(h.length).toBe(64);
    expect(event.trace_id).toMatch(/^oid_\d+_[0-9a-f]{8}$/);
    expect(event.source_origin).toBe('omni-core');
    expect(event.op).toBe('seal');
    expect(event.frozen).toBe(true);
  });

  it('applyHashLock 沿用 hash_lock 並補上 source_origin / trace_id（Trackable）', () => {
    const obj = { a: 1 };
    const locked = EntropyForge.applyHashLock(obj, 'agent-9');
    const rec = EntropyForge.traceEvents[0];
    expect(locked).toBe(obj);
    expect(rec?.source_origin).toBe('agent-9');
    expect(rec?.op).toBe('hash_lock');
    expect(Object.isFrozen(obj)).toBe(true);
    const l = locked as Record<string, unknown>;
    expect(l.trace_id).toMatch(/^oid_\d+_[0-9a-f]{8}$/);
  });

  it('verifyHashLock 確認 hash_lock 與當前序列化值一致（Transparent 零幻覺）', () => {
    const { sealed } = EntropyForge.seal({ value: 42 });
    const locked = sealed as unknown as Record<string, unknown>;
    const verified = EntropyForge.verifyHashLock(locked);
    expect(verified.ok).toBe(true);
    expect(verified.hash_lock).toBe(locked.hash_lock);
    // 刻意改值後 hash 應不一致（深拷貝後修改，避免凍結物件無法異動）
    const tampered = EntropyForge.verifyHashLock({ ...locked, value: 99 });
    expect(tampered.ok).toBe(false);
    expect(tampered.reason).toBe('hash mismatch');
  });

  it('trace / getTraceEvents 記錄完整事件軌跡（Traceable）', () => {
    EntropyForge.seal({ op: 'a' });
    EntropyForge.feedback('perf', 'agent-9', { ms: 12 });
    const events = EntropyForge.getTraceEvents();
    expect(events).toHaveLength(2);
    expect(events[0].source_origin).toBe('omni-core');
    expect(events[1].source_origin).toBe('agent-9');
  });

  it('feedback 產出帶 hash_lock 的可見化事件（Tangible），只讀不可改', () => {
    const event = EntropyForge.feedback(
      'quality-gate',
      'agent-9',
      { verdict: 'pass', idx: 3 }
    );
    expect(event.op).toBe('feedback');
    expect(typeof event.hash_lock).toBe('string');
    expect(Object.isFrozen(event)).toBe(true);
    // 不可變合約：不應修改凍結事件
    expect(() => {
      (event as unknown as Record<string, unknown>).payload = undefined as never;
    }).toThrow();
  });
});
