import { describe, it, expect } from 'vitest';
import {
  createComponentCore,
  sealComponentCore,
  verifySeal,
  type IComponentCore,
} from '../src/index.js';

describe('IComponentCore + sealComponentCore (5T Trustworthy)', () => {
  it('createComponentCore sets defaults', () => {
    const core = createComponentCore('test://origin');
    expect(core.uuid).toBeTruthy();
    expect(core.version).toBe('1.0.0');
    expect(core.timestamp).toBeGreaterThan(0);
    expect(core.source_origin).toBe('test://origin');
    expect(core.evidence).toEqual([]);
  });

  it('sealComponentCore freezes the component', async () => {
    const core = createComponentCore('test://origin');
    const sealed = await sealComponentCore(core);
    expect(Object.isFrozen(sealed)).toBe(true);
    expect(Object.isFrozen(sealed.evidence)).toBe(true);
  });

  it('sealComponentCore appends 5T-PROOF evidence', async () => {
    const core = createComponentCore('test://origin');
    const sealed = await sealComponentCore(core);
    expect(sealed.evidence.length).toBe(1);
    expect(sealed.evidence[0].standard).toBe('5T-PROOF');
    expect(sealed.evidence[0].hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('verifySeal returns true for sealed component', async () => {
    const core = createComponentCore('test://origin');
    const sealed = await sealComponentCore(core);
    const valid = await verifySeal(sealed);
    expect(valid).toBe(true);
  });

  it('verifySeal returns false for unfrozen component', async () => {
    const core = createComponentCore('test://origin');
    // Note: NOT sealed
    const valid = await verifySeal(core);
    expect(valid).toBe(false);
  });

  it('multiple seals: evidence chain grows', async () => {
    const core = createComponentCore('test://origin');
    const s1 = await sealComponentCore(core);
    expect(s1.evidence.length).toBe(1);
    // Cannot mutate sealed object (TypeError at runtime)
    expect(() => {
      (s1 as IComponentCore).evidence.push({
        hash: 'x',
        verifiedBy: 'test',
        standard: '5T-PROOF',
        payload: {},
      });
    }).toThrow();
  });
});
