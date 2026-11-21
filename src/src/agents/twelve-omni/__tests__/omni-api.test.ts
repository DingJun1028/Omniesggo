import { describe, expect, it, vi } from 'vitest';
import { OmniAPI } from '../omni-api';

describe('OmniAPI', () => {
  it('registers an endpoint and returns a successful response', async () => {
    const api = new OmniAPI();
    await api.registerEndpoint({
      id: 'orders.list',
      method: 'GET',
      path: '/orders',
      rateLimit: { windowMs: 60000, maxRequests: 10 },
    });

    const res = await api.call({ endpointId: 'orders.list', method: 'GET', path: '/orders', headers: {}, body: undefined });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/json');
    expect(typeof res.durationMs).toBe('number');
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('throws when calling a missing endpoint', async () => {
    const api = new OmniAPI();
    await expect(
      api.call({ endpointId: 'missing', method: 'GET', path: '/x', headers: {}, body: undefined })
    ).rejects.toThrow('Endpoint missing not found');
  });

  it('blocks calls while circuit breaker is open', async () => {
    const api = new OmniAPI();
    await api.registerEndpoint({
      id: 'payments.charge',
      method: 'POST',
      path: '/payments/charge',
      rateLimit: { windowMs: 60000, maxRequests: 10 },
    });

    (api as any).circuitStates.set('payments.charge', 'open');
    await expect(
      api.call({ endpointId: 'payments.charge', method: 'POST', path: '/payments/charge', headers: {}, body: {} })
    ).rejects.toThrow('Circuit breaker open');
  });

  it('health reflects degraded status after recent errors', async () => {
    const api = new OmniAPI();
    await api.registerEndpoint({
      id: 'reports.export',
      method: 'GET',
      path: '/reports/export',
      rateLimit: { windowMs: 60000, maxRequests: 10 },
    });

    (api as any).callHistory.push(
      { endpointId: 'reports.export', status: 500, durationMs: 10, timestamp: Date.now() },
      { endpointId: 'reports.export', status: 500, durationMs: 10, timestamp: Date.now() },
      { endpointId: 'reports.export', status: 200, durationMs: 10, timestamp: Date.now() }
    );

    const health = await api.health();
    expect(health.endpoints['reports.export'].status).not.toBe('healthy');
  });

  it('metrics report success rate and circuit breaker trip count', async () => {
    const api = new OmniAPI();
    (api as any).circuitStates.set('x', 'open');
    (api as any).callHistory.push(
      { endpointId: 'x', status: 200, durationMs: 5, timestamp: Date.now() },
      { endpointId: 'x', status: 500, durationMs: 20, timestamp: Date.now() }
    );

    const metrics = await api.metrics();
    expect(metrics.totalCalls).toBe(2);
    expect(metrics.circuitBreakerTrips).toBe(1);
  });
});
