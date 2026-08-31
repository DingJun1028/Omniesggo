# Ch.01 5T 協議實作

> Traceable / Trackable / Tangible / Transparent / Trustworthy — 從代碼到治理的穿透性契約。

## 來源
- Hermes `oa-team-soul-canon` / `esggo-best-practice-execution`
- 2026-08-15 session 線上實證：`/api/health`、`/api/evidence-upload`、`/api/agentic-twin`

## 實作檢查表

| 5T | 實作位置 | 驗證方式 |
|---|---|---|
| Traceable | `source_origin` + Git commit | `git log --oneline -5` |
| Trackable | OpenTelemetry / structured log | `pm2 logs esggo-core --lines 20` |
| Tangible | UI/UX feedback + brand preset | `src/brand.py` / `src/app/api/health/route.ts` |
| Transparent | zero hallucination audit | 文件公開 + 測試覆蓋 |
| Trustworthy | Hash Lock + Object.freeze | `src/lib/webhook-auth.ts` |

## 碼點

```ts
// Trustworthy: HMAC 常數時間比對
export function verifyWebhookSignature(payload: string, signatureHeader: string | null, secret: string): boolean {
  if (!signatureHeader) return false;
  const sig = signatureHeader.startsWith('sha256=') ? signatureHeader.slice(7) : signatureHeader;
  const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
  if (sig.length !== expected.length) return false;
  try { return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)); } catch { return false; }
}
```

## 驗證
- [ ] `pnpm test` 通過
- [ ] `/api/health` 200
- [ ] `git status --short` 乾淨
