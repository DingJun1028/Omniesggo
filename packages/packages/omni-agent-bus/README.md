# @esggo/omni-agent-bus — OmniAgentBus 萬能代理總線

OA 萬能分身的「圓通」骨幹：讓 7 子框架（ADK/Genkit/Agent0/CrewAI/AgentReach/DeerFlow/TencentMem）+ 30 蜂群 + Team Memory 經**同一條事件總線**互通。

## 設計哲學（無作妙德圓通無礙）

- **無作**：handler 未註冊不報錯，靜默略過；單 handler 異常不中斷總線
- **圓通**：所有 OA 元件經統一 `publish/subscribe` 主題互通
- **無礙**：訊息流經總線時**自動過 5T Gate**（對齊 `@esggo/omni-agent/src/gates.ts`），未過閘的轉 `.rejected` 主題，不准向下游廣播

## 5T Gate（總線級，對齊 omni-agent gates.ts）

對 `OATaskResult.output` 做內容級驗證：

| 維度 | 最低字數 | 品質特徵 |
|---|---|---|
| traceable | 100 | GRI/ISO/來源/引用 |
| transparent | 150 | %/比率/公開/揭露 |
| tangible | 200 | 完成/建立/數量 |
| trustworthy | 120 | hash/sha/封印/audit |
| trackable | 80 | 年度/日期/monitor |

## 用法

```ts
import { createBus } from '@esggo/omni-agent-bus';

const bus = createBus(true); // 啟用 5T 閘門
bus.subscribe('oa.produce', (msg) => console.log('收:', msg.payload));
bus.subscribe('oa.produce.rejected', (msg) => console.warn('擋下:', msg.payload));
await bus.publish('oa.produce', 'orchestrator', taskResult);
```

## 結構

```
src/
  types.ts   # 共用型別 (對齊 oa-framework / omni-agent, 不依賴 workspace 包)
  bus.ts     # OmniAgentBus + bus5TGate (5T 自動攔截)
  index.ts   # 入口
test/
  smoke.ts   # 過閘廣播 + 未過閘轉 rejected
```

## 實體部署閘門 (Deploy Gate)

`deployGate(bus, source, result, deploy)` — 讓 OA 產出「部署前」必過 5T 總線閘門（無礙）：

- 合規 → 發佈到 `<source>.deploy` 主題 + 執行 `deploy` 回調（落地）
- 不合規 → 發佈到 `<source>.rejected` 主題 + 不部署，回傳失敗原因
- `.rejected` 主題豁免二次閘門（已是閘門下游）

```ts
import { createBus, deployGate } from '@esggo/omni-agent-bus';
const bus = createBus(true);
const r = await deployGate(bus, 'oa', taskResult, async (res) => { /* 落地部署 */ });
// r.deployed === true/false; r.reason 含 5T 失敗維度
```

`tryLoadForgeT5()` — 動態 import `@esggo/oa-framework` 的 `forgeT5`（優雅降級，未安裝回 null），
讓總線直接吃 OA 框架鑄造的產出。

## 跨包整合：OA Framework × OmniAgentBus（圓通）

`oaToBusPipeline(bus, config, task, deploy)` — 讓 oa-framework 的 7 子框架產出流經總線 5T 部署閘門：

```ts
import { createBus, oaToBusPipeline } from '@esggo/omni-agent-bus';
const bus = createBus(true);
const r = await oaToBusPipeline(
  bus,
  { llmModel: 'gemini-2.5-flash', memoryGateway: 'http://127.0.0.1:8420' },
  { id: 't1', prompt: 'ESG-GO 5T 元件' },
  async (res) => { /* 落地部署 */ }
);
// r.available === false → @esggo/oa-framework 未 build, 優雅降級 (不假造產出)
// r.available === true  → r.results 每個子框架都過 5T 閘門部署
```

`loadOAFramework()` 動態 import `@esggo/oa-framework`（workspace 未 build 時回 null），
`oa-bridge` 全程優雅降級——未安裝不排除驗證，不假造 OA 產出。

## 驗證

```bash
pnpm run test   # OMNI_AGENT_BUS_OK + DEPLOY_GATE_OK + OA_PIPELINE_GRACEFUL_OK
```
