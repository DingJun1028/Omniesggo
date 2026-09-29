/**
 * 5T Trustworthy — cron 路由認證守門驗證
 * 驗證 app/api/cron/route.ts 的 assertCronAuth：
 * 1. 有 CRON_SECRET 時，缺少/錯誤密鑰 → 401
 * 2. 有 CRON_SECRET 時，正確密鑰 (x-cron-secret / Bearer) → 放行
 * 3. 無 CRON_SECRET 時，缺少 x-user-id → 401；有 → 放行
 *
 * 5T-Trackable: 下方 `import { POST } from '../app/api/cron/route'` 為
 * top-level import，首次載入需 transpile + 初始化整個 Next.js runtime。
 * 於全量並行負載下實測需 5-7 秒，遠超 vitest 預設 5s timeout → 第一個 it()
 * 隨機失敗（flaky，2026-09-28 實測失敗數在 5 與 1 間跳動，非回歸）。
 * 已由 vitest.config.ts 的全域 testTimeout: 30_000 涵蓋，此處不重複設定。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/cron/route';

function makeReq(body: unknown, headers: Record<string, string> = {}): NextRequest {
  const url = 'http://localhost/api/cron';
  return new NextRequest(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

describe('POST /api/cron — 認證守門', () => {
  const ORIGINAL = process.env.CRON_SECRET;

  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = ORIGINAL;
  });

  it('有 CRON_SECRET 時缺少密鑰 → 401', async () => {
    process.env.CRON_SECRET = 'test-secret-123';
    const res = await POST(makeReq({ job: 'daily-report' }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it('有 CRON_SECRET 時錯誤密鑰 → 401', async () => {
    process.env.CRON_SECRET = 'test-secret-123';
    const res = await POST(makeReq({ job: 'daily-report' }, { 'x-cron-secret': 'wrong' }));
    expect(res.status).toBe(401);
  });

  it('有 CRON_SECRET 時正確 x-cron-secret → 放行 (非 401)', async () => {
    process.env.CRON_SECRET = 'test-secret-123';
    const res = await POST(makeReq({ job: 'auth-check' }, { 'x-cron-secret': 'test-secret-123' }));
    expect(res.status).not.toBe(401);
  });

  it('有 CRON_SECRET 時正確 Bearer → 放行 (非 401)', async () => {
    process.env.CRON_SECRET = 'test-secret-123';
    const res = await POST(makeReq({ job: 'auth-check' }, { authorization: 'Bearer test-secret-123' }));
    expect(res.status).not.toBe(401);
  });

  it('無 CRON_SECRET 時缺少 x-user-id → 401', async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(makeReq({ job: 'auth-check' }));
    expect(res.status).toBe(401);
  });

  it('無 CRON_SECRET 時有 x-user-id → 放行 (非 401)', async () => {
    delete process.env.CRON_SECRET;
    const res = await POST(makeReq({ job: 'auth-check' }, { 'x-user-id': 'internal-scheduler' }));
    expect(res.status).not.toBe(401);
  });
});
