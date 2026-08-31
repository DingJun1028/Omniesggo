import { describe, it, expect } from 'vitest';
import {
  validateRequiredTriad,
  enforceFrozenLock,
  isBarrierInherited,
  squadOfAgent,
  routeOmniTag,
  generateHashLock,
  emitArtifact,
  OmniTagContractViolation,
  OmniTagRegistry,
} from './omnitag.js';

describe('§20.4/§20.5 OmniTag 契約閘 (oa-cli 自包含版)', () => {
  it('validateRequiredTriad passes compliant tag', () => {
    const r = validateRequiredTriad({ agent: 'agent:25', lifecycle: 'active', priority: 'p2' });
    expect(r.valid).toBe(true);
  });

  it('validateRequiredTriad fails on missing triad', () => {
    const r = validateRequiredTriad({ lifecycle: 'active' });
    expect(r.valid).toBe(false);
    expect(r.violations.some((v: string) => v.includes('agent'))).toBe(true);
  });

  it('enforceFrozenLock rejects frozen+restricted mutation', () => {
    const tag = { agent: 'agent:25', lifecycle: 'frozen' as const, security: 'restricted' as const, priority: 'p2' as const };
    expect(enforceFrozenLock(tag, true).valid).toBe(false);
    expect(enforceFrozenLock(tag, false).valid).toBe(true);
  });

  it('squadOfAgent maps 01-30 to five arrays', () => {
    expect(squadOfAgent('agent:03')).toBe('智庫聖所');
    expect(squadOfAgent('agent:09')).toBe('符文契約');
    expect(squadOfAgent('agent:15')).toBe('光之羽翼');
    expect(squadOfAgent('agent:21')).toBe('煉金熵減');
    expect(squadOfAgent('agent:27')).toBe('5T驗算');
  });

  it('routeOmniTag returns route + barrier flag', () => {
    const r = routeOmniTag({ agent: 'agent:25', squad: '5T驗算', bestPractice: '结界' });
    expect(r.target?.routeKey).toBe('audit-lock');
    expect(r.barrierInherited).toBe(true);
    expect(r.consistent).toBe(true);
  });

  it('generateHashLock is deterministic + matches TS FiveTHashLock algorithm', async () => {
    // 與 src/lib/five-t-protocol.ts FiveTHashLock.generate 同構: sha256(source|content|ts)
    const h1 = generateHashLock('agent:25', 'hello', 1760000000000);
    const h2 = generateHashLock('agent:25', 'hello', 1760000000000);
    expect(h1).toBe(h2);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    // 手算驗證同構
    const { createHash } = await import('crypto');
    const expected = createHash('sha256').update('agent:25|hello|1760000000000').digest('hex');
    expect(h1).toBe(expected);
  });

  it('emitArtifact seals compliant tag with hash', () => {
    const r = emitArtifact({
      entityId: 'x1',
      tag: { agent: 'agent:25', lifecycle: 'active', priority: 'p2', squad: '5T驗算' },
      content: '{"op":"seal"}',
    });
    expect(r.contract.valid).toBe(true);
    expect(r.hashLock).toMatch(/^[0-9a-f]{64}$/);
    expect(r.route.target?.routeKey).toBe('audit-lock');
  });

  it('emitArtifact throws on missing triad (rule 1)', () => {
    expect(() =>
      emitArtifact({ entityId: 'x2', tag: { lifecycle: 'active' } }),
    ).toThrow(OmniTagContractViolation);
  });
});

describe('§20.6 OmniTag 契約持久化層 (寫入即凍結)', () => {
  it('persistArtifact writes + verifyArtifact confirms integrity', () => {
    const reg = new OmniTagRegistry({ inMemory: true });
    const rec = reg.persistArtifact({
      entityId: 'art:01',
      tag: { agent: 'agent:25', lifecycle: 'active', priority: 'p2', squad: '5T驗算' },
      content: '{"op":"seal"}',
    });
    expect(rec.hashLock).toMatch(/^[0-9a-f]{64}$/);
    // sourceOrigin 即 agent 標籤本身 (agent:25)，不重複前綴 (修正雙重 agent: 畸形值)
    expect(rec.sourceOrigin).toBe('agent:25');

    const v = reg.verifyArtifact('art:01');
    expect(v.exists).toBe(true);
    expect(v.tampered).toBe(false);
  });

  it('getArtifact returns persisted record', () => {
    const reg = new OmniTagRegistry({ inMemory: true });
    reg.persistArtifact({
      entityId: 'art:02',
      tag: { agent: 'agent:03', lifecycle: 'draft', priority: 'p1' },
    });
    const got = reg.getArtifact('art:02');
    expect(got?.tag.agent).toBe('agent:03');
    expect(got?.tag.lifecycle).toBe('draft');
  });

  it('frozen+restricted entity rejects re-persist (H4 immutable)', () => {
    const reg = new OmniTagRegistry({ inMemory: true });
    reg.persistArtifact({
      entityId: 'art:seal',
      tag: { agent: 'agent:25', lifecycle: 'frozen', security: 'restricted', priority: 'p0' },
    });
    expect(() =>
      reg.persistArtifact({
        entityId: 'art:seal',
        tag: { agent: 'agent:25', lifecycle: 'frozen', security: 'restricted', priority: 'p0' },
      }),
    ).toThrow(/immutable/);
  });

  it('verifyArtifact detects tampering', () => {
    const reg = new OmniTagRegistry({ inMemory: true });
    reg.persistArtifact({
      entityId: 'art:tamper',
      tag: { agent: 'agent:09', lifecycle: 'active', priority: 'p2' },
      content: 'original',
    });
    // 模擬篡改：直接改 _mem 中記錄的 hashLock
    const lines = (reg as any)._mem as string[];
    const rec = JSON.parse(lines[0]);
    rec.hashLock = '0'.repeat(64);
    lines[0] = JSON.stringify(rec);

    const v = reg.verifyArtifact('art:tamper');
    expect(v.exists).toBe(true);
    expect(v.tampered).toBe(true);
  });

  it('listArtifacts enumerates all', () => {
    const reg = new OmniTagRegistry({ inMemory: true });
    reg.persistArtifact({ entityId: 'a', tag: { agent: 'agent:01', lifecycle: 'active', priority: 'p2' } });
    reg.persistArtifact({ entityId: 'b', tag: { agent: 'agent:02', lifecycle: 'active', priority: 'p2' } });
    expect(reg.listArtifacts().length).toBe(2);
  });
});
