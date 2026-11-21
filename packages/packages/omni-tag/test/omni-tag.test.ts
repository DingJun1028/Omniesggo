import { describe, it, expect } from 'vitest';
import {
  parseOmniTag,
  formatOmniTag,
  routeOmniTag,
  validateOmniTagRules,
  validateRequired,
  type OmniTag,
} from '../src/index.js';

describe('OmniTag v1.0 (6 dims + routing + rules)', () => {
  it('parseOmniTag: valid 3-part string', () => {
    expect(parseOmniTag('team:strategy:plan')).toEqual({
      namespace: 'team',
      key: 'strategy',
      value: 'plan',
    });
  });

  it('parseOmniTag: invalid namespace returns null', () => {
    expect(parseOmniTag('unknown:x:y')).toBeNull();
  });

  it('parseOmniTag: wrong parts count returns null', () => {
    expect(parseOmniTag('team:only')).toBeNull();
    expect(parseOmniTag('team:only:extra:parts')).toBeNull();
  });

  it('formatOmniTag round-trips', () => {
    const tag: OmniTag = { namespace: '5t', key: 'traceable', value: 'true' };
    expect(parseOmniTag(formatOmniTag(tag))).toEqual(tag);
  });

  it('routeOmniTag: team routes to agent ranges', () => {
    expect(routeOmniTag({ namespace: 'team', key: 'strategy', value: 'plan' })).toBe('agents-1-to-6');
    expect(routeOmniTag({ namespace: 'team', key: 'tech', value: 'audit' })).toBe('agents-7-to-12');
    expect(routeOmniTag({ namespace: 'team', key: 'guard', value: 'security' })).toBe('agents-25-to-30');
  });

  it('routeOmniTag: stage 5-tdd routes to test + QC', () => {
    expect(routeOmniTag({ namespace: 'stage', key: '5-tdd', value: 'red' })).toBe(
      'agent-test-bee+agent-quality-control-bee'
    );
  });

  it('routeOmniTag: unknown tag → broadcast', () => {
    expect(routeOmniTag({ namespace: 'task', key: 'feat', value: 'x' })).toBe('broadcast');
  });

  it('validateOmniTagRules: same namespace different value = conflict', () => {
    const tags: OmniTag[] = [
      { namespace: 'team', key: 'strategy', value: 'plan' },
      { namespace: 'team', key: 'tech', value: 'audit' },
    ];
    expect(validateOmniTagRules(tags)).toHaveLength(1);
  });

  it('validateOmniTagRules: same value = no conflict', () => {
    const tags: OmniTag[] = [
      { namespace: 'team', key: 'strategy', value: 'plan' },
      { namespace: '5t', key: 'traceable', value: 'true' },
    ];
    expect(validateOmniTagRules(tags)).toHaveLength(0);
  });

  it('validateRequired: needs team + 5t', () => {
    const onlyTeam: OmniTag[] = [{ namespace: 'team', key: 'tech', value: 'x' }];
    const onlyFiveT: OmniTag[] = [{ namespace: '5t', key: 'traceable', value: 'true' }];
    const both: OmniTag[] = [
      { namespace: 'team', key: 'tech', value: 'x' },
      { namespace: '5t', key: 'traceable', value: 'true' },
    ];
    expect(validateRequired(onlyTeam).hasTeam).toBe(true);
    expect(validateRequired(onlyTeam).hasFiveT).toBe(false);
    expect(validateRequired(onlyFiveT).hasFiveT).toBe(true);
    expect(validateRequired(both).hasTeam).toBe(true);
    expect(validateRequired(both).hasFiveT).toBe(true);
  });
});
