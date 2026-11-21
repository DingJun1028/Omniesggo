import { describe, it, expect, vi, afterEach } from 'vitest';
import worker, { type Env } from '../src/index';

const baseEnv: Env = {
  OMNI_GATEWAY_KEY: 'test-key',
  GROQ_API_KEY: 'groq-test',
};

const requestOf = (path: string, init?: RequestInit) =>
  new Request("https://router.esggo.test" + path, init);

const jsonBody = (data: Record<string, unknown>) => JSON.stringify(data);

describe('OmniGateway basic routes', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('GET /status returns ok + provider list', async () => {
    const res = await worker.fetch(requestOf('/status'), baseEnv, { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.ok).toBe(true);
    expect(data.gateway).toBe('omnigateway-core');
    expect(data.providers).toBeDefined();
    expect(data.crawl).toBe('strict');
  });

  it('GET /health mirrors /status', async () => {
    const res = await worker.fetch(requestOf('/health'), baseEnv, { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.ok).toBe(true);
  });

  it('GET / returns default response', async () => {
    const res = await worker.fetch(requestOf('/'), baseEnv, { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.gateway).toBe('omnigateway-core');
    expect(data.docs).toMatch(/\/status|\/v1\/chat\/completions/);
  });

  it('unknown path returns 200 with default message (catch-all)', async () => {
    const res = await worker.fetch(requestOf('/nope'), baseEnv, { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.gateway).toBe('omnigateway-core');
  });

  it('non-GET/POST method returns 405', async () => {
    const res = await worker.fetch(requestOf('/status', { method: 'PUT' }), baseEnv, { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any);
    expect(res.status).toBe(405);
  });

  it('OPTIONS returns 204 (CORS preflight)', async () => {
    const res = await worker.fetch(requestOf('/v1/chat/completions', { method: 'OPTIONS' }), baseEnv, { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any);
    expect(res.status).toBe(204);
  });

  it('AI Crawl Control blocks GPTBot with 403', async () => {
    const res = await worker.fetch(
      new Request('https://router.esggo.test/some-path', {
        headers: { 'user-agent': 'GPTBot/1.0' },
      }),
      baseEnv,
      { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any,
    );
    expect(res.status).toBe(403);
  });
});

describe('OmniGateway /v1/models', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('GET /v1/models returns model list', async () => {
    const res = await worker.fetch(requestOf('/v1/models'), baseEnv, { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThan(0);
    expect(data.data.some((m: any) => m.id.includes('openrouter'))).toBe(true);
  });
});

describe('OmniGateway /v1/chat/completions', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('missing Authorization returns 401', async () => {
    const res = await worker.fetch(
      requestOf('/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: jsonBody({ messages: [{ role: 'user', content: 'hi' }] }),
      }),
      { ...baseEnv, OMNI_GATEWAY_KEY: 'secret' },
      { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any,
    );
    expect(res.status).toBe(401);
  });

  it('missing messages returns 400', async () => {
    const res = await worker.fetch(
      requestOf('/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer test-key' },
        body: jsonBody({}),
      }),
      baseEnv,
      { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any,
    );
    expect(res.status).toBe(400);
    const data = (await res.json()) as any;
    expect(data.error).toMatch(/messages/);
  });

  it('invalid JSON body with no auth returns 401 first', async () => {
    const res = await worker.fetch(
      requestOf('/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not json{',
      }),
      { ...baseEnv, OMNI_GATEWAY_KEY: 'secret' },
      { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any,
    );
    expect(res.status).toBe(401);
  });

  it('POST valid request returns 200 and data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ choices: [{ message: { content: 'OK' } }] }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    const res = await worker.fetch(
      requestOf('/v1/chat/completions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: 'Bearer test-key' },
        body: jsonBody({ messages: [{ role: 'user', content: 'hello' }] }),
      }),
      baseEnv,
      { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any,
    );
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.data).toBeDefined();
  });

  it('GET /v1/chat/completions falls through to catch-all (200 default)', async () => {
    const res = await worker.fetch(requestOf('/v1/chat/completions', { method: 'GET' }), baseEnv, { waitUntil: vi.fn(), passThroughOnException: vi.fn() } as any);
    expect(res.status).toBe(200);
    const data = (await res.json()) as any;
    expect(data.gateway).toBe('omnigateway-core');
  });
});