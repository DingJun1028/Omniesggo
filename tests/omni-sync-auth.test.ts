/**
 * 5T Trustworthy — omni/sync 路由認證守門驗證
 * 驗證 app/api/omni/sync/route.ts：
 * POST 需 X-Omni-Token (Bearer) 等於 OMNI_KEY/GATEWAY_API_KEY；GET 開放。
 * 因 TOKEN 在模組頂層綁定 env，每個測試動態重載模組以隔離 env 狀態。
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

function makePost(body: unknown, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost/api/omni/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

const VALID_STATE = { appVersion: '1', activeWorkers: 0, agents: [], lastSyncAt: 0 };

describe('POST /api/omni/sync — 認證守門', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('有 TOKEN 時缺少 token → 401', async () => {
    vi.stubEnv('OMNI_KEY', 'sync-token-abc');
    vi.stubEnv('GATEWAY_API_KEY', '');
    const { POST } = await import('../app/api/omni/sync/route');
    const res = await POST(makePost(VALID_STATE));
    expect(res.status).toBe(401);
  });

  it('有 TOKEN 時錯誤 token → 401', async () => {
    vi.stubEnv('OMNI_KEY', 'sync-token-abc');
    vi.stubEnv('GATEWAY_API_KEY', '');
    const { POST } = await import('../app/api/omni/sync/route');
    const res = await POST(makePost(VALID_STATE, { 'x-omni-token': 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('有 TOKEN 時正確 x-omni-token → 非 401', async () => {
    vi.stubEnv('OMNI_KEY', 'sync-token-abc');
    vi.stubEnv('GATEWAY_API_KEY', '');
    const { POST } = await import('../app/api/omni/sync/route');
    const res = await POST(makePost(VALID_STATE, { 'x-omni-token': 'sync-token-abc' }));
    expect(res.status).not.toBe(401);
  });
});

describe('GET /api/omni/sync — 健康開放', () => {
  it('無認證 → 200 (公開健康)', async () => {
    vi.stubEnv('OMNI_KEY', '');
    vi.stubEnv('GATEWAY_API_KEY', '');
    const { GET } = await import('../app/api/omni/sync/route');
    const res = await GET(new NextRequest('http://localhost/api/omni/sync', { method: 'GET' }));
    expect(res.status).toBe(200);
  });
});
