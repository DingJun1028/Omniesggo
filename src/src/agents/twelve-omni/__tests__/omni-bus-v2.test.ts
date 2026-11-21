import { describe, expect, it, vi } from 'vitest';
import { OmniBusV2 } from '../omni-bus';

describe('OmniBusV2', () => {
  it('publishes an event to a matching subscriber', async () => {
    const bus = new OmniBusV2();
    const captured: any[] = [];
    bus.subscribe('orders', async (evt) => captured.push(evt));

    await bus.publish({
      id: 'evt-1',
      topic: 'orders',
      payload: { id: 1 },
      timestamp: Date.now(),
      headers: {},
      retries: 0,
      source: 'test',
    });

    expect(captured).toHaveLength(1);
    expect(captured[0].topic).toBe('orders');
    expect(captured[0].payload).toEqual({ id: 1 });
  });

  it('does not deliver unmatched topics', async () => {
    const bus = new OmniBusV2();
    const captured: any[] = [];
    bus.subscribe('orders', async (evt) => captured.push(evt));

    await bus.publish({
      id: 'evt-2',
      topic: 'payments',
      payload: { ok: true },
      timestamp: Date.now(),
      headers: {},
      retries: 0,
      source: 'test',
    });

    expect(captured).toHaveLength(0);
  });

  it('records a shadow event via shadowIngress', async () => {
    const bus = new OmniBusV2();
    const original = {
      id: 'evt-shadow',
      topic: 'audit',
      payload: { action: 'login' },
      timestamp: Date.now(),
      headers: {},
      retries: 0,
      source: 'test',
    };

    await bus.shadowIngress(original);

    const shadows = (bus as any).events.filter((e: any) => e.version === 'shadow-test');
    expect(shadows).toHaveLength(1);
    expect(shadows[0].topic).toBe('audit');
    expect(shadows[0].payload).toEqual({ action: 'login' });
  });

  it('tracks publication statistics', async () => {
    const bus = new OmniBusV2();
    await bus.publish({
      id: 'evt-a',
      topic: 'orders',
      payload: {},
      timestamp: Date.now(),
      headers: {},
      retries: 0,
      source: 'test',
    });

    const stats = await bus.statistics();
    expect(stats.totalPublished).toBeGreaterThanOrEqual(1);
  });
});
