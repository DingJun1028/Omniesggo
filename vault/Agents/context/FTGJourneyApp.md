---
tags: [ftg, journey, esggo, react, tailwind, express, sqlite, 5t]
created: 2026-08-29
source_origin: GitHub-Actions-Error
co_authors: [QueenBee, OA-Twins]
---

# FTG Journey App v1.0

> 永續旅程管理平台 — 將官網承諾的 6 大服務對映到 App 功能的完整實作。

## 系統架構

```
前端：React 19 + Vite + Tailwind CSS + framer-motion
後端：Express + node:sqlite（內建 SQLite）
認證：Google OAuth 2.0 + JWT (HS256)
部署：nginx + Let's Encrypt + Cloudflare DNS
```

## 六大核心功能

| 功能 | 官網頁面 | App 元件 | 狀態 |
|------|---------|---------|------|
| 安全檢查清單 | 企業員工旅遊 | JourneyDetail > PrepTab | ✅ |
| ESG 任務追蹤 | ESG 戶外團隊日 | SustainTab | ✅ |
| Impact Note 報告 | ESG Impact Note | ImpactNotePage | ✅ |
| 親子任務卡 | 企業家庭日 | FamilyDay.jsx | ✅ |
| 身心健康追蹤 | 員工身心平衡 | Wellbeing.jsx | ✅ |
| 共識營工具 | 高階主管共識營 | Executive.jsx | ✅ |

## 資料表設計

| 資料表 | 用途 |
|--------|------|
| users | 用戶資料 + 角色權限 |
| journeys | 旅程主檔 |
| journeys_members | 成員關聯 + 公開同意 |
| prep_items | 準備事項 |
| schedule | 行程安排 |
| notes | 日記筆記 |
| impact | 影響力指標 |

## 路由結構

```
/                     → Dashboard（旅程列表）
/journey/:id          → JourneyDetail（5 Tab 詳情）
/journey/:id/impact-note → ImpactNotePage（報告產出）
/family-day           → FamilyDay 功能
/wellbeing            → Wellbeing 功能
/executive            → Executive 功能
/login                → Google 登入
```

## API 端點

| 方法 | 路徑 | 説明 |
|------|------|------|
| POST | /api/auth/google | Token 交換 |
| GET | /api/journeys | 旅程列表 |
| POST | /api/journeys | 建立旅程 |
| GET | /api/journeys/:id/prep | 準備事項 |
| GET | /api/journeys/:id/schedule | 行程 |
| GET | /api/journeys/:id/notes | 筆記 |
| GET | /api/journeys/:id/impact | 影響力 |
| GET | /api/journeys/:id/members | 成員 |
| POST | /api/upload | 檔案上傳 |
| POST | /api/refresh | JWT 刷新 |

## 部署位置

- 前端：`https://journey.ftgtours.esggo.co`
- API：`https://journey-api.ftgtours.esggo.co`
- VPS：`/var/www/ftg-journey-web/`（前端）+ `pm2 ftg-journey-server`（後端）

## 安全性

- HMAC-SHA256 Webhook 驗證
- JWT + 速率限制（120 req/min）
- SQL 參數化查詢
- React XSS 自動跳脫
- Let's Encrypt SSL

## 5T 治理

- **Traceable**：`source_origin: GitHub-Actions-Error`
- **Trackable**：UUID + 生命週期
- **Tangible**：Telegram 修復通知
- **Transparent**：零幻覺驗算
- **Trustworthy**：SHA-256 + Object.freeze()

## 已知限制

1. 照片上傳尚無後端端點
2. 成員管理 API 尚無端點
3. 無 WebSocket 即時通知
4. 無 PWA 離線支援

## 進化路線

- [ ] 照片/檔案上傳
- [ ] 成員管理 API
- [ ] JWT 自動刷新
- [ ] WebSocket 即時通知
- [ ] PWA 離線支援
- [ ] 多語言國際化
- [ ] 深色模式
