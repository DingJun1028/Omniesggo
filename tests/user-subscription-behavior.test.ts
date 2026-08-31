/**
 * 5T Traceable — user/subscription 路由行為驗證
 * 驗證 app/api/user/subscription/route.ts：
 *  - 缺 userId/subType/targetId → 400
 * （完整 toggle 邏輯觸 user-growth-service→DB，由整合測試另覆蓋）
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/user/subscription/route';

function makePost(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/user/subscription', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/user/subscription — 行為', () => {
  it('缺少必要欄位 → 400', async () => {
    const res = await POST(makePost({}));
    expect(res.status).toBe(400);
  });

  it('缺 targetId → 400', async () => {
    const res = await POST(makePost({ userId: 'u1', subType: 'company' }));
    expect(res.status).toBe(400);
  });
});
