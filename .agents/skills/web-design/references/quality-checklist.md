# 質量檢查清單

Phase C 程式碼生成完成後，逐項自檢。

## DESIGN.md 合規（必查）

- [ ] 已生成 DESIGN.md 並儲存到專案目錄
- [ ] DESIGN.md 包含完整 9 個章節，無空章節
- [ ] 程式碼中所有顏色通過 DESIGN.md 定義的 CSS 變數引用，無硬編碼 hex
- [ ] 字型嚴格按 DESIGN.md 的 Typography Rules 使用
- [ ] 互動效果嚴格按 DESIGN.md 指定的檔位（L1/L2/L3）實現
- [ ] 未違反 DESIGN.md 的 Do's and Don'ts 中的任何一條

## 參考網站解析（有參考 URL 時）

- [ ] 綜合體驗感知 + Token 提取 + 截圖對照三類輸入分析
- [ ] 使用指令碼或 curl 抓取原始 HTML/CSS，未單純依賴 AI 摘要
- [ ] 已數清參考站所有 section 模組
- [ ] 若有滾動聯動動效，已做 motion audit
- [ ] 生成完成後對結果與參考物做過顯式差異審計

## 字型

- [ ] 字型按 DESIGN.md 選取，有 Google Fonts @import URL + fallback
- [ ] 已按 text-decoration-rules.md 對 h1/h2/h3 執行裝飾判斷
- [ ] **場景化字號要求**（從 `scene-defaults.md` 取對應場景字號，不要一刀切）：
  - Landing / Portfolio Hero：≥ 60px、weight ≥ 700
  - Blog / 文章：Hero 32-40px，body 1-1.0625rem，行高 1.7-1.8
  - Dashboard / App UI：頁面標題 1.25-1.5rem，正文 0.875rem
  - PPT / 課件：Hero 3-3.5rem（serif），正文 0.82-0.85rem
  - 郵件：標題 24-28px，正文 15-16px
- [ ] 中文內容：字型含中文字族，行高 ≥ 1.7，字距 0.02em

## 視覺系統

- [ ] 所有顏色通過 CSS 變數
- [ ] 圖示使用專案庫 / lucide-react / 內聯 SVG；**Playful Creative 調性允許 Emoji 裝飾**，其餘調性停用
- [ ] 使用者素材已做适配處理；不匹配時已提醒
- [ ] 圖片佔位：參考站 URL / Unsplash，禁止純色塊

## 交互

- [ ] 每個可互動元素有 hover + focus 狀態
- [ ] 入場動畫已實現（至少 L1 級 fadeIn）
- [ ] L2+ 滾動行為已實現（reveal / 視差 / 導航變化）
- [ ] L3 特效已實現（pin / 游標 / 轉場）
- [ ] L2+ 包含 prefers-reduced-motion 降級

## 響應式

- [ ] 至少适配移動端（< 600px）和桌面端
- [ ] 導航在移動端有摺疊方案
- [ ] 圖片和容器不溢位
