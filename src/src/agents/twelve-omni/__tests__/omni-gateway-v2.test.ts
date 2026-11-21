import { describe, expect, it, vi } from 'vitest';
import { OmniGatewayV2 } from '../omni-gateway';

describe('OmniGatewayV2', () => {
  it('ingress appends a gateway-ingress lifecycle entry without freezing', async () => {
    const gateway = new OmniGatewayV2();

    const out = await gateway.ingress({
      id: 'evt-1',
      topic: 'ingress',
      payload: { a: 1 },
      timestamp: Date.now(),
      headers: {},
      retries: 0,
      source: 'test',
      lifecycle_path: [],
    } as any);

    expect(Array.isArray((out as any).lifecycle_path)).toBe(true);
    expect((out as any).lifecycle_path).toHaveLength(1);
    expect((out as any).lifecycle_path[0].node).toBe('gateway-ingress');
    expect(Object.isFrozen(out)).toBe(false);
  });
});
