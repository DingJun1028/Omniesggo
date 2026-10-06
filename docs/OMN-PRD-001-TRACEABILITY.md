# OMN-PRD-001 終始矩陣 (Start–End Traceability Matrix)

> **Document ID / 文件代號** OMN-PRD-001-TRACEABILITY · **PRD version / 規劃書版本** v1.1
> **Canonical source / 單一真相源** `shared/prd-matrix.json`
> **Gate / 驗證閘** `pnpm verify:prd-matrix` → `scripts/verify-prd-matrix.mjs` (CI: `terminal-origin` job)
> **Convention** 英標繁博 (English Standard, Traditional Chinese Broad) · 5T Protocol

本文件把 OMN-PRD-001 §4 的終始矩陣由「紙面表格」升級為**可驗證的追溯鏈**：

> **需求 (起點) → 功能 (實現) → 成果 (終點) → 驗證 (證據)**

每一個證據路徑都由驗證閘在磁碟上實際檢查存在性，**禁止虛報**；標記 `planned` 的項目**禁止掛證據**。

---

## 一、狀態詞彙 (Status Vocabulary)

| 狀態 Status | 定義 Definition |
|---|---|
| `implemented` | 已實作、有程式碼與測試證據，閉合完整 |
| `partial` | 部分實作，證據存在但仍有明確缺口 (gap) |
| `planned` | 未實作，**無證據**（依 PRD 里程碑待啟動） |
| `manual` | 成果/非功能驗證需線上量測，證據為量測儀表或空值 |

---

## 二、功能 ↔ 需求 矩陣 (Feature ↔ Requirement)

| 功能 Feature | 支柱 Pillar | 層級 | 狀態 | 支撐需求 Supports | 證據 Evidence | 缺口 Gap |
|---|---|---|---|---|---|---|
| F-01 內容管理 Content Management | P1 | L4 | partial | FR-01 | `app/api/ai-notes/route.ts`, `app/api/ai-notes/[id]/route.ts`, `app/api/notes/route.ts`, `app/api/daily-report/route.ts` | 無版本化與郵件/會議紀錄型別 |
| F-02 智慧標籤引擎 Smart Tag Engine | P1 | L4 | partial | FR-03, FR-04 | `src/core/tags/universal-tag-service.ts`, `app/api/tags/pair/route.ts`, `app/api/tags/universal/route.ts`, `src/agents/twelve-omni/omni-tag.ts` | 知識圖譜僅記憶體 Map，未持久化 |
| F-03 標籤血緣追蹤 Tag Lineage | P1 | L4 | partial | FR-05 | `prisma/schema.prisma`, `app/api/omni-trace/route.ts` | 僅通用 trace，無 tag_lineage 專表 |
| F-04 知識沉澱框架 Sedimentation L1–L5 | P1 | L4 | planned | FR-01 | （無） | L1–L5 層級僅存在於 PRD |
| F-05 向量檢索 Vector Retrieval | P1 | L4 | partial | FR-04 | `src/lib/pgvector.ts`, `src/lib/vector-search.ts`, `src/lib/embedding-generator.ts`, `db/migrations/001_create_omnipotent_schema.sql` | 標籤混合查詢未接線 |
| F-06 社群共創平台 Co-creation Platform | P2 | L5 | partial | FR-06 | `app/api/village/vote/route.ts`, `app/api/village/members/route.ts`, `app/api/village/projects/route.ts`, `prisma/seed-growth.ts` | 無共創撰寫/審核/版本演進 |
| F-07 權能鍛造腳本生成器 Authority Forging | P3 | L4 | implemented | FR-08 | `src/lib/authority-forging/index.ts`, `tests/authority-forging.test.ts` | — |
| F-08 符文鑲嵌插件 API Rune Engrafting | P4 | L1 | implemented | FR-07 | `src/lib/omni-base/plugin-registry.ts`, `src/lib/omni-base/rune-contract.ts`, `app/api/omni/plugins/route.ts`, `tests/rune-engrafting.test.ts` | — |
| F-09 自動化引擎 Automation Engine | cross | L4 | partial | FR-08 | `lib/services/automationService.ts` | 無 Boost.space 整合；輸入來自 F-07 |
| F-10 即時事件流 Realtime Event Stream | cross | L3 | partial | FR-02 | `src/lib/firebase.ts`, `src/lib/supabase-sync-engine.ts`, `app/api/agent/[id]/thought/stream/route.ts` | 無標籤差異專用通道 |
| F-11 權限與治理 Permissions & Governance | cross | L3 | partial | FR-09 | `src/lib/unified-auth.ts`, `src/lib/auth-claims.ts`, `src/middleware.ts`, `db/migrations/001_create_omnipotent_schema.sql` | RLS 僅 1 表；無敏感標籤管控 |
| F-12 管理後台 Admin Console | cross | L5 | partial | FR-10 | `app/admin/page.tsx`, `app/api/admin/surveys/route.ts`, `grafana/provisioning`, `prometheus/prometheus.yml` | 無設定/監控/合規報表整合後台 |
| F-13 原生行動端 Native Mobile | cross | L5 | planned | FR-02, FR-09 | （無） | M6 未啟動，無 .swift/.kt |

---

## 三、需求 ↔ 功能 ↔ 驗證 矩陣 (Requirement ↔ Feature ↔ Verification)

| 需求 Requirement | 優先級 | 對應功能 Feature | 驗證方法 Verification | 證據 Evidence | 狀態 |
|---|---|---|---|---|---|
| FR-01 內容事件持久化 | P0 | F-01 | 單元測試 + 事件日誌 | `tests/api-routes.test.ts` | partial |
| FR-02 即時標籤反映 | P0 | F-10 | Realtime 訂閱測試 | `tests/bus.test.ts`, `src/lib/supabase-sync-engine.ts` | partial |
| FR-03 智慧標籤生成 | P0 | F-02 | 標籤準確率測試 (NFR-03) | `tests/universal-tag-service.test.ts` | partial |
| FR-04 雙向追蹤 | P0 | F-02, F-05 | 雙向查詢整合測試 | `tests/rag-query-behavior.test.ts`, `app/api/tags/pair/route.ts` | partial |
| FR-05 標籤血緣記錄 | P1 | F-03 | 血緣記錄回溯測試 | `app/api/omni-trace/route.ts` | partial |
| FR-06 社群共創 | P1 | F-06 | 共創流程 E2E 測試 | `tests/e2e.test.ts`, `app/api/village/projects/route.ts` | partial |
| FR-07 插件擴展 | P1 | F-08 | 插件 SDK 測試 | `tests/rune-engrafting.test.ts`, `src/lib/omni-base/rune-contract.ts` | implemented |
| FR-08 自動化工作流 | P1 | F-07, F-09 | 工作流整合測試 + 鍛造安全閘測試 | `tests/authority-forging.test.ts`, `lib/services/automationService.ts` | partial |
| FR-09 權限治理 | P0 | F-11 | RLS 政策測試 | `db/migrations/001_create_omnipotent_schema.sql`, `src/middleware.ts` | partial |
| FR-10 稽核與監控 | P1 | F-12 | 稽核日誌驗證 | `tests/audit-logger.test.ts`, `prometheus/prometheus.yml` | partial |

---

## 四、非功能需求 ↔ 驗證 矩陣 (NFR ↔ Verification)

| 需求 NFR | 優先級 | 目標值 Target | 驗證方法 | 驗證階段 | 證據 Evidence | 狀態 |
|---|---|---|---|---|---|---|
| NFR-01 端到端延遲 | P0 | ≤ 200ms | 效能基準測試 | 開發期 + 上線前 | `tests/performance-optimizer.test.ts` | partial |
| NFR-02 吞吐量 | P0 | ≥ 10⁶ 事件/日 | 負載測試 | 上線前 | （無，上線前執行） | manual |
| NFR-03 標籤準確率 | P0 | ≥ 90% | 標籤準確率測試 | 開發期 + 上線前 | `tests/universal-tag-service.test.ts` | partial |
| NFR-04 可用性 | P0 | ≥ 99.9% | 可用性監控 | 上線後持續 | `prometheus/prometheus.yml`, `grafana/provisioning` | partial |
| NFR-05 安全 | P0 | HTTPS / 最小權限 | 安全掃描 + 滲透測試 | 上線前 | `src/middleware.ts`, `db/migrations/001_create_omnipotent_schema.sql`, `docs/SECURITY-AUDIT-dependencies-2026-09-28.md` | partial |
| NFR-06 可擴充 | P1 | 模組化、易於新增整合 | 架構審查 | 開發期 | `src/lib/omni-base/rune-contract.ts`, `src/core/ai/skills/registry.ts`, `tests/rune-engrafting.test.ts` | implemented |
| NFR-07 可維護 | P1 | 日誌可導出集中化 | 日誌整合驗證 | 上線前 | `docs/monitoring/alerting.md`, `grafana/provisioning` | partial |

---

## 五、成果 ↔ 需求 ↔ 功能 矩陣 (Outcome ↔ Requirement ↔ Feature)

| 成果 Outcome | 量測指標 | 目標值 | 支撐需求 | 支撐功能 | 量測方式 | 頻率 | 量測儀表 Instrument | 狀態 |
|---|---|---|---|---|---|---|---|---|
| OR-01 知識沉澱率 | 沉澱知識量成長率 | ≥ 200% / 6 個月 | FR-01, FR-02, FR-03, FR-04, FR-05 | F-01, F-02, F-03, F-04 | 資料庫沉澱層級統計 | 每月 | `data/omni-factory-kpis.json` | manual |
| OR-02 檢索效率 | 平均檢索時間 | 下降 ≥ 50% | FR-04, FR-05, NFR-01 | F-02, F-03, F-05 | 檢索日誌分析 | 每月 | `app/api/ai-notes/search/route.ts` | manual |
| OR-03 社群活躍 | 月活躍貢獻者 | ≥ 1,000 | FR-06 | F-06 | 使用者活動統計 | 每月 | `prisma/seed-growth.ts` | manual |
| OR-04 自動化覆蓋 | 自動化工作流覆蓋率 | ≥ 60% | FR-08 | F-07, F-09 | 工作流監控 | 每季 | `lib/services/automationService.ts` | manual |

---

## 六、技能覆蓋 (Skill Coverage vs PRD)

| 技能 Skill | 任務型別 | 角色 | 覆蓋需求 | 覆蓋 NFR | 證據 Evidence |
|---|---|---|---|---|---|
| junaikey-sovereign 萬能元鑰·超覺醒奧義 | `junaikey_sovereign` | 語意治理與自我成長引擎：觀/覺/練/印 四階段，以 5T 封印輸出 | FR-03, FR-05, FR-10 | NFR-03, NFR-06 | `src/core/ai/skills/junaikey-sovereign.ts`, `src/core/ai/skills/__tests__/registry.test.ts`, `src/core/ai/skills/__tests__/api-integration.test.ts` |

**解讀 (Reading):** JunAiKey 對 PRD 的貢獻是**治理與品質閘**，而非業務功能本身——它以零幻覺驗算支撐 FR-03 標籤品質、以 Hash Lock 封印支撐 FR-05 血緣可回溯、以 5T 軌跡支撐 FR-10 稽核，並以技能註冊表的模組化結構支撐 NFR-06。

---

## 七、終始閉合檢查 (Traceability Closure Check §4.4)

| 檢查項 | 通過標準 | 實測結果 |
|---|---|---|
| 需求覆蓋 Requirement Coverage | 每一項需求至少對應一項功能 | ✅ 10/10 |
| 功能覆蓋 Feature Coverage | 每一項功能至少支撐一項需求 | ✅ 13/13（F-13 於 PRD v1.1 補列） |
| 成果覆蓋 Outcome Coverage | 每一項成果至少由一項需求支撐 | ✅ 4/4 |
| 驗證覆蓋 Verification Coverage | 每一項需求皆有對應驗證方法 | ✅ 17/17（FR + NFR） |
| 無孤兒項 No Orphans | 無未對應之需求、功能、成果 | ✅ JSON ↔ Markdown ↔ PRD 三方位同步 |
| 證據真實性 Evidence Reality | 證據路徑存在、planned 不掛證據 | ✅ 由 `verify:prd-matrix` 實測磁碟 |

> ⚠️ 上表的 ✅ **不是人工宣稱**，而是 `pnpm verify:prd-matrix` 的實際輸出結果。任一項失敗即 exit 1，並阻斷 CI。

---

## 八、PRD 反饋 (Feedback into PRD)

終始閉合檢查發現 PRD v1.0 的兩處斷鏈，已回饋至 `docs/OMN-PRD-001.md`：

1. **F-13 於 §4.1 無對應需求**（孤兒功能）→ v1.1 補列 `FR-02`、`FR-09`（原生端必須承接即時推送與權限治理契約）。
2. **F-04 無實作**（僅 PRD 文字）→ 維持 `planned`，對應里程碑 M1 之後補建。

這正是終始矩陣存在的意義：**斷鏈被儀器抓到，而不是被遺忘。**

---

## 九、驗證方式 (How to Verify)

```bash
pnpm verify:prd-matrix      # 獨立執行本矩陣閘
pnpm verify:matrix          # 終始矩陣統一閘（含本閘）
```

- Canonical: `shared/prd-matrix.json`
- Gate: `scripts/verify-prd-matrix.mjs`
- PRD: `docs/OMN-PRD-001.md`

5T: `Truth`（證據實存）· `Trustable`（不可虛報）· `Trackable`（ID 可追溯）· `Goodness`（斷鏈即回饋 PRD）· `Beauty`（單一真相源，雙文件同步）
