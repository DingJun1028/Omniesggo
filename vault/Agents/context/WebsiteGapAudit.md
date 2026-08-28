---
source_origin: oa-knowledge-avatar
created: 2026-08-29
modified: 2026-08-29
co_authors: [oa-team, hermes]
lifecycle: active
access: public-research
tags: [ftg, website-audit, gap-remediation, seo]
related: [[FTGToursShareCopy]] [[CloudflareCache404]] [[FTGJourneyAppArchitecture]]
---

# 官網缺口補齊 Audit · 知識分身

> 2026-08-28 對 `ftgtours.esggo.co` 做的系統化缺口審計與補齊實錄。

## 發現並補齊的缺口
| 缺口 | 修正 | 狀態 |
|------|------|------|
| 無 404 頁（打錯網址白屏） | `NotFound.jsx` + App.jsx `path="*"` + i18n `notFound` 鍵 | ✅ |
| 無 robots.txt | `public/robots.txt` | ✅ 200 |
| 無 sitemap.xml | `public/sitemap.xml`（8 頁） | ✅ 200 |
| favicon 404（index.html 引用但無檔） | `public/favicon.svg` + apple-touch-icon | ✅ 200 |
| 分享無圖（無 og:image） | `public/og-image.svg` + index.html `og:image`/`twitter:image` | ✅ 200 |
| i18n notFound 中英鍵缺失 | zh/en 加 `notFound.{title,desc,back}` | ✅ |

## 第二輪審計（2026-08-29）
| 檢查項 | 結果 |
|--------|------|
| 聯絡表單 `/api/contact` 後端 | ✅ 由 `ftgtours-api` Worker 處理（非新建 Worker） |
| D1 `ftgtours_contact` + `contact_inquiries` 表 | ✅ 存在 |
| 端到端 POST 測試 | ✅ `{"ok":true,"id":6}` 寫入成功 |
| 各頁 `keywords` SEO | ✅ 8 頁全有 |

## 誤判與修正（5T 誠實回報）
- 初判「聯絡表單無後端」→ 新建 `ftgtours-contact-worker` + wrangler.toml
- 部署發現路由被既有 `ftgtours-api` 佔用（error 10020）
- 驗證確認 `ftgtours-api` 正常服務 `/api/contact`
- **已刪除冗餘 Worker + 本地 wrangler.toml**

## 關聯
- [[FTGToursShareCopy]] — 分享文案規範
- [[CloudflareCache404]] — og-image 404 是快取陷阱非檔案缺失
- [[FTGJourneyAppArchitecture]] — 品牌生態
