---
name: oa-page-builder
description: "Use when the user provides a design guide table (spec table) and asks to create or rebuild a Next.js page. Generates page components following ESGGO design conventions: light theme only, Berkeley Blue #003262 primary, Gold #FDB515 accent, no dark/glass/liquid effects."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [page-builder, spec-table, nextjs, ui, esggo]
    related_skills: [oa-summon, oa-design-fix, oa-ui-design-system, oa-5t-enforcer]
---

# OA Page Builder — 規格表建頁器 v2

## Overview

根據設計指南表（spec table）自動生成符合 ESGGO 設計規範的 Next.js 頁面組件。零算力組裝，輸出可直接部署的程式碼。

## When to Use

- 用戶提供 spec table 要求建立頁面
- 用戶說「建立頁面」、「依規格建頁」、「spec table 轉頁面」
- 需要重構現有頁面符合設計系統

**Don't use for:** 設計審核（用 `oa-design-fix`）、部署（用 `oa-deploy`）、驗證（用 `oa-5t-enforcer`）

## Spec Table Format

| 區塊 | 類型 | 內容 | 樣式備註 |
|------|------|------|----------|
| hero | Hero | 標題、副標、CTA、背景圖 | Berkeley Blue 文字 |
| stats | StatsGrid | 3-4 個關鍵指標 | 金色數字 |
| features | FeatureCards | 3-6 張功能卡片 | Solid Card 風格 |
| cta | CTASection | 行動呼籲區 | 金色按鈕 |

## Core Workflow

### Step 1: 解析 Spec Table

```bash
# 讀取用戶提供的 spec table（通常在聊天中或檔案中）
# 解析為結構化 JSON
```

### Step 2: 生成頁面組件

```typescript
// 輸出路徑：src/app/<route>/page.tsx
// 使用 OmniBase 元件：<OmniBase.Card>, <OmniBase.Button>, <OmniBase.Grid>
```

### Step 3: 驗證建置

```bash
cd /c/var/www/esggo
pnpm build
```

### Step 4: 5T 驗證

```bash
# 執行 oa-5t-enforcer 驗證
```

## Design Compliance Checklist

- [ ] **Light theme only** — 無深色背景、無玻璃/模糊效果
- [ ] **Berkeley Blue #003262** — 主標題、主要文字、主要邊框
- [ ] **Gold #FDB515** — 強調色、CTA 按鈕、關鍵數字、hover 狀態
- [ ] **White #FFFFFF** — 背景、卡片背景
- [ ] **Neutral Gray #F5F5F5 / #E5E5E5** — 次要背景、分隔線
- [ ] **OmniBase 元件** — 使用 `lib/omni-base/components` 導出的元件
- [ ] **Solid Card** — 白底、陰影、圓角、hover 升高
- [ ] **無液態/玻璃/暗色效果**

## Output Structure

```
src/app/<route>/
├── page.tsx          # 主頁面（Server Component）
├── components/
│   ├── Hero.tsx
│   ├── StatsGrid.tsx
│   ├── FeatureCards.tsx
│   └── CTASection.tsx
└── types.ts          # 區塊型別定義
```

## Common Pitfalls

1. **使用舊版設計系統** — 必須用 `lib/omni-base`（系統級），不可用 `lib/design-system` 或 `components/ui`
2. **暗色主題殘留** — 所有背景必須白色，文字 Berkeley Blue
3. **缺少 Gold 強調** — 關鍵數字、CTA、hover 必須有 Gold #FDB515
4. **硬編碼顏色** — 必須用設計系統 token，不可直接寫 hex
5. **Client Component 濫用** — 預設 Server Component，只有互動才用 `'use client'`

## Verification Checklist

- [ ] Spec table 解析正確
- [ ] 頁面組件生成完成
- [ ] `pnpm build` 通過
- [ ] `oa-5t-enforcer` 驗證通過
- [ ] Git 提交