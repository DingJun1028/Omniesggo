---
name: oa-design-fix
description: "Use when the user reports color issues, dark theme appearing, broken styles, or visual bugs. Diagnoses and fixes light theme violations across the ESGGO project. Checks for dark backgrounds, glass/blur effects, wrong text colors, and ensures Berkeley Blue #003262 + Gold #FDB515 compliance."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [design-fix, ui, theme, compliance, esggo]
    related_skills: [oa-summon, oa-page-builder, oa-ui-design-system, oa-5t-enforcer]
---

# OA Design Fix — 設計修復器 v2

## Overview

診斷並修復 ESGGO 專案中的亮色主題違規問題。確保全站符合 OmniBase 設計系統：白底、Berkeley Blue #003262 主色、Gold #FDB515 強調色。

## When to Use

- 用戶回報顏色問題、深色主題出現、樣式錯亂
- 用戶說「修復設計」、「修復樣式」、「亮色主題違規」
- 部署前設計合規檢查

**Don't use for:** 頁面建置（用 `oa-page-builder`）、部署（用 `oa-deploy`）、驗證（用 `oa-5t-enforcer`）

## Core Workflow

### Step 1: 掃描違規

```bash
cd /c/var/www/esggo
# 搜尋深色背景
grep -r "bg-gray-900\|bg-black\|bg-slate-900\|dark:" src/ --include="*.tsx" --include="*.ts"
# 搜尋玻璃/模糊效果
grep -r "backdrop-blur\|bg-opacity-[0-9]\|glass" src/ --include="*.tsx" --include="*.ts"
# 搜尋錯誤文字顏色
grep -r "text-white\|text-gray-100\|text-gray-200" src/ --include="*.tsx" --include="*.ts"
```

### Step 2: 修復違規

| 違規類型 | 修復目標 |
|----------|----------|
| 深色背景 | `bg-white` 或 `bg-gray-50` |
| 玻璃/模糊 | 移除 `backdrop-blur`、`bg-opacity` |
| 白色文字 | `text-berkeley-blue` 或 `text-gray-900` |
| 缺少 Gold 強調 | 關鍵元素加上 `text-gold` `bg-gold` `border-gold` |

### Step 3: 驗證修復

```bash
pnpm build
# 視覺回歸測試
```

## Design Token Reference

```css
/* 必須使用的設計 token */
--color-primary: #003262;      /* Berkeley Blue */
--color-accent: #FDB515;       /* Gold */
--color-bg: #FFFFFF;           /* White */
--color-bg-secondary: #F5F5F5; /* Light Gray */
--color-border: #E5E5E5;       /* Border Gray */
--color-text-primary: #003262; /* Berkeley Blue */
--color-text-secondary: #525252; /* Neutral Gray */
```

## Common Pitfalls

1. **只修表面不修根本** — 必須找到來源檔案（通常在 `lib/omni-base` 或 `components/omnibase`）
2. **遺漏 Client Component** — `'use client'` 檔案也要檢查
3. **Tailwind 類別動態拼接** — `className={\`bg-\${color}\`}` 會漏掉 grep，需手動檢查
4. **第三方元件庫** — 確認是否覆蓋了設計系統樣式

## Verification Checklist

- [ ] 無深色背景類別
- [ ] 無玻璃/模糊效果
- [ ] 所有文字符合 Berkeley Blue / Neutral Gray
- [ ] 關鍵互動元素有 Gold 強調
- [ ] `pnpm build` 通過
- [ ] Git 提交