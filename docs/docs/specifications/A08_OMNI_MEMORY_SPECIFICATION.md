# A08 OmniMemory & Alignment Engine (全通記憶與對齊引擎)

## 1. 核心理念 (Core Concept)
借鑑 Meta Muse 的執行時架構，為 ESG GO 的 `OmniCore` 打造一個具備「長期記憶 (Memory)」、「自動對齊 (Alignment)」、「夢境與遺忘 (Dreams & Forgetting)」的動態演進機制，旨在讓 OmniAgent Swarm 能根據使用者行為與偏好自動調整運作模式。

## 2. 系統架構對應 (Architecture Mapping)

| Meta Muse 功能 | ESG GO 對應實作 (OmniMemory) | 零成本/零算力技術堆疊 |
| :--- | :--- | :--- |
| **Hatch 執行環境** | **OmniAgent Swarm Runtime** | Node.js (Next.js 16) + 既有 VPS 資源 |
| **記憶體管理 (PostgreSQL)** | **Supabase Postgres (FTS)** | 不使用需高算力的 pgvector。改採 Postgres 內建的全文檢索 (Full-Text Search) 與 JSONB 標籤索引，完全免費。 |
| **索賠 (Claims) 管理** | **5T 協議斷言 (5T Assertions)** | 本地端輕量 Hash 封印，不產生鏈上 gas fee。 |
| **夢境與遺忘機制** | **熵減煉金與對齊排程 (Nightly)** | 利用既有 VPS 的 PM2 Cron Jobs，透過本地小語言模型 (或純邏輯規則) 清理過期記憶。 |
| **ALIGNMENT_SYNTHESIS.md** | **OMNI_ALIGNMENT.md** | Obsidian 本地端純文字同步 (零成本) |
| **JSONL 追蹤日誌** | **OmniSync 執行日誌** | 萬能分身追蹤系統 (JSONL) |

## 3. 模組設計 (Module Design)

### 3.1 萬能記憶矩陣 (OmniMemory Matrix)
在 Supabase 中建立 `omni_memory` 表，為了達成「零算力」要求，我們放棄依賴昂貴的 Embedding API，改採傳統高效率索引：
- `id` (UUID)
- `type` (claim, preference, rule, thought)
- `content` (Text)
- `keywords` (String 陣列 / JSONB - 用於關鍵字精確與模糊比對)
- `confidence` (0-1)
- `last_accessed` (Timestamp)

### 3.2 夢境與遺忘引擎 (Dreams & Forgetting Engine)
- **遺忘 (Forgetting)**：每日自動執行背景任務，將 `confidence` 低於閾值且長時間未使用的記憶標記為過期或歸檔，確保 AI 提示詞空間 (Context Window) 的精確度。
- **夢境 (Dreams)**：在背景中，由次級代理 (L-Hub) 非同步分析 `transcript.jsonl`，提取新的 `claims` 或 `preferences` 寫入記憶矩陣，並定期合成。

### 3.3 對齊合成 (Alignment Synthesis)
每次夢境任務完成後，系統會自動生成並更新 `OMNI_ALIGNMENT.md`，該文件將作為所有後續 OmniAgent 喚醒時的「核心靈魂 (JunAiKey)」指引之一。

## 4. 實作路徑 (Implementation Plan)

- **Phase 1: Schema 建立** - 在 Supabase 中設定 `pgvector` 延伸模組與 `omni_memory` 資料表。
- **Phase 2: 記憶存取 API** - 透過 Next.js 建立 `/api/omni-memory/` 端點 (讀取、寫入、相似度搜尋)。
- **Phase 3: 背景演化排程** - 設定 Node.js 背景排程腳本 (`omni-dreams.js`)，處理遺忘與合成機制。
- **Phase 4: 系統整合** - 在 `ESGReportsCenter` 或 OmniCenter 中加入「OmniMemory 儀表板」，讓使用者能直接檢視與管理記憶與對齊狀態。

## 5. 5T 協議確保 (5T Protocol Compliance)
- **Trackable**: 所有記憶的增刪皆記錄於 `OmniSync` 追蹤日誌中。
- **Trustworthy**: 核心偏好與對齊規則將進行 `ZKP Seal` 封印。
