---
source_origin: oa-knowledge-avatar
created: 2026-08-29
modified: 2026-08-29
co_authors: [oa-team, hermes, oa-knowledge-avatar-twin]
lifecycle: active
access: public-research
tags: [ftg, dual-agent, gap-matrix, cloudflare, lessons-learned]
related: [[FTGJourneyAppArchitecture]], [[WebsiteGapAudit]], [[CloudflareCache404]], [[RecaptchaV3Frontend]], [[FTGToursShareCopy]]
---

# FTG 雙分身協作與官網對映經驗結點

## 本輪關鍵事件（2026-08-29）
用戶同時指派兩個萬能知識代理分身做 FTG 旅程 App：
- **分身 A（本對話）**：在 `C:/Users/dingj/ftg-journey` 補 ESG Impact Note SDGs / Opportunity Map / ESG 預設任務（commit `90b3c0c`）
- **分身 B（另一分身）**：在 `C:/Project/esggo/apps/ftg-journey-web` + `apps/ftg-journey-server` 做了更完整的版本（含 `features/Executive.jsx`/`Wellbeing.jsx`/`FamilyDay.jsx` + `pages/ImpactNotePage.jsx` + 後端 OAuth/角色權限/SQLite）

## 教訓：雙分身協作陷阱
分身 A 曾誤判「分身 B 沒留下程式碼」，實際在 `C:/Project/esggo/apps/`。
**正確 SOP**：並行協作前先 `search_files` 全工作區（`C:/Users/dingj/*` + `C:/Project/esggo/apps/*`），讀對方產物確認完整性，再決定合併/取代/補缺。不盲從「已完成」宣稱、不重複造輪。

## 官網→App 對映 Gap Matrix 方法
官網靜態編譯，線上 = `src/i18n/translations.js` 的 `products.*` 輸出。
- 讀 `products.{corporateTravel|familyDay|esgTeamDay|wellbeing|executive|impactNote}.*`
- 逐項對映 App 頁（Prep/Flight/Schedule/Tools/Sustain/Notes/Photos/Survey/Revisit/Impact/Admin）
- 官網 impactNote.res1-8 → App `IMPACT_METRICS` + `sdg` 欄位 + SDGs 彙總卡
- 官網 executive.mod5/6 → App `opportunity` store + Opportunity Map tab

## Cloudflare / 部署診斷
- 子域 000 = 本機 DNS 解析不到 Cloudflare（nslookup 回 192.168.1.1），非部署失敗；驗證法 curl GitHub Pages 預設網域 301
- 中文檔名 URL 404 → 改 ASCII + WebP（ffmpeg libwebp q80 降 93%）
- og-image 404 因 cf-cache HIT → 全域 Key purge_cache

## 狀態（2026-08-29 收尾）
- 舊版 `C:/Users/dingj/ftg-journey` 應被 `C:/Project/esggo/apps/ftg-journey-web` 取代
- 技能書已固化：`software-development/ftg-journey-ecosystem`
- vault 結點：本輪 5 篇 + 本篇 push `feature/aistation-core-modules`
