import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { TencentDBStorage, type TencentDBConfig } from '../src/tencentdb-adapter.js';
import type { Memory } from '../src/index.js';

// Mock fetch for unit tests (no real gateway needed)
const mockFetch = (responses: { ok: boolean; body: any; status: number }[]) => {
  let i = 0;
  (globalThis as any).fetch = async (_url: string, _init: any) => {
    const r = responses[Math.min(i++, responses.length - 1)];
    return {
      ok: r.ok,
      status: r.status,
      text: async () => JSON.stringify(r.body),
      json: async () => r.body,
    };
  };
};

describe('TencentDBStorage (unit)', () => {
  let storage: TencentDBStorage;

  beforeEach(() => {
    const config: TencentDBConfig = {
      gatewayUrl: 'http://localhost:8420',
      serviceId: 'test-svc',
      userId: 'test-user',
    };
    storage = new TencentDBStorage(config);
  });

  afterEach(() => {
    delete (globalThis as any).fetch;
  });

  it('store sends memory to /recall + /search/memories', async () => {
    mockFetch([
      { ok: true, body: [], status: 200 },
      { ok: true, body: { status: 'ok' }, status: 200 },
    ]);

    const memory: Memory = {
      uuid: 'test-001',
      version: '1.0.0',
      timestamp: Date.now(),
      source_origin: 'test',
      evidence: [],
      content: 'test content',
      layer: 'L1',
      tags: [],
    };

    await expect(storage.store(memory)).resolves.toBeUndefined();
  });

  it('recall maps results to Memory objects', async () => {
    mockFetch([
      {
        ok: true,
        body: [
          {
            id: 'mem-001',
            content: 'hello world',
            timestamp: 1234567890,
            metadata: { layer: 'L1' },
          },
        ],
        status: 200,
      },
    ]);

    const results = await storage.recall({ query: 'hello', limit: 5 });
    expect(results).toHaveLength(1);
    expect(results[0].uuid).toBe('mem-001');
    expect(results[0].content).toBe('hello world');
  });

  it('throws on non-ok response', async () => {
    mockFetch([{ ok: false, body: 'unauthorized', status: 401 }]);

    const memory: Memory = {
      uuid: 'test',
      version: '1.0.0',
      timestamp: Date.now(),
      source_origin: 'test',
      evidence: [],
      content: 'fail',
      layer: 'L0',
      tags: [],
    };

    await expect(storage.store(memory)).rejects.toThrow(/TencentDB.*401/);
  });
});
