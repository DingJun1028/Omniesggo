---
source_origin: oa-knowledge-avatar
created: 2026-08-29
modified: 2026-08-29
co_authors: [oa-team, hermes]
lifecycle: active
access: public-research
tags: [ftg, website-audit, gap-remediation, seo]
related: [[FTGToursShareCopy]] [[FTGJourneyAppArchitecture]] [[CloudflareCache404]]
---

# 官網缺口補齊清單 · 知識分身

> `ftgtours.esggo.co` 成熟度審計與補齊記錄。生產級官網應具備的基礎設施。

## 已補齊缺口（2026-08-29）
| 缺口 | 修正 | 狀態 |
|------|------|------|
| 無 404 頁 | `NotFound.jsx` + App.jsx `path="*"` + i18n `notFound` 鍵 | ✅ |
| 無 robots.txt | `public/robots.txt`（Allow + Sitemap） | ✅ 200 |
| 無 sitemap.xml | `public/sitemap.xml`（8 頁 URL） | ✅ 200 |
| favicon 404 | `public/favicon.svg` + apple-touch-icon | ✅ 200 |
| 分享無圖 | `public/og-image.svg`（1200×630）+ index.html og:image | ✅ 200 |
| 聯絡表單後端 | 既有 `ftgtours-api` Worker 已處理 /api/contact → D1 | ✅ 驗證寫入成功 |

## 第二輪審計（確認無功能缺口）
- 聯絡表單 POST `/api/contact` → 既有 `ftgtours-api` Worker 佔用路由，寫入 D1 `ftgtours_contact.contact_inquiries` 成功（`{"ok":true,"id":6}`）
- 各頁 `keywords` SEO 8 頁全有
- 誤建 `ftgtours-contact-worker` 因路由被佔 → 已刪除，避免冗餘

## 增強項（後續）
- schema.org TravelAgency JSON-LD（搜尋富摘要）
- reCAPTCHA v3 前端（VITE_RECAPTCHA_SITE_KEY）
- 首頁 Hero 橫幅圖 LCP 優化（preload + fetchpriority）

## 關聯
- [[FTGToursShareCopy]] — 分享文案
- [[CloudflareCache404]] — Cloudflare 快取 404 陷阱
- [[FTGJourneyAppArchitecture]] — FTG App 與官網同源
