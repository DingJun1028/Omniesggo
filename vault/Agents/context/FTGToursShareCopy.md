---
source_origin: oa-knowledge-avatar
created: 2026-08-29
modified: 2026-08-29
co_authors: [oa-team, hermes]
lifecycle: active
access: public-research
tags: [ftg, share-copy, seo, meta]
related: [[FTGJourneyAppArchitecture]] [[WebsiteGapAudit]]
---

# FTG 官網分享文案規範 · 知識分身

> 官網 `ftgtours.esggo.co` 分享時（OG/Twitter/搜尋結果）出現的介紹文案，由使用者 2026-08-26 指定。

## 指定文案（聚焦主題）
> 墾趣結合戶外導覽、旅行服務與在地連結，為企業設計兼顧員工身心健康、團隊連結、環境友善與地方價值的旅程。

## 實施位置（5T Traceable）
- `index.html`：`description` / `og:description` / `twitter:description` 三處
- `src/utils/seo.js`：`DEFAULT_DESCRIPTION` 常數（中文預設）
- `src/pages/Home.jsx`：`usePageSeo` 的 `description` 改為 `t('home.metaDesc')`（依語言動態取）
- `src/i18n/translations.js`：zh + en 各加 `home.metaDesc` 鍵

## 中英對照
| 語言 | metaDesc |
|------|----------|
| zh | 墾趣結合戶外導覽、旅行服務與在地連結，為企業設計兼顧員工身心健康、團隊連結、環境友善與地方價值的旅程。 |
| en | FTG TOURS blends outdoor guiding, travel services and local connections to design journeys that care for employee wellbeing, team bonding, environmental friendliness and local value. |

## 驗證（5T Transparent）
- 線上 `curl ftgtours.esggo.co` grep `og:description` = 指定文案 ✅
- 英文 bundle 含 `blends outdoor guiding` ✅

## 關聯
- [[FTGJourneyAppArchitecture]] — 旅程 App 與官網同品牌
- [[WebsiteGapAudit]] — 官網優化缺口補齊
