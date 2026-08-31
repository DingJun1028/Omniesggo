/**
 * 5T Traceable — rag/query 路由行為驗證
 * 驗證 app/api/rag/query/route.ts：
 *  - 缺 prompt → 400
 *  - 無 GEMINI_API_KEY 時走 mock 分支 (status 200)
 * 用 vi.stubEnv 確保走 mock 分支，不觸外部 AI。
 * （body 解析在 vitest 環境有 NextResponse 限制，故只斷言 status）
 */

import { describe, it, expect, afterEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/rag/query/route';

function makePost(body: unknown): NextRequest {
  return new NextRequest('http://localhost/api/rag/query', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/rag/query — 行為', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('缺少 prompt → 400', async () => {
    const res = await POST(makePost({}));
    expect(res.status).toBe(400);
  });

  it('無 GEMINI_API_KEY → 走 mock 分支 (200)', async () => {
    vi.stubEnv('GEMINI_API_KEY', '');
    vi.stubEnv('FREE_TIER_ONLY', 'true');
    const res = await POST(makePost({ prompt: 'test query' }));
    expect(res.status).toBe(200);
  });
});
