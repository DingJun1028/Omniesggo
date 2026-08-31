import { describe, it, expect } from 'vitest';
import {
  validateRequiredTriad,
  enforceFrozenLock,
  isBarrierInherited,
  validateEntropyReduction,
  auditContractRate,
  verifyOmniTagContract,
  type OmniTagSet,
} from '../omnitag-contract';

const compliantTag: OmniTagSet = {
  agent: 'agent:25',
  squad: '5T驗算',
  security: 'internal',
  lifecycle: 'active',
  priority: 'p2',
  platform: 'esggo',
  bestPractice: '结界',
};

describe('§20.5 OmniTag Contract Validator', () => {
  it('rule 1: required triad passes when all three present', () => {
    const r = validateRequiredTriad(compliantTag);
    expect(r.valid).toBe(true);
    expect(r.violations).toHaveLength(0);
  });

  it('rule 1: required triad fails when agent missing', () => {
    const r = validateRequiredTriad({ lifecycle: 'active', priority: 'p2' });
    expect(r.valid).toBe(false);
    expect(r.violations.some((v) => v.includes('agent'))).toBe(true);
  });

  it('rule 1: rejects malformed agent id outside 01-30', () => {
    const r = validateRequiredTriad({
      agent: 'agent:99',
      lifecycle: 'active',
      priority: 'p2',
    });
    expect(r.valid).toBe(false);
  });

  it('rule 2: frozen + restricted blocks mutation (H4)', () => {
    const sealed: OmniTagSet = {
      ...compliantTag,
      lifecycle: 'frozen',
      security: 'restricted',
    };
    const r = enforceFrozenLock(sealed, true);
    expect(r.valid).toBe(false);
    expect(r.violations[0]).toContain('H4 frozen');
  });

  it('rule 2: frozen + restricted allows read (no mutation)', () => {
    const sealed: OmniTagSet = {
      ...compliantTag,
      lifecycle: 'frozen',
      security: 'restricted',
    };
    const r = enforceFrozenLock(sealed, false);
    expect(r.valid).toBe(true);
  });

  it('rule 3: barrier inheritance detected via best-practice:结界', () => {
    expect(isBarrierInherited(compliantTag)).toBe(true);
    expect(isBarrierInherited({ ...compliantTag, bestPractice: 'awakened' })).toBe(false);
  });

  it('rule 4: p0 completion requires entropy decrease', () => {
    const p0: OmniTagSet = { ...compliantTag, priority: 'p0' };
    const ok = validateEntropyReduction(p0, {
      completed: true,
      entropyBefore: 0.2,
      entropyAfter: 0.08,
    });
    expect(ok.valid).toBe(true);

    const bad = validateEntropyReduction(p0, {
      completed: true,
      entropyBefore: 0.2,
      entropyAfter: 0.25,
    });
    expect(bad.valid).toBe(false);
  });

  it('rule 5: contract rate audit targets 100%', () => {
    const tags: OmniTagSet[] = [
      compliantTag,
      { lifecycle: 'active', priority: 'p2' }, // missing agent
      compliantTag,
    ];
    const audit = auditContractRate(tags);
    expect(audit.total).toBe(3);
    expect(audit.compliant).toBe(2);
    expect(audit.rate).toBeCloseTo(2 / 3);
  });

  it('full verify aggregates all rules (§20.5)', () => {
    const r = verifyOmniTagContract(compliantTag, {
      attemptedMutation: false,
      completed: false,
    });
    expect(r.valid).toBe(true);
  });

  it('full verify flags frozen mutation attempt', () => {
    const sealed: OmniTagSet = {
      ...compliantTag,
      lifecycle: 'frozen',
      security: 'restricted',
    };
    const r = verifyOmniTagContract(sealed, { attemptedMutation: true });
    expect(r.valid).toBe(false);
    expect(r.violations.some((v) => v.includes('H4'))).toBe(true);
  });
});
