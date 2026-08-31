# OA Framework — 萬能分身元框架

整合 7 大 AI Agent 框架為統一元框架，對齊 `soul.md` 的 5T 協議與 `omni-agent` 5T 驗證引擎。

## 整合的子框架

| ID | 框架 | 形態 | 適配器 |
|---|---|---|---|
| `adk` | Google Agent Development Kit (TS) | npm `@google/adk` | `adapters/adk.ts` |
| `genkit` | Google Genkit (Firebase) | npm `genkit` | `adapters/genkit.ts` |
| `agent0` | Agent Zero organic framework | Docker `agent0ai/agent-zero:50001` | `adapters/agent0.ts` |
| `crewai` | CrewAI 30 蜂群 | Python/uv (crewai-runtime) | `adapters/crewai.ts` |
| `agentreach` | Agent Reach（最新技術） | **spec pending** — 待使用者提供文檔 | `adapters/agentreach.ts` |
| `deerflow` | DeerFlow 研究流程 | Python FastAPI (esggo-deerflow) | `adapters/deerflow.ts` |
| `tencent-mem` | 騰訊 Agent 記憶 (TencentDB Agent Memory) — **Team Memory** | MemoryCore `:8420` + Hub `:8125` + Proxy `:8096` | `adapters/tencent-mem.ts` |

## 架構

```
src/
  core/
    types.ts        # IComponentCore / ISubFrameAdapter / OAFrameConfig / OATask / OATaskResult
    t5.ts           # 5T 驗證器 + Hash Lock (forgeT5 / verify5T)
    orchestrator.ts # OAOrchestrator — 多框架並行 dispatch + 5T 閘門
  adapters/         # 7 個子框架適配器 (統一 ISubFrameAdapter 介面)
  index.ts          # createOAFrame() — 一鍵註冊全部 7 框架
test/
  smoke.ts          # 7 框架並行 + 5T 驗證
```

## 5T 協議（來自 soul.md + omni-agent Gate）

每筆產出經 `forgeT5` 鑄造，過**雙層閘門**（無礙）：
- **層 (1) 欄位級** — `t5` 五維布林 + Hash Lock 重算（SHA-256，寫入即凍結）
- **層 (2) 內容級** — `omni-gate.verifyAllGates` 對齊 `@esggo/omni-agent/src/gates.ts`：
  - 長度下限（traceable 100 / transparent 150 / tangible 200 / trustworthy 120 / trackable 80）
  - 品質特徵正則（GRI/ISO 來源、% 揭露、完成/建立量化、hash/audit 信任、年度/monitor 追蹤）
- 產出自動包裝為含 5T 品質特徵的結構化報告（`src/core/t5.ts` `forgeT5`），通過部署前閘門才放行
- `src/core/omni-gate.ts` 為對齊 gates.ts 的獨立橋接器（不依賴未 build 的 workspace 包，避免 pnpm gate 阻斷）

## 使用

```ts
import { createOAFrame, verify5T } from '@esggo/oa-framework';

const oa = createOAFrame({ llmModel: 'gemini-2.5-flash', memoryGateway: 'http://127.0.0.1:8420' });
const results = await oa.run({ id: 't1', prompt: '為 ESG-GO 產出 5T 合規元件骨架' });
for (const r of results) {
  const v = verify5T(r);  // 5T 全綠 + Hash Lock 未被篡改
  console.log(`[${r.subFrame}] 5T=${v.pass ? 'PASS' : 'FAIL'}`);
}
```

## 驗證

```bash
npm run typecheck   # tsc 零錯誤
npx tsx test/smoke.ts  # 7 框架並行 + 5T 鑄造 → ALL_7_FRAMEWORKS_OK
```

## 待辦

- [x] **5T 雙層閘門** — 欄位級(t5 布林 + Hash Lock 重算) + 內容級(對齊 omni-agent `gates.ts` 的長度下限/品質正則), `omni-gate.ts` 橋接器已落地, smoke 全過
- [x] **ADK** — 真實連結 `new LlmAgent({name,model,instruction,tools})` + `run()` (dynamic import, 未裝 `@google/adk` 時 graceful 降級)
- [x] **Genkit** — 真實連結 `genkit({plugins:[googleAI()]})` + `ai.generate()` (dynamic import, 未裝時 graceful 降級)
- [x] **Agent Reach** — 對齊官方精確子命令 (Panniantong/agent-reach, Python `pip install agent-reach`):
  - 本質: 路由器+體檢器, 實際執行委派上游 CLI (非自帶 search)
  - 路由表 (來自 agent_reach/skill/SKILL.md):
    - exa→`mcporter call exa.web_search_exa query=... numResults=5`
    - jina→`curl -s "https://r.jina.ai/URL"`
    - github→`gh search repos "..." --sort stars --limit 10`
    - youtube→`yt-dlp --write-sub --write-auto-sub --skip-download -o /tmp/%(id)s "URL"`
    - bilibili→`bili search "..." --type video -n 5`
    - twitter→`twitter search "..." -n 10` (需 TWITTER_AUTH_TOKEN/CT0)
    - reddit→`opencli reddit search "..." -f yaml` | `rdt search ...`
    - xiaohongshu→`opencli xiaohongshu search "..." -f yaml`
    - facebook/instagram→`opencli facebook|instagram ... -f yaml`
    - v2ex→`curl -s "https://www.v2ex.com/api/topics/hot.json" -H "User-Agent: agent-reach/1.0"`
    - linkedin/xiaoyuzhou/xueqiu/rss→參考官方 references/*.md, 先以 exa 兜底
  - `doctor()`→`agent-reach doctor --json` (顯示每平台 active_backend)
  - 未安裝時 health=down + scaffold (graceful 降級)
- [x] **騰訊 Agent 記憶** — Team Memory 適配器 (`memory.ts` + `tencent-mem.ts`)：
  - 4 類資產 `MemoryAssetKind`: `chat_memory`(L0-L3) / `skill` / `wiki` / `codegraph`
  - 真實 API：`/v3/tools/list` + `/v3/tools/call` (Knowledge OpenAPI) + `/api/assets` (資產庫)
  - 部署：`git clone https://github.com/Tencent/TencentDB-Agent-Memory.git && cd deploy/global-images && cp .env.example .env && ./start-all.sh`
  - 端點：core `:8420` / hub `:8125` / proxy `:8096`
  - 對齊 OA-Team 30 蜂群：每個 Agent 可經 `saveAsset`+`callTool` 實作 Agent Loadout (綁定不同記憶資產)
  - 當前 VPS `:8420` **已部署並運行** (Ollama 自託管, gemma4:e4b + nomic-embed-text)。`health()` → `ok`。
  - 認證：Bearer `TDAI_GATEWAY_API_KEY` + 必帶 `x-tdai-service-id` header (預設 `oa-team-swarm`)；核心寫入/召回路由為 `POST /v3/conversation/add` + `/v3/conversation/search` (經實測驗證 L0 存可取)。
  - 已知限制：`embeddingService:false` (core 啟動探測時序)，向量語意檢索弱，但 BM25/sqlite 檢索可用。
- [ ] **Agent Reach**：使用者未提供文檔，`agentreach.ts` 為占位骨架（`health()` 回 `down`），待補協議細節後實作通道分發。
- [ ] 各 adapter `dispatch` 目前為 scaffold（回傳標記字串），需注入真實 SDK 調用（@google/adk / genkit / Agent0 A2A / crewai-runtime / DeerFlow API / TencentDB gateway）。
- [ ] 與 `omni-agent` 5T Gate 串接（將 `verify5T` 作為部署前閘門）。
