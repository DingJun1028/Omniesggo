# ftgtours-api（lead-api）

FTG 官網 + HTB B2B 統一線索 Worker（Cloudflare Workers + D1）。

## 路由

| Method | Path | 說明 |
| --- | --- | --- |
| GET | `/health` | 健康探活 |
| POST | `/api/contact` | 商務洽詢受理（FTG 表單、HTB Vercel proxy 共用） |

## 表單欄位（JSON body）

`company` `contact_name` `email` `phone` `participants` `activity_type`
`preferred_date` `message` `site`（`ftg` 預設 / `htb`）`hp`（蜜罐，有填即假成功）
`recaptchaToken`（設定 `RECAPTCHA_SECRET_KEY` 後必填）

## 安全機制

- Origin 白名單（`ALLOWED_ORIGINS` vars）
- 蜜罐 honeypot（`hp`）
- reCAPTCHA v3 服務端 siteverify（score >= 0.5，secret 存在才強制）
- 每 IP 每小時配額（`IP_HOURLY_CAP`，D1 `created_at` 欄位缺時自動降級）
- Resend 通知：owner 通知 + 客戶回執（缺 key 優雅跳過，失敗不影響受理）

## 部署

```bash
# 本目錄執行（需有 Workers 權限的 API token）
npx wrangler deploy

# D1 schema migration（只需一次；Worker 有無 site 欄位皆可運作）
npx wrangler d1 execute ftgtours_contact --remote --file migrations/0001_add_site.sql

# secrets（依需求）
npx wrangler secret put RECAPTCHA_SECRET_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put LEAD_NOTIFY_TO
npx wrangler secret put LEAD_FROM
```

## HTB B2B 對接

HTB（Vercel）透過 `apps/htb-b2b/vercel.json` 的同源 rewrite
`/api/contact → https://ftgtours.esggo.co/api/contact` 送出，
帶 `site: 'htb'`，無 CORS 依賴。
