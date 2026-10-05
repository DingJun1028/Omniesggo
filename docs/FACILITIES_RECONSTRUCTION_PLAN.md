# ESG GO 全系統設施功能重構與 5T 標準化規劃書

**Version**: v3.0.0 · **Architecture Standard**: OmniSub Editorial Framework · **Themes**: Light Editorial / Dark Editorial (Zero Text Gradients)

---

## 1. 核心願景與設計哲學 (Core Vision)

所有系統設施（Facilities）不再僅是靜態展示或簡單表單，而是全面對齊 **OmniSub** 的即時性、閉環化與極致手冊質感（Editorial）：
1. **嚴格零漸層字體 (Zero Text Gradients)**：所有標題、副標、數據標籤、按鈕一律採用高對比純色（淺色：`#0f172a`、`#0d9488`；深色：`#ebecef`、`#5EEAD4`），徹底杜絕投影幕與列印時的模糊與噪點。
2. **全對稱雙主題 (Dual Editorial Themes)**：頂部全域支援「清新淺色 (Light)」與「深色手冊 (Dark)」即時無損切換。
3. **5T 協議五步標準閉環 (Standard 5-Step Loop)**：
   - **Step 1: 數據攝取 (Ingestion)**：支援檔案拖曳、範例帶入、系統 API 串接。
   - **Step 2: 參數調控 (Configuration)**：抽屜式或側欄式參數自訂（如邊際成本、電力係數、重大性門檻）。
   - **Step 3: 核心運算與動態視覺化 (Computation & Visualization)**：即時圖表渲染、異常標註。
   - **Step 4: 5T 密碼學封印 (Sealing & Hash Lock)**：自動生成 SHA-256 存證與因果審查追蹤鏈。
   - **Step 5: 成果發布與憑證匯出 (Export & Verification)**：可列印正式報告、JSON 確信檔案、PDF 證書。

---

## 2. 全系統主要設施重構矩陣 (Facility Reconstruction Matrix)

| 設施模組 | 當前功能局限 | OmniSub 標準化功能重構規劃 | 核心指標 / 標準 |
| :--- | :--- | :--- | :--- |
| **1. ESG 報告中心 & 表單引擎** (`reports/ESGReportsCenter.tsx`) | 僅有單純清單與基本欄位表單 | 升級為 **「全流程永續報告工作台」**：支援章節大綱導覽、動態公式校驗、即時雙主題分屏預覽、AI 語意合規檢查。 | GRI 2024 / CSRD ESRS |
| **2. PDF 自動解析設施** (`app/parser/page.tsx`) | 單一檔案上傳、靜態總攬 | 升級為 **「批量報告解析工作站」**：多檔案隊列、OCR 關鍵字對比檢驗、Scope 1/2/3 數據標註修正抽屜、100% 本地 Node 隱私保障。 | ISO 14064-1 |
| **3. 雙重重大性矩陣** (`app/materiality/page.tsx`) | 簡單散佈點與手動拉桿 | 升級為 **「重大性策略評估工作坊」**：可拖曳互動散佈圖、利害關係人問卷矩陣匯入、CSRD ESRS 雙重實質性判定、動態熱力圖。 | EU CSRD / GRI 3 |
| **4. 供應鏈盡職調查** (`app/supply-chain/page.tsx`) | 單一文字輸入評鑑 | 升級為 **「多階供應鏈 ESG 戰情室」**：Tier 1/2 階層圖譜、人權/勞安/減碳雷達圖、自動問卷批改評級、黑名單風險警示。 | EU CSDD / 德國 LkSG |
| **5. 淨零路徑與 MACC 規劃** (`app/roadmap/page.tsx`) | 基礎里程碑數字顯示 | 升級為 **「邊際減碳成本 (MACC) 模擬器」**：動態措施瀑布圖、資本支出 (CapEx) 敏感度分析、SBTi 1.5°C 淨零軌跡試算。 | SBTi 1.5°C / MACC |
| **6. 5T 防偽驗證與信任中心** (`app/verifier/page.tsx`) | 單純雜湊值文字比對 | 升級為 **「5T 密碼學確信探索器」**：展開完整的因果鏈條 (Trace Lineage)、檔案位元組即時比對、防偽列印專用憑證產生器。 | 5T Hash Lock / ZKP |

---

## 3. 實施執行路線 (Implementation Roadmap)

1. **第一梯隊：報告與表單核心 (`ESGReportsCenter.tsx` + `DynamicFormEngine.tsx`)**
   - 重構為全螢幕手冊編輯器，左側章節導覽、中間表單輸入、右側即時 5T 報告預覽。
2. **第二梯隊：重大性評估與供應鏈 (`materiality/page.tsx` + `supply-chain/page.tsx`)**
   - 注入高互動性圖表與分析抽屜，統一純色高辨識度按鈕。
3. **第三梯隊：減碳路徑與防偽確信 (`roadmap/page.tsx` + `verifier/page.tsx`)**
   - 強化敏感度試算滑桿與防偽確信列印規格。
