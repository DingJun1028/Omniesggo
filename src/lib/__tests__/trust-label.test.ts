import { describe, it, expect, beforeEach } from 'vitest';
import { esggo } from '../omni-core/omni-function';
import { createTrustTag, updateLifecycle, type TrustLevel, TRUST_LEVEL_SCORE } from '../omni-base';
import { validateTrustLevel, enforceFrozenLock } from '../omnitag-contract';
import type { OmniTagSet } from '../omni-core/types';

// ── §20.7 Trust Label 內建函數測試 ──

describe('§20.7 Trust Label — esggo.trustScore', () => {
  it('returns score for known trust levels', () => {
    expect(esggo.trustScore('low')).toBe(0.7);
    expect(esggo.trustScore('medium')).toBe(0.85);
    expect(esggo.trustScore('high')).toBe(0.95);
    expect(esggo.trustScore('critical')).toBe(1.0);
    expect(esggo.trustScore('authenticated')).toBe(0.9);
  });

  it('returns 0 for unknown level', () => {
    expect(esggo.trustScore('unknown' as TrustLevel)).toBe(0);
  });
});

describe('§20.7 Trust Label — esggo.trustGate', () => {
  it('passes when score meets default high threshold', () => {
    const result = esggo.trustGate('high' as TrustLevel);
    expect(result.passed).toBe(true);
    expect(result.threshold).toBe(TRUST_LEVEL_SCORE.high);
  });

  it('blocks when score below threshold', () => {
    const result = esggo.trustGate('low' as TrustLevel);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('uses custom requiredLevel', () => {
    const result = esggo.trustGate('medium' as TrustLevel, { requiredLevel: 'low' });
    expect(result.passed).toBe(true);
  });
});

describe('§20.7 Trust Label — esggo.trustLabel', () => {
  it('applies label to tag and returns enriched OmniTagSet', () => {
    const tag = { agent: 'agent:01', squad: '5T驗算' } as OmniTagSet;
    const result = esggo.trustLabel(tag, 'high' as TrustLevel);
    expect(result.trustLevel).toBe('high');
    expect(result.trustScore).toBe(0.95);
    expect(result.hashLock).toBeTruthy();
  });
});

describe('§20.7 Trust Label — createTrustTag', () => {
  it('auto-computes trustScore and hashLock', () => {
    const tag = createTrustTag({ agent: 'agent:01', trustLevel: 'high' });
    expect(tag.trustLevel).toBe('high');
    expect(tag.trustScore).toBe(0.95);
    expect(tag.hashLock).toMatch(/^[0-9a-f]{64}$/);
  });

  it('auto-computes different scores per level', () => {
    const low = createTrustTag({ agent: 'agent:01', trustLevel: 'low' });
    const high = createTrustTag({ agent: 'agent:01', trustLevel: 'high' });
    expect(low.trustScore).toBe(0.7);
    expect(high.trustScore).toBe(0.95);
    expect(low.hashLock).not.toBe(high.hashLock);
  });
});

describe('§20.7 Trust Label — updateLifecycle', () => {
  it('preserves trustLevel when lifecycle changes', () => {
    const tag = createTrustTag({ agent: 'agent:01', trustLevel: 'high', lifecycle: 'active' });
    const updated = updateLifecycle(tag, 'frozen', { trustLevel: 'high' });
    expect(updated.lifecycle).toBe('frozen');
    expect(updated.trustLevel).toBe('high');
  });

  it('accepts optional trustLevel param', () => {
    const tag = createTrustTag({ agent: 'agent:01', trustLevel: 'high' });
    const updated = updateLifecycle(tag, 'active');
    expect(updated.trustLevel).toBe('high');
  });
});

describe('§20.7 Trust Label — validateTrustLevel', () => {
  it('returns valid for high trustLevel', () => {
    const tag = createTrustTag({ agent: 'agent:25', trustLevel: 'high' });
    const result = validateTrustLevel(tag);
    expect(result.valid).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it('returns violations for missing trustLevel', () => {
    const tag = { agent: 'agent:01', lifecycle: 'active', priority: 'p2' } as OmniTagSet;
    const result = validateTrustLevel(tag);
    expect(result.valid).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
    expect(result.violations.some((v) => v.includes('trustLevel'))).toBe(true);
  });

  it('returns violations for invalid trustLevel value', () => {
    const tag = { agent: 'agent:01', trustLevel: 'invalid' as TrustLevel, lifecycle: 'active', priority: 'p2' } as OmniTagSet;
    const result = validateTrustLevel(tag);
    expect(result.valid).toBe(false);
  });
});

describe('§20.7 Trust Label — enforceFrozenLock', () => {
  it('allows modify when tag is not frozen', () => {
    const tag = createTrustTag({ agent: 'agent:01', trustLevel: 'high', lifecycle: 'active' });
    const result = enforceFrozenLock(tag, { lifecycle: 'frozen' });
    expect(result.blocked).toBe(false);
  });

  it('blocks modify when tag is frozen', () => {
    const tag = createTrustTag({ agent: 'agent:01', trustLevel: 'high', lifecycle: 'frozen' });
    const result = enforceFrozenLock(tag, { lifecycle: 'active' });
    expect(result.blocked).toBe(true);
    expect(result.violations.length).toBeGreaterThan(0);
  });
});
