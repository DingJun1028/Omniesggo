# Ch.03 Webhook HMAC 守門

> 常數時間比對，防止時序攻擊；可套用於 cron / memory / zenrows / sonnar / verify-5t。

## 核心 helper

```ts
export function verifyWebhookSignature(payload: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const sig = signatureHeader.startsWith('sha256=') ? signatureHeader.slice(7) : signatureHeader;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (sig.length !== expected.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { return false; }
}
```

## 套用位置

| 路由 | Header | 無 secret 回退 |
|---|---|---|
| `/api/cron` | `x-cron-secret` / `Authorization: Bearer` | `x-user-id` |
| `/api/memory` | `x-memory-key` / `Authorization: Bearer` | — |
| `/api/zenrows/fetch` | `X-Signature-256` | 401 |
| `/api/sonnar/crawl` | `X-Signature-256` | 401 |
| `/api/verify-5t` | `X-Signature-256` | 放行 |

## 常見陷阱

- `signatureHeader` 帶 `sha256=` 前綴時，必須 strip 否則 `timingSafeEqual` 一定 false
- 長度不同時直接 `return false`，避免 `timingSafeEqual` throw
- secret 為空時直接拒絕，不要 fallback 到公開

## 驗證

- [ ] `pnpm vitest run tests/cron-auth.test.ts tests/memory-auth.test.ts`
- [ ] `pnpm vitest run src/lib/__tests__/zenrows-client.test.ts`
