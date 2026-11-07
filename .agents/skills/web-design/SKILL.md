---
name: web-design
description: Web 視覺設計 SKILL。輸入 PRD / 參考 URL / 截圖 / 關鍵詞（任意組合），先產出一份標準化 DESIGN.md 設計規範，使用者確認后據此生成 UI/UX、視覺、動效、響應式全部達標的 web 程式碼。專攻 web 端：Landing Page、Portfolio、產品頁、部落格、個人站、SaaS 介紹頁等。當使用者說"幫我做個網站""設計一個頁面""參考 XX 做一個""把這個截圖/PRD 做成網頁""做一個 landing page""出一份 design 規範"時觸發。不用於後端、資料庫、純邏輯 bug 修復。
title: Web 設計
category: web-design
version: 1.0.0
title: Web 設計
category: web-design
version: 1.0.0
---

# Web Design

Web 端視覺設計 SKILL。兩階段工作流：**先出規範（DESIGN.md），再出程式碼。**

DESIGN.md 是顯式檔案產物，儲存到專案目錄，可跨專案複用、可手動修改、可給其他工具消費。

## 核心流程

```
Phase A  理解需求（靈活輸入）──→  Phase B  輸出 DESIGN.md（使用者確認）──→  Phase C  生成專案程式碼
```

**啟動時先檢測**（按優先順序）：
1. 專案里已經有 DESIGN.md 了嗎？→ 有則沿用/修改/重建
2. 專案里有 PRD.md 嗎？→ 有則進入 A4（PRD 驅動流程）
3. 都沒有 → 正常走 Phase A

---

## Phase A: 理解需求

輸入是靈活的，以下任意組合都行，不要強制使用者走固定路徑：

| 輸入 | 處理方式 |
|------|---------|
| **參考 URL** | 抓取 HTML+CSS，提取 Token，motion audit |
| **截圖 / 設計稿** | 從視覺提取氣質、色溫、密度、字型風格 |
| **關鍵詞 / 描述** | "暗色剋制襯線風格" → 從 style-seeds 匹配 Token |
| **品牌名** | "做成類似 Linear 的" → 先查 `references/design-systems/`，有則直接讀取；無則抓取該網站 |
| **混合** | "參考這個 URL 但配色要暖一些" → 提取 + 覆蓋 |
| **PRD 文件** | 讀取 PRD.md 的產品定位、頁面結構、設計交接區 → 分析競品風格 → 推導設計方向 |

### A1. URL 分析（有參考 URL 時）

**意圖判斷**：參考（提取設計語言，做獨立新頁面）vs 復刻（使用者明確說"復刻/clone"）。

**抓取流程**（按優先順序嘗試）：

1. **首選：Playwright 爬蟲**（真實瀏覽器，能繞反爬、渲染 SPA、模擬滾動）
   ```bash
   python3 scripts/crawl_website.py --url [URL] --output ./crawl-output --scroll-delay 600
   ```
   輸出：每屏視口截圖 + tokens.json + structure.json + styles.css
   
2. **備選：Token 提取指令碼**（輕量，適合簡單靜態站）
   ```bash
   python3 scripts/extract_design_tokens.py --url [URL] --format json
   ```

3. **降級：手動 curl**（指令碼都不可用時）
   ```bash
   curl -Ls [URL]
   ```

綜合三類輸入判斷：實際體驗（氛圍節奏）> 截圖（區域性氣質）> Token 數值（精確引數）。Playwright 爬蟲的視口截圖可直接作為"體驗"和"截圖"兩類輸入。

**Motion Audit**（參考站有滾動聯動動效時必做）：
- 觸發訊號：動效跟隨滾動連續變化 / 模組間有 stagger-pin-parallax / 引用 GSAP-Lenis 等
- 記錄每個動效區塊的 trigger、driver、elements、effect、timing

**降級鏈路**：
- Playwright 爬蟲失敗 → 查 `references/design-systems/` 有無該品牌預置檔案（58 個品牌）
- 預置檔案也無 → `extract_design_tokens.py` 嘗試靜態提取
- 靜態提取也失敗 → 手動 curl CSS
- 全部失敗 → 要求使用者提供截圖，從視覺手動建 Token

### A2. 對話引導（無參考物時）

快速鎖定風格方向，不要機械走問答清單：

**核心問題**（按需選問，不全問）：
- 亮色 vs 暗色？
- 襯線 vs 無襯線？
- 剋制留白 vs 豐富飽滿？
- 強調色偏好？
- 有沒有喜歡的網站或風格參考？

從 `references/style-seeds.md` 匹配最近似的種子（10 种預設方向），展示給使用者確認或混搭。

使用者提到具體品牌時，查閱 `references/design-systems/INDEX.md` 按類別檢索，按需讀取對應品牌檔案（58 個真實網站設計規範，每個 ~300 行）。品牌檔案只含靜態設計系統，動效仍需按互動檔位補充。

### A3. 互動檔位確認（不可跳過）

| 檔位 | 體驗感 |
|------|--------|
| **L1** 精緻靜態 | 優雅 hover + 柔和入場 |
| **L2** 流暢互動 | 滾動 reveal、視差、導航變化 |
| **L3** 沉浸體驗 | 滾動驅動時間線、pin、游標跟隨、轉場 |

L2 追問：reveal 風格（fadeInUp/scaleIn）、視差、導航變化
L3 追問：section pin、游標效果、轉場、是否允許 GSAP/ScrollTrigger/Lenis

查閱 `references/interaction-patterns.md` 獲取對應檔位的完整程式碼。

### A4. PRD 驅動（檢測到專案級規範檔案時）

**啟動時自動掃描專案根目錄**，按優先順序：
1. `PRD.md` / `prd.md`
2. `SPEC.md` / `spec.md`
3. `README.md` 或任何 `.md` — 若含「產品定位 / Target Users / Pages / 核心頁面」等關鍵欄位

**不繫結特定工具或模板**。只要能從文件里抽到下列欄位，就足以作為設計輸入：

| 欄位（中/英別名） | 用途 |
|-------------------|------|
| 產品名稱 / Product / Name | Hero 文案 |
| 一句話定位 / Tagline / Pitch | Hero 副標題、定調 |
| 目標使用者 / Target Users / Audience | 色彩溫度、字型風格決策 |
| 核心頁面 / Pages / Screens | Phase C 生成清單 |
| 競品 / Competitors / References | Phase A 風格參考起點 |
| 技術棧 / Tech Stack | Phase C 程式碼生成方案 |
| 設計交接 / Design Notes / 調性 | 直接繼承的硬約束 |

**競品風格分析**：
- PRD 提到競品 → 優先查 `references/design-systems/` 是否已有預置
- 有預置 → 讀取該品牌規範作為起點
- 無預置 → 呼叫 `scripts/crawl_website.py` 抓取提取
- PRD 沒提 → 按產品型別 + 調性從 `references/style-seeds.md` 匹配最近種子

**提取不到關鍵欄位時**：不要瞎猜，回到對話引導（A2）補齊。

**與使用者確認**（示例）：
> 我從 `{檔名}` 讀到了：
> - 產品：{名稱} — {一句話定位}
> - 目標使用者：{畫像}
> - 參考競品：{列表 或 "無"}
> - 建議的風格方向：{1-2 個候選，各附一句理由}
>
> 這個方向對嗎？

確認後進入 A3（互動檔位），然後 Phase B。

---

## Phase B: 輸出 DESIGN.md（必走）

**必須生成 DESIGN.md 檔案。** 按 `references/design-md-template.md` 模板輸出 9 個章節：

1. **Visual Theme & Atmosphere** — 設計哲學、氛圍關鍵詞、一句話定調
2. **Color Palette & Roles** — 完整 CSS 變數定義（含 RGB 輔助值）
3. **Typography Rules** — 字型族、Google Fonts URL、字號層級表、禁止字型
4. **Component Stylings** — 按鈕/卡片/導航/連結/標籤等完整 CSS（含所有狀態）
5. **Layout Principles** — 網格、間距梯度、容器寬度
6. **Depth & Elevation** — 陰影體系
7. **Animation & Interaction** — 動效檔位、入場/滾動/懸停/特效的完整程式碼
8. **Do's and Don'ts** — 設計護欄、Anti-Patterns（至少 8 條）
9. **Responsive Behavior** — 斷點、觸控目標、摺疊策略

**文字裝飾規則**：生成 Color Palette 和 Typography 后，按 `references/text-decoration-rules.md` 決策表對標題逐級判斷是否新增漸變/投影。

**展示摘要給使用者確認**，確認后儲存 DESIGN.md 到專案目錄，再進入 Phase C。

---

## Phase C: 生成專案程式碼（必走）

### C1. 確認場景 + 收集內容

問使用者做什麼頁面，收集具體內容。查閱 `references/scene-defaults.md` 獲取該場景的佈局和元件基線。

**常見場景的內容需求**：

| 場景 | 需要收集 |
|------|---------|
| Landing Page | 標題、副標題、Feature 列表、CTA、Social proof |
| 個人站 / Portfolio | 名字、頭銜、專案列表、關於、聯絡方式、部落格列表 |
| Blog | 名稱、文章列表/內容、作者資訊、分類標籤 |
| 產品頁 | 產品名、賣點、功能截圖、定價、FAQ |

使用者資訊不全時主動問；使用者說"你先做，內容我後面填"則用合理的佔位內容。

### C2. 設計框架 + 生成程式碼

1. **檢查專案環境**：框架、路由、樣式方案、現有元件和 assets
2. **框架決策**：有專案 → 沿用；無專案 → 最小可行方案
3. **嚴格按 DESIGN.md 生成**：
   - 所有顏色通過 CSS 變數引用
   - 字型按 DESIGN.md 定義使用
   - 互動按 DESIGN.md 指定檔位實現
   - 不違反 Do's and Don'ts
4. **圖片策略**：使用者素材 > 專案 assets > 參考站 URL 佔位 > Unsplash
5. **圖示策略**：專案現有庫 > lucide-react > 內聯 SVG（參考 `references/icon-library.md`）

### C3. 審計

- **DESIGN.md 合規檢查**：程式碼是否嚴格遵循規範
- **參考物差異審計**（有參考時）：Token / 版式 / 字型 / 互動 / 素材逐項比對
- **響應式驗證**：至少移動端 + 桌面端
- **質量清單**：讀 `references/quality-checklist.md` 逐項自檢

---

## 首頁爆點原則（Landing Page 專屬）

一個 Web 平臺最重要的是**落地頁（首頁）**。其他頁面保持規範、風格統一即可，唯有首頁必須滿足下面兩條硬性原則，不可妥協。

### 原則一：3 個「臥槽」爆點 + 1 個巧思

爆點位置**固定**，每個位置必須有一個讓使用者"臥槽"的視覺衝擊：

| # | 位置 | 要求 | 典型招式 |
|---|------|------|---------|
| **1** | **首屏 / Hero** | 載入瞬間就被動態/3D/巨型漸變震住 | 卡片星座爆發、WebGL 3D 物體、巨型標題 mask reveal、滑鼠跟隨光斑、3D 卡片堆 |
| **2** | **首次滑動** | 離開首屏的第一個 section 必須有"鉤子"繼續吸引 | 宣言橫滾帶（大字 marquee）、數字爆發、分屏切割、卡片匯聚轉場、全屏影片 |
| **3** | **列表 / 陣列 / 列舉 / 展示區** | 不能是普通等大 grid | Bento 不等大布局、SpotlightCard hover 跟蹤光、3D 傾斜卡片、抽象藝術頂 |

**1 個巧思設計點**：一處"不注意就錯過、一注意到就笑"的細節。候選：
- 互動反饋微動畫（複製后的 sparkle + tooltip）
- 彩蛋（Konami / Ctrl+K 命令面板）
- Meta 梗（關鍵詞 hover 彈 "這就是本頁用到的規範 →"）
- 滾動到底的小驚喜（如"你看到這裡了，謝謝"）

### 原則二：流暢 · 滑動無阻（不可破）

以下是效能紅線，與爆點設計**同等優先順序**。爆點炸裂但卡頓 = 零分。

- **3D / WebGL**：全頁最多 1 處，且必須 IntersectionObserver 不可見時暫停
- **`filter: blur()` on moving elements**：禁止。用 opacity + scale 做景深代替
- **`backdrop-filter: blur()`**：值 ≤ 14px，且不覆蓋大面積滾動區
- **Lenis / scroll-jacking**：僅當 pin-scrub 真正必要時啟用；普通頁面用原生 `scroll-behavior: smooth`
- **ScrollTrigger pin**：單頁 ≤ 2 處（doubao 級敘事才解鎖）
- **pointermove 監聽**：必須 rAF 節流
- **Custom cursor 全域性替換**：僅在氣質強烈的設計類/工具類站點用，普通 SaaS 停用

### 實現建議（效能友好的爆點配方）

這些組合實測在中等配置裝置可達 60fps：

| 爆點 | 實現 | 效能成本 |
|------|------|---------|
| **滑鼠聚光燈** | CSS var `--mx/--my` + `radial-gradient(at var(--mx) var(--my))` | ⭐ 極低（單次 repaint）|
| **卡片爆發入場** | GSAP 一次性 timeline（load 時 stagger 1.5s，結束即釋放）| ⭐⭐ 低（僅 1 次）|
| **宣言橫滾帶** | 純 CSS `transform: translateX` keyframes | ⭐ 極低 |
| **SpotlightCard** | 每張卡 `--mx/--my` + `::before` radial-gradient（rAF 節流）| ⭐⭐ 低 |
| **大字 mask reveal** | 純 CSS `clip-path` 一次性動畫 | ⭐ 極低 |
| **關鍵字漸變流動** | `background-position` 動畫 | ⭐ 極低 |

避免的反面組合：
- ❌ 12+ 元素同時帶 `filter: blur()` + `will-change`（GPU 記憶體爆）
- ❌ Lenis + 多個 pin-scrub + WebGL（主執行緒堵死）
- ❌ Three.js 常駐渲染不暫停（即使離開視窗也吃 FPS）

---

## 100 分質量底線（硬性驗收）

DESIGN.md + 生成程式碼必須**同時**滿足以下全部條件，任何一條不滿足都算未完成。完整細項見 `references/quality-checklist.md`，這裡是最核心的紅線：

### DESIGN.md 紅線
- 9 個章節都有實質內容，不是模板佔位
- 每個元件樣式包含 default / hover / active / focus / disabled **全部狀態**
- 所有顏色定義為 CSS 變數，含 RGB 輔助值（便於 rgba）
- 字型有 `@import` URL + fallback stack
- 動效檔位明確（L1/L2/L3），對應依賴宣告完整
- Do's and Don'ts ≥ 8 條，其中 Don'ts ≥ 5 條
- L2+ 必須包含 `prefers-reduced-motion` 降級
- 響應式至少覆蓋 Desktop + Mobile

### 程式碼紅線
- 所有顏色通過 CSS 變數引用，**零硬編碼 hex**
- 字型嚴格按 DESIGN.md 的 Typography Rules 實現
- 每個可互動元素有 hover + focus 態
- 入場動畫已實現（至少 L1 級 fadeIn）
- L2+ 實現滾動 reveal + 導航滾動態 + 視差
- L3 實現 pin / 游標跟隨 / 轉場
- 圖片**停用純色塊佔位**（參考站 URL / Unsplash / 使用者素材）
- 圖示用專案庫 / lucide-react / 內聯 SVG（Playful 調性外禁 Emoji）
- 未違反 DESIGN.md Do's and Don'ts 中的任何一條
- 移動端 ≤ 600px 無橫向溢位，觸控目標 ≥ 44×44px

### 簽名動效紅線（L2+ 強制，L3 加倍）

**任何 L2 及以上頁面必須包含以下 6 類動效，缺一不可**。優先從 [vue-bits / reactbits](https://github.com/DavidHDev/vue-bits) 目錄挑（查 `references/motion-library.md`），能複用原始碼就不要自己寫。

| 類別 | 數量 | 落點 |
|------|------|------|
| Text Animation — Hero H1 | ≥ 1 | 大標題入場或持續態（如 SplitText / ShinyText / GradientText） |
| Text Animation — Section H2 | ≥ 1 | 章節標題滾動觸發（如 ScrollFloat / BlurText） |
| Text Animation — Body / Label | ≥ 1 | 正文、eyebrow、程式碼塊（如 ScrollReveal / TextType / ScrambleText） |
| Animation — 元素級 | ≥ 1 | CTA 磁吸 / 卡片 hover / 游標 / 點選反饋（如 Magnet / GlareHover / ClickSpark） |
| Component — 互動構件 | ≥ 1 | 卡片棧 / 畫廊 / 導航 / 3D 卡片（如 CardSwap / ScrollStack / SpotlightCard / MagicBento） |
| Background — 氛圍層 | ≥ 1 | Hero 或全域性背景（如 Aurora / Silk / Grainient / Threads） |

**L3 級別的累計 signature moments ≥ 6 個**，但一頁不超過 10 個（會躁）。

### L3 電影級 scroll-story 硬性加碼

L3 頁面（使用者說"像 doubao / apple / stripe 那樣"、"要有 3D"、"普通"、"要電影感"等）除上述 6 類動效外，**必須再至少覆蓋 3/4 的 scroll-story 模式**，詳細模板見 `references/scroll-story-patterns.md`：

| 模式 | 必備 | 說明 |
|------|------|------|
| Pin-Scrub 場景 | ≥ 1 | section pin + 滾動驅動內容形變/時間線 |
| 左 pin / 右 swap 容器替換 | ≥ 1 | 左側標題固定、右側容器按滾動切換多場景（doubao 產品四連同款） |
| 匯聚/散開轉場 | ≥ 1 | 多元素從散落飛向合併 或 反之（doubao hero→次屏同款） |
| WebGL / 真 3D 簽名時刻 | ≥ 1 | Three.js / OGL / Babylon，不能只用 CSS 3D 充數 |

**黃金判據**：**每 1-2 屏必有一個 signature moment**。連續三屏只有 fade reveal 就不合格。

**效能底線**：
- 單頁 WebGL scene ≤ 1 個
- 移動端自動降級（見 scroll-story-patterns.md 效能章節）
- `prefers-reduced-motion` 必須有完整降級路徑

**風格适配**：嚴格參照 `references/motion-library.md` 的「按風格 × 場景推荐組合」——Dark Editorial 不要用 GlitchText，Playful 不要用 Aurora，調性一致比酷炫重要。

**效能底線**：
- 單頁重背景（WebGL）≤ 1 個
- 移動端自動降級：重背景 → 靜態漸變；3D 元件 → 2D
- Cursor 效果僅在 `matchMedia('(hover: hover)')` 下啟用
- 所有效果必須有 `prefers-reduced-motion` 降級路徑

**致謝**：使用 vue-bits / reactbits 原始碼時，在頁面 footer 或 README 註明 "Motion effects derived from [vue-bits](https://github.com/DavidHDev/vue-bits) by DavidHDev (MIT)"。

### 參考物對齊審計（有參考時）
- 已數清參考站 section 數量
- 色板 / 字型 / 間距與參考數值對齊（或明確說明故意偏離的設計理由）
- 參考站有滾動動效 → 必做 motion audit 並實現對應檔位
- 生成后顯式做一次差異審計：列出哪些對齊、哪些故意不同

**審計不是可選步驟**。Phase C 程式碼寫完必須逐條過一遍，未過的就地修。

---

## 技術棧原則

- **框架**：沿用專案已有棧；無則最小可行方案（靜態 HTML 或 Vite）
- **樣式**：沿用已有方案；不強行引入新依賴
- **元件**：有庫複用；無庫手寫語義化元件
- **動畫**：CSS 優先；L2 可用 IntersectionObserver；L3 允許 GSAP/ScrollTrigger/Lenis
- **圖片**：禁止純色塊佔位；佔點陣圖在程式碼頂部 `const IMG` 統一管理

---

## 語言規則

**預設跟隨輸入語言**，不強塞：

| 輸入訊號 | 預設生成語言 |
|----------|--------------|
| 參考 URL / 截圖 / PRD 為中文 | 中文 |
| 參考 URL / 截圖 / PRD 為英文 | 英文 |
| 使用者對話語言 | 作為兜底判定 |

**多語言切換按需加**：
- 僅當使用者明確要求，或 PRD 說明產品面向多市場時才加 i18n
- **不要預設往每個頁面塞 locale 物件和語言切換器**——單語言產品里這是噪音
- 需要 i18n 時：
  - 文案集中到獨立 locale 物件（`const messages = { zh: {...}, en: {...} }`），元件內 `t('hero.title')` 引用
  - 切換即時生效，不要重新整理
  - 簡單專案：頂層 locale + React state；Next.js：`next-intl` / `i18next`；純 HTML：`<select>` + `data-lang`

**中文頁面專屬要求**（生成中文內容時必守）：
- 中文字型用 Noto Sans SC / Noto Serif SC / LXGW WenKai 等中文字族，禁止只配英文字型讓系統回退
- 行高 ≥ 1.7，字距 `letter-spacing: 0.02em`
- 正文字號 ≥ 15px，長篇閱讀 ≥ 16px
- 中英混排：中文字族在前，英文字族（Inter / DM Sans）作為 fallback，靠 `font-family` 連結入

---

## 參考檔案索引

| 檔案 | 內容 | 何時讀取 |
|------|------|----------|
| `references/design-md-template.md` | DESIGN.md 輸出模板（9 章節） | Phase B |
| `references/interaction-patterns.md` | L1/L2/L3 三檔互動程式碼庫 | Phase A + B |
| `references/motion-library.md` | vue-bits/reactbits 效果目錄 + 按風格推荐組合 | Phase B（選型）+ Phase C（落地） |
| `references/scroll-story-patterns.md` | L3 電影級 scroll-story 招式庫（卡片星座 / 左pin右swap / 匯聚轉場 / WebGL 簽名） | Phase B（L3 判定后）+ Phase C |
| `references/style-seeds.md` | 10 种風格種子 → Token 對映 | Phase A 對話時 |
| `references/scene-defaults.md` | 7 种場景的佈局/元件/互動基線 | Phase C |
| `references/text-decoration-rules.md` | 文字漸變/投影決策表 | Phase B |
| `references/icon-library.md` | lucide-react 圖示速查 | Phase C |
| `references/quality-checklist.md` | 質量檢查清單 | Phase C 審計 |
| `references/design-systems/INDEX.md` | 58 個品牌設計系統索引 | Phase A 使用者提到品牌時 |
| `references/design-systems/{name}.md` | 單個品牌完整設計規範 | 按需讀取，禁止全量載入 |
| `scripts/crawl_website.py` | Playwright 爬蟲（截圖 + Token + 結構） | Phase A 首選 |
| `scripts/extract_design_tokens.py` | 輕量 Token 提取（靜態站備選） | Phase A 備選 |
| `scripts/fetch_unsplash_images.py` | 佔點陣圖候選 URL | Phase C |

---

## ✅ 最佳實踐做法

### 1. 設計原則

| 領域 | 核心原則 |
|------|----------|
| 基礎 | 清晰 > 複雜，一致 > 特色，簡潔 > 囉唆 |
| 色彩 | 使用者友善 = 弱對比優先 + 語義通透 |
| 間距 | 一致邊界 + 呼吸感，密集區補白 |
| 觸發 | 80/20 法則：20% 核心操作承載 80% 流量 |
| 照護 | 記得說明 + 反飽和 + 品牌專屬 |

### 2. 響應式最佳實踐

| 斷點 | 適用場景 | 測試重點 |
|------|----------|----------|
| ≤ 600px | 桌面側 | 橫向溢位、無觸控目標 |
| 600–900px | 平板 | 單欄、觸控節流 |
| 900–1200px | 平板、桌機 | 兩欄、網格 |
| ≥ 1200px | 桌面 | 網格、觸控目標 |

### 3. 動效最佳實踐

| 檔位 | 要求 |
|------|------|
| L1 | 優雅 hover + 柔和入場 |
| L2 | 滾動 reveal、視差、導航變化 |
| L3 | scroll-story、pin、游標跟隨 |

**性能紅線**
- 單頁 WebGL ≤ 1 個
- 移動端自動降級
- `filter: blur()` on moving elements 禁止
- `backdrop-filter: blur()` ≤ 14px
- `prefers-reduced-motion` 降級路徑

### 4. 性能最佳實踐

- 3D/WebGL：load 時一次性 timeline，結束即釋放
- 卡片爆發入場：GSAP 一次性 timeline
- 圖片：禁止純色塊佔位；使用者素材 > 專案 assets > 參考站 URL > Unsplash
- 圖示：專案庫 > lucide-react > 內聯 SVG
- 字型：所有顏色通過 CSS 變數引用，零硬編碼 hex
- 字型：字體檔案緩存、gzip、字型子集

### 5. 可訪問性（a11y）最佳實踐

- 每個可互動元素有 hover + focus 態
- 觸控目標 ≥ 44×44px（移動端）
- 標題層級：H1 → H2 → H3
- 語義化 HTML：button、nav、main、article、footer
- 顏色對比：符合 WCAG 2.1 AA
- 鍵盤導航：所有功能可通過鍵盤完成

### 6. 安全最佳實踐

- 輸入驗證：所有使用者輸入均須驗證
- 輸出轉義：防止 XSS
- 授權檢查：每個請求前檢查權限
- 敏感數據：在客戶端處理避免儲存
- 安全標頭：Content-Security-Policy, X-Frame-Options

### 7. 質量檢查清單（自動化）

```bash
# 響應式
npm run test:e2e -- --screens desktop tablet mobile

# 動效
npm run test:animations

# 訪問性
npm run test:a11y

# 性能
npm run test:performance
```

---

## 技術棧原則

- **框架**：沿用專案已有棧；無則最小可行方案（靜態 HTML 或 Vite）
- **樣式**：沿用已有方案；不強行引入新依賴
- **元件**：有庫複用；無庫手寫語義化元件
- **動畫**：CSS 優先；L2 可用 IntersectionObserver；L3 允許 GSAP/ScrollTrigger/Lenis
- **圖片**：禁止純色塊佔位；佔點陣圖在程式碼頂部 `const IMG` 統一管理


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| web-design | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：web-design 並查詢目前狀態
{
  triggers: ["web-design", "query"],
  actions: ["awaken()", "query()"],
  priority: ["web-design", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | web-design, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | web-design, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：web-design
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 web-design 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 web-design 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
