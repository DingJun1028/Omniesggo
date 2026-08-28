---
source_origin: oa-knowledge-avatar
created: 2026-08-29
modified: 2026-08-29
co_authors: [oa-team, hermes]
lifecycle: active
access: public-research
tags: [ftg, journey-app, pwa, oracle, swarm]
related: [[AStationSevenModules]] [[OracleAlwaysFreeResearch]] [[FTGToursShareCopy]] [[WebsiteGapAudit]] [[RecaptchaV3Frontend]]
---

# FTG 永續旅程 App 架構 · 知識分身

> 與墾趣旅遊 FTG TOURS 企業戶外方案對應的旅程 Companion App。純前端 PWA + Oracle 後端，全功能旅程前中後管理。

## 核心架構（5T 對映）
- **Traceable**：code 落 `C:/Users/dingj/ftg-journey/`，每 module 標 source_origin
- **Trackable**：IndexedDB (前端) + SQLite via node:sqlite (後端) 雙軌
- **Tangible**：使用者看到 RWD UI（ftg 色系、行動優先）
- **Transparent**：Google OAuth id_token + 四角色權限（admin/guide/staff/member）
- **Trustworthy**：去敏化匯出符合台灣個資法（consentPublic 欄位 + 遮蔽姓名/電話/email/idNo）

## 功能矩陣
| 階段 | 功能 |
|------|------|
| 旅程前 | 準備清單（人選/護照/文件/錢/物品/流程 六大類自訂）、機票、飯店 |
| 旅程中 | 旅程表+鬧鐘、重要時刻提醒、工具組（點名/聯絡/紀念品/停靠/計時/訂餐/旅館） |
| 旅程後 | 心得、照片分享、滿意度、舊地重遊、永續專案+成果追蹤+報告 |
| 後台 | 導遊/行政專區、成員一覽、CRM/BD、匯入匯出 |

## 部署拓撲
- 前端：`journey.ftgtours.esggo.co` → GitHub Pages（Vite+React+Tailwind PWA）
- 後端：`journey-api.ftgtours.esggo.co` → Oracle Always Free VPS (esggo-vps ARM aarch64) → systemd + nginx + Let's Encrypt
- 角色權限：Google Identity Services (GIS) id_token 隱式流程（純前端可行），server 端 `node:sqlite` 跨裝置同步

## 經驗（Absorb 吸收，正確+錯誤變體皆存）
- ✅ node:sqlite 跨平台（Win/ARM 皆可用，免 better-sqlite3 原生編譯）
- ✅ Oracle Always Free 額度：AMD E2.Micro 限 2 台 + ARM A1.Flex 限 4OCPU/24GB（esggo-vps + oa-worker-01 已滿，新建被拒 LimitExceeded）
- ⚠️ GitHub Pages custom domain 拼字錯誤 `journey.ftgours.esggo.co`（ftgours 少 t）導致證書簽給錯域名 → 用 API 改 cname 修正
- ⚠️ 子域 DNS-only 模式 + Let's Encrypt certbot 直連最穩（繞過 Cloudflare SSL 模式權限）

## 關聯
- [[AStationSevenModules]] — AI Station 7 模組生產線對應旅程內容產製
- [[OracleAlwaysFreeResearch]] — VPS 部署基礎設施
- [[FTGToursShareCopy]] — 官網分享文案規範
- [[WebsiteGapAudit]] — 官網缺口補齊清單
- [[RecaptchaV3Frontend]] — 聯絡表單防垃圾架構
