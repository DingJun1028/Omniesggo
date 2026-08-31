/**
 * 5T Trustworthy — memory 路由寫入認證守門驗證
 * 聚焦守門「拒絕未授權」職責（401 情境）。
 * 放行後的業務流依賴 Redis/Firestore，由整合測試另覆蓋。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, DELETE } from '../app/api/memory/route';

function makeReq(method: string, headers: Record<string, string> = {}, body?: unknown): NextRequest {
  const url = method === 'DELETE' ? 'http://localhost/api/memory?key=test' : 'http://localhost/api/memory';
  return new NextRequest(url, {
    method,
    headers: { 'content-type': 'application/json', ...headers },
    body: body ? JSON.stringify(body) : undefined,
  });
}

describe('app/api/memory — 寫入認證守門 (拒絕未授權)', () => {
  const ORIGINAL = process.env.MEMORY_API_KEY;
  afterEach(() => {
    if (ORIGINAL === undefined) delete process.env.MEMORY_API_KEY;
    else process.env.MEMORY_API_KEY = ORIGINAL;
  });

  describe('POST 守門', () => {
    it('有 MEMORY_API_KEY 時缺少密鑰 → 401', async () => {
      process.env.MEMORY_API_KEY = 'mem-secret-xyz';
      const res = await POST(makeReq('POST', {}, { key: 'k', value: 'v' }));
      expect(res.status).toBe(401);
    });

    it('有 MEMORY_API_KEY 時錯誤密鑰 → 401', async () => {
      process.env.MEMORY_API_KEY = 'mem-secret-xyz';
      const res = await POST(makeReq('POST', { 'x-memory-key': 'wrong' }, { key: 'k', value: 'v' }));
      expect(res.status).toBe(401);
    });

    it('無 MEMORY_API_KEY 時缺少 x-user-id → 401', async () => {
      delete process.env.MEMORY_API_KEY;
      const res = await POST(makeReq('POST', {}, { key: 'k', value: 'v' }));
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE 守門', () => {
    it('有 MEMORY_API_KEY 時缺少密鑰 → 401', async () => {
      process.env.MEMORY_API_KEY = 'mem-secret-xyz';
      const res = await DELETE(makeReq('DELETE'));
      expect(res.status).toBe(401);
    });

    it('無 MEMORY_API_KEY 時缺少 x-user-id → 401', async () => {
      delete process.env.MEMORY_API_KEY;
      const res = await DELETE(makeReq('DELETE'));
      expect(res.status).toBe(401);
    });
  });
});
