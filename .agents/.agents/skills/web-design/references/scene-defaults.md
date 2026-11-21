# Scene Defaults

每種場景的預設佈局、元件和互動基線。Round 1 確認場景後載入，作為後續對話的起點。

---

## Landing Page / 產品介紹頁

```yaml
layout:
  structure: 縱向多 section 敘事（Hero → Features → Social Proof → CTA）
  container: 1200px max, 居中
  section_spacing: 80-120px
  grid: 自由混排（1/2/3 列按內容切換）

components:
  必要: Hero (大標題+副標題+CTA), 導航欄, Feature 卡片, CTA 按鈕, Footer
  常見: 客戶 Logo 捲軸, 定價卡片, FAQ 摺疊, Testimonial 卡片
  可選: 影片嵌入, 資料統計, 對比表格

interaction_baseline: L2
  - 導航: sticky, 滾動後背景模糊
  - 入場: section 級 fadeInUp + 內部 stagger
  - Hero: 2-3 層 stagger 入場
  - 卡片: hover lift + shadow
  - CTA: hover scale + 色變
  - 滾動: 進度條（可選）

typography:
  hero_size: 3.5-5rem
  section_title: 2-2.5rem
  body: 1-1.125rem
  density: 中等（標題+段落+留白交替）
```

---

## Portfolio / 作品集

```yaml
layout:
  structure: Hero + 專案網格 + 關於我 + 聯絡
  container: 1100-1400px
  grid: 2-3 列 masonry 或等高網格
  專案詳情: 彈窗 / 新頁面 / 展開

components:
  必要: 專案卡片 (封面+標題+標籤), 篩選/分類, 聯絡方式
  常見: 技能標籤, 時間線, 社交連結
  可選: 游標自定義, 專案詳情頁, 暗色模式切換

interaction_baseline: L2-L3
  - 專案卡片: hover 圖片縮放 + 資訊浮現
  - 圖片: lightbox 或全屏預覽
  - 滾動: reveal + 視差
  - 頁面轉場: 跨頁動畫（L3）
  - 游標: 自定義游標或磁性效果（L3）

typography:
  hero_size: 4-6rem (可以很大)
  body: 0.95-1rem
  density: 低（大量留白，圖片主導）
```

---

## Blog / 內容站

```yaml
layout:
  structure: 文章列表 / 單篇文章
  container: 720-800px (窄容器，閱讀最佳)
  sidebar: 可選（目錄/標籤/推荐）
  間距: 段落間 1.5-2em

components:
  必要: 文章卡片, 文章正文排版, 日期/標籤, 分頁
  常見: 目錄(TOC), 程式碼塊, 引用塊, 圖片燈箱
  可選: 評論區, 搜尋, RSS, 暗色模式

interaction_baseline: L1
  - 入場: 輕微 fadeIn
  - 文章卡片: hover 色變或輕浮起
  - 目錄: 滾動高亮當前章節
  - 程式碼塊: 一鍵複製
  - 圖片: 點選放大

typography:
  article_title: 2-2.5rem
  body: 1-1.0625rem, line-height 1.7-1.8
  中文額外: 字距 0.02em, 首行縮排 2em
  density: 高（文字密集，靠行高和段距呼吸）
```

---

## Dashboard / 資料面板

```yaml
layout:
  structure: 側邊欄 + 頂欄 + 內容區
  container: 全寬（側欄 240-280px, 內容區自適應）
  grid: 密集網格（2-4 列, gap 12-16px）
  間距: 緊湊（16-24px section 間距）

components:
  必要: 側邊導航, 資料卡片, 圖表容器, 表格, 篩選器
  常見: KPI 數字, 狀態徽章, 麵包屑, 通知, 載入骨架
  可選: 即時更新指示, 暗色模式, 可拖拽卡片

interaction_baseline: L1
  - 資料卡片: hover 邊框高亮（不要 lift，影響資訊密度）
  - 表格行: hover 背景色變
  - 側欄: 可摺疊, 當前項高亮
  - 載入: 骨架屏脈衝
  - 狀態: 數字變化過渡動畫（數字滾動）
  - 注意: 不要用 scroll reveal（資訊需要立即可見）

typography:
  page_title: 1.5rem
  card_title: 0.875-1rem
  body: 0.8125-0.875rem
  數字: 1.5-2.5rem, font-weight 700-800
  density: 高（資訊密集，靠網格和邊框區隔）
```

---

## PPT / 課件 / 知識地圖

```yaml
layout:
  structure: Hero + 分節導航 + Bento 網格內容區
  container: 1280px
  grid: 3 列 Bento (span-1/span-2/span-3 混排)
  gap: 14px
  間距: section 間 48-64px

components:
  必要: 導航標籤(pill), 模組卡片, Hero 統計, 分節標題
  常見: 進度指示, 難度標籤, 知識點卡片, 時間線
  可選: 目錄, 下載按鈕, 評估表單

interaction_baseline: L1
  - 導航: 錨點滾動 + 當前項高亮 (IntersectionObserver)
  - 卡片: hover 邊框加深 + 輕陰影
  - 標籤: hover 反色
  - 列印: @media print 隱藏導航, 單列排版
  - 注意: 避免滾動動畫（課件需要快速瀏覽和列印）

typography:
  hero_title: 3-3.5rem (serif, 裝飾性)
  section_title: 1.5rem (serif)
  card_title: 0.95rem (sans, bold)
  body: 0.82-0.85rem
  labels: 0.65-0.72rem, uppercase, letter-spacing
  density: 中高（資訊量大但靠卡片邊界組織）
```

---

## App UI / 管理后台

```yaml
layout:
  structure: 頂欄 + 側欄（可選）+ 內容區 + 彈窗/抽屜
  container: 全寬, 內容區 max 1400px
  grid: 按功能分割槽, 1-3 列自適應
  間距: 中等（24-32px）

components:
  必要: 按鈕(多狀態), 表單(input/select/checkbox), 表格, 彈窗/抽屜
  常見: Toast 通知, 步驟條, Tabs, 下拉選單, 分頁
  可選: 拖拽, 富文本編輯, 檔案上傳, 骨架屏

interaction_baseline: L1-L2
  - 按鈕: hover/active/disabled/loading 四態
  - 表單: focus ring, 校驗反饋, 錯誤高亮
  - 彈窗: 背景模糊 + 內容 scaleIn
  - Toast: slideIn + 自動消失
  - 列表: 拖拽排序（如需要）
  - 過渡: 頁面切換 fade（不要 slide，影響導航預期）

typography:
  page_title: 1.25-1.5rem
  body: 0.875rem
  label: 0.75rem
  density: 中等（功能優先，適度留白）
```

---

## 郵件模板

```yaml
layout:
  structure: Logo 頭部 + 正文 + CTA + 頁尾
  container: 600px max (郵件客戶端限制)
  grid: 單列或 2 列（table-based, 非 CSS grid）
  間距: 20-30px padding

components:
  必要: 頭部(Logo+標題), 正文段落, CTA 按鈕, 頁尾(退訂連結)
  常見: 產品卡片, 圖片+文字橫排, 分隔線
  注意: 所有樣式必須內聯, 不支持 CSS class

interaction_baseline: 無（郵件不支持 JS）
  - CTA 按鈕: 用 table+td 實現圓角, 內聯 background-color
  - 連結: 內聯 color, text-decoration
  - 圖片: 必須設 width, alt text, display:block

typography:
  title: 24-28px
  body: 15-16px, line-height 1.5-1.6
  安全字型: Arial, Helvetica, Georgia, Times New Roman
  禁止: Google Fonts, 自定義字型（部分客戶端不支持）
  density: 低（郵件閱讀環境干擾大，需要大字號和留白）

constraints:
  - 所有樣式內聯（不支持 <style> 在所有客戶端）
  - 布局用 <table>, 不用 flexbox/grid
  - 圖片寬度不超過 580px
  - 總寬度 600px
  - 不使用 JS
  - 背景圖用 VML fallback（Outlook）
```
