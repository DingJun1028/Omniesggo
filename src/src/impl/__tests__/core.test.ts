import { describe, expect, it, vi, beforeEach } from 'vitest';
import { OmniCoreEcosystem, OmniAgent, OmniAgentGateway, OmniAgentBus, TimeTravelRegistry } from '../core';

function makeCore(c: any): any {
  return { ...c, timestamp: Date.now() };
}

describe('OmniAgent core', () => {
  let ecosystem: OmniCoreEcosystem;

  beforeEach(() => {
    ecosystem = new OmniCoreEcosystem();
  });

  it('clones an OA when backpressure threshold is exceeded for data.clean', async () => {
    const root = new OmniAgent(
      makeCore({ uuid: 'root-1', version: '1.0.0', evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' } })
    );
    (ecosystem as any).agents.set(root.uuid, root);

    for (let i = 0; i < 1001; i++) {
      await ecosystem.bus.publish(
        makeCore({
          uuid: `evt-${i}`,
          version: '1.0.0',
          eventName: 'data.clean',
          payload: { i },
          stage: 'EMERGED',
          source_origin: 'demo',
          topic: 'data.clean',
          evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
          lifecycle_path: [],
        })
      );
    }

    const agents = Array.from((ecosystem as any).agents.values());
    const clones = agents.filter((a: any) => a.uuid !== 'root-1');
    expect(clones.length).toBeGreaterThanOrEqual(1);
  });

  it('does not clone on a non-backpressure topic', async () => {
    const root = new OmniAgent(
      makeCore({ uuid: 'root-2', version: '1.0.0', evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' } })
    );
    (ecosystem as any).agents.set('root-2', root);

    await ecosystem.bus.publish(
      makeCore({
        uuid: 'evt-1',
        version: '1.0.0',
        eventName: 'other.topic',
        payload: {},
        stage: 'EMERGED',
        source_origin: 'demo',
        topic: 'other.topic',
        evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
        lifecycle_path: [],
      })
    );

    const agents = Array.from((ecosystem as any).agents.values());
    expect(agents.map((a: any) => a.uuid)).toEqual(['root-2']);
  });

  it('hand-warms enough synthetic agents to allow deterministic cluster cloning', async () => {
    for (let i = 0; i < 5; i++) {
      const agent = new OmniAgent(
        makeCore({ uuid: `seed-${i}`, version: '1.0.0', evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' } })
      );
      (ecosystem as any).agents.set(agent.uuid, agent);
    }

    for (let i = 0; i < 1001; i++) {
      await ecosystem.bus.publish(
        makeCore({
          uuid: `evt-warm-${i}`,
          version: '1.0.0',
          eventName: 'data.clean',
          payload: { i },
          stage: 'EMERGED',
          source_origin: 'demo',
          topic: 'data.clean',
          evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
          lifecycle_path: [],
        })
      );
    }

    const agents = Array.from((ecosystem as any).agents.values());
    const clones = agents.filter((a: any) => !a.uuid.startsWith('seed-'));
    expect(agents.length).toBeGreaterThanOrEqual(6);
    expect(clones.length).toBeGreaterThanOrEqual(1);
  });

  it('shadowTestIngress publishes a shadow-test event with preserved eventName', async () => {
    const original = makeCore({
      uuid: 'evt-shadow',
      version: '1.0.0',
      eventName: 'user.action',
      payload: { ok: true },
      stage: 'EMERGED',
      source_origin: 'demo',
      topic: 'audit',
      evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
      lifecycle_path: [],
    });

    await (ecosystem.busV2 as any).shadowIngress(original);

    const shadows = (ecosystem.busV2 as any).events.filter((e: any) => e.version === 'shadow-test');
    expect(shadows).toHaveLength(1);
    expect(shadows[0].eventName).toBe('user.action');
    expect(shadows[0].topic).toBe('audit');
    expect(shadows[0].payload).toEqual({ ok: true });
  });
});

describe('OmniAgentGateway ingress/egress', () => {
  function makeGateway() {
    const registry = new TimeTravelRegistry();
    const bus = new OmniAgentBus(registry, null as any);
    return new OmniAgentGateway(bus);
  }

  it('ingress rejects invalid event and publishes sys.martial_law', async () => {
    const gateway = makeGateway();
    const captured: any[] = [];
    (gateway as any).bus.subscribe('system', async (evt: any) => {
      captured.push(evt);
    });

    const invalid = makeCore({
      uuid: 'invalid-1',
      version: '1.0.0',
      eventName: 'bad.ingress',
      payload: {},
      stage: 'EMERGED',
      source_origin: 'tester',
      topic: 'ingress',
      evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
      lifecycle_path: [],
    });

    const out = await gateway.ingress(invalid as any);

    expect(Object.isFrozen(out)).toBe(true);
    const martialEvents = captured.filter((e: any) => e.eventName === 'sys.martial_law');
    expect(martialEvents).toHaveLength(1);
    expect(martialEvents[0].topic).toBe('system');
    expect(martialEvents[0].payload).toBeDefined();
    expect((martialEvents[0].payload as any).reason).toBe('evidence mismatch');
  });

  it('ingress locks a valid event and returns a frozen event with hashLock', async () => {
    const gateway = makeGateway();

    const valid = makeCore({
      uuid: 'valid-1',
      version: '1.0.0',
      eventName: 'good.ingress',
      payload: {},
      stage: 'EMERGED',
      source_origin: 'tester',
      topic: 'ingress',
      evidence: { originCause: 'system_init', processTrace: [], finalEffect: 'initialized',  hash: 'ok'  },
      lifecycle_path: [],
      hashLock: 'lock-1',
    });

    const out = await gateway.ingress(valid as any);

    expect(Object.isFrozen(out)).toBe(true);
    expect(typeof (out as any).hashLock).toBe('string');
    expect((out as any).hashLock).not.toBe('lock-1');
  });

  it('egress rejects invalid event and publishes sys.martial_law', async () => {
    const gateway = makeGateway();
    const captured: any[] = [];
    (gateway as any).bus.subscribe('system', async (evt: any) => {
      captured.push(evt);
    });

    const invalid = makeCore({
      uuid: 'egress-1',
      version: '1.0.0',
      eventName: 'bad.egress',
      payload: {},
      stage: 'EMERGED',
      source_origin: 'tester',
      topic: 'egress',
      evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
      lifecycle_path: [],
    });

    const out = await gateway.egress(invalid as any);
    expect(Object.isFrozen(out)).toBe(true);
    expect(captured.some((e: any) => e.eventName === 'sys.martial_law')).toBe(true);
    expect(captured.find((e: any) => e.eventName === 'sys.martial_law').payload.reason).toBe(
      'egress evidence mismatch'
    );
  });

  it('egress locks a valid event', async () => {
    const gateway = makeGateway();

    const valid = makeCore({
      uuid: 'egress-2',
      version: '1.0.0',
      eventName: 'good.egress',
      payload: {},
      stage: 'EMERGED',
      source_origin: 'tester',
      topic: 'egress',
      evidence: { originCause: 'system_init', processTrace: [], finalEffect: 'initialized',  hash: 'ok'  },
      lifecycle_path: [],
      hashLock: 'lock-2',
    });

    const out = await gateway.egress(valid as any);
    expect(Object.isFrozen(out)).toBe(true);
    expect(typeof (out as any).hashLock).toBe('string');
  });
});

describe('OmniCoreEcosystem modules', () => {
  it('exposes evidence, time, memory, healing, evolution and seed', () => {
    const ecosystem = new OmniCoreEcosystem();
    expect(ecosystem.evidence).toBeDefined();
    expect(ecosystem.time).toBeDefined();
    expect(ecosystem.memory).toBeDefined();
    expect(ecosystem.healing).toBeDefined();
    expect(ecosystem.evolution).toBeDefined();
    expect(ecosystem.seed).toBeDefined();
    expect(ecosystem.api).toBeDefined();
    expect(ecosystem.blackboard).toBeDefined();
  });

  it('records and verifies evidence', () => {
    const ecosystem = new OmniCoreEcosystem();
    const record = ecosystem.evidence.capture({ sourceOrigin: 'tester', payload: { a: 1 } });
    expect(record.status).toBe('pending');
    const ok = ecosystem.evidence.verify(record, { a: 1 });
    expect(ok).toBe(true);
    expect(ecosystem.evidence.getRecords('tester')).toHaveLength(1);
  });

  it('snapshots and rolls back time', () => {
    const ecosystem = new OmniCoreEcosystem();
    const first = ecosystem.time.snapshot('tl1', { step: 1 }, 1000);
    const second = ecosystem.time.snapshot('tl1', { step: 2 }, 2000);
    expect(ecosystem.time.replay('tl1')?.id).toBe(second.id);
    expect(ecosystem.time.rollback('tl1', 1500)?.state).toEqual({ step: 1 });
  });

  it('memorizes and recalls memory', () => {
    const ecosystem = new OmniCoreEcosystem();
    const a = ecosystem.memory.memorize('carbon disclosure', 'doc-a');
    const b = ecosystem.memory.memorize('carbon audit trail', 'doc-b');
    const result = ecosystem.memory.recall('carbon disclosure');
    expect(result.map(x => x.id)).toContain(a.id);
    expect(result.map(x => x.id)).toContain(b.id);
  });

  it('heals from seed vault', async () => {
    const ecosystem = new OmniCoreEcosystem();
    ecosystem.healing.saveSeed('corrupt-1', { kind: 'agent' });
    expect(ecosystem.healing.isUnderMartialLaw()).toBe(false);

    const result = await ecosystem.healing.autoRepair('corrupt-1');
    expect(result.status).toBe('repaired');
    expect((result as any).restoredUuid).toBeTruthy();
  });

  it('records user RAG profile and recalls similar users', () => {
    const ecosystem = new OmniCoreEcosystem();

    ecosystem.userRegistry.recordPreference('u1', 'theme', 'martial-lock');
    ecosystem.userRegistry.recordHabit('u1', 'carbon disclosure', 3);
    ecosystem.userRegistry.recordGrowthEvent('u1', 'report_generate', { reportId: 'r1' });

    ecosystem.userRegistry.recordPreference('u2', 'theme', 'celestial-glow');
    ecosystem.userRegistry.recordHabit('u2', 'carbon disclosure', 5);
    ecosystem.userRegistry.recordGrowthEvent('u2', 'report_generate', { reportId: 'r2' });

    const profile = ecosystem.userRegistry.getUserProfile('u1');
    expect(profile.preferences.map((p: { key: string }) => p.key)).toContain('theme');
    expect(profile.habits.map((h: { behavior: string }) => h.behavior)).toContain('carbon disclosure');
    expect(profile.growthEvents.map((e: { event: string }) => e.event)).toContain('report_generate');

    const similar = ecosystem.userRegistry.recallSimilarUsers('u1', 'carbon');
    expect(similar).toHaveLength(1);
    expect(similar[0].userId).toBe('u2');
  });
});
