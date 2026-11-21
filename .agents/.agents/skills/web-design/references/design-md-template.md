# DESIGN.md Template

Phase B 輸出 DESIGN.md 時按此模板生成。9 個標準章節，每個都必須有實質內容。

---

## 模板

```markdown
# DESIGN.md

> {{一句話設計宣言}}

## 1. Visual Theme & Atmosphere

**Style**: {{風格名稱}}
**Keywords**: {{5-8 個設計關鍵詞}}
**Tone**: {{調性描述}} — NOT {{反面關鍵詞}}
**Feel**: {{一句感性描述，用比喻}}

**Interaction Tier**: {{L1 精緻靜態 / L2 流暢互動 / L3 沉浸體驗}}
**Dependencies**: {{CSS only / GSAP + ScrollTrigger / GSAP + ScrollTrigger + Lenis}}

## 2. Color Palette & Roles

```css
:root {
  /* Backgrounds */
  --bg: {{主背景}};                          /* 頁面背景 */
  --surface: {{表面}};                       /* 卡片/容器 */
  --surface-alt: {{次級表面}};               /* 交替 section */
  --surface-hover: {{表面 hover}};           /* 懸停態表面 */

  /* Borders */
  --border: {{邊框}};                        /* 預設邊框 */
  --border-hover: {{邊框 hover}};            /* 懸停邊框 */

  /* Text */
  --text: {{主文字}};                        /* 標題、重要文字 */
  --text-secondary: {{次文字}};              /* 正文、描述 */
  --text-tertiary: {{三級文字}};             /* 標籤、輔助資訊 */

  /* Accent */
  --accent: {{主強調色}};                    /* CTA、連結、活躍態 */
  --accent-hover: {{強調色 hover}};

  /* RGB variants for rgba() */
  --bg-rgb: {{r,g,b}};
  --accent-rgb: {{r,g,b}};

  /* Semantic */
  --success: {{成功色}};
  --error: {{錯誤色}};
  --warning: {{警告色}};
}
```

**Color Rules:**
- {{規則 1，如"所有顏色通過 CSS 變數引用，禁止硬編碼 hex"}}
- {{規則 2，如"同一 section 內只用一個強調色"}}
- {{規則 3}}

## 3. Typography Rules

**Font Stack:**
```css
@import url('{{Google Fonts URL}}');
```

| Role | Font | Size | Weight | Line Height | Letter Spacing |
|------|------|------|--------|-------------|----------------|
| Hero H1 | {{font}} | {{size}} | {{weight}} | {{lh}} | {{ls}} |
| Section H2 | {{font}} | {{size}} | {{weight}} | {{lh}} | {{ls}} |
| H3 | {{font}} | {{size}} | {{weight}} | {{lh}} | — |
| Body | {{font}} | {{size}} | {{weight}} | {{lh}} | — |
| Label | {{font}} | {{size}} | {{weight}} | {{lh}} | {{ls}} |
| Mono/Code | {{font}} | {{size}} | {{weight}} | {{lh}} | — |

**Typography Rules:**
- {{規則，如"Heading weight ≥ 700"}}
- **NEVER use**: {{禁止字型列表}}

**Text Decoration:**
- {{按 text-decoration-rules.md 決策表判斷後的結果，如"Hero h1: 無漸變、無投影（剋制風格）"}}

## 4. Component Stylings

### Buttons
```css
{{完整 CSS，含 default / hover / active / focus / disabled}}
```

### Cards
```css
{{完整 CSS，含 default / hover / focus}}
```

### Navigation
```css
{{完整 CSS，含 scrolled 狀態（如有）}}
```

### Links
```css
{{完整 CSS，含 hover 動畫}}
```

### Tags / Badges
```css
{{完整 CSS}}
```

### {{其他場景需要的元件}}

## 5. Layout Principles

**Container:**
- Max width: {{width}}
- Padding: {{padding}}
- Narrow variant (text-heavy): {{width}}

**Spacing Scale:**
- Section padding: {{value}}
- Component gap: {{value}}
- Card internal padding: {{value}}

**Grid:**
```css
{{網格 CSS}}
```

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | {{無陰影}} | {{場景}} |
| Subtle | {{輕陰影}} | {{場景}} |
| Elevated | {{中陰影}} | {{場景}} |
| {{更多層級}} | | |

## 7. Animation & Interaction

**Motion Philosophy**: {{一句話，如"剋制優雅，只用 opacity 和 transform"}}
**Tier**: {{L1/L2/L3}}

### Dependencies
```html
{{CDN 連結（如有）}}
```

### Base Setup
```js
{{GSAP/Lenis 初始化程式碼（如有）}}
```

### Entrance Animation
```css
{{入場動畫 keyframes + 類名}}
```

### Scroll Behavior
```js
{{滾動 reveal / 視差 / pin 程式碼}}
```

### Hover & Focus States
```css
{{所有可互動元素的 hover/focus 規則}}
```

### Special Effects
{{按需包含：游標跟隨 / 頁面轉場 / 文字 reveal / 視差 / 其他}}

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  {{降級規則}}
}
```

## 8. Do's and Don'ts

### Do
- {{正面規則，至少 5 條}}

### Don't
- {{禁止項，至少 8 條，用 ❌ 字首}}

## 9. Responsive Behavior

**Breakpoints:**
| Name | Width | Key Changes |
|------|-------|-------------|
| Desktop | > {{bp}} | {{布局}} |
| Tablet | {{bp}}-{{bp}} | {{布局}} |
| Mobile | < {{bp}} | {{布局}} |

**Touch Targets:** minimum {{size}}
**Collapsing Strategy:** {{摺疊規則}}

```css
{{響應式 CSS}}
```
```

---

## 生成指導

生成 DESIGN.md 時遵循以下規則：

1. **每個章節都要有實質內容**，不能只寫標題佔位
2. **所有 CSS 必須可執行**，不是虛擬碼
3. **元件必須包含所有狀態**（default / hover / active / focus / disabled）
4. **Animation 章節不能為空**，至少包含入場和 hover
5. **Do's and Don'ts 是核心章節**——Anti-Patterns 比正面建議更能約束 AI 行為
6. **L2+ 必須包含 Reduced Motion 降級**
7. **顏色全部定義為 CSS 變數**，元件中禁止硬編碼 hex
8. **字型必須有 Google Fonts @import URL + fallback**
9. **響應式至少覆蓋 Desktop + Mobile**
10. **檔案儲存為 DESIGN.md 到專案根目錄**
