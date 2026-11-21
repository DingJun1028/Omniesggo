# ESGGO 萬能架構總覽（Unified Architecture Overview）

> 本文件是 ESGGO 架構知識的**單一可導航入口**。採用 **MECE 分類法則**（Mutually Exclusive, Collectively Exhaustive — 互斥且完全窮盡）對萬能架構進行分析組構：所有 Omni 模組依「架構關注點」劃分為四個互斥層次（治理 / 資料 / 智慧 / 呈現），每模組唯一歸層、全體窮盡，無重疊無遺漏。
>
> 所有模組路徑均經 `2026-07-18` 實際檢查確認存在（非示意）。

---

## 1. 架構哲學與 MECE 分類原則

ESGGO 核心治理原則為 **5T 協議**（真→善→美→信→通），目標「圓通無礙（Seamless Unity）」。

**MECE 分類軸選擇**：按「架構關注點（Architectural Concern）」縱向分層，而非按模組功能橫向列舉。理由：
- **互斥（Mutually Exclusive）**：每個 Omni 模組依其主要職責唯一歸屬一層，避免「既是資料又是呈現」的模糊歸類。
- **窮盡（Collectively Exhaustive）**：四層覆蓋從意志契約（治理）到用戶交付（呈現）的完整鏈路，所有已知 Omni 模組均落入其一。

### MECE 四層架構

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 4  呈現層 Presentation  — 用戶可見的產出與交互          │
│  OmniWrite · OmniTheme · OmniComponent · OmniChart · OmniTodo │
├─────────────────────────────────────────────────────────────┤
│  Layer 3  智慧層 Intelligence  — 模型路由 / 代理 / 推理        │
│  OmniAgent · OmniBiz                                          │
├─────────────────────────────────────────────────────────────┤
│  Layer 2  資料層 Data  — 儲存 / 狀態 / 知識 / 溯源            │
│  OmniTag · OmniBase · OmniSeed · OmniMemory · OmniWiki ·      │
│  OmniNote · OmniSingularity                                  │
├─────────────────────────────────────────────────────────────┤
│  Layer 1  治理層 Governance  — 意志 / 契約 / 血緣 / 安全       │
│  Hexa-Core(6) · OmniSoul · OmniKey                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 治理層（Governance）— 意志 / 契約 / 血緣 / 安全

基礎設施與治理原語，定義「系統如何被信任與編排」。

### Hexa-Core 六位一體

| 組件 | 名稱 | 職責 | 實作位置 |
|------|------|------|----------|
| OmniHeart | 全通之心 | 自發治理、無摩擦路徑 | `src/impl/core.ts`（OmniCoreEcosystem）|
| OmniEye | 全知之眼 | 數據溯源、可觀測 | `src/impl/omni-evidence.ts` + `omni-time.ts` |
| OmniCore | 全能之核 | 意志執行、事件總線 | `src/impl/core.ts` + `src/lib/omni-agent-bus.ts` |
| OmniPulse | 全域之脈 | 數據總線、脈動協調 | `src/agents/twelve-omni/omni-bus.ts` + `omni-bus-v2.ts` |
| OmniBone | 全境之骨 | 契約維繫、型別契約 | `src/lib/omni-core/contracts.ts` + `celestial-core-processor.ts` |
| OmniBrain | 全息之腦 | 熵減煉金、架構重構 | `src/lib/omni-core/entropy-forge.ts` + `omni-kernel.ts` |

### 治理型別與安全

| 模組 | 說明 | 實作位置 |
|------|------|----------|
| **OmniSoul** 萬能靈魂 | 意志 / 價值對齊 | `src/types/omni-soul.ts` |
| **OmniKey** 萬能密鑰 | 密碼學金鑰管理 | `src/types/omni-key.ts` |

---

## 3. 資料層（Data）— 儲存 / 狀態 / 知識 / 溯源

系統的「記憶與事實」，支撐上層智慧與呈現。

| 模組 | 說明 | 關鍵技術 | 實作位置（已驗證）|
|------|------|----------|-------------------|
| **OmniTag** 萬能標籤 | 量子糾纏式雙向同步定位，支援 5T | 雙向同步 | `src/lib/omni-tag/index.ts` |
| **OmniBase** 萬能基地 | 企業資料管理、行業分類、報告資料庫 | 資料層 | `src/lib/omni-base/` |
| **OmniSeed** 萬能種子 | 數據治理與 AI 訓練基礎數據生成器 | 種子/治理 | `src/core/sonnar/omni-seed.ts` |
| **OmniMemory** 萬能永憶 | 智能數據記憶、RAG 知識庫 | 記憶 | `src/impl/omni-memory.ts` + `omni-sync-memory` skill |
| **OmniWiki** 萬能維基 | 知識庫維基、跨頁連結 | 知識圖譜 | `src/lib/omni-wiki/` |
| **OmniNote** 萬能筆記 | AI 萬能筆記、混合架構、筆記知識化 | 筆記 | `src/lib/omni-core/omni-note.ts` + `docs/omni-note-architecture.md` |
| **OmniSingularity** 萬能奇點 | 統一狀態聚合 | 狀態 | `src/types/omni-singularity.ts` |

---

## 4. 智慧層（Intelligence）— 模型路由 / 代理 / 推理

將資料轉化為判斷與行動的認知層。

| 模組 | 說明 | 關鍵技術 | 實作位置（已驗證）|
|------|------|----------|-------------------|
| **OmniAgent** 萬能代理 | AI 報告生成引擎、RAG 檢索、語意搜尋 | AI/RAG | `src/core/ai/` + `src/agents/omni-agent.ts` |
| **OmniBiz** 萬能商情 | 商情分析、競爭情報、行業數據整合 | 商情 | `src/lib/sustain-write/biz-intelligence/` |

---

## 5. 呈現層（Presentation）— 用戶可見的產出與交互

系統對外的價值交付面。

| 模組 | 說明 | 關鍵技術 | 實作位置（已驗證）|
|------|------|----------|-------------------|
| **OmniWrite** 萬能永撰 | 數據驅動永續報告生成引擎（圖表、RWD、品牌化）| 報告生成 | `src/lib/sustain-write/` |
| **OmniTheme** 萬能主題 | 品牌主題、視覺令牌、多品牌化 | 主題引擎 | `src/lib/omni-theme/` |
| **OmniComponent** 萬能組件 | 可複用 UI 組件庫、設計系統 | 組件系統 | `src/lib/omni-component/` |
| **OmniChart** 萬能圖表 | 5T Proof Locked 圖表 | 視覺化 | `src/components/charts/` |
| **OmniTodo** 萬能待辦 | 任務追蹤、5T 治理待辦、工作流 | 任務 | `src/core/omni-todo/` |

---

## 6. MECE 完備性檢查

| 層次 | 模組數 | 涵蓋 |
|------|--------|------|
| 治理層 | 8（Hexa-Core 6 + Soul + Key）| 意志/契約/血緣/安全 |
| 資料層 | 7 | 儲存/狀態/知識/溯源 |
| 智慧層 | 2 | 模型/代理/推理 |
| 呈現層 | 5 | UI/報告/品牌/圖表/任務 |
| **合計** | **22** | 全體窮盡，每模組唯一歸層 |

> 若未來新增 Omni 模組，依其主要職責落入四層之一即可保持 MECE。跨層依賴（如 OmniWrite 讀 OmniBase）是層間調用，不破壞分類互斥性。

---

## 7. OmniSkill Codex（技能書體系）

- **技能書**：`.agents/rules/OMNISKILL_BOOK.md`（v2.1，代理矩陣、技能索引、5T 協議）
- **全局憲法**：`.agents/rules/global-rule.md`（Hexa-Core、Sacred Trinity、ADR 流程）
- **實踐技書**：`esggo-shijian-jishu`（esggo 實戰方法論總冊）

---

## 8. 雙向 TypeScript

- **共享型別**：`packages/shared/src/types.ts`，前後端共用
- **驗證**：Zod Schema，嚴格模式零 `any`（動態邊界除外）
- **型別門檻**：`tsconfig.core.json`（core 門檻）+ `tsconfig.json`（root 全量）雙道皆過 = 型別全綠

---

## 9. 架構決策記錄（ADR）索引

| ADR | 主題 | 文件 |
|-----|------|------|
| ADR-001 | Event Sourcing for AI Model Routing | `docs/architecture/ARCHITECTURE-DECISION-LOG.md` |
| ADR-002 | Zero-Trust Security Model | 同上 |
| ADR-003 | Multi-Provider Model Discovery | 同上 |
| ADR-004 | Shadow Testing Framework | 同上 |
| ADR-005 | 生產部署策略 | `docs/ADR-005-production-deployment-strategy.md` |
| ADR-006 | Complete Autonomous Delegation | `docs/architecture/COMPLETE-AUTONOMOUS-DELEGATION-ARCHITECTURE.md` |

---

## 10. 部署架構

- **VPS**：`vps/` 完整部署腳本（PM2 ecosystem、Nginx、監控）
- **容器化**：根 `Dockerfile`（含 HEALTHCHECK 探 `/api/healthz`）+ `vps/docker-compose.prod.yml`
- **CI/CD**：`.github/workflows/`（ci / deploy / deploy-oracle / security-audit / check-design）
- **保護**：`main` 受保護（1 審查 + enforce admins）；合規自合併走 DELETE→squash→PUT

---

## 11. 參考文檔

- `README.md` — 核心架構章節（Hexa-Core 圖、十二大系統表、5T 協議標準）
- `docs/architecture/ARCHITECTURE-DECISION-LOG.md` — ADR-001~004
- `docs/ADR-005-production-deployment-strategy.md` — 部署策略
- `docs/architecture/COMPLETE-AUTONOMOUS-DELEGATION-ARCHITECTURE.md` — 完全代主自行架構
- `docs/ai-notes-design/architecture.md` — AI 萬能筆記混合架構
- `.agents/rules/OMNISKILL_BOOK.md` — OmniSkill Codex v2.1

---

*本總覽為 2026-07-18 補全，採 MECE 法則重組 ESGGO 萬能架構。模組路徑均經實際檢查確認。*
