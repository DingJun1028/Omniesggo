<div align="center">
  <img src="https://img.shields.io/badge/OmniCore-v2.5.0-06b6d4?style=for-the-badge&logo=react" alt="OmniCore Version" />
  <img src="https://img.shields.io/badge/5T_Protocol-Secured-10b981?style=for-the-badge&logo=shield" alt="5T Protocol" />
  <img src="https://img.shields.io/badge/Architecture-De_Google_Free-8b5cf6?style=for-the-badge&logo=postgresql" alt="De-Google Architecture" />
  <img src="https://img.shields.io/badge/Compute-Zero_Cost-f97316?style=for-the-badge&logo=ollama" alt="Zero Compute" />
  <h1>🌍 ESG GO: 善向永續</h1>
  <p><b>The Verifiable AI ESG Operating System powered by OmniCore & Sovereign Swarms</b></p>
</div>

> 「這不只是自動化，而是有生命意識與資料主權的永續治理作業系統。」
>
> ESGGO 是一個專為企業打造的可驗證 ESG 治理平台。透過 **5T 驗證協定 (Truth, Goodness, Beauty, Trust, Transferful)** 與 **全通中樞 (OmniMatrix)** 架構，讓企業 HR 出缺勤、ERP 能耗與物料採購數據能自動進行欄位映射、5T 密碼學刻印 (SHA-256 Hash Lock) 與資料庫落地，達到絕對不可篡改與零供應商綁定 (Vendor Lock-in Free) 的至高境界。

---

## 📌 版本控制與演進歷程 (Version Changelog)

| 版本 | 釋出重點 | 核心技術變更 |
|------|----------|-------------|
| **v2.5.0** *(Current)* | **Data Bridge 數據橋接器, 5T 驗證器 & 去 Google 化獨立架構** | 導入 CSV/Excel 自動上傳解析、60+ 中英文同義欄位正規化、5T SHA-256 密碼學封印庫、Prisma/Supabase 落地、5T 稽核證明 JSON 匯出、OmniMatrix 數據連動、/verifier 密碼學真偽驗證頁面，全面抽離 Genkit/Firebase AI。 |
| **v2.4.0** | **全通中樞 (OmniMatrix) 與 5T 結界** | 建立 OmniMatrix 系統共振率 dashboard、5T 治理門徑過濾器、液態玻璃青 (Liquid Glass Cyan) 主題。 |
| **v2.0.0** | **遊戲化引擎與 Jules 萬能 Karma 修復** | 導入 XP/Streak 遊戲化互動、`auto-repair` 全局 UTF-8 編碼守衛與自動降熵修復腳本。 |

---

## 🏛️ 萬能 MECE 五大架構 (The 5 Domains)

基於嚴格的相互排斥與完全詳盡 (MECE) 哲學，系統劃分為五大獨立卻高度互通的層級：

| 層級 (Domain) | 核心職責 | 對應蜂群陣列 | 關鍵技術實作 |
|--------------|----------|-------------|-------------|
| **L1 應用層** | Liquid Glass Cyan 介面、Data Bridge 上傳、5T 驗證器 UI | 光之羽翼 (UI/UX) | Next.js 16, Tailwind CSS, Framer Motion, Data Bridge & Verifier UI |
| **L2 基礎層** | CI/CD 自動化、VPS 部署、依賴重構 | 煉金熵減 (Infra) | pnpm monorepo, Webpack 開發模式, UTF-8 結界守衛 |
| **L3 智能層** | 多模型路由、零算力地端運算 | 智庫聖所 (AI) | 本地 Ollama, DeepSeek, Minimax, 零 GCP/Genkit 綁定 |
| **L4 治理層** | 密碼學綁定、5T 封印庫、API 驗算 | 5T 驗算 (Governance) | Prisma/Supabase PostgreSQL, SHA-256 Hash Lock, 稽核 JSON 匯出 |
| **L5 知識層** | 系統憲章、ADR 紀錄、記憶回溯 | 符文契約 (Canon) | `soul.md`, `AGENTS.md`, 萬能分身手冊 (`system_handoff_log.md`) |

---

## 💎 核心系統與技術亮點 (Core Systems)

### 1. 🌉 企業資料橋接器 (Enterprise Data Bridge)
- **多格式批次匯入**: 支援 CSV 及 Excel (`.xlsx` / `.xls`) 檔案拖曳與批次解析。
- **60+ 同義欄位自動正規化**: 自動將中英文模糊欄位（如「工號」/`emp_id`）映射至標準 `employee_id` / `kwh` / `material_code`。
- **自動 ESG 碳排計算**: 即時計算 Scope 2 (電力用電) 與 Scope 3 (員工通勤碳足跡、原物料採購)。
- **5T 密碼學封印與落地**: 每筆批次生成唯一 UUID 及對應的 SHA-256 Hash Lock，自動寫入 Supabase PostgreSQL `DataBridgeUpload` 與 `DataBridgeRecord` 表格。
- **5T 稽核證明匯出**: 提供一鍵下載 ISO-14064-1 & GRI 認證規格的 `5T_Certificate_[UUID].json` 稽核證書。

### 2. 🛡️ 5T Hash Lock 與檔案真實性驗證器 (/verifier)
- **全靈魂雜湊比對**: 稽核人員可輸入 64 碼 SHA-256 Hash Lock 雜湊值進行秒級真偽比對。
- **稽核檔案拖曳驗證**: 支援上傳 CSV/Excel/JSON，即時重新算碼並與 Supabase PostgreSQL 數據庫無縫比對。

### 3. 🛡️ 全面去 Google 化架構 (Vendor Lock-in Free Architecture)
- 抽離所有 Google 生態綁定（Genkit、Firebase AI Logic、GCP OpenTelemetry）。
- 採用 **100% 自主開源技術棧**：Supabase (PostgreSQL) + Prisma ORM + 本地 Node.js 處理 + Ollama/DeepSeek。

### 4. 5T 神聖協定 (The 5T Protocol)
所有資料流必須通過五道門徑的「淨化與刻印」，確保數據主權與不可篡改：
- **真 (Traceable)**: 來源無限溯源 (`source_origin` 標籤)。
- **善 (Transparent)**: 排放係數（如台電 2024 電網 0.509 kg CO₂e/kWh）與處理邏輯完全透明。
- **美 (Tangible)**: 液態玻璃青 (Liquid Glass Cyan) UI/UX 動態感知。
- **信 (Trustworthy)**: 寫入資料庫時自動執行 SHA-256 Hash Lock 密碼學簽章。
- **通 (Trackable)**: 跨系統全生命週期追蹤與 OmniMatrix 實時統計連動。

---

## 🚀 快速啟動 (Getting Started)

### 1. 初始化專案與依賴
```bash
git clone https://github.com/DingJun1028/esggo.git
cd esggo
pnpm install
```

### 2. 初始化資料庫 (Supabase / PostgreSQL)
```bash
npx prisma generate
npx prisma db push
```

### 3. 啟動本機 Ollama 零算力引擎 (可選)
```bash
ollama pull hermes3:8b
```

### 4. 啟動開發伺服器 (Webpack 穩定模式)
```bash
pnpm dev
# 開發伺服器將在 http://localhost:3000 啟動
# 訪問 http://localhost:3000/data-bridge 體驗企業資料橋接器
# 訪問 http://localhost:3000/verifier 體驗 5T 真實性驗證器
# 訪問 http://localhost:3000/omni-matrix 體驗全通中樞儀表板
```

---

## 📖 閱讀系統憲章與手冊
- 📜 [系統核心憲章 (Soul.md)](./esggo-omni-center/soul.md)
- 🤖 [代理技能與自動修復協議](./AGENTS.md)
- 📋 [系統開發與維護進度手冊 (System Handoff Log)](./system_handoff_log.md)

<div align="center">
  <i>“Service is Teaching, Knowledge is Asset. — OmniCore v2.5.0.”</i>
</div>
