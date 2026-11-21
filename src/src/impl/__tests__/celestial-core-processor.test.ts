import { describe, it, expect } from 'vitest';
import { CelestialCoreProcessor } from '../../lib/omni-core/celestial-core-processor';
import { IComponentCore } from '../../lib/omni-core/contracts';

const core = new CelestialCoreProcessor();

const mockComponent: IComponentCore = {
  uuid: 'test-uuid',
  version: '1.0',
  timestamp: Date.now(),
  evidence: { originCause: 'unknown', processTrace: [], finalEffect: 'unknown' },
};

describe('CelestialCoreProcessor', () => {
  it('monitorBackpressure returns frozen object with hash', () => {
    const result = core.monitorBackpressure(mockComponent, 'data.clean');
    expect(Object.isFrozen(result)).toBe(true);
    expect('hash' in result).toBe(true);
  });

  it('shadowTestIngress returns undefined (void)', () => {
    const result = core.shadowTestIngress({ foo: 'bar' });
    expect(result).toBeUndefined();
  });

  it('predictAndPreFetch returns a non‑empty string with ISO tag', () => {
    const result = core.predictAndPreFetch();
    expect(typeof result).toBe('string');
    expect(result).toContain('ISO');
  });

  it('injectChaos returns undefined (void)', () => {
    const result = core.injectChaos('agent-123');
    expect(result).toBeUndefined();
  });

  it('lifecycleCleanup returns frozen marker', () => {
    const marker = core.lifecycleCleanup('agent-xyz');
    expect(Object.isFrozen(marker)).toBe(true);
    expect(marker).toHaveProperty('agentId', 'agent-xyz');
  });
});
