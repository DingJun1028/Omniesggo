# A02 永續報告中心與動態表單引擎 終始矩陣功能說明書

**編號**: A02 · **模組代號**: `OMNI-FACILITY-A02`  
**所屬體系**: ESG GO 善向永續系統 · **核心負責體**: OmniNexus & Antigravity  
**設計語言**: Editorial Dual-Theme Standard (Light Editorial / Dark Editorial, Zero Text Gradients)  
**5T 協議狀態**: Truth (溯源) · Goodness (透明) · Beauty (可感) · Trust (防篡改) · Transferful (全追蹤)

---

## 1. 設施定位與終極願景 (Facility Positioning & Vision)

A02 作為全系統的「永續報告編撰與表單引擎中心」，負責將企業繁雜的 ESG 營運指標、碳排盤查數據與合規文字，自動轉化為符合 GRI 2024 / CSRD ESRS 國際標準的正式報告書。

### 核心承諾：
1. **零漸層字體原則**：報表、欄位名稱、章節標題、按鈕一律採用高對比純色，保證分屏編輯與列印報表時的高辨識度。
2. **終始閉環 (End-Beginning Matrix)**：
   - **起 (Cause)**：使用者選定報告範本或自訂欄位結構。
   - **承 (Trace)**：動態表單引擎即時校驗欄位型別，自動帶入歷史數據與運算公式。
   - **轉 (Synthesis)**：AI 語意合規檢查，比對 GRI 準則與同業對標數據。
   - **合 (Proof)**：完成編撰並生成 5T 雜湊鎖 (Hash Lock) 存證。
   - **終 (Effect)**：即時分屏預覽、產出可列印正式 PDF 報告書與 JSON 確信憑證。

---

## 2. 終始矩陣全景映射 (End-Beginning Matrix Mapping)

| 階段 (Phase) | 步驟 (Step) | 觸發與輸入 (Origin Cause) | 處理與流轉 (Process Trace) | 最終顯化 (Final Effect) | 5T 檢驗點 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **起 (Origin)** | 1. 模版載入 | 選擇「GRI 通用準則」或「科技業 ESG 模版」 | 表單引擎動態解析 JSON Schema，動態生成章節 | 呈現左側章節導航與對應輸入欄位 | **Truth (真)**: 模版來源驗證與版本標記 |
| **承 (Process)** | 2. 數據填報 | 使用者手動輸入或一鍵帶入範例數據 | 執行即時 Zod 結構檢驗與數值邊界試算 | 數值即時更新，錯誤欄位精準標紅提示 | **Goodness (善)**: 計算公式完全透明，零幻覺 |
| **轉 (Synthesize)**| 3. 分屏即時排版 | 輸入內容觸發即時 Markdown/HTML 渲染 | Editorial 排版引擎依主題即時生成排版 | 右側即時展示正式印刷風格手冊報告 | **Beauty (美)**: 乾淨 Editorial 報章質感，純色無噪點 |
| **合 (Manifest)** | 4. 5T 密碼學封印 | 點擊「封印此章節」或「全書發布」 | 本地 Node.js 執行 SHA-256 存證刻印 | 產生章節 Hash Lock，將資料寫入數據庫 | **Trust (信)**: 防篡改封印憑證，不可事後修改 |
| **終 (Eternal)** | 5. 跨格式發布 | 點擊「匯出 PDF 報告書」或「驗證 JSON」 | 產生標準雙語 PDF 與第三方查核連結 | 產出實體可交付的永續報告書 | **Transferful (通)**: 全週期 Hook 追蹤查驗 |

---

## 3. 介面重新規劃規格 (UI Architecture)

### 3.1 頂部導航列 (Top Editorial Header)
- 膠囊標籤：`A02 · ESG REPORTS WORKBENCH`、`GRI 2024 COMPLIANT`
- 標題：`永續報告書編撰中心 (ESG Reports Center)`（純色無漸層）
- 控制鈕：模版切換、帶入示範報告、雙主題切換、一鍵 5T 封印導出

### 3.2 三欄式全流程工作台架構 (Tri-Column Layout)
1. **左側：章節與指標導覽 (Outline Navigator - 20%)**
   - 包含：公司治理 (G)、環境保護 (E)、社會責任 (S)、溫室氣體盤查、重大性議題清單。
   - 每一章節顯示完成百分比膠囊與封印狀態。
2. **中間：動態表單輸入區 (Dynamic Form Engine - 45%)**
   - 根據當前選取章節，動態渲染數字、文字、下拉選單、表格與公式欄位。
   - 具備「自動儲存草稿」與「AI 語意合規輔助」功能。
3. **右側：即時印刷風格報告預覽 (Live Editorial Preview - 35%)**
   - 完全遵循 DESIGN.md 的 Editorial 手冊排版。
   - 淺色模式下白紙黑字、清晰圖表；深色模式下深色手冊質感。
   - 頂部附帶「即時列印預覽」與「下載正式 PDF」。

---

## 4. 驗收標準 (Definition of Done)

1. **零漸層字體**：所有標題、按鈕文字、表單標籤皆為純色高對比色。
2. **雙主題自適應**：在淺色與深色模式下，預覽面板與編輯面板完美對稱。
3. **動態表單與預覽聯動**：中間欄位輸入時，右側預覽無延遲即時更新。
4. **5T 封印實作**：點擊封印後，自動生成真實 SHA-256 雜湊值並呈現存證條碼。
