# 高科生技官方網站 — 品牌元件規格

> 色彩請先使用 `docs/brand/htb-content-modules.md` 與 `src/styles/brand-htb.css` 的設計 Token；避免額外引入 ESGGO 既有品牌色。

---

## 1. 按鈕 Button

| 元件 | 規格 |
| --- | --- |
| 主 CTA | `background: var(--sprout)` / `color: #14301a` / `padding: 12px 16px` / `border-radius: 12px` / `font-weight: 700` |
| 次要 CTA | `background: var(--deep-sea)` / `color: #fff` / `border-radius: 12px` / `font-weight: 700` |
|  ghost 按鈕 | `background: #fff` / `color: var(--charcoal)` / `border: 1px solid #e5e7eb` / `border-radius: 12px` |
| 最小觸控尺寸 | `min-height: 44px` |
| 禁用狀態 | `opacity: 0.6` / `cursor: not-allowed` |

---

## 2. 卡片 Card

| 元件 | 規格 |
| --- | --- |
| 基礎卡片 | `background: #fff` / `border: 1px solid #e5e7eb` / `border-radius: 14px` / `padding: 14px` |
| 數據卡 | 數字用 `font-size: 26px` / `font-weight: 800` / `color: var(--deep-sea)` |
| 科技推力卡 | `border-left: 4px solid var(--deep-sea)` |
| 經濟拉力卡 | `border-left: 4px solid var(--sprout)` |
| 陰影 | 預設 `box-shadow: 0 1px 3px rgba(0,0,0,0.06)`；可選 hover `0 8px 24px rgba(0,0,0,0.08)` |

---

## 3. 圖說 Image Caption

| 元件 | 規格 |
| --- | --- |
| 圖說容器 | `border-radius: 14px` / `overflow: hidden` / `background: #fff` / `border: 1px solid #e5e7eb` |
| 主標 | `font-size: 13px` / `font-weight: 700` / `margin: 0 0 4px` |
| 內文 | `font-size: 12px` / `color: #374151` / `line-height: 1.5` |
| 替代圖 | 未提供實拍時使用漸層占位，禁止出現藍紫霓虹、機器人大腦、漂浮數據 |

---

## 4. 導航 Navigation

| 元件 | 規格 |
| --- | --- |
| 高度 | `min-height: 52px` |
| 底線 | `border-bottom: 3px solid var(--sprout)` |
| Logo 區 | 左側固定；品牌標準字保持 `font-weight: 700` |
| 選單 | 漢堡按鈕 `34x34` / `border-radius: 8px` |
| 吸頂 | `position: sticky; top: 0; z-index: 10` |

---

## 5. 信任標章 Trust Badge

| 元件 | 規格 |
| --- | --- |
| 通過 | `background: #d1fae5` / `color: #064e3b` / `padding: 4px 8px` / `border-radius: 999px` / `font-size: 12px` / `font-weight: 700` |
| 資訊 | `background: #dbeafe` / `color: #0f3b66` / 其餘同上 |

---

## 6. 頁尾 Footer

| 元件 | 規格 |
| --- | --- |
| 背景 | `background: #fff` / `border-top: 1px solid #e5e7eb` |
| 品牌行 | `font-size: 14px` / `font-weight: 700` |
| 內文 | `font-size: 12px` / `color: #374151` / `line-height: 1.6` |

---

## 7. 響應式斷點

| 斷點 | 說明 |
| --- | --- |
| Mobile first | 預設單欄、滿版卡片、觸控友善 |
| `>= 640px` | 資料卡可改 2 欄；限制最大寬度 `max-width: 640px` |
| `>= 768px` | 可展開側欄選單；內容最大寬度 `max-width: 768px` |

---

## 8. 字級節奏

| 用途 | 大小 | 字重 |
| --- | --- | --- |
| 頁首品牌 | 15px | 700 |
| Hero 主標 | 26px | 800 |
| 區塊標題 | 20px | 800 |
| 內文 | 14px | 400 |
| 圖說 | 12–13px | 400/700 |
| 輔助說明 | 12px | 400 |

---

## 9. 間距節奏

| 用途 | 數值 |
| --- | --- |
| 頁內左右安全距 | `16px` |
| 段落間距 | `12px` / `24px` |
| 卡片間距 | `12px` |
| 區塊上下 padding | `24px 16px` |

---

## 10. 內容邊界

- 所有第三方機構名稱需避免暗示未完成合作。
- 收益數據預留免責微字：「依實際場域條件可能有所差異」。
- 禁用視覺：藍紫霓虹、機器人大腦、漂浮數據。

---

*Generated for High-Tech Seaweed official website design system.*
