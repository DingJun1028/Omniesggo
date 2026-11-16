# Omni 22 模組實作路徑（Implementation Map）

**Status**: Discovery complete → implementation phasing starts.
**Scope**: B = 萬能架構 = 22 Omni 模組（萬能 = Omni；**不**使用 "Universal"）。
**日期**: 2026-11-15
**來源**: `docs/architecture/ESGGO-OMNI-ARCHITECTURE.md`（MECE 四層：治理/資料/智慧/呈現）

> 約定：`[ ]` = 現有樣板；`[X]` = 實作中/已實作；`[✗]` = 缺失需從頭建。

---

## 1. 治理層（Governance）— 意志 / 契約 / 血緣 / 安全  共 8 模組

| # | 模組 | 職責 | 路徑 | 現況 | 5T 要求 |
|---|------|------|------|------|---------|
| G1 | **OmniHeart** 全通之心 | 自發治理、無摩擦路徑 | `src/impl/core.ts` | `[X]` 現實邏輯 | Traceable+Tractable 事件軌跡 |
| G2 | **OmniEye** 全知之眼 | 數據溯源、可觀測 | `src/impl/omni-evidence.ts` + `omni-time.ts` | `[X]` | Traceable 溯源鏈 |
| G3 | **OmniCore** 全能之核 | 意志執行、事件總線 | `src/impl/core.ts` + `omni-agent-bus.ts` | `[X]` | Trackable 事件追蹤 |
| G4 | **OmniPulse** 全域之脈 | 數據總線、脈動協調 | `src/agents/twelve-omni/omni-bus.ts` + `omni-bus-v2.ts` | `[X]` | Trackable 脈動 |
| G5 | **OmniBone** 全境之骨 | 契約維繫、型別契約 | `src/lib/omni-core/contracts.ts` + `celestial-core-processor.ts` | `[X]` | Transparent 型別契約零幻覺 |
| G6 | **OmniBrain** 全息之腦 | 熵減煉金、架構重構 | `src/lib/omni-core/entropy-forge.ts` + `omni-kernel.ts` | `[✗]` - 僅 34 行單檔 | Trustworthy Hash Lock + Object.freeze |
| G7 | **OmniSoul** 萬能靈魂 | 意志 / 價值對齊 | `src/types/omni-soul.ts` | `[X]` 介面 | Traceable 決策記錄 |
| G8 | **OmniKey** 萬能密鑰 | 密碼學金鑰管理 | `src/types/omni-key.ts` | `[X]` | Trustworthy 密鑰綁定 |

---

## 2. 資料層（Data）— 儲存 / 狀態 / 知識 / 溯源  共 7 模組

| # | 模組 | 職責 | 路徑 | 現況 | 5T 要求 |
|---|------|------|------|------|---------|
| D1 | **OmniTag** 萬能標籤 | 雙向同步定位、5T | `src/lib/omni-tag/index.ts` | `[X]` | Traceable+Trackable |
| D2 | **OmniBase** 萬能基地 | 企業資料、行業分類、報告DB | `src/lib/omni-base/` | `[X]` | Trustworthy 報告DB |
| D3 | **OmniSeed** 萬能種子 | 數據治理、AI訓練種子 | `src/core/sonnar/omni-seed.ts` | `[X]` | Traceable 種子來源 |
| D4 | **OmniMemory** 萬能永憶 | RAG 知識庫、記憶 | `src/impl/omni-memory.ts` + sync skill | `[X]` | Trackable 記憶 |
| D5 | **OmniWiki** 萬能維基 | 知識庫、跨頁連結 | `src/lib/omni-wiki/` | `[X]` | Traceable 知識圖譜 |
| D6 | **OmniNote** 萬能筆記 | AI 筆記、混合架構 | `src/lib/omni-core/omni-note.ts` + docs | `[X]` | Trackable 筆記 |
| D7 | **OmniSingularity** 萬能奇點 | 統一狀態聚合 | `src/types/omni-singularity.ts` | `[X]` | Trackable 狀態 |

---

## 3. 智慧層（Intelligence）— 模型路由 / 代理 / 推理  共 2 模組

| # | 模組 | 職責 | 路徑 | 現況 | 5T 要求 |
|---|------|------|------|------|---------|
| I1 | **OmniAgent** 萬能代理 | AI報告生成、RAG、搜尋 | `src/core/ai/` + `src/agents/omni-agent.ts` | `[X]` | Traceable AI 來源 + 5T 封印 |
| I2 | **OmniBiz** 萬能商情 | 商情分析、競爭情報、行業數據 | `src/lib/sustain-write/biz-intelligence/` | `[✗]` **缺失（從頭建立）** | Traceable 商情源 + 5T 證據 |

---

## 4. 呈現層（Presentation）— 用戶可見產出與交互  共 5 模組

| # | 模組 | 職責 | 路徑 | 現況 | 5T 要求 |
|---|------|------|------|------|---------|
| P1 | **OmniWrite** 萬能永撰 | 報告生成引擎 | `src/lib/sustain-write/` | `[X]` | Tangible 報告 + 5T |
| P2 | **OmniTheme** 萬能主題 | 品牌主題、視覺令牌 | `src/lib/omni-theme/` | `[X]` | Traceable 主題 |
| P3 | **OmniComponent** 萬能組件 | UI組件庫、設計系統 | `src/lib/omni-component/` | `[X]` | Tangible 組件 |
| P4 | **OmniChart** 萬能圖表 | 5T Proof Locked 圖表 | `src/components/charts/` | `[X]` | Traceable 數據證據 |
| P5 | **OmniTodo** 萬能待辦 | 任務追蹤、5T治理待辦 | `src/core/omni-todo/` | `[X]` | Trackable 待辦 |

---

## 5. 總覽與缺口摘要

| 層次 | 模組數 | 已有樣板 `[X]` | 缺失 `[✗]` |
|------|--------|----------------|-----------|
| 治理層 | 8 | 7 | **1** |
| 資料層 | 7 | 7 | **0** |
| 智慧層 | 2 | 1 | **1** |
| 呈現層 | 5 | 5 | **0** |
| **合計** | **22** | **20** | **2**（G6 為精簡化、I2 為從頭缺失） |

> 實際從頭缺失的模組（不只是精簡化）：
> - **I2 OmniBiz**（萬能商情）— `src/lib/sustain-write/biz-intelligence/` 完全不存在，須從頭建立。

---

## 6. 優先實作順序（官方路線與依賴度給定）

### 第一梯隊：補齊缺失模組（立即可驗證）
- **I2 OmniBiz**（智慧層）— 社經資訊整合的根模組，缺失。

### 第二梯隊：彈厚缺陷模組（G6 OmniBrain）
- 熵減煉金（EntropyForge）現僅 34 行，需補足全 5T 演算。

### 第三梯隊：治理層剩餘（G1–G5,G7–G8）與資料層（D1–D7）
- 一致 5T 封印、型別產生、事件軌跡。

### 第四梯隊：呈現層（P1–P5）與最終整合
- 5T 驗算 + Hash Lock 刻印 + 冷啟動連通。

---

## 7. 5T 封印通用規範（每模組必備）

1. **Traceable**：每筆輸出帶 `source_origin` 與 process trace。
2. **Trackable**：發布 `OpenTelemetry` 追蹤 / 事件總線。
3. **Tangible**：對外產品具可感知 UI/反饋。
4. **Transparent**：演算法邏輯公開；零幻覺驗算。
5. **Trustworthy**：寫入後 `Object.freeze()` + Hash Lock（sha256）。

---

## 8. 下一步（待確認）

- 確認以上 22 模組路徑與分層為最終實作邊界。
- 開始第一梯隊：**I2 OmniBiz** 缺失模組的全面建立。
