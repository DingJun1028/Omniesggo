import { describe, it, expect } from 'vitest';
import { OmniDB, omniDB } from '../src/index.js';
import type { OmniTag } from '@esggo/omni-tag';

describe('OmniDB v1.0 (Knowledge Pyramid + self-iteration)', () => {
  it('extract creates Pattern with confidence', () => {
    const db = new OmniDB();
    const tag: OmniTag = { namespace: 'team', key: 'tech', value: 'x' };
    const p = db.extract('TypeScript walker MUST include .d.ts', ['mem-uuid-1'], [tag], 0.9);
    expect(p.id).toBeTruthy();
    expect(p.rule).toContain('.d.ts');
    expect(p.confidence).toBe(0.9);
    expect(p.evidence).toEqual(['mem-uuid-1']);
  });

  it('link creates Insight (crossDomain if >= 2 patterns)', () => {
    const db = new OmniDB();
    const tag1: OmniTag = { namespace: 'team', key: 'tech', value: 'a' };
    const tag2: OmniTag = { namespace: 'team', key: 'guard', value: 'b' };
    const p1 = db.extract('rule A', [], [tag1]);
    const p2 = db.extract('rule B', [], [tag2]);

    const insight = db.link([p1.id, p2.id], 'cross-domain connection', 0.85);
    expect(insight.crossDomain).toBe(true);
    expect(insight.confidence).toBe(0.85);
  });

  it('reason creates Wisdom with Provenance Chain', async () => {
    const db = new OmniDB();
    const p1 = db.extract('fact 1', ['src-1']);
    const p2 = db.extract('fact 2', ['src-2']);
    const insight = db.link([p1.id, p2.id], 'combining facts');

    const wisdom = await db.reason([insight.id], 'recommendation text', ['step1', 'step2']);
    expect(wisdom.recommendation).toBe('recommendation text');
    expect(wisdom.provenance.sources).toContain('src-1');
    expect(wisdom.provenance.sources).toContain('src-2');
    expect(wisdom.provenance.reasoningPath).toEqual(['step1', 'step2']);
    expect(wisdom.provenance.hash).toMatch(/^[a-f0-9]{64}$/);
    expect(wisdom.evidence.length).toBeGreaterThan(0);
    expect(wisdom.evidence[0].standard).toBe('5T-PROOF');
  });

  it('detectGaps finds topics with < 3 patterns', () => {
    const db = new OmniDB();
    const tag: OmniTag = { namespace: 'team', key: 'tech', value: 'x' };
    db.extract('rule', [], [tag]);
    db.extract('rule2', [], [tag]);
    const gaps = db.detectGaps();
    expect(gaps.find((g) => g.topic === 'team:tech')).toBeTruthy();
  });

  it('iterate detects contradictions + new insights + gaps', async () => {
    const db = new OmniDB();
    const tag: OmniTag = { namespace: 'team', key: 'x', value: 'y' };

    // 製造矛盾 (同樣 rule text 不同 id)
    db.extract('walker must include dts', [], [tag]);
    db.extract('walker must include dts', [], [tag]);

    const insight = db.link([], 'standalone');
    const report = await db.iterate();
    expect(report.contradictions.length).toBeGreaterThan(0);
    expect(report.gaps).toBeDefined();
    expect(report.iteratedAt).toBeGreaterThan(0);
    expect(report.evidence[0].standard).toBe('5T-PROOF');
    // 注意: standalone insight 沒 patternIds, 不會在 newInsights
  });

  it('ask returns answer + provenance', async () => {
    const db = new OmniDB();
    const tag: OmniTag = { namespace: 'team', key: 'x', value: 'y' };
    db.extract('walker must include dts', [], [tag]);
    db.link([], 'reasoning');

    const result = await db.ask('walker dts');
    expect(result.answer).toContain('walker must include dts');
    expect(result.provenance.sources).toBeDefined();
  });

  it('ask with no matching pattern returns guidance', async () => {
    const db = new OmniDB();
    const result = await db.ask('nonexistent query xyz');
    expect(result.answer).toContain('建議先 extract');
    expect(result.provenance.sources).toEqual([]);
  });
});
