# A03 智能解析與審計查證工作站 終始矩陣功能說明書
# (A03 OmniParser & 5T Verifier Workstation Specification)

> **設施代號**: `A03` | **設施路徑**: `/parser`, `/verifier` | **規範等級**: P0 核心治理基準  
> **設計風格**: OmniSub Editorial 手冊印刷雙主題 (Light / Dark) · 嚴格零文字漸層  
> **架構協議**: 5T 數據治理協議 · 端到端密碼學 Hash Lock 封印

---

## 1. 設施願景與定位 (Mission & Vision)

A03「智能解析與審計查證工作站」為 ESGGO 善向永續平台中負責**「非結構化數據結構化」**與**「第三方審計合規查驗」**之雙核心重鎮。
- **智能解析 (Parser)**：消除企業 ESG 報告書（PDF/掃描件）與結構化指標之間的數位斷層，自動萃取範疇一、二、三碳排數據、GRI/SASB 指標，並即時產出 5T 稽核紀錄。
- **審計查證 (Verifier)**：提供獨立第三方稽核員、金融機構與利害關係人公開驗證通道，透過 SHA-256 Hash Lock 與檔案二進位特徵碼，即時比對鏈上或 Supabase 不可篡改憑證。

---

## 2. 終始矩陣閉環架構 (End-Beginning Matrix)

A03 設施全面貫徹 5T 終始矩陣閉環：

```
[起] Origin Cause (始)
  │  ▸ 非結構化 PDF 報告書上傳 / 外部提供之 Hash Lock 序號
  ▼
[承] Process Trace (承)
  │  ▸ 文字流提取、正則正規化、OCR 容錯校準
  │  ▸ 溯源刻印：sourceOrigin="OmniParser Engine v2.0"
  ▼
[轉] Synthesize (轉)
  │  ▸ 範疇一、二、三溫室氣體自動分類與累加 (tCO2e)
  │  ▸ 與歷史基期及行業基準比對差異
  ▼
[合] Hash Lock Seal (合)
  │  ▸ 生成全檔案與結構化數據之 SHA-256 密碼學封印
  │  ▸ 凍結狀態 (objectFrozen = true)
  ▼
[終] Final Effect (終)
  │  ▸ 產出具備 QR Code 之「5T 防偽查驗數位憑證」(Printable Certificate)
  │  ▸ 數據直接回流至 A01 萬能中心與 A02 報告中心
```

---

## 3. 核心功能規格細節 (Core Functional Specifications)

### 3.1 設施子模組甲：PDF 智能解析工作台 (`/parser`)
1. **拖曳式多檔案解析佇列**：
   - 支援拖曳上傳 `.pdf`（上限 50MB）。
   - 支援「載入預設範本」進行即時免上傳模擬演練。
2. **5T 自動稽核標準檢核表 (Audit Checklist)**：
   - 自動檢驗：文檔頁數校驗、文字密度完整度、溫室氣體範疇一/二/三揭露完整性、GRI 內容索引檢驗。
3. **數據結構化即時卡片**：
   - 範疇一（直接排放）：`tCO2e` 數值與佔比。
   - 範疇二（能源間接）：`tCO2e` 數值與佔比。
   - 範疇三（價值鏈間接）：`tCO2e` 數值與佔比。
   - 溫室氣體排放總量：自動加總校驗。
4. **端到端 5T 標籤刻印**：
   - 解析完成自動賦予 `UUID`、`version: "2.0"`、`timestamp`、`sourceOrigin` 與 `hashLock`。

### 3.2 設施子模組乙：5T 防偽與防篡改查驗工作台 (`/verifier`)
1. **雙重查驗通道**：
   - **Hash Lock 查驗**：輸入 64 位 SHA-256 雜湊碼，即時自 Supabase/Vault 檢索封印紀錄。
   - **檔案特徵碼查驗**：上傳本機報告書或憑證檔案，瀏覽器計算 SHA-256 後直接進行二進位對齊。
2. **即時驗證狀態卡片**：
   - 驗證成功：顯示安全綠色冷光標章、封印時間戳記、簽署機構、數據筆數與原始來源。
   - 驗證失敗：警示紅燈，明確標註「查無密碼學特徵」或「內容可能已被非法篡改」。
3. **官方數位合規憑證 (Printable Certificate)**：
   - 一鍵開啟具備 ISO 14064-1 / 5T 協議認證章戳之官方查驗證書。
   - 支援瀏覽器原生列印為高品質 PDF 報告。

---

## 4. 樣式與視覺規範 (Design & Typography)

- **字體規範**：嚴格純色高對比字體，禁用漸層文字（Zero Text Gradients）。
- **淺色模式 (Light Editorial)**：
  - 背景：`#f8fafc` (Slate 50)，卡片 `#ffffff`，邊框 `#e2e8f0`。
  - 主標題：`#0f172a` (Slate 900)，強調冷色 `#0d9488` (Teal 600)。
- **深色模式 (Dark Editorial)**：
  - 背景：`#020617` (Slate 950)，卡片 `#0b0f19`，邊框 `#1e293b`。
  - 主標題：`#ebecef` (銀白)，強調冷色 `#5EEAD4` (冷青)。
