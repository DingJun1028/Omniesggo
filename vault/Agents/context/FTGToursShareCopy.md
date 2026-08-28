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

> 官網 `ftgtours.esggo.co` 分享時（OG/Twitter/meta description）出現的介紹文案，由使用者指定聚焦主題。

## 指定文案（繁體中文）
```
墾趣結合戶外導覽、旅行服務與在地連結，為企業設計兼顧員工身心健康、團隊連結、環境友善與地方價值的旅程。
```

## 英文對應（EN）
```
FTG TOURS blends outdoor guiding, travel services and local connections to design journeys that care for employee wellbeing, team bonding, environmental friendliness and local value.
```

## 實施位置（5T Traceable）
- `index.html`：`description` + `og:description` + `twitter:description` + `og:image`
- `src/utils/seo.js`：`DEFAULT_DESCRIPTION`（中文預設）
- `src/pages/Home.jsx`：`usePageSeo({ description: t('home.metaDesc') })`
- `src/i18n/translations.js`：zh/en 各加 `home.metaDesc` 鍵（i18n 動態取，避免硬編碼）

## 經驗
- ⚠️ 首頁 description 原為硬編碼中文，英文版切換時不變 → 改為 `t('home.metaDesc')` 依語言取
- ✅ 分享圖 `og-image.svg`（1200×630）放 `public/`，index.html 加 `og:image` / `twitter:image`
- ✅ 各服務子頁 metaDesc 中英文鍵需對齊（audit 確認 8 頁全有）

## 關聯
- [[FTGJourneyAppArchitecture]] — FTG 旅程 App 與官網同源品牌
- [[WebsiteGapAudit]] — 官網缺口補齊（含 meta/OG/favicon）
