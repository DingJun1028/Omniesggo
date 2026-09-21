import { describe, it, expect } from 'vitest';
import { OmniForge, omniForge, type DebtItem } from '../src/index.js';
import { createComponentCore } from '@esggo/omni-core';

const sampleDebt: DebtItem[] = [
  { type: 'dead-code', path: 'src/foo.ts', severity: 'critical', line_count: 100, suggestion: 'remove' },
  { type: 'duplicate-code', path: 'src/bar.ts', severity: 'medium', line_count: 50, suggestion: 'dedupe' },
];

describe('OmniForge v1.0 (Trust Object.freeze + entropy forge)', () => {
  it('measureEntropy returns IComponentCore + entropy', async () => {
    const report = await omniForge.measureEntropy(sampleDebt);
    expect(report.uuid).toBeTruthy();
    expect(report.entropy_before).toBeGreaterThan(0);
    expect(report.debt_items).toEqual(sampleDebt);
  });

  it('measureEntropy seals (Trustworthy evidence)', async () => {
    const report = await omniForge.measureEntropy([]);
    expect(report.evidence.length).toBeGreaterThan(0);
    expect(report.evidence[0].standard).toBe('5T-PROOF');
  });

  it('forgeEntropy dryRun does not modify', async () => {
    const report = await omniForge.forgeEntropy(true, sampleDebt);
    expect(report.debt_items).toEqual(sampleDebt);
    expect(report.reduction_percent).toBe(0);
  });

  it('forgeEntropy live removes critical/high', async () => {
    const report = await omniForge.forgeEntropy(false, sampleDebt);
    expect(report.debt_items).toHaveLength(1); // 移除 critical 後剩 medium
    expect(report.debt_items[0].severity).toBe('medium');
    expect(report.reduction_percent).toBeGreaterThan(0);
  });

  it('seal + verify round-trip', async () => {
    const core = createComponentCore('test://origin');
    const sealed = await omniForge.seal(core);
    const valid = await omniForge.verify(sealed);
    expect(valid).toBe(true);
  });

  it('lintContract detects missing source_origin', () => {
    const valid = createComponentCore('test://origin');
    const invalid = createComponentCore(''); // 故意空

    const results = omniForge.lintContract([valid, invalid]);
    expect(results).toHaveLength(1);
    expect(results[0].file).toBe('unknown');
    expect(results[0].violations[0].rule).toContain('source_origin');
  });

  it('evolve runs measure + forge + lint', async () => {
    const core1 = createComponentCore('test://a');
    const core2 = createComponentCore('test://b');

    const { entropy, lintResults } = await omniForge.evolve(sampleDebt, [core1, core2]);

    expect(entropy).toBeDefined();
    expect(entropy.debt_items).toEqual(sampleDebt); // dryRun
    expect(lintResults).toHaveLength(0); // 兩個 core 都有 source_origin
  });
});
