---
name: oa-ui-design-system
description: "ESGGO 系統級四大萬能（OmniTag/OmniBase/OmniAgent/OmniTheme）+ 5T 協議 + Solid Card 設計系統 + v5 萬能系統版（28章×28萬字）。使用時機：建立新頁面、重構 UI 元件、設計審核、永續報告（24/28章）、VPS 部署除錯、AI 模型測試、Hermes config 注入、知識教學平台、系統級架構調整。"
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [ui, design-system, omnibase, omnitag, omniagent, omniteme, solid-card, 5t, esggo]
    related_skills: [oa-summon, oa-page-builder, oa-design-fix, oa-5t-enforcer]
---

# OA UI Design System — 系統級設計系統 v2

## Overview

ESGGO 四大萬能系統級基礎設施：OmniTag（標籤）、OmniBase（基礎）、OmniAgent（代理）、OmniTheme（主題）。統一設計語言、元件庫、Token、5T 協議整合。

## When to Use

- 用戶說「設計系統」、「OmniBase」、「OmniTag」、「四大萬能」、「UI 元件庫」
- 建立新頁面、重構元件、設計審核

**Don't use for:** 頁面建置（用 `oa-page-builder`）、設計修復（用 `oa-design-fix`）

## Four Omni Systems (系統級 lib/omni-*)

```
src/lib/
├── omni-tag/       # 標籤系統：語義標記、微資料、結構化數據
├── omni-base/      # 基礎元件：Card、Button、Grid、Typography、Form
├── omni-agent/     # 代理介面：Chat、ToolCall、Status、Stream
├── omni-theme/     # 主題系統：Token、Color、Spacing、Dark/Light
```

## Design Tokens (OmniTheme)

```typescript
// src/lib/omni-theme/tokens.ts
export const tokens = {
  color: {
    primary: '#003262',      // Berkeley Blue
    accent: '#FDB515',       // Gold
    bg: '#FFFFFF',           // White
    bgSecondary: '#F5F5F5',  // Light Gray
    border: '#E5E5E5',       // Border Gray
    textPrimary: '#003262',  // Berkeley Blue
    textSecondary: '#525252', // Neutral Gray
    success: '#166534',      // Green
    warning: '#854D0E',      // Amber
    error: '#991B1B',        // Red
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 4, md: 8, lg: 12, xl: 16, full: 9999 },
  shadow: { sm: '0 1px 2px', md: '0 4px 6px', lg: '0 10px 15px', xl: '0 20px 25px' },
  font: { mono: 'JetBrains Mono', sans: 'Inter', serif: 'Source Serif 4' },
};
```

## OmniBase Components (v3.7)

| 元件 | 用途 | 關鍵 Props |
|------|------|------------|
| `OmniCard` | 內容容器 | `variant: 'default' \| 'elevated' \| 'outlined'`, `hover?: boolean` |
| `OmniButton` | 行動按鈕 | `variant: 'primary' \| 'secondary' \| 'ghost' \| 'danger'`, `size` |
| `OmniGrid` | 響應式網格 | `cols: { base: 1, md: 2, lg: 3, xl: 4 }`, `gap` |
| `OmniTypography` | 文字層級 | `variant: 'h1'..'h6' \| 'body' \| 'caption' \| 'code'` |
| `OmniForm` | 表單封裝 | `schema: ZodSchema`, `onSubmit` |
| `OmniBadge` | 狀態標籤 | `variant: 'default' \| 'success' \| 'warning' \| 'error'` |
| `OmniAvatar` | 用戶頭像 | `src`, `fallback`, `size` |
| `OmniTooltip` | 提示浮層 | `content`, `position` |

## OmniTag System

```typescript
// 語義標記範例
<OmniTag.Item 
  itemType="https://schema.org/Corporation"
  properties={{
    name: "台積電",
    ticker: "2330.TW",
    esgScore: { environment: 85, social: 78, governance: 92 }
  }}
>
  <OmniCard>...</OmniCard>
</OmniTag.Item>
```

## Solid Card Design Rules

1. **白底** — `bg-white`
2. **陰影** — `shadow-md` 預設，`hover:shadow-xl`
3. **圓角** — `rounded-lg` (12px)
4. **邊框** — `border border-gray-200`
5. **Hover 升高** — `transition-shadow transform hover:-translate-y-1`
6. **Gold 強調** — 關鍵數字、CTA、邊框 hover

## 5T Integration

| 5T 維度 | 設計系統對應 |
|---------|-------------|
| Truth | Token 來源可追溯、版本控制 |
| Goodness | 元件決策記錄、設計審核流程 |
| Beauty | 一致性檢查、視覺回歸測試 |
| Trust | Token 不可變、Schema 驗證 |
| Transferful | 文檔公開、Storybook、Figma 同步 |

## Common Pitfalls

1. **使用舊版 design-system** — 已廢棄，必須用 `lib/omni-*`
2. **硬編碼顏色** — 全部用 Token
3. **暗色模式殘留** — ESGGO 僅支援亮色
4. **元件庫外部依賴** — 禁止引入 shadcn/ui、Radix 等外部庫

## Verification Checklist

- [ ] 所有元件使用 OmniBase
- [ ] Token 統一管理
- [ ] 無硬編碼顏色
- [ ] 無暗色模式類別
- [ ] Solid Card 風格一致
- [ ] 5T 文檔完整