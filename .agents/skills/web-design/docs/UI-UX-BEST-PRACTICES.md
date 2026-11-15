# RWD/UI/UX 使用者友好最佳實踐

> 響應式網站設計（RWD）／使用者介面（UI）／使用者體驗（UX）最佳實踐指南。
> 依循業界標準與可存取性（Accessibility）原則，打造跨裝置、易用、友善的使用者介面。

---

## 📋 目錄

1. [設計原則](#1-設計原則)
2. [響應式設計（RWD）最佳實踐](#2-響應式設計rwd-最佳實踐)
3. [使用者介面（UI）設計最佳實踐](#3-使用者介面ui-設計最佳實踐)
4. [使用者體驗（UX）設計最佳實踐](#4-使用者體驗ux-設計最佳實踐)
5. [存取性（Accessibility）](#5-存取性accessibility)
6. [互動模式](#6-互動模式)
7. [色彩與排版系統](#7-色彩與排版系統)
8. [間距與階層系統](#8-間距與層級系統)
9. [觸控與點擊目標](#9-觸控與點擊目標)
10. [可存取性檢查清單](#10-可存取性檢查清單)
11. [質量檢查清單](#11-質量檢查清單)
12. [常見反模式](#12-常見反模式)
13. [參考資源](#13-參考資源)

---

## 1. 設計原則

### 1.1 四個核心原則

```
1. 發展性（Responsive）
   → 適合所有裝置尺寸：桌面、平板、行動裝置

2. 可存取性（Accessible）
   → 所有使用者（含殘障使用者）都能使用

3. 易用性（Usable）
   → 直覺、快速、低認知負擔

4. 一致性（Consistent）
   → 跨頁面、跨功能的視覺與行為一致
```

### 1.2 設計哲學

| 角度 | 核心問題 | 最佳實踐 |
|------|----------|----------|
| **Chemistry** | 你要傳達什麼感覺？ | 一致、專業、自信、有溫度 |
| **Balance** | 視覺元素如何分佈？ | 留白、對齊、比例、重量 |
| **Hierarchy** | 使用者最先看到什麼？ | 標題→副標題→正文→CTA 的隱性層級 |
| **Feedback** | 使用者操作後是否有回饋？ | 即時、明確、相稱 |
| **Efficiency** | 使用者能快速完成任務？ | 減少步驟、快捷鍵、預設值 |

### 1.3 使用者中心設計（UCD）流程

```
需求分析 → 設計原始稿 → 原型測試 → 評估改進 → 釋出 → 監測迭代
```

---

## 2. 響應式設計（RWD）最佳實踐

### 2.1 斷點設計

| 裝置 | 寬度 | 常用佈局 |
|------|------|----------|
| 移動裝置 | < 600px | 單欄、堆疊 |
| 平板 | 600–899px | 雙欄或兩列 |
| 桌面 | 900–1199px | 多欄、複雜佈局 |
| 大桌面 | ≥ 1200px | 優先顯示、噪音較多 |

**基本 CSS 變數**：

```css
:root {
  --breakpoint-sm: 600px;
  --breakpoint-md: 899px;
  --breakpoint-lg: 1199px;
  --breakpoint-xl: 1200px;
}
```

### 2.2 核心結構

```css
/* 容器 */
.container {
  width: 100%;
  max-width: 1200px;
  margin-inline: auto;
  padding-inline: 1rem;
}

/* 網格系統 */
.grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* 移動裝置優先 */
@media (min-width: 768px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

### 2.3 移動端優先策略

```
小屏幕 → 大屏幕
```

```
Mobile First:
- 基礎樣式面向手機
- 再用 @media (min-width:) 增強

Desktop First:
- 基礎樣式面向桌面
- 再用 @media (max-width:) 瘦身

✅ 推薦：Mobile First（性能好、可訪問性好）
```

### 2.4 圖片與影像

```css
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
  height: auto;
}

/* 軟體影像 */
img { image-rendering: auto; }
```

### 2.5 字體縮放

```css
/* 預設：遷移到更大的字體 */
html { font-size: 100%; }

/* 固定場景 */
.big-text { font-size: 1.2rem; }
```

---

## 3. 使用者介面（UI）設計最佳實踐

### 3.1 色彩系統

#### 3.1.1 色彩角色分配

| 色彩 | 角色 |
|------|------|
| 主色 | 品牌識別、主要按鈕、連結 |
| 次要色 | 强調、圖示、標籤 |
| 背景色 | 頁面、卡片、容器 |
| 文字色 | 標題、副標題、正文 |
| 錯誤色 | 表單錯誤、危險操作 |
| 成功色 | 成功通知、確認 |
| 警告色 | 警告、候選 |
| 資訊色 | 提示、提示訊息 |

#### 3.1.2 三階層色彩

```css
:root {
  /* 主色 */
  --color-primary: #6366f1;
  --color-primary-light: #818cf8;
  --color-primary-dark: #4f46e5;

  /* 文字 */
  --color-text: #1f2937;
  --color-text-secondary: #6b7280;
  --color-text-tertiary: #9ca3af;

  /* 背景 */
  --color-bg: #ffffff;
  --color-bg-surface: #f9fafb;
  --color-bg-alt: #f3f4f6;
}
```

### 3.2 字型系統

#### 3.2.1 字型分層

| 角色 | 字體 | 字號 | 粗細 | 行高 | 字間 |
|------|------|------|------|------|------|
| 標題 H1 | Noto Sans SC | 2rem+ | 700+ | 1.3 | 0 |
| 標題 H2 | Noto Sans SC | 1.5rem | 600 | 1.4 | 0 |
| 標題 H3 | Noto Sans SC | 1.25rem | 600 | 1.4 | 0 |
| 正文 | Noto Sans SC | 1rem | 400 | 1.7 | 0.02em |
| 輔助文字 | Noto Sans SC | 0.875rem | 400 | 1.5 | 0.01em |
| 標籤 | Noto Sans SC | 0.75rem | 500 | 1.4 | 0.05em |
| 程式碼 | JetBrains Mono | 0.875rem | 400 | 1.5 | 0.05em |

#### 3.2.2 字型降級

```css
body {
  font-family: "Noto Sans SC", "Noto Sans TC", "Noto Sans", "Arial", sans-serif;
}
```

### 3.3 元件設計

#### 3.3.1 按鈕（Button）

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  border: 2px solid transparent;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  outline: none;
  min-height: 44px;
}

.btn-primary {
  background: var(--color-primary);
  color: #fff;
}

.btn-primary:hover {
  background: var(--color-primary-dark);
}

.btn-primary:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

#### 3.3.2 卡片（Card）

```css
.card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  padding: 1.25rem;
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.card:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

#### 3.3.3 導航（Navigation）

```css
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border);
}

.nav__list {
  display: flex;
  gap: 1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}

.nav__link {
  display: inline-flex;
  align-items: center;
  padding: 0.75rem 1rem;
  color: var(--color-text-secondary);
  text-decoration: none;
  border-radius: 0.5rem;
  transition: all 0.2s ease;
}

.nav__link:hover,
.nav__link:focus-visible {
  background: var(--color-bg-alt);
  color: var(--color-text);
}

.nav__link--active {
  color: var(--color-primary);
  font-weight: 600;
}
```

#### 3.3.4 摘要（Summary）

```css
.summary {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
}

.summary__title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}
```

### 3.4 表單設計

#### 3.4.1 表單元件

```css
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.4rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-bg);
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  border-color: var(--color-primary);
  outline: none;
}

.form-input::placeholder {
  color: var(--color-text-tertiary);
}

.form-error {
  color: #ef4444;
  font-size: 0.8125rem;
  margin-top: 0.25rem;
}
```

#### 3.4.2 表單錯誤提示

```css
.form-group--error .form-input,
.form-group--error .form-select {
  border-color: #ef4444;
  background: #fef2f2;
}

.form-group--invalid .form-error {
  display: block;
}
```

### 3.5 狀態設計

| 狀態 | 設計要點 |
|------|----------|
| 預設 | 初始狀態 |
| hover | 鼠標懸停反饋（桌面） |
| active | 按下反饋 |
| focus | 鍵盤焦點（必須） |
| disabled | 不可用的禁用 |
| loading | 加載中 |
| success | 成功 |
| error | 錯誤 |
| empty | 空狀態 |
| expanded | 展開 |
| collapsed | 收起 |

---

## 4. 使用者體驗（UX）設計最佳實踐

### 4.1 用户旅程（User Journey）

```
[認知] → [探索] → [理解] → [決策] → [購買/使用] → [滿意]
```

### 4.2 明確性（Clarity）

```
✓ 明確：標題、副標題、按鈕文字都要清楚
△ 模糊：太曖昧、太時尚
✗ 混淆：用戶看不懂在做什麼
```

### 4.3 可預測性（Predictability）

```
✓ 可預測：操作結果符合使用者期待
✗ 不可預測：操作結果意外
```

### 4.4 微互動（Micro-interactions）

```css
/* 按鈕懸停微互動 */
.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

/* 數字計數器 */
.count-up {
  transition: transform 0.3s ease;
}
.count-up:hover {
  transform: scale(1.2);
}
```

### 4.5 非阻塞（Non-blocking）

```
✓ 非阻塞：操作失敗時提示，不卡住
✗ 阻塞：無效輸入直接禁用按鈕
✗ 阻塞：無消息層、異常時整頁掩蓋
```

### 4.6 引導式設計（Onboarding）

| 步驟 | 說明 |
|------|------|
| 1. 認識 | 簡介產品、展示核心功能 |
| 2. 體驗 | 讓使用者感受核心功能 |
| 3. 參與 | 讓使用者撰寫第一筆資料 |
| 4. 成功 | 到達第一個里程碑 |
| 5. 鐮刀 | 用戶熟悉後移除引導 |

### 4.7 錯誤處理

```json
{
  "error_code": "NETWORK_TIMEOUT",
  "message": "連線逾時，請重試",
  "action": "重新整理或稍後再試",
  "retry": true
}
```


---

## 5. 存取性（Accessibility）

### 5.1 四個核心原則（POUR）

| 原則 | 描述 |
|------|------|
| **P**erceivable | 可感知：內容可被感知 |
| **O**perable | 可操作：可以互動 |
| **U**nderstandable | 可理解：信息明確 |
| **R**obust | 健壯：與輔助技術相容 |

### 5.2 螢幕閱讀器優化

```html
<!-- 為圖片添加 alt -->
<img src="logo.svg" alt="OmniBitwarden 登入頁面" />

<!-- 語義化標籤 -->
<header></header>
<nav></nav>
<main></main>
<section></section>
<article></article>
<aside></aside>
<footer></footer>

<!-- 跳過連結 -->
<a href="#main-content" class="skip-link">跳到主要內容</a>
```

### 5.3 焦點管理（Focus）

```css
.skip-link {
  position: absolute;
  top: -100%;
  left: 0;
  background: var(--color-primary);
  color: #fff;
  padding: 0.75rem 1.5rem;
  z-index: 200;
  border-radius: 0 0 0.5rem 0;
}

.skip-link:focus {
  top: 0;
}

/* 焦點可見 */
:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* 避免突兀的焦點 */
:focus:not(:focus-visible) {
  outline: none;
}
```

### 5.4 對比度

```css
/* 文字對比設置 */
:root {
  --color-text: #1f2937;        /* 1:18 對比 */
  --color-text-secondary: #6b7280; /* 1:4.5 對比 */
  --color-text-tertiary: #9ca3af;   /* 1:3 對比（輔助） */
}
```

---

## 6. 互動模式

### 6.1 三檔互動

| 檔位 | 描述 | 範例 |
|------|------|------|
| L1 | 精緻靜態 | hover 浮起、淡入 |
| L2 | 流暢互動 | 滾動 reveal、視差、導航變化 |
| L3 | 沉浸體驗 | 滾動驅動時間線、pin、游標跟隨 |

### 6.2 滾動反應（Scroll Reveal）

```css
.reveal {
  opacity: 0;
  transform: translateY(24px);
  transition: opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
              transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.reveal.in-view {
  opacity: 1;
  transform: translateY(0);
}
```

### 6.3 滾動進度條

```css
.scroll-progress {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--color-primary);
  z-index: 1000;
  transform-origin: left;
  transform: scaleX(0);
}

.scroll-progress.in-view {
  transform: scaleX(1);
}
```

### 6.4 卡片 hover 效果

```css
.card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
```

### 6.5 標簽（Tag）

```css
.tag {
  display: inline-flex;
  align-items: center;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.tag-primary {
  background: var(--color-primary-light);
  color: #fff;
}
```

### 6.6 登入動畫

```css
.login-enter {
  animation: loginSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) both;
}

@keyframes loginSlideIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 7. 色彩與排版系統

### 7.1 色彩標籤

| 色彩名稱 | 角色 | 備註 |
|----------|------|------|
| Primary | 主要強調色 | CTA、連結、活躍態 |
| Secondary | 次要強調色 | 輔助按鈕、關聯項 |
| Background | 背景色 | 頁面、卡片 |
| Surface | 表面色 | 卡片、容器 |
| Text | 文字色 | 標題、正文 |
| Border | 邊框色 | 輸入框、分離線 |
| Error | 錯誤色 | 錯誤訊息 |
| Success | 成功色 | 成功通知 |
| Warning | 警告色 | 警告提示 |
| Info | 資訊色 | 資訊提示 |

### 7.2 字串檔案

| 字串角色 | 字體 | 字號 | 粗細 |
|----------|------|------|------|
| Title | Noto Sans SC | 2rem+ | 700+ |
| H1 | Noto Sans SC | 1.5rem | 600 |
| H2 | Noto Sans SC | 1.25rem | 600 |
| Body | Noto Sans SC | 1rem | 400 |
| Label | Noto Sans SC | 0.75rem | 500 |
| Mono | JetBrains Mono | 0.875rem | 400 |

---

## 8. 間距與層級系統

### 8.1 間距四分法

```css
:root {
  --space-1: 0.25rem;  /* 4px */
  --space-2: 0.5rem;   /* 8px */
  --space-3: 0.75rem;  /* 12px */
  --space-4: 1rem;     /* 16px */
  --space-5: 1.5rem;   /* 24px */
  --space-6: 2rem;     /* 32px */
  --space-8: 3rem;     /* 48px */
  --space-10: 4rem;    /* 64px */
  --space-12: 6rem;    /* 96px */
}
```

### 8.2 間距規則

| 應用 | 推薦間距 |
|------|----------|
| 頁面版面 | 16px–24px 邊距 |
| 容器內間距 | 16px–24px |
| 元件與元件間距 | 16px–24px |
| 元件內間距 | 12px–16px |

### 8.3 網格系統

```css
:root {
  --grid-columns: 12;
  --container-max: 1200px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(var(--grid-columns), 1fr);
  gap: 1.5rem;
  max-width: var(--container-max);
  margin-inline: auto;
  padding-inline: 1rem;
}

/* 移動端（< 600px）：堆疊 */
@media (max-width: 599px) {
  .grid { grid-template-columns: 1fr; }
}

/* 平板（600–899px）：雙欄 */
@media (min-width: 600px) {
  .grid { grid-template-columns: repeat(2, 1fr); }
}

/* 桌面（≥ 900px）：三欄 */
@media (min-width: 900px) {
  .grid { grid-template-columns: repeat(3, 1fr); }
}
```

---

## 9. 觸控與點擊目標

### 9.1 觸控目標尺寸

```css
/* 最小觸控目標：44×44px */
.min-touch-target {
  min-width: 44px;
  min-height: 44px;
}

/* 密集佈局可用 36×36px */
.dense-touch-target {
  min-width: 36px;
  min-height: 36px;
}
```

### 9.2 點擊反饋

```css
.btn:active {
  transform: scale(0.97);
}
```

### 9.3 鍵盤導航

```css
/* 鍵盤導航可見 */
a:focus-visible,
button:focus-visible,
input:focus-visible,
select:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

---

## 10. 可存取性檢查清單

### 10.1 文字與圖像

- [ ] 文字有足够對比度（4.5:1）
- [ ] 圖片有 alt 文字
- [ ] 圖片使用合適的格式（PNG/JPEG/SVG/WebP）
- [ ] 圖片不超過 200KB

### 10.2 互動元素

- [ ] 所有按鈕都有 hover+active+disabled 狀態
- [ ] 所有互動元素有 focus 可見
- [ ] 表單元件有 label
- [ ] 表單錯誤有明確描述

### 10.3 結構

- [ ] 使用語義化標籤（header/main/nav/footer/article/aside）
- [ ] 頁面有適當的標題層級
- [ ] 導覽有適當的 landmark
- [ ] 有跳過連結

### 10.4 裝置適配

- [ ] 移動裝置（< 600px）有完整佈局
- [ ] 平板（600–899px）有完整佈局
- [ ] 桌面（≥ 900px）有完整佈局
- [ ] 無橫向溢位

---

## 11. 質量檢查清單

### 11.1 DESIGN.md 合規

- [ ] 已生成 DESIGN.md 並儲存至專案目錄
- [ ] DESIGN.md 包含完整 9 個章節，無空章節
- [ ] 程式碼中所有顏色透過 DESIGN.md 定義的 CSS 變數引用，無硬編碼 hex
- [ ] 字型嚴格按 DESIGN.md 的 Typography Rules 使用
- [ ] 互動效果嚴格按 DESIGN.md 指定的檔位（L1/L2/L3）實現
- [ ] 未違反 DESIGN.md 的 Do's and Don'ts 中的任何一條

### 11.2 功能

- [ ] 響應式設計已測試（移動、平板、桌面）
- [ ] 導覽在移動端有折疊方案
- [ ] 圖片和容器不溢位
- [ ] 互動元素有手勢反應

### 11.3 性能

- [ ] 無空白載入
- [ ] 圖片優化（WebP、降低體積）
- [ ] 動畫平滑（60fps）
- [ ] 無觸發迴圈或重複翻新

### 11.4 可存取性

- [ ] 所有功能能透過鍵盤操作
- [ ] 螢幕閱讀器可讀
- [ ] 對比度足夠
- [ ] 焦點管理健全

---

## 12. 常見反模式（Don'ts）

### 12.1 視覺

```txt
❌ 硬編碼 hex 色彩
   → 改用 CSS 變數

❌ 丟失對比度
   → 確保文字與背景對比 ≥ 4.5:1

❌ 缺少焦點環
   → 所有互動元素需有 focus-visible

❌ 過度濾鏡（filter: blur() 動畫）
   → 蜜月使用，關注 FPS

❌ 懸停反應無鏈接
   → 所有 hover 都應該有明確反饋
```

### 12.2 互動

```txt
❌ 按鈕語言模糊
   → 按鈕文字應清晰描述行為

❌ 錯誤訊息不明確
   → 應顯示具體錯誤原因與解決方案

❌ 載入狀態不反應
   → 加載時應顯示進度條或骨架屏

❌ 表單沒有即時校驗
   → 表單輸入即時校驗並提示
```

### 12.3 響應式

```txt
❌ 行動端只有純文字
   → 動作與桌面端一致

❌ 導覽在行動端不可用
   → 必須提供折疊導覽

❌ 圖片溢位
   → image { max-width: 100%; } 必備

❌ 觸控目標過小
   → 至少 44×44px
```

---

## 13. 參考資源

| 類別 | 資源 |
|------|------|
| 色彩 | Material Design Color System、Tailwind CSS Palette |
| 字型 | Noto Sans SC、Inter、JetBrains Mono |
| 設計系統 | Material Design、Apple Human Interface Guidelines、Google Material Web |
| 響應式 | Mobile First、Flexible Grid、Media Queries |
| 存取性 | WCAG 2.2、ARIA、axe DevTools |
| 動畫 | CSS Transitions、GSAP、Lenis |
| 質量 | Web Vitals（LCP、FID、CLS、INP、TTFB） |

---

## 📚 核心檔案索引

| 檔案 | 內容 | 讀取時機 |
|------|------|----------|
| `references/design-md-template.md` | DESIGN.md 輸出模板（9 章節） | Phase B |
| `references/interaction-patterns.md` | L1/L2/L3 三檔互動程式碼庫 | Phase A + B |
| `references/motion-library.md` | 動畫效果目錄 | Phase B（選型）+ Phase C（落地） |
| `references/scene-defaults.md` | 場景佈局基線 | Phase C |
| `references/quality-checklist.md` | 質量檢查清單 | Phase C 審計 |
| `references/style-seeds.md` | 風格種子在對話時 | Phase A |

---

## 📝 生產紀錄

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0 | 2026-11-03 | 初始版本，響應式使用者介面最佳實踐 |
| 0.9 | 2026-11-02 | 基礎 UI/UX 設計規範 |