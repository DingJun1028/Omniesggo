# Omniesggo 萬能永續平台 — 產品設施功能架構・需求成果・終始矩陣規劃書

> **Doc ID / 文件代號** OMN-PRD-001 · **Version / 版本** v1.0 · **Status / 狀態** 規劃核定 (Planning Approved)
> **Written / 撰寫日期** 2025 · **Scope / 適用範圍** 平台整體 (Web / iOS / Android / 後端 / AI / 自動化)
> **Purpose / 文件目的** 定義產品設施與功能架構、需求與成果對應、終始矩陣（需求↔功能↔成果↔驗證），作為後續建造與驗收之單一來源 (Single Source of Truth)
>
> **Convention / 落檔規範** 英標繁博 (English Standard, Traditional Chinese Broad) · 5T Protocol

---

## 0. 摘要 (Executive Summary)

Omniesggo 萬能永續平台是一套以「**永續**」為核心價值、以「**萬能**」為能力邊界的智慧企業平台。其設計哲學為：

> **一次設定、永久即時、智慧沉澱、社群共創。**

平台以 **四大支柱** 為功能主體，以 **智慧沉澱引擎 (Jun.AI.Key)** 為知識內核，以 **Supabase 生態** 為後端骨幹，以 **AI 多模態整合** 與 **Boost.space 自動化** 為擴展能力，並以 **原生行動端** 延伸觸達。

本規劃書將「需求 → 功能 → 成果 → 驗證」四者以**終始矩陣**串接，確保每一項需求皆有對應功能、每一項功能皆有可量測成果、每一項成果皆有驗證方法，杜絕「做了但無法驗證、驗證了但無法追溯」的斷鏈。

---

## 1. 產品定位與願景 (Positioning & Vision)

### 1.1 定位 (Positioning)

- **永續 (Sustainable)**：資料、知識、價值可被永久沉澱、即時反映、持續進化，不因人員或系統更迭而流失。
- **萬能 (Omnipotent)**：跨領域、跨平台、跨模態，透過標準 API 與插件機制，可承接企業知識管理、電商、媒體、工業物聯網等多元場景。

### 1.2 核心價值主張 (Core Value Proposition)

| 價值 Value | 說明 Description |
|---|---|
| 永久即時 Permanent Realtime | 所有資料事件（建立/更新/刪除）被持久化記錄並即時反映於標籤與索引 |
| 智慧生成 Intelligent Generation | 多語言 LLM + 知識圖譜 + 自我學習，動態產出上下文相符的標籤與內容 |
| 雙向追蹤 Bidirectional Tracking | 資料→標籤（自動標註入索引）與 標籤→資料（依標籤反查資料集與歷史） |
| 智慧沉澱 Knowledge Sedimentation | L1–L5 知識沉澱框架，將散落資訊沉澱為可複用、可傳承的組織智慧 |
| 社群共創 Community Co-creation | 開放社群共同創作、審核、進化知識與功能 |
| 高效治理 Efficient Governance | 動態權限、敏感標籤管控、全流程監控、合規可稽核 |

### 1.3 目標使用者 (Personas)

| 角色 Role | 需求摘要 Requirement Summary |
|---|---|
| 企業管理者 Enterprise Manager | 決策、合規、績效可視化 |
| 知識工作者 Knowledge Worker | 內容沉澱、檢索、協作 |
| 開發者 Developer | 標準 API、插件擴展、自動化 |
| 社群貢獻者 Community Contributor | 共創、審核、回饋 |
| 一般使用者 General User | 跨平台存取、即時體驗 |

---

## 2. 產品設施功能架構 (Product Facility & Feature Architecture)

### 2.1 設施分層 (Facility Layers)

```
┌─────────────────────────────────────────────────────────────┐
│  L5  體驗層  Web / iOS / Android / 社群共創介面 / 管理後台      │
├─────────────────────────────────────────────────────────────┤
│  L4  能力層  智慧沉澱引擎 / 標籤引擎 / 檢索引擎 / 自動化引擎      │
├─────────────────────────────────────────────────────────────┤
│  L3  服務層  Edge Functions / Realtime / Storage / Auth       │
├─────────────────────────────────────────────────────────────┤
│  L2  資料層  PostgreSQL / pgvector / 事件流 / 知識圖譜          │
├─────────────────────────────────────────────────────────────┤
│  L1  基礎層  Supabase 生態 / AI 供應商 / Boost.space / 插件 API │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 四大支柱 (Four Pillars)

| 支柱 Pillar | 代號 Code | 功能摘要 Summary |
|---|---|---|
| 支柱一：智慧沉澱 Intelligence Sedimentation | P1 | 知識沉澱 L1–L5、內容管理、標籤血緣追蹤、檢索 |
| 支柱二：社群共創 Community Co-creation | P2 | 共創平台 UI/UX、審核流程、貢獻獎勵、版本演進 |
| 支柱三：權能鍛造 Authority Forging | P3 | 權能鍛造腳本生成器 (Authority Forging Script Generator) |
| 支柱四：符文鑲嵌 Rune Engrafting | P4 | 符文鑲嵌插件 API 標準 (Rune Engrafting Plugin API Standard) |

### 2.3 功能模組清單 (Feature Modules)

| 模組代號 Module | 模組名稱 Name | 支柱 Pillar | 層級 Layer | 說明 Description |
|---|---|---|---|---|
| F-01 | 內容管理 Content Management | P1 | L4 | 文件/郵件/會議紀錄等內容的建立、更新、刪除、版本化 |
| F-02 | 智慧標籤引擎 Smart Tag Engine | P1 | L4 | 多語言 LLM + 知識圖譜動態生成標籤，雙向追蹤 |
| F-03 | 標籤血緣追蹤 Tag Lineage Tracing | P1 | L4 | 記錄標籤變更（新增/移除/修改）與原因，可回溯 |
| F-04 | 知識沉澱框架 Sedimentation Framework | P1 | L4 | L1–L5 沉澱層級，將資訊沉澱為組織智慧 |
| F-05 | 向量檢索 Vector Retrieval | P1 | L4 | pgvector 語意檢索 + 標籤檢索混合查詢 |
| F-06 | 社群共創平台 Co-creation Platform | P2 | L5 | 共創、審核、貢獻者聲譽、版本演進 |
| F-07 | 權能鍛造腳本生成器 Authority Forging Script Generator | P3 | L4 | 依需求生成自動化腳本（後端任務） |
| F-08 | 符文鑲嵌插件 API Rune Engrafting Plugin API | P4 | L1 | 標準插件 API，支援第三方擴展 |
| F-09 | 自動化引擎 Automation Engine | 跨支柱 | L4 | Boost.space 跨平台工作流自動化 |
| F-10 | 即時事件流 Realtime Event Stream | 跨支柱 | L3 | Postgres pub/sub，即時推送標籤/內容變更 |
| F-11 | 權限與治理 Permissions & Governance | 跨支柱 | L3 | 動態權限、RLS、敏感標籤管控、稽核 |
| F-12 | 管理後台 Admin Console | 跨支柱 | L5 | 設定、監控、日誌、合規報表 |
| F-13 | 原生行動端 Native Mobile | 跨支柱 | L5 | iOS (SwiftUI) / Android (Kotlin) |

### 2.4 技術設施 (Technology Facilities)

| 設施 Facility | 技術方案 Technology | 角色 Role |
|---|---|---|
| 核心框架 | TypeScript 5.x | 系統核心邏輯 |
| 後端服務 | Node.js (Express/NestJS) | API 網關與業務邏輯 |
| 資料庫 | Supabase (PostgreSQL + pgvector) | 知識庫、使用者資料、向量索引 |
| AI 整合 | Pollinations / ChatX / Straico API | 文字生成、影像、多模態分析 |
| 自動化 | Boost.space | 跨平台工作流自動化 |
| 行動端 | SwiftUI (iOS) / Kotlin (Android) | 原生鍵盤應用 |
| 即時 | Postgres LISTEN/NOTIFY + Realtime | 事件推送 |
| 邊緣運算 | Supabase Edge Functions (Deno) | AI 推理、權重更新、血緣追蹤 |

---

## 3. 需求成果 (Requirements & Outcomes)

### 3.1 需求分類 (Classification)

- **功能需求 (FR, Functional Requirement)**：系統必須執行的行為。
- **非功能需求 (NFR, Non-Functional Requirement)**：效能、安全、可用性、可擴充、可維護、合規。
- **成果需求 (OR, Outcome Requirement)**：交付後應達成之可量測商業/營運成果。

### 3.2 需求清單 (Requirements Register)

| 需求代號 ID | 需求名稱 Name | 類型 Type | 優先級 Priority | 描述 Description |
|---|---|---|---|---|
| FR-01 | 內容事件持久化 | 功能 | P0 | 所有內容建立/更新/刪除皆被持久化記錄 |
| FR-02 | 即時標籤反映 | 功能 | P0 | 內容變更即時反映於標籤與索引 |
| FR-03 | 智慧標籤生成 | 功能 | P0 | 結合多語言 LLM 與知識圖譜動態生成標籤 |
| FR-04 | 雙向追蹤 | 功能 | P0 | 資料→標籤 與 標籤→資料 雙向查詢 |
| FR-05 | 標籤血緣記錄 | 功能 | P1 | 記錄標籤變更與原因，可回溯歷史 |
| FR-06 | 社群共創 | 功能 | P1 | 社群共同創作、審核、演進 |
| FR-07 | 插件擴展 | 功能 | P1 | 標準插件 API 支援第三方擴展 |
| FR-08 | 自動化工作流 | 功能 | P1 | 跨平台自動化（Boost.space） |
| FR-09 | 權限治理 | 功能 | P0 | 動態權限、RLS、敏感標籤管控 |
| FR-10 | 稽核與監控 | 功能 | P1 | 全流程監控、日誌、合規報表 |
| NFR-01 | 端到端延遲 | 非功能 | P0 | 標籤生成 ≤ 200ms（即時路徑） |
| NFR-02 | 吞吐量 | 非功能 | P0 | 每日處理 ≥ 10⁶ 條更新事件 |
| NFR-03 | 標籤準確率 | 非功能 | P0 | 主流流程標籤準確率 ≥ 90% |
| NFR-04 | 可用性 | 非功能 | P0 | ≥ 99.9%，支援自動擴容與容錯 |
| NFR-05 | 安全 | 非功能 | P0 | 敏感資料僅經環境變數，HTTPS，最小權限 |
| NFR-06 | 可擴充 | 非功能 | P1 | 模組化結構，易於新增 API 整合 |
| NFR-07 | 可維護 | 非功能 | P1 | 日誌可導出至集中化系統 (ELK/Grafana Loki) |
| OR-01 | 知識沉澱率 | 成果 | P1 | 上線 6 個月內沉澱知識量成長 ≥ 200% |
| OR-02 | 檢索效率 | 成果 | P1 | 平均檢索時間下降 ≥ 50% |
| OR-03 | 社群活躍 | 成果 | P2 | 月活躍貢獻者 ≥ 1,000 |
| OR-04 | 自動化覆蓋 | 成果 | P2 | 重複性工作自動化覆蓋率 ≥ 60% |

### 3.3 成果定義與量測 (Outcome Definition & Measurement)

| 成果代號 ID | 成果名稱 Name | 量測指標 Metric | 目標值 Target | 量測方式 Method |
|---|---|---|---|---|
| OR-01 | 知識沉澱率 | 沉澱知識量成長率 | ≥ 200% / 6 個月 | 資料庫沉澱層級統計 |
| OR-02 | 檢索效率 | 平均檢索時間 | 下降 ≥ 50% | 檢索日誌分析 |
| OR-03 | 社群活躍 | 月活躍貢獻者 | ≥ 1,000 | 使用者活動統計 |
| OR-04 | 自動化覆蓋 | 自動化工作流覆蓋率 | ≥ 60% | 工作流監控 |

---

## 4. 終始矩陣 (Start–End Traceability Matrix)

> **終始矩陣**：將「需求（起點）→ 功能（實現）→ 成果（終點）→ 驗證（證據）」四者串接，確保每一環節可追溯、可驗證、無斷鏈。
>
> **運行版（含程式碼與測試證據）**見 `docs/OMN-PRD-001-TRACEABILITY.md`，並由 `pnpm verify:prd-matrix` 自動驗證。

### 4.1 需求 ↔ 功能 對應矩陣 (Requirement ↔ Feature)

| 需求代號 ID | 對應功能模組 Feature | 支柱 Pillar | 驗證方法 Verification |
|---|---|---|---|
| FR-01 | F-01 內容管理 | P1 | 單元測試 + 事件日誌 |
| FR-02 | F-10 即時事件流 | 跨支柱 | Realtime 訂閱測試 |
| FR-03 | F-02 智慧標籤引擎 | P1 | 標籤準確率測試（NFR-03） |
| FR-04 | F-02 / F-05 | P1 | 雙向查詢整合測試 |
| FR-05 | F-03 標籤血緣追蹤 | P1 | 血緣記錄回溯測試 |
| FR-06 | F-06 社群共創平台 | P2 | 共創流程 E2E 測試 |
| FR-07 | F-08 符文鑲嵌插件 API | P4 | 插件 SDK 測試 |
| FR-08 | F-09 自動化引擎 | 跨支柱 | 工作流整合測試 |
| FR-09 | F-11 權限與治理 | 跨支柱 | RLS 政策測試 |
| FR-10 | F-12 管理後台 | 跨支柱 | 稽核日誌驗證 |

### 4.2 非功能需求 ↔ 驗證 對應矩陣 (NFR ↔ Verification)

| 需求代號 ID | 目標值 Target | 驗證方法 Verification | 驗證階段 Stage |
|---|---|---|---|
| NFR-01 | ≤ 200ms | 效能基準測試 | 開發期 + 上線前 |
| NFR-02 | ≥ 10⁶ 事件/日 | 負載測試 | 上線前 |
| NFR-03 | ≥ 90% | 標籤準確率測試 | 開發期 + 上線前 |
| NFR-04 | ≥ 99.9% | 可用性監控 | 上線後持續 |
| NFR-05 | 安全 | 安全掃描 + 滲透測試 | 上線前 |
| NFR-06 | 可擴充 | 架構審查 | 開發期 |
| NFR-07 | 可維護 | 日誌整合驗證 | 上線前 |

### 4.3 成果 ↔ 需求 ↔ 功能 對應矩陣 (Outcome ↔ Requirement ↔ Feature)

| 成果代號 ID | 支撐需求 Supports Requirement | 支撐功能 Supports Feature | 量測頻率 Frequency |
|---|---|---|---|
| OR-01 | FR-01/02/03/04/05 | F-01/02/03/04 | 每月 |
| OR-02 | FR-04/05, NFR-01 | F-02/03/05 | 每月 |
| OR-03 | FR-06 | F-06 | 每月 |
| OR-04 | FR-08 | F-09 | 每季 |

### 4.4 終始閉合檢查 (Traceability Closure Check)

| 檢查項 Check | 通過標準 Pass Criteria |
|---|---|
| 需求覆蓋 Requirement Coverage | 每一項需求至少對應一項功能 |
| 功能覆蓋 Feature Coverage | 每一項功能至少支撐一項需求 |
| 成果覆蓋 Outcome Coverage | 每一項成果至少由一項需求支撐 |
| 驗證覆蓋 Verification Coverage | 每一項需求皆有對應驗證方法 |
| 無孤兒項 No Orphans | 無未對應之需求、功能、成果 |

---

## 5. 規劃書 (Implementation Plan)

### 5.1 里程碑 (Milestones)

| 里程碑 Milestone | 代號 Code | 內容 Content | 交付物 Deliverable | 支柱 Pillar |
|---|---|---|---|---|
| M0 | 基礎設施 | Supabase 專案、CI/CD、環境設定 | 可運行骨架 | 跨支柱 |
| M1 | 智慧沉澱 MVP | 內容管理 + 智慧標籤 + 血緣追蹤 | F-01/02/03/04 | P1 |
| M2 | 社群共創 MVP | 共創平台 UI/UX + 審核流程 | F-06 | P2 |
| M3 | 權能鍛造 MVP | 腳本生成器 | F-07 | P3 |
| M4 | 符文鑲嵌 MVP | 插件 API 標準 | F-08 | P4 |
| M5 | 自動化整合 | Boost.space 工作流 | F-09 | 跨支柱 |
| M6 | 行動端 | iOS / Android 原生應用 | F-13 | 跨支柱 |
| M7 | 治理與合規 | 權限、稽核、監控 | F-11/12 | 跨支柱 |
| M8 | 上線與優化 | 負載測試、監控、回饋迴圈 | 上線版本 | 跨支柱 |

### 5.2 建造順序 (Build Order)

1. **M0 基礎設施** → 2. **M1 智慧沉澱**（核心價值）→ 3. **M2 社群共創** → 4. **M3/M4 支柱三/四** → 5. **M5 自動化** → 6. **M6 行動端** → 7. **M7 治理** → 8. **M8 上線優化**

> 優先完成 **一條完整的主工作流**（內容 → 標籤 → 檢索 → 沉澱），再橫向擴展其他支柱，確保每個里程碑皆可獨立驗證與交付。

### 5.3 資源與風險 (Resources & Risks)

| 風險 Risk | 影響 Impact | 緩解措施 Mitigation |
|---|---|---|
| AI 供應商延遲/不穩 | 標籤生成延遲 | 快取、降級路徑、多供應商備援 |
| 標籤準確率不足 | 檢索品質下降 | 主動學習迴圈、使用者修正回饋 |
| 資料規模成長 | 效能下降 | 索引優化、分區、連接池 |
| 安全漏洞 | 資料外洩 | RLS、最小權限、定期掃描 |
| 社群參與不足 | 共創價值打折 | 貢獻獎勵、聲譽系統、引導內容 |

### 5.4 驗證與驗收 (Verification & Acceptance)

- 每一里程碑交付前，執行對應之**終始矩陣驗證**（見 §4.4）。
- 上線前完成 **NFR 基準測試**（延遲、吞吐、準確率、安全）。
- 上線後以 **成果量測**（OR-01~04）追蹤商業成效，並回饋至需求調整。

---

## 6. 附錄 (Appendix)

### 6.1 名詞對照 (Glossary)

| 術語 Term | 說明 Description |
|---|---|
| 智慧沉澱 Intelligence Sedimentation | 將散落資訊依 L1–L5 層級沉澱為組織智慧 |
| 標籤血緣追蹤 Tag Lineage | 記錄標籤變更歷史與原因，可回溯 |
| 符文鑲嵌 Rune Engrafting | 標準插件 API 機制，支援第三方擴展 |
| 權能鍛造 Authority Forging | 依需求自動生成自動化腳本 |
| 終始矩陣 Traceability Matrix | 需求→功能→成果→驗證之可追溯對應 |

### 6.2 文件變更紀錄 (Revision History)

| 版本 Version | 日期 Date | 變更內容 Change |
|---|---|---|
| v1.0 | 2025 | 初版核定 Initial approval |

---

*本規劃書為 Omniesggo 萬能永續平台之單一來源文件，後續建造應依此執行並回報進度。*
*This PRD is the Single Source of Truth for the Omniesggo platform; subsequent build work must follow it and report progress.*
