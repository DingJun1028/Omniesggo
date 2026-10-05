# A05 供應鏈永續盡職調查戰情室 終始矩陣功能說明書
# (A05 Supply Chain ESG Due Diligence War Room Specification)

> **設施代號**: `A05` | **設施路徑**: `/supply-chain` | **規範等級**: P0 核心治理基準  
> **設計風格**: OmniSub Editorial 手冊印刷雙主題 (Light / Dark) · 嚴格零文字漸層  
> **架構協議**: 5T 數據治理協議 · 歐盟 CSDDD 盡職調查準則 · SHA-256 Hash Lock 封印

---

## 1. 設施願景與定位 (Mission & Vision)

A05「供應鏈永續盡職調查戰情室」響應全球供應鏈去風險化趨勢及歐盟 CSDDD（企業永續盡職調查指令）。
設施協助企業建立穿透式供應商治理機制，對 Tier 1（一級核心製造商）與 Tier 2（二級原物料商）進行全維度 ESG 風險掃描、碳排放合規度評鑑、勞動人權審計，並產出具備 5T 密碼學背書的「供應商永續合規憑證」。

---

## 2. 終始矩陣閉環架構 (End-Beginning Matrix)

```
[起] Origin Cause (始)
  │  ▸ 供應商自評問卷 (SAQ)、第三方驗廠報告 (ISO 14001 / ISO 45001)、排碳稽核紀錄
  ▼
[承] Process Trace (承)
  │  ▸ 供應商階層劃分 (Tier 1 / Tier 2 / Tier 3)
  │  ▸ ESG 三大維度分數計算 (0~100) 與弱點標記
  ▼
[轉] Synthesize (轉)
  │  ▸ 智慧綜合評鑑：綜合評級 (A+ / A / B / C / D) 與風險等級 (Low / Moderate / High)
  │  ▸ 產出客製化改善行動清單 (Corrective Action Plan, CAP)
  ▼
[合] Hash Lock Seal (合)
  │  ▸ 生成全評鑑紀錄之 SHA-256 密碼學 Hash Lock
  │  ▸ 鎖定稽核版本，作為採購簽約與供應商評鑑之不可否認依據
  ▼
[終] Final Effect (終)
  │  ▸ 產出官方「供應商 ESG 評鑑合格憑證」(Supplier ESG Certificate)
  │  ▸ 同步至企業採購 ERP 系統與範疇三 (Scope 3) 碳排放盤查系統
```

---

## 3. 核心功能規格細節 (Core Functional Specifications)

### 3.1 供應商新增與智慧審計評鑑 (Vendor Evaluation Engine)
1. **供應商基本檔錄入**：
   - 供應商名稱、所屬產業領域、供應鏈階層 (Tier 1 關鍵模組 / Tier 2 零組件 / Tier 3 原料)。
2. **AI 文字報告快速摘要與評析**：
   - 可直接貼上供應商回傳之永續問卷、第三方認證編號（ISO 14001、ISO 45001、ISO 50001、RBA）與碳排數據。
   - 支援「快速載入預設示範案例」，一鍵體驗評鑑工作流。
3. **即時 ESG 綜合評估卡片**：
   - 環境 E 得分 (0~100)
   - 社會 S 得分 (0~100)
   - 公司治理 G 得分 (0~100)
   - 總評級與風險標章（如 A+ 低風險、B 中度風險）
   - 關鍵優勢 (Strengths) 與待改善風險點 (Weaknesses) 標籤化陳列

### 3.2 供應鏈全景名錄戰情表 (Supply Chain Registry Table)
- **多維度篩選**：依階層（Tier 1/2）、風險等級（Low/Medium/High）、評級（A+/A/B/C/D）即時篩選。
- **5T 密碼學封印識別**：每一筆已審計之供應商皆標記綠色「5T Verified」與 Hash Lock 前後 8 碼。
- **一鍵匯出官方合規憑證**：支援點擊下載官方 PDF 供應商審計合格背書證書。

---

## 4. 樣式與視覺規範 (Design & Typography)

- **字體規範**：嚴格純色高對比字體，禁用漸層文字（Zero Text Gradients）。
- **雙主題適配**：支援 Clean Light（清晰淺色）與 Dark Editorial（深色手冊），全卡片採用 `OmniCard`，按鈕採用純色 `OmniButton`。
