# 方向 C：AI 原生重構 — 60 員軍團整合版（深貫廣通）

> Omniesggo 已具備 60 員雙蜂軍團（Dual-Hive 60）+ JunAikey + OmniTag + auto-repair v2 基礎。
> 本版將 60 員軍團從「靜態定義」升級為「動態編排核心」，與方向 C 深度整合，缺口補齊，圓通無礙。

---

## 一、60 員軍團 × 方向 C 映射矩陣

### 1.1 雙蜂 → Agent 角色映射
| 60 員陣列 | 編號 | 方向 C Agent 角色 | 職責 | 部署側 |
|---|---|---|---|---|
| 智庫聖所 | 01-06 (umbra) / 31-36 (lumen) | **Knowledge Curator** | 記憶沉澆 + RAG 資料源 + 向量嵌入 | local + vps |
| 符文契約 | 07-12 / 37-42 | **Contract Guardian** | TypeBox schema 驗證 + PRD 追溯 + API 契約 | local + vps |
| 暗翼/光翼 | 13-18 / 43-48 | **Task Dispatcher** | 背景 Task 調度 + ADK 編排 + Bento 渲染 | local + vps |
| 煉金熵減 | 19-24 / 49-54 | **Self-Healer + Auto-Repair v3** | CI 修復 + 重構 + 效能監控 | local + vps |
| 5T 驗算 | 25-30 / 55-60 | **Quality Gatekeeper** | 5T 合規驗算 + Hash Lock + soul-lineage | local + vps |

### 1.2 Agent 角色 × 60 員陣列對應
| 方向 C Agent | 主要陣列 | 輔助陣列 | 60 員編號範圍 |
|---|---|---|---|
| **Planner** | 智庫聖所 | 5T 驗算 | 02, 32 (規劃蜂) + 25, 55 (測場蜂) |
| **Coder** | 符文契約 | 暗翼/光翼 | 07, 37 (編碼蜂) + 13, 43 (圖像蜂) |
| **Reviewer** | 5T 驗算 | 符文契約 | 30, 60 (質控蜂) + 09, 39 (架構蜂) |
| **Tester** | 煉金熵減 | 5T 驗算 | 11, 41 (測試蜂) + 25, 55 (測場蜂) |
| **Self-Healer** | 煉金熵減 | 智庫聖所 | 19, 49 (增長蜂) + 06, 36 (優化蜂) |
| **Doc-Sync** | 智庫聖所 | 5T 驗算 | 04, 34 (策効蜂) + 30, 60 (質控蜂) |
| **Knowledge Curator** | 智庫聖所 | — | 01-06, 31-36 (全智庫聖所) |
| **Contract Guardian** | 符文契約 | — | 07-12, 37-42 (全符文契約) |

---

## 二、60 員軍團升級路線

### 2.1 現況（靜態定義）
```
soul-matrix-60.ts → SOUL_MATRIX_60: SoulAgent60[] (60 員)
  ├── HiveSide: 'local' | 'vps'
  ├── ArrayKey: 'sanctum' | 'rune' | 'wing' | 'alchemy' | 'audit'
  ├── alignment: 'umbra' | 'lumen'
  ├── archetype: 12 種原型
  └── verify-oa-gap.mjs (5/5 驗證閘)
```

### 2.2 升級後（動態編排）
```
Agent Bus v2 Orchestrator
  ├── Agent Registry (from soul-matrix-60.ts)
  │   ├── 60 員靜態定義 → 動態實例化
  │   ├── HiveSide 路由 → local/vps agent 派遣
  │   └── alignment 路由 → umbra/lumen 記憶分區
  ├── Task Graph (DAG)
  │   ├── Planner → 依陣列能力派遣 task
  │   ├── 並行/序列/條件分支
  │   └── retry + timeout + circuit breaker
  ├── Memory Hub (tencent-mem.ts)
  │   ├── umbra → /api/assets?tag=umbra
  │   ├── lumen → /api/assets?tag=lumen
  │   └── 暗光共鳴 → cross-agent 知識共享
  └── 5T 驗算 (purify + verifyZeroHallucination)
      ├── 每次 PR 自動驗證
      └── Hash Lock (sealComponentCore)
```

### 2.3 關鍵變革
| 維度 | 現況 | 升級後 |
|---|---|---|
| 60 員定義 | 靜態 TypeScript 陣列 | 動態 agent 實例（可擴縮） |
| 派遣機制 | 手動/腳本觸發 | Planner agent 自動 DAG 分配 |
| 記憶共享 | MemoryHub 路由 | RAG + 向量搜尋 + 暗光共鳴 |
| 5T 驗算 | CI 腳本手動跑 | 每次 PR 自動 + 信心閾值 |
| 部署側 | 固定 local/vps | 動態分配（負載均衡） |
| 監控 | 無 | Prometheus + Grafana + agent heartbeat |

---

## 三、60 員 × 方向 C 六階段整合

### 階段 1：Agent Bus v2 + 60 員 Registry（第 1-2 週）
**目標**：將 60 員靜態定義接入 Agent Bus v2，實現動態派遣。

**具體動作**：
1. `packages/omni-agent-bus/src/registry/` 新增 `agent-registry.ts`
   - 從 `oa-swarm/src/soul-matrix-60.ts` 載入 60 員定義
   - 轉換為 Agent Bus 的 `AgentDescriptor` 格式
   - 支援 HiveSide 路由（local → 本機 agent，vps → VPS agent）
2. `packages/omni-agent-bus/src/orchestrator/` 新增 `task-graph.ts`
   - DAG 結構，節點 = task，邊 = 依賴
   - Planner agent 依陣列能力分配 task
   - 並行執行（同陣列內）+ 序列執行（跨陣列依賴）
3. `packages/omni-agent-bus/src/memory/` 新增 `memory-hub-bridge.ts`
   - 橋接 tencent-mem.ts 的 MemoryHub API
   - umbra/lumen 路由自動分區
   - 暗光共鳴：cross-agent 知識共享

**60 員參與**：
- Knowledge Curator（01-06, 31-36）：初始化記憶沉澆
- Contract Guardian（07-12, 37-42）：驗證 schema 契約
- Task Dispatcher（13-18, 43-48）：建立 task graph

**驗證**：
- `verify-oa-gap.mjs` 5/5 通過（60 員觸達）
- Agent Bus v2 能派遣 3 agent 並行完成簡單 task
- Memory Hub 路由正確（umbra → umbra，lumen → lumen）

### 階段 2：Auto-Repair v3 + 煉金熵減陣列（第 3-4 週）
**目標**：將 auto-repair 升級為 LLM 驅動，由煉金熵減陣列（19-24, 49-54）主導。

**具體動作**：
1. `scripts/auto-repair-v3/` 新增：
   - `analyze.mjs`：LLM 分析 CI 錯誤 → root cause + fix strategy
   - `generate-fix.mjs`：LLM 生成 fix patch
   - `verify-fix.mjs`：自動跑測試 + typecheck + lint
   - `create-pr.mjs`：自動開 PR + 詳細描述
2. 煉金熵減陣列 agent 定義：
   - 19/49（增長蜂）：監控 CI 失敗趨勢
   - 20/50（運營蜂）：協調修復流程
   - 21/51（商業分析蜂）：評估修復影響
   - 22/52（探路蜂）：探索替代修復方案
   - 23/53（外交蜂）：通知相關 stakeholder
   - 24/54（調研蜂）：收集修復歷史數據
3. 信心閾值：confidence > 0.8 → 自動 PR；< 0.8 → 只報告
4. 修復歷史追蹤 → 持續改善 prompt

**60 員參與**：
- 煉金熵減（19-24, 49-54）：主導修復流程
- 智庫聖所（01-06, 31-36）：提供歷史修復記憶
- 5T 驗算（25-30, 55-60）：驗證修復合規

**驗證**：
- 故意引入 5 種常見錯誤，v3 能自動修復 ≥3 種
- 修復 PR 包含 root cause 分析 + 測試結果

### 階段 3：測試自動生成 + 符文契約陣列（第 5-6 週）
**目標**：AI 自動生成測試，由符文契約陣列（07-12, 37-42）主導。

**具體動作**：
1. `scripts/gen-tests/` 新增：
   - `gen-unit.mjs`：source → vitest 測試（含 edge cases）
   - `gen-e2e.mjs`：UI 變更 → Playwright 測試
   - `coverage-check.mjs`：coverage 閾值檢查（≥80%）
2. 符文契約陣列 agent 定義：
   - 07/37（編碼蜂）：生成測試程式碼
   - 08/38（算法蜂）：生成 edge case
   - 09/39（架構蜂）：驗證測試架構
   - 10/40（數據蜂）：測試資料生成
   - 11/41（測試蜂）：執行測試
   - 12/42（設計蜂）：E2E 測試腳本
3. CI 整合：PR 開啟 → 自動生成測試 → 跑測試 → 報告 coverage

**60 員參與**：
- 符文契約（07-12, 37-42）：主導測試生成
- 5T 驗算（25-30, 55-60）：驗證測試合規
- 煉金熵減（19-24, 49-54）：監控測試品質

**驗證**：
- 對 10 個未測試模組生成測試，≥7 個能通過
- Coverage 提升 ≥20%

### 階段 4：文件同步 + 智庫聖所陣列（第 7-8 週）
**目標**：code 變更 → 自動更新文件，由智庫聖所陣列（01-06, 31-36）主導。

**具體動作**：
1. `scripts/doc-sync/` 新增：
   - `sync-readme.mjs`：模組列表自動更新
   - `sync-arch.mjs`：架構變更 → ARCHITECTURE.md
   - `sync-api.mjs`：API route → OpenAPI spec
   - `sync-soul.mjs`：soul-chapter 摘要生成
   - `sync-prd.mjs`：schema 變更 → prd-matrix.json
2. 智庫聖所陣列 agent 定義：
   - 01/31（萬能蜂后）：戰略記憶庫更新
   - 02/32（規劃蜂）：長程規劃脈絡
   - 03/33（分析蜂）：數據洞察會話
   - 04/34（策効蜂）：方案資產沉澆
   - 05/35（風險蜂）：風險事件會話
   - 06/36（優化蜂）：流程熵減追蹤

**60 員參與**：
- 智庫聖所（01-06, 31-36）：主導文件沉澆
- 5T 驗算（25-30, 55-60）：驗證文件合規
- 符文契約（07-12, 37-42）：驗證 API 契約

**驗證**：
- 修改一個 API route → doc-sync 自動生成文件更新 PR
- soul-chapter 摘要自動生成

### 階段 5：知識圖譜 + RAG + 暗翼/光翼陣列（第 9-12 週）
**目標**：建立 codebase 知識圖譜，由暗翼/光翼陣列（13-18, 43-48）主導。

**具體動作**：
1. Indexing pipeline：
   - code → AST → chunks → embeddings → Supabase pgvector
   - 選擇 embedding model：Ollama `nomic-embed-text`
   - 向量 DB：Supabase pgvector（已有 Supabase）
2. RAG API：
   - agent query → retrieve relevant chunks → inject context
   - 整合到 Coder agent：寫新功能時自動檢索相關 code + docs
3. 暗翼/光翼陣列 agent 定義：
   - 13/43（圖像蜂）：視覺化知識圖譜
   - 14/44（動畫蜂）：動態更新圖譜
   - 15/45（文案蜂）：文件語意索引
   - 16/46（音頻蜂）：語音查詢介面
   - 17/47（市場蜂）：外部知識整合
   - 18/48（社群蜂）：協作知識共享
4. 暗光共鳴機制：
   - umbra 寫入的 codegraph → lumen 代理可召回
   - cross-agent 知識共享 → RAG 上下文更豐富

**60 員參與**：
- 暗翼/光翼（13-18, 43-48）：主導知識圖譜
- 智庫聖所（01-06, 31-36）：資料沉澆
- 5T 驗算（25-30, 55-60）：驗證知識合規

**驗證**：
- agent 能正確回答「FTG journey API 的認證機制是什麼？」
- 暗光共鳴：umbra 寫入 → lumen 召回成功

### 階段 6：全系統自癒 + 5T 驗算陣列（第 13-16 週）
**目標**：生產環境錯誤 → agent 自動分析 + 修復 + 部署，由 5T 驗算陣列（25-30, 55-60）主導合規驗證。

**具體動作**：
1. 監控整合：Sentry/Datadog → webhook → agent
2. 錯誤分類：LLM 分析錯誤類型（runtime/logic/config/infra）
3. 修復生成：LLM 生成 fix → 開 PR → 跑 CI → 人類 approve → 自動部署
4. 回滾機制：修復失敗 → 自動 revert → 告警人類
5. 5T 驗算陣列 agent 定義：
   - 25/55（測場蜂）：現場回饋收集
   - 26/56（追蹤蜂）：競品/錯誤追蹤
   - 27/57（安全蜂）：資安驗證
   - 28/58（維護蜂）：維運 SOP 執行
   - 29/59（支援蜂）：技術支援
   - 30/60（質控蜂）：品質標準驗證 + Hash Lock

**60 員參與**：
- 5T 驗算（25-30, 55-60）：主導合規驗證
- 煉金熵減（19-24, 49-54）：執行修復
- 智庫聖所（01-06, 31-36）：提供歷史記憶
- 符文契約（07-12, 37-42）：驗證契約合規

**驗證**：
- 模擬生產錯誤 → agent 自動修復或回滾
- SLA：P0 錯誤 15 分鐘內自動修復或回滾
- 5T 驗算全通過

---

## 四、暗光共鳴機制（Cross-Agent Knowledge Sharing）

### 4.1 機制設計
```
┌─────────────────┐     ┌─────────────────┐
│  Umbra (01-30)  │     │  Lumen (31-60)  │
│  潛行·觀察·隱蔽  │     │  啟示·創造·淨化  │
├─────────────────┤     ├─────────────────┤
│  codegraph      │◄───►│  wiki           │
│  (內部實作)     │ 共鳴 │  (文件沉澆)     │
├─────────────────┤     ├─────────────────┤
│  skill          │◄───►│  chat_memory    │
│  (技能步驟)     │ 共鳴 │  (會話脈絡)     │
└─────────────────┘     └─────────────────┘
         │                       │
         └───────┬───────────────┘
                 ▼
         ┌───────────────┐
         │  RAG Context  │
         │  (統一檢索)   │
         └───────────────┘
```

### 4.2 實作
1. **寫入側**：umbra agent 寫入 codegraph → 自動標記 `alignment=umbra` + `session_key`
2. **召回側**：lumen agent 查詢 wiki → 自動包含 umbra 的 codegraph（同 session_key）
3. **向量嵌入**：所有資產嵌入向量 → Supabase pgvector → 語意搜尋
4. **權限控制**：visibility 繼承主屬性（umbra → agent/restricted，lumen → team/restricted）

---

## 五、5T 驗算自動化

### 5.1 現況
- `verify-oa-gap.mjs`：5/5 驗證閘（手動/CI 觸發）
- `purify` + `verifyZeroHallucination`：5T 協定驗算
- `sealComponentCore`：Hash Lock 刻印

### 5.2 升級後（自動化）
```
每次 PR → GitHub Actions → 5T 驗算 Agent（25-30/55-60）
  ├── Traceable: ISoulArtifact source_origin 檢查
  ├── Trackable: swarm-core 生命週期 Hook 驗證
  ├── Tangible: dashboard.html 5T 視覺化
  ├── Transparent: protocol-5t purify 公開演算
  └── Trustworthy: verifyZeroHallucination + Hash Lock
  → 全通過 → auto-approve（人類仍可 override）
  → 任一失敗 → block PR + 詳細報告
```

### 5.3 信心閾值
| 驗算項 | 閾值 | 失敗處理 |
|---|---|---|
| 5/5 驗證閘 | 100% | Block PR |
| purify 零幻覺 | 100% | Block PR |
| Hash Lock 完整性 | 100% | Block PR |
| Coverage ≥80% | 80% | Warning（不 block） |
| Auto-Repair confidence | ≥0.8 | 只報告，不自動 PR |

---

## 六、缺口補齊清單

### 6.1 已識別缺口
| # | 缺口 | 影響 | 補齊方案 | 優先級 |
|---|---|---|---|---|
| G1 | 60 員無動態實例化機制 | 靜態定義無法擴縮 | Agent Bus v2 Registry | P0 |
| G2 | MemoryHub 無向量搜尋 | 記憶召回靠關鍵字 | Supabase pgvector + embedding | P1 |
| G3 | Auto-Repair 僅規則式 | 修復能力有限 | LLM 驅動 v3 | P0 |
| G4 | 無測試自動生成 | Coverage 不穩定 | gen-tests.mjs | P1 |
| G5 | 文件手動同步 | 文件滯後 | doc-sync.mjs | P2 |
| G6 | 無知識圖譜 | agent 上下文不足 | RAG + vector DB | P1 |
| G7 | 5T 驗算手動 | 驗證不一致 | CI 自動化 | P0 |
| G8 | 無生產監控整合 | 自癒無法觸發 | Sentry webhook → agent | P2 |
| G9 | 暗光共鳴未實作 | cross-agent 知識不共享 | session_key + vector search | P1 |
| G10 | 60 員無 heartbeat | 無法監控 agent 健康 | Agent Bus heartbeat | P2 |

### 6.2 補齊時程
| 缺口 | 補齊階段 | 預計完成 |
|---|---|---|
| G1, G7 | 階段 1 | 第 2 週 |
| G3 | 階段 2 | 第 4 週 |
| G4 | 階段 3 | 第 6 週 |
| G5 | 階段 4 | 第 8 週 |
| G2, G6, G9 | 階段 5 | 第 12 週 |
| G8, G10 | 階段 6 | 第 16 週 |

---

## 七、KPI 與成功指標（60 員整合版）

| 指標 | 現況 | 目標（6 月） | 負責陣列 |
|---|---|---|---|
| 60 員觸達率 | 60/60（靜態） | 60/60（動態實例） | Task Dispatcher |
| CI 失敗自動修復率 | ~30%（v2） | ≥70%（v3） | 煉金熵減 |
| 新 code 測試覆蓋率 | 手動，不穩定 | ≥80%（自動生成） | 符文契約 |
| 文件更新延遲 | 手動，數天 | ≤1 天（自動同步） | 智庫聖所 |
| 生產錯誤 MTTR | 手動，數小時 | ≤15 分鐘（自癒） | 煉金熵減 |
| 5T 驗算自動化 | 手動 CI | 100% PR 自動 | 5T 驗算 |
| 暗光共鳴成功率 | 0%（未實作） | ≥90% | 智庫聖所 |
| Agent heartbeat 覆蓋 | 0% | 100% | Task Dispatcher |
| API 成本 | $0 | ≤$35/月 | — |

---

## 八、與方向 A/B 的整合

### 8.1 三方向統一視圖
```
┌─────────────────────────────────────────────────────┐
│              Omniesggo 升級路線圖                    │
├─────────────┬─────────────┬─────────────────────────┤
│ 短期 (1-3月)│ 中期 (3-6月)│ 長期 (6-12月)        │
├─────────────┼─────────────┼─────────────────────────┤
│ 方向 B 基礎 │ 方向 C 階段 │ 方向 A 評估           │
│ • 磁碟清理  │ • Agent Bus │ • K8s 容器化          │
│ • CI 合併  │ • Auto-Repair v3 │ • Service Mesh     │
│ • Turbo cache│ • 測試生成 │ • GitOps              │
│ • Docker dev│ • 文件同步 │ • 微服務拆分          │
│             │ • 知識圖譜 │                       │
│             │ • 全系統自癒│                       │
├─────────────┼─────────────┼─────────────────────────┤
│ 60 員軍團   │ 60 員動態化 │ 60 員雲端擴縮         │
│ 靜態定義    │ Agent Bus v2│ K8s HPA               │
│ verify-oa-gap│ 5T 自動驗算│ Prometheus 監控       │
└─────────────┴─────────────┴─────────────────────────┘
```

### 8.2 60 員 × 三方向
| 60 員陣列 | 方向 B（基礎） | 方向 C（AI 原生） | 方向 A（雲原生） |
|---|---|---|---|
| 智庫聖所 | 記憶沉澆優化 | RAG + 向量搜尋 | 雲端向量 DB |
| 符文契約 | schema-traceability 自動化 | 測試自動生成 | API Gateway 契約 |
| 暗翼/光翼 | Task 調度優化 | 知識圖譜 + RAG | Service Mesh |
| 煉金熵減 | CI 合併 + affected testing | Auto-Repair v3 | K8s 自癒 |
| 5T 驗算 | soul-lineage 自動化 | 5T 自動驗算 | 合規即程式碼 |

---

## 九、立即可執行的 MVP（2 週內）

### MVP 1：60 員 Agent Registry 原型（3 天）
```typescript
// packages/omni-agent-bus/src/registry/agent-registry.ts
import { SOUL_MATRIX_60 } from '../../../oa-swarm/src/soul-matrix-60';

export interface AgentDescriptor {
  id: number;
  name: string;
  hiveSide: 'local' | 'vps';
  arrayKey: 'sanctum' | 'rune' | 'wing' | 'alchemy' | 'audit';
  alignment: 'umbra' | 'lumen';
  archetype: string;
  capabilities: string[];
  memoryEndpoint: string;
  heartbeat: boolean;
}

export const AGENT_REGISTRY: AgentDescriptor[] = SOUL_MATRIX_60.map(a => ({
  id: a.id,
  name: a.name,
  hiveSide: a.hiveSide,
  arrayKey: a.arrayKey,
  alignment: a.alignment,
  archetype: a.archetype,
  capabilities: ARRAY_CAPABILITIES[a.arrayKey],
  memoryEndpoint: a.alignment === 'umbra'
    ? '/api/assets?tag=umbra'
    : '/api/assets?tag=lumen',
  heartbeat: false, // MVP: 待實作
}));

const ARRAY_CAPABILITIES: Record<string, string[]> = {
  sanctum: ['memory', 'rag', 'knowledge-curation'],
  rune: ['schema', 'contract', 'api-generation', 'testing'],
  wing: ['task-dispatch', 'adk-orchestration', 'rendering'],
  alchemy: ['repair', 'refactor', 'performance', 'ci-cd'],
  audit: ['5t-verify', 'hash-lock', 'compliance', 'quality-gate'],
};
```

### MVP 2：Auto-Repair v3 原型（2 天）
```javascript
// scripts/auto-repair-v3/analyze.mjs
import { execSync } from 'child_process';

const log = execSync('gh run view --log-failed 2>/dev/null || cat /tmp/ci-error.log', {encoding:'utf8'});

const res = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'qwen2.5-coder:7b',
    prompt: `你是 Omniesggo 的煉金熵減陣列（19-24/49-54）代理。
分析以下 CI 錯誤，輸出 JSON: {rootCause, fixStrategy, confidence, files, arrayKey}
confidence 為 0-1，>0.8 才自動 PR。

${log.slice(0,8000)}`,
    stream: false
  })
});
const analysis = JSON.parse((await res.json()).response);
console.log(JSON.stringify(analysis, null, 2));
```

### MVP 3：5T 驗算自動化（1 天）
```yaml
# .github/workflows/5t-auto-verify.yml
name: 5T Auto Verify
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: node oa-swarm/scripts/verify-oa-gap.mjs
      - run: node scripts/check-soul-lineage.mjs
      - run: node scripts/generate-schema-traceability.mjs --check
```

---

## 十一、60 員英雄卡（萬能卡牌）

完整英雄卡資料見 `REPORT_60員英雄卡.md`（Markdown 版）與 `REPORT_60員英雄卡.html`（互動式卡牌版）。

### 英雄卡速查（按陣列分組）

| 陣列 | 代理 | 最強維度 | 代表英雄 |
|---|---|---|---|
| 智庫聖所 | 01-06, 31-36 | MEM/INT | 01/31 萬能蜂后 (MEM=10, INT=10) |
| 符文契約 | 07-12, 37-42 | ATK/INT | 07/37 編碼蜂 (ATK=9), 08/38 算法蜂 (INT=10) |
| 暗翼/光翼 | 13-18, 43-48 | ATK/SYN | 13/43 圖像蜂 (ATK=8), 17/47 市場蜂 (SYN=9) |
| 煉金熵減 | 19-24, 49-54 | SPD/INT | 22/52 探路蜂 (SPD=9), 21/51 商業分析蜂 (INT=9) |
| 5T 驗算 | 25-30, 55-60 | DEF/MEM | 27/57 安全蜂 (DEF=10), 57/60 (MEM=9) |

### 特殊加成速查
| 加成 | 代理 | 效果 |
|---|---|---|
| 🌑 暗影加成 | 01-30 (umbra) | local 環境 +20% |
| ☀️ 光芒加成 | 31-60 (lumen) | vps 環境 +20% |
| 🔗 暗光共鳴 | 01,04,06,15,30,31,32,34,36,45,60 | cross-agent 知識共享 +15% |
| ⚡ 5T 驗算 | 01,05,09,11,23,25,27,30,31,35,36,37,39,41,53,55,57,60 | Hash Lock 保護 |

**立即開始**（本週）：
1. MVP 1：60 員 Agent Registry 原型（3 天）
2. MVP 3：5T 驗算自動化（1 天）

**下週開始**：
3. MVP 2：Auto-Repair v3 原型（2 天）

**本月開始**：
4. 階段 1：Agent Bus v2 + 60 員 Registry（2 週）

**關鍵成功因素**：
1. 60 員軍團是現有資產，方向 C 是「活化」而非「取代」
2. 暗光共鳴機制是 60 員軍團的核心優勢，必須在 RAG 中實作
3. 5T 驗算陣列（25-30/55-60）是品質閘的最後防線，不可繞過
4. 人類始終保留 review 權（不可自動 merge）

**不建議**：跳過 60 員軍團直接做方向 C（浪費現有 60 員定義與驗證閘）
