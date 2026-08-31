import { describe, it, expect } from 'vitest';
import {
  FiveTOmniTagGate,
  OmniTagContractViolation,
  FiveTTrackable,
  MemoryArtifactStore,
} from '../five-t-protocol';
import type { OmniTagSet } from '../omnitag-contract';

const compliant: OmniTagSet = {
  agent: 'agent:25',
  squad: '5T驗算',
  lifecycle: 'active',
  priority: 'p2',
  platform: 'esggo',
  bestPractice: '结界',
};

describe('§20.5 FiveTOmniTagGate 接線 (5T 驗算陣列 25-30)', () => {
  it('emitArtifact passes compliant tag and records lifecycle event', () => {
    const r = FiveTOmniTagGate.emitArtifact({
      entityId: 'artifact:001',
      tag: compliant,
    });
    expect(r.contract.valid).toBe(true);
    const life = FiveTTrackable.getLifecycle('artifact:001');
    expect(life.some((e) => e.event === 'omnitag:sealed')).toBe(true);
  });

  it('emitArtifact throws on missing required triad (rule 1)', () => {
    const bad: OmniTagSet = { lifecycle: 'active', priority: 'p2' };
    expect(() =>
      FiveTOmniTagGate.emitArtifact({ entityId: 'x', tag: bad }),
    ).toThrow(OmniTagContractViolation);
  });

  it('mutateArtifact rejects frozen+restricted (rule 2 / H4)', () => {
    const sealed: OmniTagSet = {
      ...compliant,
      lifecycle: 'frozen',
      security: 'restricted',
    };
    expect(() => FiveTOmniTagGate.mutateArtifact('y', sealed)).toThrow(
      OmniTagContractViolation,
    );
  });

  it('mutateArtifact allows mutation on non-sealed tag', () => {
    expect(() =>
      FiveTOmniTagGate.mutateArtifact('z', compliant),
    ).not.toThrow();
  });

  it('violation exposes structured violations list', () => {
    try {
      FiveTOmniTagGate.emitArtifact({
        entityId: 'bad',
        tag: { lifecycle: 'active' } as OmniTagSet,
      });
      expect.unreachable('should have thrown');
    } catch (e) {
      const v = e as OmniTagContractViolation;
      expect(v.check.violations.length).toBeGreaterThan(0);
      expect(v.check.violations.some((x) => x.includes('agent'))).toBe(true);
    }
  });

  it('emitArtifact attaches §20.4 auto-route for each squad', () => {
    const cases: Array<[string, string]> = [
      ['agent:03', 'memory-recall'],
      ['agent:09', 'typescript-contract'],
      ['agent:15', 'auto-deploy'],
      ['agent:21', 'entropy-forge'],
      ['agent:27', 'audit-lock'],
    ];
    for (const [agent, routeKey] of cases) {
      const r = FiveTOmniTagGate.emitArtifact({
        entityId: `art:${agent}`,
        tag: { agent, lifecycle: 'active', priority: 'p2', squad: undefined } as OmniTagSet,
      });
      expect(r.route.target?.routeKey).toBe(routeKey);
      expect(r.route.consistent).toBe(true);
    }
  });

  it('emitArtifact records route-warn when agent/squad mismatch', () => {
    const r = FiveTOmniTagGate.emitArtifact({
      entityId: 'mismatch:01',
      tag: { agent: 'agent:03', squad: '5T驗算', lifecycle: 'active', priority: 'p2' } as OmniTagSet,
    });
    expect(r.route.consistent).toBe(false);
    const life = FiveTTrackable.getLifecycle('mismatch:01');
    expect(life.some((e) => e.event === 'omnitag:route-warn')).toBe(true);
  });

  it('barrier inheritance flag propagates on emit', () => {
    const r = FiveTOmniTagGate.emitArtifact({
      entityId: 'barrier:01',
      tag: { agent: 'agent:25', lifecycle: 'active', priority: 'p2', bestPractice: '结界' } as OmniTagSet,
    });
    expect(r.route.barrierInherited).toBe(true);
  });
});

describe('§20.6 FiveTOmniTagGate 持久化層 (寫入即凍結)', () => {
  it('persistArtifact writes + verifyPersisted confirms integrity', () => {
    const rec = FiveTOmniTagGate.persistArtifact({
      entityId: 'persist:01',
      tag: { agent: 'agent:25', lifecycle: 'active', priority: 'p2', squad: '5T驗算' },
      content: '{"op":"seal"}',
    });
    expect(rec.hashLock).toMatch(/^[0-9a-f]{64}$/);
    expect(rec.sourceOrigin).toBe('agent:agent:25');

    const v = FiveTOmniTagGate.verifyPersisted('persist:01');
    expect(v.exists).toBe(true);
    expect(v.tampered).toBe(false);
  });

  it('getPersisted returns stored record', () => {
    FiveTOmniTagGate.persistArtifact({
      entityId: 'persist:02',
      tag: { agent: 'agent:03', lifecycle: 'draft', priority: 'p1' },
    });
    const got = FiveTOmniTagGate.getPersisted('persist:02');
    expect(got?.tag.agent).toBe('agent:03');
    expect(got?.tag.lifecycle).toBe('draft');
  });

  it('frozen+restricted rejects re-persist (H4 immutable)', () => {
    FiveTOmniTagGate.persistArtifact({
      entityId: 'persist:seal',
      tag: { agent: 'agent:25', lifecycle: 'frozen', security: 'restricted', priority: 'p0' },
    });
    expect(() =>
      FiveTOmniTagGate.persistArtifact({
        entityId: 'persist:seal',
        tag: { agent: 'agent:25', lifecycle: 'frozen', security: 'restricted', priority: 'p0' },
      }),
    ).toThrow(/immutable/);
  });

  it('verifyPersisted detects tampering', () => {
    FiveTOmniTagGate.persistArtifact({
      entityId: 'persist:tamper',
      tag: { agent: 'agent:09', lifecycle: 'active', priority: 'p2' },
      content: 'original',
    });
    // 直接篡改 store 內記錄的 hashLock
    const store = FiveTOmniTagGate.getStore() as any;
    const rec = store._map.get('persist:tamper');
    rec.hashLock = '0'.repeat(64);

    const v = FiveTOmniTagGate.verifyPersisted('persist:tamper');
    expect(v.exists).toBe(true);
    expect(v.tampered).toBe(true);
  });

  it('setStore swaps backend (in-memory default → custom)', () => {
    const custom = new MemoryArtifactStore();
    FiveTOmniTagGate.setStore(custom);
    const rec = FiveTOmniTagGate.persistArtifact({
      entityId: 'persist:custom',
      tag: { agent: 'agent:01', lifecycle: 'active', priority: 'p2' },
    });
    expect(custom.read('persist:custom')?.entityId).toBe('persist:custom');
    expect(FiveTOmniTagGate.getStore()).toBe(custom);
    // 還原預設避免影響其他測試
    FiveTOmniTagGate.setStore(new MemoryArtifactStore());
  });
});
