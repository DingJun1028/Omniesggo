import { describe, expect, it } from 'vitest';
import { deepFreeze } from '../src/deep-freeze';
import { egressLock, hashLockEvent, type LockableEvent } from '../src/egress';
import { ChaosEngine, EntropyLedger, LearningLoop, PrefetchGate } from '../src/evolution';

function mintEvent(partial: Partial<LockableEvent> = {}): LockableEvent {
  return {
    uuid: 'evt-1',
    version: '1.0.0',
    timestamp: 1234567890,
    source_origin: 'test://origin',
    topic: 'esg.ingest',
    payload: { kwh: 1200 },
    ...partial,
  };
}

describe('deepFreeze (R1)', () => {
  it('遞迴凍結 evidence 內層與陣列元素', () => {
    const target: Record<string, unknown> = {
      uuid: 'u',
      evidence: { inner: { deep: true } },
      list: [{ a: 1 }],
    };
    deepFreeze(target);
    expect(Object.isFrozen(target)).toBe(true);
    expect(Object.isFrozen(target['evidence'])).toBe(true);
    expect(Object.isFrozen((target['evidence'] as Record<string, unknown>)['inner'])).toBe(true);
    expect(Object.isFrozen((target['list'] as unknown[])[0])).toBe(true);
  });
});

describe('hashLockEvent / egressLock (R2)', () => {
  it('內容雜湊具決定性且對 payload 敏感', () => {
    const a = hashLockEvent(mintEvent());
    const b = hashLockEvent(mintEvent());
    const c = hashLockEvent(mintEvent({ payload: { kwh: 1201 } }));
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a).toHaveLength(64);
  });

  it('egressLock 刻印 hash_lock 並深凍結事件', () => {
    const event = mintEvent();
    const seal = egressLock(event);
    expect(event.evidence?.['hash_lock']).toBe(seal.hash);
    expect(event.evidence?.['verification_standard']).toBe('ISO-14064-1');
    expect(Object.isFrozen(event)).toBe(true);
    expect(Object.isFrozen(event.evidence)).toBe(true);
  });
});

describe('EntropyLedger (R3)', () => {
  it('計算重複事件率並累計合併批次', () => {
    const ledger = new EntropyLedger(() => ['a', 'b', 'b', 'c']);
    const m1 = ledger.weeklyReduce();
    expect(m1.duplicateEventRate).toBe(0.25);
    expect(m1.technicalDebtIndex).toBe(0.15);
    expect(m1.mergedBatchCount).toBe(1);
    ledger.weeklyReduce();
    expect(ledger.weeklyReduce().mergedBatchCount).toBe(3);
  });

  it('空 journal 不產生 NaN', () => {
    const metrics = new EntropyLedger(() => []).weeklyReduce();
    expect(metrics.duplicateEventRate).toBe(0);
    expect(Number.isNaN(metrics.technicalDebtIndex)).toBe(false);
  });
});

describe('PrefetchGate (R6)', () => {
  it('低於命中率門檻時停用預判', () => {
    const gate = new PrefetchGate(0.6);
    expect(gate.shouldPrefetch()).toBe(true); // 首次允許探測
    for (let i = 0; i < 5; i += 1) gate.record(false);
    expect(gate.shouldPrefetch()).toBe(false); // 0% < 60%
    for (let i = 0; i < 10; i += 1) gate.record(true);
    expect(gate.hitRate()).toBeCloseTo(10 / 15, 5);
    expect(gate.shouldPrefetch()).toBe(true); // 66.7% >= 60%
  });
});

describe('LearningLoop + ChaosEngine (R7)', () => {
  it('未知失敗沉澱模板, 已知失敗復用模板', async () => {
    const learning = new LearningLoop();
    const quarantined: string[] = [];
    const chaos = new ChaosEngine(learning, (sig) => quarantined.push(sig));
    const failProbe = async (): Promise<void> => {
      throw new Error('stale_timestamp');
    };

    const first = await chaos.injectMutation(failProbe, 'sys.chaos_test::stale');
    expect(first).toBe('crystallized');
    expect(learning.templateCount()).toBe(1);
    expect(quarantined).toEqual(['sys.chaos_test::stale']);

    const second = await chaos.injectMutation(failProbe, 'sys.chaos_test::stale');
    expect(second).toBe('learned');

    const third = await chaos.injectMutation(async () => undefined, 'sys.chaos_test::stale');
    expect(third).toBe('passed');
  });
});
