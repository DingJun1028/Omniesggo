# 完全代主自行 (Complete Autonomous Delegation)

讓 **agent 在授權範圍內代理使用者（principal）自主決策與執行** 的機制。
結合簽章驗證、約束條件（constraints / restrictions）、自主決策引擎、執行歷程與回報，
實現「使用者委派 → agent 自主完成」的端到端能力。

> 狀態：已合併 `main`（功能 PR #229；安全修補 D1–D5 PR #231；紀錄 PR #237）。
> 安全漏洞 D1–D5 均已 fixed，詳見 `ERROR-LEDGER.md`。

---

## 1. 架構與元件

| 元件 | 檔案 | 職責 |
|------|------|------|
| `CompleteDelegationManager` | `delegation-manager.ts` | 建立 / 簽章 / 驗證 / 終止授權範圍；列舉活躍授權 |
| `CompleteDelegationAgent` | `complete-delegation-agent.ts` | 代理執行 `executeOnBehalfOfPrincipal`、約束與歷程、授權驗證 |
| `AutonomousDecisionEngine` | `autonomous-decision-engine.ts` | 自主決策 `makeDecision`、能力評估、決策紀錄、回報 principal |
| `PerformanceOptimizer` / `ConnectionPool` | `performance-optimizer.ts` | 連線池（waiters 佇列，見 D3）與效能優化 |
| `ESGAnalysisEngine` | `src/lib/esg-analysis/engine.ts` | ESG 評分運算（D5 已防 NaN） |
| 型別 | `src/types/complete-delegation.ts` | `ICompleteDelegationManager`、`ICompleteDelegationScope`、`DelegationPermission` 等 |

入口聚合於 `src/agents/complete-delegation/index.ts`：
`createCompleteDelegationAgent`、`executeCompleteDelegationTask`、`getDelegationManager`、`getDecisionEngine`。

---

## 2. 授權生命週期

```
principal ──建立──> CompleteDelegationManager.createCompleteDelegation()
                         │  產生 ICompleteDelegationScope
                         │  signDelegation() → SHA-256 簽章 (scope.signature)
                         ▼
                  儲存於 store (get/terminate/getActiveDelegations)
                         │
agent ──代理執行──> CompleteDelegationAgent.executeOnBehalfOfPrincipal(intent)
                         │  1. validateAuthorization(intent)        → manager.validateDelegation()
                         │  2. generateOptions(intent, context)
                         │  3. decisionEngine.makeDecision(ctx)     → 含 recordDecision()
                         │  4. executeTask(decision, context)
                         │  5. 紀錄結果 + reportToPrincipal()
                         ▼
                  執行歷程 (getExecutionHistory) / 決策回報 (reportToPrincipal)
                         │
principal ──終止──> manager.terminateDelegation(id, reason)  → 移除授權
```

### 驗證（D1 修復後）
`validateDelegation(delegationId, permission)` 執行：
1. 從 store 取得 scope（不存在 → `false`）
2. 時間窗檢查：`now < validFrom || now > validUntil` → `false`
   - 無期限時 `validUntil = Number.MAX_SAFE_INTEGER`（D2）
3. 權限檢查：`permissions.includes(permission) || permissions.includes('full')`
4. **簽章驗證**：`verifySignature(scope)` 重新計算 SHA-256 並比對 `scope.signature`
   （舊版 `return true` 繞過已移除）

---

## 3. 權限模型

`DelegationPermission` 八種 + 萬用 `full`：

| 權限 | 說明 |
|------|------|
| `read` | 讀取資源 |
| `write` | 寫入 / 變更 |
| `execute` | 執行任務 / 動作 |
| `decide` | 自主決策 |
| `delegate` | 再委派 |
| `govern` | 治理操作 |
| `audit` | 稽覈 |
| `monitor` | 監控 / 觀測（只讀觀測，不含變更） |
| `full` | 包含以上全部（wildcard） |

`validateDelegation` 中 `full` 視為涵蓋任何 required permission。

---

## 4. 安全模型

| 機制 | 實作 |
|------|------|
| 簽章 | `signDelegation` 對 `{delegationId, principalId, agentId, permissions, validFrom, validUntil}` 做 SHA-256；`verifySignature` 重算比對 |
| 效期 | `validUntil` 預設 `Number.MAX_SAFE_INTEGER`（無期限），過期即 `validateDelegation=false` |
| 約束 | `getConstraints()` 依 restrictions + 有效期限產生 `DecisionConstraint[]`（severity: `hard`） |
| 最小權限 | 建立時校驗權限列舉；執行前 `validateDelegation(id, 'execute')` 把關（API 回 403） |

> 已實作：決策引擎支援**可插拔策略**（`conservative` / `balanced` / `aggressive`，預設 `balanced`，
> 行為與舊版一致）；`AuditLogger` 內建記憶體環形緩衝區 + 可掛載 `auditSink`（持久化 / 轉送外部儲存）、
> 支援 `getLogs()` / `query()`；`CompleteDelegationManager` 於建立 / 驗證 / 終止時寫入審計日誌。
> 唯與實際 `omni-gateway` 的端對端串接仍在進行（見第 7 節）。

---

## 5. API 參考

基底：`/api/delegation`

### POST `/api/delegation` — 建立授權
```jsonc
// body
{ "principalId": "user-123", "agentId": "agent-001",
  "permissions": ["read","write","execute"], "validUntil": 1783769300000, "description": "..." }
// 201 → { success, delegation: { delegationId, agentId, principalId, permissions, validFrom, validUntil, description } }
```
權限須為九種（含 `monitor`） + `full` 之一；`permissions` 非空。

### GET `/api/delegation` — 活躍授權列表
`?principalId=` 可選；回傳 `{ success, delegations[], count }`。

### GET `/api/delegation/[id]` — 取得單筆
`404` 若不存在。

### DELETE `/api/delegation/[id]` — 終止
body `{ "reason": "..." }` 可選；回傳 `{ success, delegationId, reason }`。

### POST `/api/delegation/[id]/execute` — 執行任務
```jsonc
// body
{ "intent": "產生 Q3 ESG 報告", "context": { ... } }
// 驗證：delegation 存在(404) → validateDelegation(id,'execute')(403)
// 200 → { success, executionId, result, error, duration, gateway: { startHashLock, completeHashLock } }
```

### GET `/api/delegation/audit?delegationId=xxx` — 審計軌跡
```jsonc
// 需具備 monitor（或 full）權限；回傳該授權生命週期審計事件（全量）
// 驗證：delegation 存在(404) → validateDelegation(id,'monitor')(403)
// 200 → { success, delegationId, count, entries: [ DELEGATION_CREATED / DELEGATION_VALIDATED / DELEGATION_TERMINATED ... ] }
// 全量：經 createDelegationJournal（統一 JSONL，預設 .audit/delegation-journal.jsonl）
//       持久化，不抽樣、不截斷；設 AUDIT_FULL_VOLUME=false 可停用（退回記憶體環形緩衝）
```

### GET `/api/delegation/events/stream?delegationId=xxx` — 事件總線訂閱 (SSE)
```text
// 即時推送該 delegation 生命週期事件（text/event-stream）
// 需具備 monitor（或 full）權限；驗證：delegation 存在(404) → validateDelegation(id,'monitor')(403)
// 無 delegationId → 400
// 每幀：data: { "type": "<事件名>", "delegationId": "...", "hashLock": "<64hex>", "ts": <ms>, "payload": {...} }\n\n
// 首幀為 { "type": "CONNECTED", "delegationId": "...", "ts": <ms> }
// 斷線自動退訂
```

**事件消費者範例**（前端 EventSource / Node fetch 皆可）：
```ts
// 瀏覽器：EventSource（自動重連；不支援自訂 header，權限由 delegation 的 monitor 授權隱含）
const es = new EventSource(
  `/api/delegation/events/stream?delegationId=${delegationId}`
);
es.onmessage = (e) => {
  const evt = JSON.parse(e.data);
  if (evt.type === 'CONNECTED') return console.log('已訂閱', evt.delegationId);
  console.log('委派事件', evt.type, 'hashLock', evt.hashLock, evt.payload);
};
es.onerror = () => es.close();

// Node 端：fetch + 讀取 stream
const res = await fetch(`/api/delegation/events/stream?delegationId=${delegationId}`);
const reader = res.body.getReader();
const dec = new TextDecoder();
for (;;) {
  const { done, value } = await reader.read();
  if (done) break;
  const frame = dec.decode(value);            // 含 "data: {...}\n\n"
  const json = frame.replace(/^data: /, '').trim();
  const evt = JSON.parse(json);
  console.log('委派事件', evt);
}
```

**連線回放 + 斷點續傳（對齊「全量」+ RWD）**：訂閱端點於 `CONNECTED` 後、續推即時事件前，會先以 `REPLAY` 框回放該 `delegationId` 的全量事件（`getFullEventTrail`，來源為統一日誌 JSONL sink），並以 `REPLAY_DONE` 標示歷史結束。每筆 `REPLAY` 與即時事件均帶 `id`（單調序號）；客戶端斷線重連時由 `EventSource` 自動帶回 `Last-Event-ID`，服務端據此僅回放其後事件（斷點續傳）。

**心跳保活（RWD / 全端穩健）**：每 25s 發送 `: heartbeat` 註解框，避免中間代理因閒置關閉連線。

**事件形狀（實際）**：經 `secureForward` 發布的真實事件封裝為 `{ event, payload: <IBusEvent>, ts }`，委派 payload 位於 `payload.payload`、`hashLock` 位於 `payload.hashLock`；SSE 端點已據此正確抽取並以 `{ type, delegationId, hashLock, ts, payload }` 推播。

也可直接在應用內訂閱同一條 `omni-agent-bus`（與 SSE 端點同源）：
```ts
import { enhancedOmniBus } from '../lib/omni-agent-bus';
const unsub = enhancedOmniBus.subscribe('external-forward', (ev) => {
  const p = ev.payload as { type?: string; delegationId?: string };
  if (p?.type?.startsWith('delegation.') && p.delegationId === delegationId) {
    console.log('委派事件', p.type, (ev as any).hashLock);
  }
});
// ... 使用完畢 unsub();
```

**指標觀測器（內建監控/分析消費者）**：直接取得單例即可獲得全量聚合快照（首次呼叫即訂閱總線）：
```ts
import { getDelegationMetrics } from './metrics';
const { total, byType, activeDelegations, lastSeenAt } = getDelegationMetrics().getSnapshot();
// per-delegation：
const d = getDelegationMetrics().getDelegationSnapshot(delegationId);
```
亦可直接 `GET /api/delegation/metrics[?delegationId=]`（全球聚合僅計數；單一 delegation 需 `monitor`/`full` 權限）。

### POST `/api/delegation/events` — 雙向回寫 (client → bus)
```jsonc
// body
{ "delegationId": "del_xxx", "type": "delegation.decision.made",
  "topic": "delegation.decision",            // 可省，將依 type 推導
  "payload": { "decisionId": "dec-xyz" } }
// 驗證：delegationId 存在(404) → validateDelegation(id,'execute')(403) → type 須為 DelegationEventNames 值(400)
// 200 → { success, hashLock }   (hashLock 為 SHA-256，溯源回寫事件)
// 與 GET /api/delegation/events/stream（server→client）互補，構成委派事件雙向同步
```
雙向同步語意：client 經 `POST` 回寫事件至同一 `omni-agent-bus`（`external-forward`），所有 `GET /stream` 訂閱者（含其他 client）即時收到 → 狀態雙向一致。

### 事件觀測 UI（RWD）
- 路徑：`/delegation/events?delegationId=xxx`（對齊「RWD / 全端 / 雙向同步」）
- `src/app/delegation/events/page.tsx`：響應式頁面，輸入 `delegationId` 即訂閱即時事件（亦可從網址帶入）。
- `src/components/delegation/DelegationEventStream.tsx`：client 元件，經 `EventSource` 連線 SSE 端點，呈現即時事件卡片（含 `hashLock` 溯源、連線狀態、斷線自動重連）。
- `src/components/delegation/DelegationMetricsOverview.tsx`：client 元件，消費 `GET /api/delegation/metrics` 呈現即時聚合指標總覽（全球 + 連線 delegation 專屬，5s 輪詢）。
- 設計採 Tailwind 響應式（手機 / 桌面自適應），與現有 demo 頁面視覺一致。

> **事件總線貫通（深貫廣通）**：授權生命週期（`DELEGATION_CREATED` / `VALIDATED` / `TERMINATED`）由 `CompleteDelegationManager`、
> 決策（`DELEGATION_DECISION_MADE`）由 `AutonomousDecisionEngine`、回報（`DELEGATION_DECISION_REPORTED`）由 agent、
> 執行（`DELEGATION_EXECUTION_STARTED` / `COMPLETED`）由執行路由，統一經 `omni-gateway.secureForward` 轉發至
> `omni-agent-bus`（SHA-256 `hashLock` 溯源），供監控 / 分析元件訂閱。封裝見 `events.ts` 之 `publishDelegationEvent`（fire-and-forget，發布失敗不影響主流程）。

---

## 6. 自主決策引擎

`AutonomousDecisionEngine`：
- `makeDecision(ctx: DecisionContext)`：依 `intent` / `options` / `constraints` 產生 `AutonomousDecision`（含 `decisionId`、`selectedOption`）。
- `assessAutonomyCapability()`：評估代理自主能力。
- `recordDecision()`：紀錄決策（記憶體 store）。
- `reportToPrincipal()`：將決策回報 principal。

取得單例：`getDecisionEngine()`；測試重置：`resetDecisionEngine()`。

---

## 7. 後續擴充

- [x] **稽覈日誌**：`AuditLogger`（`autonomous-decision-engine.ts`）內建記憶體環形緩衝區（上限 1000 筆）+
      可掛載 `auditSink`（持久化 / 轉送外部儲存），並提供 `getLogs()` / `query()`；
      `CompleteDelegationManager` 於 `DELEGATION_CREATED` / `DELEGATION_VALIDATED` / `DELEGATION_TERMINATED`
      寫入審計日誌，對外開放 `getAuditTrail()`。
- [x] **權限擴充**：新增 `monitor`（監控 / 觀測）權限類型，已納入型別與 API / manager 列舉校驗。
- [x] **決策策略**：可插拔策略（`decision-strategy.ts`）`conservative` / `balanced` / `aggressive`，
      經 `getDecisionEngine({ strategy })` / `new AutonomousDecisionEngine({ strategy })` 注入，
      `makeDecision` 委託 `strategy.select()` 選擇最佳方案。
- [x] **Gateway 端對端**：`POST /api/delegation/[id]/execute` 於執行前 / 後經 `omni-gateway.secureForward` 實際轉發 `DELEGATION_EXECUTION_STARTED` / `DELEGATION_EXECUTION_COMPLETED` 至 `omni-agent-bus`（含 SHA-256 `hashLock` 溯源）；回應附 `gateway.startHashLock` / `gateway.completeHashLock`。另含 route-level e2e 測試斷言回傳 64 字元 hashLock。
- [x] **事件訂閱 SSE**：`GET /api/delegation/events/stream?delegationId=` 經 `enhancedOmniBus` 訂閱 `external-forward`，即時推送該 delegation 生命週期事件（含 `hashLock` 溯源），`monitor`（或 `full`）權限把關、斷線自動退訂。亦可直接於應用內 `enhancedOmniBus.subscribe('external-forward', ...)` 消費（見第 5 節「事件消費者範例」）。
- [x] **事件雙向同步**：`POST /api/delegation/events` 接收 client 經同一 `omni-agent-bus`（`external-forward`）回寫的委派事件（需 `execute`/`full` 權限），與 SSE（server→client）互補構成雙向同步；回寫事件同樣附 SHA-256 `hashLock` 溯源。
- [x] **全量留存（審計 + 事件同一份 JSONL）**：審計條目與委派事件合併寫入統一日誌 `createDelegationJournal`（append-only JSONL，預設 `.audit/delegation-journal.jsonl`，可經 `DELEGATION_JOURNAL_PATH` 覆寫，亦相容舊 `AUDIT_SINK_PATH` / `EVENT_SINK_PATH`），以 `kind` 區分、共用單調序號 `id` 空間，實現不抽樣、不截斷的全量留存；`getFullAuditTrail(delegationId?)` / `getFullEventTrail(delegationId?, sinceId?)` 分別讀回。設 `AUDIT_FULL_VOLUME=false` 停用審計持久化（退回環形緩衝）。
- [x] **全量事件留存 + SSE 回放 + 斷點續傳**：`publishDelegationEvent` 發布時經統一日誌持久化全量事件並分配 `id`；SSE 端點連線時先以 `REPLAY` 框（帶 `id`）回放該 `delegationId` 歷史，再以 `REPLAY_DONE` 收尾後續推即時事件（實現「進頁面即見完整脈絡」）。客戶端 `EventSource` 重連自帶 `Last-Event-ID`，服務端據 `sinceId` 僅回放其後事件（斷點續傳）。
- [x] **RWD 事件觀測 UI**：新增 `/delegation/events` 響應式頁面 + `DelegationEventStream` client 元件（EventSource → SSE 端點），手機 / 桌面自適應呈現即時事件（含 `hashLock` 溯源、連線狀態、斷線自動重連），對齊「RWD / 全端 / 雙向同步」。
- [x] **RWD UI 雙向同步閉環 + 斷點續傳**：`DelegationEventStream` 新增回寫輸入框，經 `POST /api/delegation/events`（型別 `delegation.client.sync`）將 client 訊號寫回同一 `omni-agent-bus`，事件經 SSE 迴路返回本面板並標記「本端傳送」，形成 client↔server 雙向閉環；SSE 即時幀帶 `source:'client'` 欄位供 UI 識別本端回寫（取代脆弱的 note 文字比對）。另將最後收到的 SSE `id` 存於 `localStorage`，全新連線（頁面重新整理）時以 `?sinceId=` 查詢參數續傳（服務端 `GET /stream` 已支援 `?sinceId=` 作為 `Last-Event-ID` 表頭之備援），實現「全量不漏」的斷點續傳。
- [x] **委派事件指標觀測器（監控/分析消費者）**：`metrics.ts` 的 `getDelegationMetrics()` 單例訂閱同一 `omni-agent-bus`（`external-forward`），對所有委派生命週期事件進行**全量聚合**（不抽樣、不截斷，非委派事件一律忽略），提供全域（`total` / `byType` / `activeDelegations` / `lastSeenAt`）與 per-delegation（`getDelegationSnapshot`）指標快照，落實 summary 待辦「將委派事件接入實際監控/分析消費者」。對齊平臺不變量：全域（與其他子系統共用同一總線，無孤島）、全量（觀測所有事件）、雙向同步（server 推送與 client 經 `POST /api/delegation/events` 回寫進入同一總線，觀測器一視同仁聚合）。
- [x] **指標 API**：`GET /api/delegation/metrics[?delegationId=]` 暴露觀測器聚合；全球聚合（`?delegationId` 省略）僅回傳計數、不含 delegation 識別碼（最小暴露）；單一 delegation 須具備 `monitor` / `full` 權限（與 audit / stream 端點一致）；回應含 `alerts` 陣列（全量告警）。
- [x] **指標總覽卡（RWD UI）**：`/delegation/events` 頁面新增 `DelegationMetricsOverview` 元件，消費 `GET /api/delegation/metrics` 呈現即時聚合（全球總事件數 / 活躍 delegation 數 / 事件類型分佈，以及連線 delegation 的專屬指標，需 `monitor`/`full`），5s 輕量輪詢；對齊 RWD / 全端 / 全量，關閉「監控消費者 → 可視化」閉環。
- [x] **委派事件告警/閾值（監控/告警閉環）**：觀測器依規則產生告警——`delegation.emergency.stop`（critical）、`delegation.anomaly.detected`（warning），以及單一 delegation 事件總量達可設閱值（預設 1000）時發出 warning；告警全量留存於觀測器與 API（`alerts` 欄位，per-delegation 隔離），並於 `/delegation/events` 總覽卡以紅（critical）/ 琥珀（warning）呈現，完成「觀測 → 告警」閉環。
- [x] **告警外部通知 + SSE 即時可見（監控→告警→處置 閉環）**：觀測器產生告警時，除全量留存外，同時 (a) 經 `alert-notifier.ts` 轉發至外部 sink，完成「告警 → 處置」最後一哩——支援 **webhook**（`createAlertNotifier`，環境 `DELEGATION_ALERT_WEBHOOK_URL`）與 **郵件**（`createEmailNotifier`，環境 `DELEGATION_ALERT_EMAIL_WEBHOOK_URL` + 可選 `DELEGATION_ALERT_EMAIL_TO` / `DELEGATION_ALERT_EMAIL_FROM`，經郵件閘道 webhook 投遞、免 SMTP 相依）；兩者經 `createCompositeNotifier` 扇出、共用 `AlertNotifier` 介面（`getDefaultAlertNotifier` 依環境組出）。預設全停用；`NODE_ENV==='test'` 一律停用，避免觸網；(b) 發布 `delegation.alert.raised` 事件至同一 `omni-agent-bus`（topic `delegation.alert`），使 RWD SSE 端點（`GET /api/delegation/events/stream`）即時可見。觀測器於 `ingest` 對 `delegation.alert.raised` 提早 return，避免自我回灌（no self-loop）；通知失敗不影響告警留存（catch 吞掉，對齊「全量」）。
- [x] **統一發布原語（深貫廣通 · 全域事件總線單一來源）**：抽出 `src/lib/bus.ts` 之 `publishBusEvent(topic, event)`，集中「SHA-256 hashLock 溯源 + 發布至 omni-agent-bus（`enhancedOmniBus`）」之單一路徑；`core/services/omni-gateway.ts` 之 `secureForward` 已委託於此，委派子系統的 `publishDelegationEvent` 經由 `secureForward` 間接使用——所有子系統發布事件均走同一帶 hashLock 的入口，便於監控 / 分析元件統一訂閱（`external-forward`）。（`twelve-omni` 子系統另有自身 `secureForward` 僅做 hashLock + 凍結、不發布至共享總線，為已知分歧，留待後續評估是否併入。）

---

## 8. 測試

覆蓋套件（位於 `tests/`，本模組相關 359 passed）：
- `complete-delegation.test.ts` — manager / agent / 決策引擎
- `api-routes.test.ts` — 上述 REST 端點（audit / stream / events / metrics）
- `delegation-metrics.test.ts` — 指標觀測器（監控/分析消費者）單元 + 路由
- `alert-notifier.test.ts` — 告警外部通知 sink（webhook / 郵件 / 複合扇出 / 失敗容錯 / test 環境停用）
- `bus.test.ts` — 統一發布原語 `publishBusEvent`（hashLock + 發布至總線）
- `integration.test.ts` — 端到端流程
- `performance-optimizer.test.ts` — 連線池 / 效能
- `esg-analysis.test.ts` — 評分（D5）

> 注：`tests/audit-logger.test.ts` 為平行 session WIP（測試 `AuditLogger` 環形緩衝截斷），未納入本模組測試清單。

執行：`npx vitest run tests/complete-delegation.test.ts tests/api-routes.test.ts tests/delegation-metrics.test.ts tests/alert-notifier.test.ts tests/bus.test.ts tests/integration.test.ts tests/performance-optimizer.test.ts tests/esg-analysis.test.ts`
