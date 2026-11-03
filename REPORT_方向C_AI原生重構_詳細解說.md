# 方向 C：AI 原生重構（AI-Native Restructure）— 詳細解說

> Omniesggo 已具備 30-agent swarm、JunAikey、OmniTag、auto-repair v2 基礎，本方向將 AI 代理從「輔助工具」提升為「核心架構」。

---

## 一、核心理念

### 1.1 從「AI 輔助」到「AI 驅動」
現況：AI 代理（auto-repair、crewai-run）是 CI/CD 的「附加功能」，人類仍是主要開發者。
目標：AI 代理成為「一等公民」，人類轉為「審查者 + 決策者」，AI 負責「執行 + 自癒 + 演進」。

### 1.2 三大支柱
1. **Agent-First 開發**：每個模組由專責 agent 維護，人類 review PR
2. **自癒系統**：故障 → agent 分析 → 生成 fix → 驗證 → 部署，全自動閉環
3. **知識積累**：codebase → vector embeddings → 語意搜尋 → agent 上下文

---

## 二、架構變革詳解

### 2.1 AI Orchestrator（OmniAgent 升級版）
```
┌─────────────────────────────────────────────────────┐
│              OmniAgent Orchestrator v2                │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Planner  │ │ Coder    │ │ Reviewer │ │ Tester │ │
│  │ (規劃)   │ │ (寫碼)   │ │ (審查)   │ │ (測試) │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───┬────┘ │
│       └─────────────┴────────────┴───────────┘      │
│                    ↓ Event Bus (Agent Bus)            │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
│  │ Self-Healing │ │ Auto-Repair  │ │ Auto-Deploy│  │
│  │ (自癒)       │ │ (自動修復)   │ │ (自動部署) │  │
│  └──────────────┘ └──────────────┘ └────────────┘  │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐  │
│  │ Knowledge    │ │ Vector DB    │ │ Memory     │  │
│  │ Graph        │ │ (Embeddings) │ │ Store      │  │
│  └──────────────┘ └──────────────┘ └────────────┘  │
└─────────────────────────────────────────────────────┘
```

### 2.2 Agent 角色定義
| Agent | 職責 | 觸發條件 | 輸出 |
|---|---|---|---|
| **Planner** | 將需求分解為可執行 task graph | 新 issue / PRD 變更 | task-graph.json |
| **Coder** | 依 task 寫 code + 測試 | Planner 派遣 | feature/* branch PR |
| **Reviewer** | Code review + 安全掃描 | PR 開啟 | review comment + approve/request changes |
| **Tester** | 生成/執行測試 | Coder 完成 | test report + coverage |
| **Self-Healer** | 監控生產 + 自動修復 | 錯誤告警 / CI 失敗 | hotfix PR |
| **Doc-Sync** | code 變更 → 文件更新 | merge to main | docs PR |

### 2.3 知識圖譜（Knowledge Graph）
- **來源**：codebase AST + README + soul-chapter + PRD matrix + ADR
- **儲存**：vector embeddings (Ollama embedding model) + graph DB (Neo4j 或 Supabase pgvector)
- **用途**：
  - Agent 上下文注入（RAG）：Coder agent 寫新功能時，自動檢索相關 code + docs
  - 影響分析：修改某模組時，自動找出依賴它的模組 + 測試
  - 重複偵測：新 code 與現有 code 相似度 > 80% → 警告

---

## 三、關鍵步驟（6 階段）

### 階段 1：Agent Bus 升級（第 1-2 週）
**目標**：將現有 omni-agent-bus 從「事件傳遞」升級為「agent 編排」。

**具體動作**：
1. 在 `packages/omni-agent-bus` 新增 `orchestrator/` 模組
2. 定義 Agent 協議（AgentProtocol）：register / dispatch / result / heartbeat
3. 實作 Task Graph：DAG 結構，支援並行/序列/條件分支
4. 加入 retry + timeout + circuit breaker
5. 與 JunAikey 整合：agent 記憶持久化

**驗證**：`pnpm -C packages/omni-agent-bus test` 全綠 + 手動派遣 3 agent 並行完成簡單任務

### 階段 2：Auto-Repair v3 LLM 驅動（第 3-4 週）
**目標**：將 auto-repair 從「規則式修復」升級為「LLM 驅動修復」。

**現況 v2**：8 類錯誤分類 → 可修復類自動 fix（`: any`→`: unknown`、lint --fix、lockfile 重建）
**v3 增強**：
1. **錯誤分析**：LLM 讀取錯誤日誌 + 相關 code → 生成 root cause 分析
2. **修復生成**：LLM 生成 fix patch（diff 格式）
3. **驗證**：自動跑測試 + typecheck + lint
4. **PR 生成**：自動開 PR + 詳細描述 + 測試結果
5. **人類閘**：PR 需人類 approve 才 merge（安全閘）

**具體動作**：
1. 新增 `scripts/auto-repair-v3.mjs`（LLM 驅動版）
2. 整合 Ollama（本地）或 Gemini（雲端）作為推理後端
3. 設定修復信心閾值：confidence > 0.8 才自動 PR，否則只報告
4. 加入修復歷史追蹤（哪些修復成功/失敗）→ 持續改善 prompt

**驗證**：故意引入 5 種常見錯誤，v3 能自動修復 ≥3 種

### 階段 3：測試自動生成（第 5-6 週）
**目標**：AI 自動為新 code 生成單元測試 + E2E 測試。

**具體動作**：
1. 新增 `scripts/gen-tests.mjs`：輸入 source file → 輸出 test file
2. 使用 Ollama/Gemini 生成 vitest 測試（含 edge cases）
3. 整合到 CI：PR 開啟 → 自動生成測試 → 跑測試 → 報告 coverage
4. 設定 coverage 閾值：新 code coverage ≥ 80%
5. E2E：Playwright 測試腳本生成（針對 UI 變更）

**驗證**：對 10 個未測試的模組生成測試，≥7 個能通過

### 階段 4：文件同步自動化（第 7-8 週）
**目標**：code 變更 → 自動更新文件 + soul-chapter。

**具體動作**：
1. 新增 `scripts/doc-sync.mjs`：監聽 code diff → 生成文件更新 PR
2. 更新範圍：README.md（模組列表）、ARCHITECTURE.md（架構變更）、API docs（OpenAPI spec）
3. soul-chapter：自動生成章節摘要（soul-summary.md）
4. PRD matrix：schema 變更 → 自動更新 prd-matrix.json

**驗證**：修改一個 API route → doc-sync 自動生成文件更新 PR

### 階段 5：知識圖譜 + RAG（第 9-12 週）
**目標**：建立 codebase 知識圖譜，agent 可語意搜尋。

**具體動作**：
1. 選擇 embedding model：Ollama `nomic-embed-text`（本地）或 OpenAI
2. 選擇向量 DB：Supabase pgvector（已有 Supabase）或 Qdrant
3. 建立 indexing pipeline：code → AST → chunks → embeddings → vector DB
4. 建立 RAG API：agent query → retrieve relevant chunks → inject context
5. 整合到 Coder agent：寫新功能時自動檢索相關 code + docs

**驗證**：agent 能正確回答「FTG journey API 的認證機制是什麼？」等問題

### 階段 6：全系統自癒（第 13-16 週）
**目標**：生產環境錯誤 → agent 自動分析 + 修復 + 部署。

**具體動作**：
1. 監控整合：Sentry/Datadog → webhook → agent
2. 錯誤分類：LLM 分析錯誤類型（runtime/logic/config/infra）
3. 修復生成：LLM 生成 fix → 開 PR → 跑 CI → 人類 approve → 自動部署
4. 回滾機制：修復失敗 → 自動 revert → 告警人類
5. SLA：P0 錯誤 15 分鐘內自動修復或回滾

**驗證**：模擬生產錯誤（如 DB 連線失敗）→ agent 自動修復或回滾

---

## 四、技術選型

### 4.1 LLM 推理後端
| 選項 | 優點 | 缺點 | 建議 |
|---|---|---|---|
| **Ollama（本地）** | 零成本、De-Google、隱私 | 效能有限（i5-8265U）、模型品質 | 主力，用於分類/嵌入 |
| **Gemini API** | 品質高、免費額度 | 依賴 Google | 複雜修復生成 |
| **Claude API** | 品質最高、code 能力強 | 付費 | 關鍵修復（P0） |
| **混合策略** | 成本/品質平衡 | 複雜度 | ✅ 推薦 |

### 4.2 向量資料庫
| 選項 | 優點 | 缺點 | 建議 |
|---|---|---|---|
| **Supabase pgvector** | 已有 Supabase、零額外成本 | 效能中等 | ✅ 推薦（初期） |
| **Qdrant** | 高效能、專用 | 額外維運 | 大規模時遷移 |
| **Chroma** | 輕量、本地 | 不適合生產 | 開發測試用 |

### 4.3 Agent 框架
| 選項 | 優點 | 缺點 | 建議 |
|---|---|---|---|
| **自建（omni-agent-bus 升級）** | 完全控制、與現有整合 | 開發成本 | ✅ 推薦（已有基礎） |
| **LangGraph** | 成熟、生態豐富 | Python 生態、與 Node 整合複雜 | 可參考設計 |
| **CrewAI** | 已有 crewai-run workflow | Python、重 | 不推薦 |
| **AutoGen** | Microsoft 支援 | 複雜 | 可參考 |

---

## 五、成本估算

### 5.1 開發成本
| 階段 | 工作量 | 人力 |
|---|---|---|
| 階段 1 Agent Bus 升級 | 2 週 | 1 全端 |
| 階段 2 Auto-Repair v3 | 2 週 | 1 全端 + 1 AI |
| 階段 3 測試生成 | 2 週 | 1 全端 |
| 階段 4 文件同步 | 2 週 | 1 全端 |
| 階段 5 知識圖譜 | 4 週 | 1 全端 + 1 AI |
| 階段 6 全系統自癒 | 4 週 | 2 全端 + 1 DevOps |
| **總計** | **16 週** | **~2-3 人** |

### 5.2 運行成本（月）
| 項目 | 成本 |
|---|---|
| Ollama（本地） | $0（已有 PC） |
| Gemini API（免費額度） | $0-5 |
| Claude API（P0 修復） | $10-30 |
| Supabase pgvector | $0（免費 tier） |
| GitHub Actions（CI） | $0（免費額度內） |
| **總計** | **$10-35/月** |

---

## 六、風險與緩解

### 6.1 AI 可靠性風險
**問題**：LLM 可能生成錯誤修復，引入新 bug
**緩解**：
- 信心閾值：confidence < 0.8 → 只報告，不自動 PR
- 人類閘：所有自動 PR 需人類 approve
- 回滾機制：部署後監控，異常自動 revert
- 修復歷史追蹤：持續改善 prompt 和閾值

### 6.2 成本失控風險
**問題**：LLM API 呼叫頻繁，成本超預期
**緩解**：
- 優先使用本地 Ollama（零成本）
- 雲端 LLM 僅用於複雜修復（P0/P1）
- 設定每日 API 呼叫上限
- 快取：相同錯誤不重複分析

### 6.3 安全風險
**問題**：AI 自動修改 code 可能引入安全漏洞
**緩解**：
- 安全掃描作為 CI 閘（security-audit.yml）
- 祕密掃描 pre-commit + CI
- 人類 review 所有 PR（不可自動 merge）
- OWASP Top 10 檢查整合

### 6.4 依賴 LLM 供應商風險
**問題**：Gemini/Claude API 變更或停服
**緩解**：
- 多供應商抽象層（LLM Provider Interface）
- 本地 Ollama 作為 fallback
- 定期評估模型品質，可替換

---

## 七、KPI 與成功指標

| 指標 | 現況 | 目標（6 月） |
|---|---|---|
| CI 失敗自動修復率 | ~30%（v2 規則式） | ≥70%（v3 LLM 驅動） |
| 新 code 測試覆蓋率 | 手動，不穩定 | ≥80%（自動生成） |
| 文件更新延遲 | 手動，數天 | ≤1 天（自動同步） |
| 生產錯誤 MTTR | 手動，數小時 | ≤15 分鐘（自癒） |
| 開發者日均產出 | 基線 | +50%（agent 輔助） |
| API 成本 | $0 | ≤$35/月 |

---

## 八、與方向 B 的整合

方向 C 不應孤立執行，建議與方向 B（漸進式模組化）結合：

1. **方向 B 提供的基礎**：
   - 清晰的模組邊界 → agent 可精準定位修改範圍
   - Turbo remote cache → agent 執行更快
   - affected-based CI → agent 只跑相關測試
   - Docker dev container → agent 環境統一

2. **方向 C 的增強**：
   - Agent 自動維護模組邊界（doc-sync + schema-traceability）
   - Agent 自動優化 CI（auto-repair v3）
   - Agent 自動生成測試（coverage 提升）

3. **整合時程**：
   - 月 1-2：方向 B 基礎（磁碟清理 + CI 合併 + Turbo cache + Docker）
   - 月 3-4：方向 C 階段 1-2（Agent Bus + Auto-Repair v3）
   - 月 5-6：方向 C 階段 3-4（測試生成 + 文件同步）
   - 月 7-12：方向 C 階段 5-6（知識圖譜 + 全系統自癒）

---

## 九、立即可執行的 MVP（2 週內）

### MVP 1：Auto-Repair v3 原型
```bash
# 1. 建立 LLM 驅動的錯誤分析腳本
mkdir -p scripts/auto-repair-v3
cat > scripts/auto-repair-v3/analyze.mjs << 'EOF'
import { execSync } from 'child_process';
// 讀取 CI 錯誤日誌
const log = execSync('gh run view --log-failed 2>/dev/null || cat /tmp/ci-error.log', {encoding:'utf8'});
// 呼叫 Ollama 分析
const res = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'qwen2.5-coder:7b',
    prompt: `分析以下 CI 錯誤，輸出 JSON: {rootCause, fixStrategy, confidence, files}\n\n${log.slice(0,8000)}`,
    stream: false
  })
});
const analysis = await res.json();
console.log(JSON.parse(analysis.response));
EOF
node scripts/auto-repair-v3/analyze.mjs
```

### MVP 2：測試生成原型
```bash
# 為單一檔案生成測試
cat > scripts/gen-test.mjs << 'EOF'
const src = process.argv[2];
const code = require('fs').readFileSync(src, 'utf8');
const res = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  body: JSON.stringify({
    model: 'qwen2.5-coder:7b',
    prompt: `為以下 TypeScript 程式碼生成 vitest 單元測試，含 edge cases。只輸出測試程式碼。\n\n${code}`,
    stream: false
  })
});
const test = await res.json();
require('fs').writeFileSync(src.replace('.ts','.test.ts'), test.response);
EOF
node scripts/gen-test.mjs src/lib/utils.ts
```

### MVP 3：RAG 原型（Supabase pgvector）
```sql
-- 在 Supabase 建立 embeddings 表
CREATE TABLE code_embeddings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_path text NOT NULL,
  chunk_text text NOT NULL,
  embedding vector(768),
  created_at timestamptz DEFAULT now()
);
CREATE INDEX ON code_embeddings USING ivfflat (embedding vector_cosine_ops);
```

---

## 九、決策建議

**立即開始**：MVP 1（Auto-Repair v3 原型）— 2 天內可驗證 Ollama 分析 CI 錯誤的可行性
**本週開始**：MVP 2（測試生成）— 驗證 AI 生成測試的品質
**本月開始**：階段 1（Agent Bus 升級）— 奠定架構基礎

**關鍵成功因素**：
1. 人類始終保留 review 權（不可自動 merge）
2. 漸進式引入（先原型 → 驗證 → 擴大）
3. 持續測量 KPI（修復率、coverage、MTTR）
4. 保持方向 B 的基礎設施（模組邊界、CI、cache）

**不建議**：跳過方向 B 直接做方向 C（缺乏模組邊界，agent 修改範圍不可控）
