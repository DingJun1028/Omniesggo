/**
 * 5T Transparent — 內部錯誤不洩漏驗證
 * 直接單元測試 src/lib/api-utils 的 jsonErrorInternal，確保原始 error.message
 * 不出現在 HTTP 回應 body（防資訊洩漏），僅於伺服器端 console.error 留存。
 */

import { describe, it, expect } from 'vitest';
import { jsonErrorInternal, jsonError } from '../src/lib/api-utils';

describe('jsonErrorInternal — 不洩漏內部錯誤訊息', () => {
  it('應將原始 error.message 攔截，不在回應中暴露', async () => {
    const secret = new Error('DB connection refused at 10.0.0.5:5432/user=admin');
    const res = jsonErrorInternal(secret);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(JSON.stringify(body)).not.toContain('10.0.0.5');
    expect(JSON.stringify(body)).not.toContain('DB connection refused');
    expect(JSON.stringify(body)).not.toContain('user=admin');
    expect(body.error).toBeDefined();
  });

  it('預設使用 INTERNAL_ERROR 錯誤碼且 status 500', async () => {
    const res = jsonErrorInternal(new Error('boom'));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('boom');
  });

  it('允許指定自訂 errorKey 與 status', async () => {
    const res = jsonErrorInternal(new Error('x'), 'RAG_QUERY_FAILED', 422);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(JSON.stringify(body)).not.toContain('x');
  });

  it('對照：jsonError 帶 customMessage 會外洩（突顯為何要用 jsonErrorInternal）', async () => {
    const res = jsonError('INTERNAL_ERROR', 'leak-secret-token-abc');
    const body = await res.json();
    expect(JSON.stringify(body)).toContain('leak-secret-token-abc');
  });
});
