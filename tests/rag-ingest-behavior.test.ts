/**
 * 5T Traceable — rag/ingest 路由行為驗證
 * 驗證 app/api/rag/ingest/route.ts：
 *  - 缺 file → 400
 * （完整 PDF 解析流程觸外部 AGNES/Firebase，由整合測試另覆蓋）
 * 用 FormData 不帶 file 觸發參數校驗分支。
 */

import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../app/api/rag/ingest/route';

function makeFormNoFile(): NextRequest {
  const fd = new FormData();
  fd.set('userId', 'test-user');
  return new NextRequest('http://localhost/api/rag/ingest', {
    method: 'POST',
    body: fd,
  });
}

describe('POST /api/rag/ingest — 行為', () => {
  it('缺少 file → 400', async () => {
    const res = await POST(makeFormNoFile());
    expect(res.status).toBe(400);
  });
});
