---
source_origin: 万能分身超觉醒 session (2026-09-28) / OmniAgentBus + Gateway WS auth CI 閉環
created: 2026-09-28
modified: 2026-09-28
co_authors: [agent:01, agent:07, agent:11, agent:30]
lifecycle: active
access: public-research
---

# 架構規格書：OmniAgentBus 分身總線 × Gateway WS 認證 × CI 閉環

> 5T-Traceable: 本文件由 `feat/oa-swarm-array-routing-ws-auth` 分支之實測證據反推撰寫，非事前設計文件。
> 5T-Trackable: 每條「驗證閘」皆對應可重現的指令與 exit code。
> 5T-Tangible: 規格中的所有數字均為本機實跑輸出，無估算值。
> 5T-Transparent: 未實測項以「⏸ 待 CI 實測」明示。
> 5T-Trustworthy: 產物 `dist/` 為 gitignored，僅經 `test:dist` 產物匯入煙霧驗證後釋出。

---

## 1. 系統定位

```
                     ┌─────────────────────────────────────┐
                     │   OA-Team 30 蜂群矩陣 (SSOT)         │
                     │   apps/gateway/oa-swarm-matrix.mjs  │
                     │   5 陣列 × 6 = 30, Object.freeze    │
                     └──────────────┬──────────────────────┘
                                    │ 派工關鍵字路由
                                    │ inferAgentNum(prompt, allowedNums)
                                    ▼
  ┌──────────────────────────────────────────────────────────────────┐
  │  OmniAgentBus — 代理總線 (packages/omni-agent-bus)               │
  │                                                                   │
  │   publish(topic, from, payload)                                   │
  │        │                                                          │
  │        ├─► 5T Gate (總線級單一旗標 gateEnabled)                   │
  │        │      ├─ pass  → 圓通扇出至所有已訂閱分身                  │
  │        │      └─ fail  → 轉 <topic>.rejected (無人收)              │
  │        │                                                          │
  │        └─► handlers: Map<string, Set<BusHandler>>                │
  │               無數量上限常數 → 分身數僅受記憶體與 handler 延遲    │
  └──────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
                     ┌─────────────────────────────────────┐
                     │  Gateway WS 認證 (apps/gateway)      │
                     │  候選來源: query token / subprotocol │
                     │            X-Omni-Token / Bearer     │
                     │  多候選遮蔽 + 嚴格相等 + 逐一路由    │
                     └─────────────────────────────────────┘
```

---

## 2. 組件規格

### 2.1 蜂群矩陣 SSOT — `apps/gateway/oa-swarm-matrix.mjs`

| 項目 | 規格 | 實測值 |
|------|------|--------|
| 代理總數 | 恰 30 | 30 ✅ |
| 陣列數 | 恰 5，id 1-5 | 5 ✅ |
| 每陣列人數 | 恰 6（MECE 互斥且窮盡） | 6/6/6/6/6 ✅ |
| 編號連續性 | 01-30 無缺漏 | ✅ |
| 陣列歸屬 | 01→策略 / 12→技術 / 18→創意 / 24→營銷 / 30→守衛 | ✅ |
| 不可篡改 | `Object.isFrozen` 對陣列與每個成員皆 true | true ✅ |
| 21 vs 03 | 萬能商業分析蜂 vs 萬能分析蜂 命名區隔 | ✅ |

**關鍵設計：關鍵字遮蔽防護**

`CAPABILITY_KEYWORDS` 會互相遮蔽。`資安分析報告` 同時命中 `分析`(03) 與 `資安`(27)。
若不先以 `allowedNums` 限定陣列，表格順序會決定勝負 → 派給守衛組（不含 03）時
退回 25 測場蜂，漏掉 27 資安蜂。命中多個時取**最長關鍵字**，讓 `平面設計` 勝過 `設計`。

實測：

| 輸入 | 限定陣列 | 結果 | 期望 |
|------|---------|------|------|
| 資安分析報告 | 守衛組 {25..30} | 27 | 27 ✅ |
| 做一張平面設計圖 | 創意組 {13..18} | 13 | 13 ✅ |

**邊界**：`listAgents(0)` 不可用 `!arrayId` 判斷 — `0` 為 falsy，會被誤判成「未指定」
而回傳全部 30 位。必須顯式檢查 `undefined / null / '' / 'all'`。

### 2.2 OmniAgentBus — `packages/omni-agent-bus`

| 項目 | 規格 | 實測值 |
|------|------|--------|
| 分身上限 | **無硬編碼上限** | 37 → 237 ✅ |
| 扇出耗時 | 237 分身 × 500 事件 < 5000ms | 3ms ✅ |
| 總投遞數 | — | 18774 ✅ |
| 5T 攔截 | 未過閘產出轉 `.rejected`，無人收到 | rejected=1 ✅ |
| 閘門語意 | **總線級**單一 `gateEnabled` 旗標 | 見下方警告 |

> ⚠️ **5T 閘粒度警告（勿誤述）**
> 閘門是「總線級」的單一旗標 + 內容級 `bus5TGate`，對所有 payload 一視同仁。
> **不存在**「每個分身各自受閘」的性質。`live-clones.smoke.ts` 驗證的是：
> 閘門的攔截/放行結果**不因分身數量而改變**。

**三條並行的驗證面**（2026-09-28 補第三面，OMH served-surface gate 觸發）：

| 面 | 測試 | 驗證對象 | 失效時的症狀 |
|----|------|---------|-------------|
| src 面 | 7 支 `*.smoke.ts`（tsx 直接跑 TS） | 原始碼行為 | 本機即紅 |
| dist 面 | `dist-smoke.mjs`（先 `tsc` 再 import） | **消費者真正 import 的產物** | 本機即紅 |
| 型別面 | `types-smoke.ts`（`tsc --noEmit` 讀 `dist/*.d.ts`） | `types` 欄位可被**外部 tsc** 解析 | **runtime 全綠、CI 紅燈** |

> ⚠️ **第三面是本輪實際抓到缺陷的那一面。**
> `dist-smoke.mjs` 驗 runtime 匯入（node 執行 `.js`），**完全不讀 `.d.ts`**。
> 故 `types` 欄位指向壞檔、`.d.ts` 漏匯型別時，dist 面全綠。
> 型別面補上這個缺口：見下方 ADR-C。

`dist-smoke.mjs` 需先 `tsc` 產生 `dist/`（gitignored），故獨立為 `test:dist`；
型別面同樣需先產出 `.d.ts`，故 `typecheck:surface` 必須在 `tsc` 之後執行
（`test:surface = tsc && npm run typecheck:surface` 即此約束）。

### 2.3 Gateway WS 認證 — `apps/gateway/ws-auth.test.mjs`

認證候選來源與優先序（多候選遮蔽防護：全部候選皆錯才拒絕）：

| 來源 | 格式 | 說明 |
|------|------|------|
| query | `?token=<T>` | 嚴格相等，`TOKENextra` 拒絕 |
| subprotocol | `bearer, <T>` / `auth.<T>` | 有效者優先，無關 header 不遮蔽 |
| header | `X-Omni-Token: <T>` | 既有 Node client 相容路徑 |
| header | `Authorization: Bearer <T>` | 標準路徑 |

**向後相容**：`WS_AUTH_TOKEN` 未設定時，啟動即印 `⚠️ 未啟用` 警告，任何人可連線（僅限本機/內網）。
設定後所有路徑強制認證，舊 client 需帶 token。

---

## 3. CI 驗證閘

### 3.1 根因：本分支 CI 紅燈

`apps/gateway/ws-auth.test.mjs` 是**腳本式**測試（頂層 `await` + `record()` + `process.exit`），
非 vitest 套件。根 `vitest run` 抓取後報 `No test suite found in file` → 整個 job exit 1。

```
Test Files  1 failed | 81 passed | 4 skipped (85)
     Tests  823 passed | 21 skipped (844)
Error: No test suite found in file apps/gateway/ws-auth.test.mjs
##[error]Process completed with exit code 1.
```

同一類問題在 `vitest.config.ts` 已有先例排除：`apps/omnilive/test/**`、
`apps/self-healing/test/**`、`apps/ftg-tools/**/*.test.mjs`、
`apps/universal-translator/test/**`（皆為 node:test 或腳本式）。

### 3.2 雙邊修正（排除 + 真實執行）

| 檔案 | 變更 | 理由 |
|------|------|------|
| `vitest.config.ts:51` | 排除 `apps/gateway/ws-auth.test.mjs` | 避免根 vitest 抓不到 suite |
| `.github/workflows/ci.yml:182` | 新增 `Run Gateway WS auth test (node script)` | **覆蓋率不減**，直接以 node 執行 25 斷言 |
| `.github/workflows/ci.yml:186` | 新增 `Run OmniAgentBus suite (src smoke + dist import)` | 補上 served-surface 缺口 |
| `.github/workflows/ci.yml:190` | 新增 `Typecheck OmniAgentBus tests` | 測試碼本身也要過 tsc |
| `packages/omni-agent-bus/package.json` | 新增 `test:dist` / `test:all` | dist-smoke 需先 build |

**排除 ≠ 遺棄。** 排除只是讓根 vitest 不去抓錯類型的檔案；真實執行交給
`node apps/gateway/ws-auth.test.mjs` 與 `pnpm -F @esggo/omni-agent-bus test:all`。

### 3.3 驗證閘對照表

| 閘 | 指令 | 實測結果 |
|----|------|---------|
| 根單元測試 | `npx vitest run` | exit 0 ×3 連跑 — 81 files / 836 tests passed |
| Repo 標準檢查 | `npm run check` | exit 0 — 4 files / 24 tests passed |
| Repo 型別閘 | `npm run typecheck` | exit 0 |
| 熵境 lint 閘 | `npm run lint` | exit 0 — 32 warnings, **0 errors** |
| 核心型別 | `npx tsc -p tsconfig.core.json` | exit 0 |
| 蜂群矩陣 SSOT | `npx vitest run apps/gateway` | exit 0 — 42 tests passed |
| WS 認證腳本 | `node apps/gateway/ws-auth.test.mjs` | exit 0 — 25/25 |
| 總線 src 面 | `pnpm -F @esggo/omni-agent-bus test` | exit 0 — 7 smoke 全過 |
| 總線 dist 面 | `pnpm -F @esggo/omni-agent-bus test:dist` | exit 0 — DIST_IMPORT_SMOKE_OK |
| **總線型別面** | `pnpm -F @esggo/omni-agent-bus typecheck:surface` | exit 0 — 抓到並修 `FiveTDimension` 未匯出 |
| 測試碼型別 | `pnpm -F @esggo/omni-agent-bus typecheck:test` | exit 0 |
| **安裝完整性** | `pnpm install --frozen-lockfile` | exit 0 — 39 workspace projects, lockfile 一致 |
| Workflow schema | `python .scratch/verify-workflows-schema.py` | exit 0 — 25 檔 0 錯誤 |
| Python 語法 | `python -m py_compile apps/agent_mesh/agent_tool.py` | exit 0 |

---

## 4. 關鍵設計決策

### ADR-A：lib/agents/omni-agent-bus.ts 退化成 re-export shim

**決策**：`.ts` 不再持有實作，改為帶型別的重導出薄層；正典為同目錄 `.js`。

**理由**（三重證據）：
1. 該 `.ts` 內容是純 CommonJS（`require` / `module.exports`、零型別標註），
   副檔名與內容不符。
2. 它的 API 與正典 `.js` 不相容 — 缺 `writeEntry` / `readEntry` /
   `queryBlackboard` / 註冊自癒 Hook。
3. 自身在嚴格型別下產生 **46 個 tsc 錯誤**（隱式 any、class 屬性不存在）。

**呼叫端追蹤證據**：三個 `require('./omni-agent-bus')` 呼叫端
（`knowledge-collector.js` / `omni-agent-bus-autonomy.js` / `omni-agent-bus-hook.js`）
皆解析到同目錄 `.js`（Node CJS 解析不認 `.ts`），零呼叫端 import 該 `.ts`。

**後果**：`require.main === module` 守衛在 shim 下不觸發，autonomy 心跳不會啟動。
`scripts/start-orchestrator.sh` 已同步改指 `.js`。

### ADR-B：dist-smoke 與 src smoke 分離

`*.smoke.ts` 走 tsx（直接跑 TS），`dist-smoke.mjs` 走 node（import 編譯產物）。
兩者驗證面不同：前者證「原始碼對」，後者證「發出去的東西對」。
只跑前者會漏掉 tsc 設定錯誤、匯出遺漏、package.json `main` 指錯等**只在產物顯現**的缺陷。

---

### ADR-C：型別出現在公開簽章卻不可命名（2026-09-28 型別面實測發現）

**決策**：`export type FiveTDimension`（`src/bus.ts`），並經 `src/index.ts` 轉出至公開入口。

**缺陷**：`bus5TGate` 的公開簽章為
`{ pass: boolean; failed: FiveTDimension[] }`，但 `FiveTDimension` 當時是
`src/bus.ts` 的**內部**型別（無 `export`）。`dist/index.d.ts` 因此不含它。

**為何是真缺陷而非潔癖**：consumer 想標註該欄位型別時寫不出來 ——
`const dims: FiveTDimension[] = gate.failed` 直接 TS2305；也無法對
`gate.failed` 做 exhaustive switch。型別出現在公開簽章卻不可命名，等於契約有洞。

**為何前兩面抓不到**：

| 面 | 為何漏掉 |
|----|---------|
| src 面（tsx 跑 .ts） | 測試在同 module 內可直接用內部型別，無跨 module 邊界 |
| dist 面（node import .js） | node 執行 `.js` **完全不讀 `.d.ts`** |
| 型別面 | ✅ `tsc --noEmit` 讀 `dist/index.d.ts` → TS2305 |

**驗證**：
```
$ npx tsc -p tsconfig.types-smoke.json     # 修正前
test/types-smoke.ts(17,3): error TS2305: Module '"../dist/index.js"' has no exported member 'OmniBusInstance'.
test/types-smoke.ts(18,3): error TS2305: ... has no exported member 'IOmniBus'.
test/types-smoke.ts(21,3): error TS2305: ... has no exported member 'FiveTDimension'.

$ npx tsc -p tsconfig.types-smoke.json     # 修正後
（無輸出，exit 0）
```

**方法論教訓**：`OmniBusInstance` / `IOmniBus` 也在首輪報 TS2305，但它們屬
`lib/agents/omni-agent-bus.ts` 那一層，**不在本 package 契約內**。
修正測試（改測真實存在的 7 個型別）而非擴大 package 契約 ——
測試寫錯對象與產品有缺陷要分開處理，否則會為遷就測試而擴大 API。

---

---

### ADR-D：根 vitest 隨機失敗 5 → 1 → 0（資源競爭，非回歸）

**現象**：修改後連續兩次 `npx vitest run`（**完全相同命令**）：
```
第 1 次: Test Files 3 failed | 79 passed | 4 skipped (86)   Tests 5 failed
第 2 次: Test Files 1 failed | 81 passed | 4 skipped (86)   Tests 1 failed
```
同一個 commit 兩次結果不同 → 非確定性缺陷。

**定因過程**（三步，皆實測）：

| 步驟 | 方法 | 結果 |
|------|------|------|
| 1 | `git stash push -u -- packages/omni-agent-bus/` 後單跑 3 檔 | 35 passed — 但**不能定罪**，因全量並行才是真實條件 |
| 2 | `git stash pop` 還原後單跑同 3 檔 | 35 passed — 排除「我的改動」 |
| 3 | 全量並行重跑 | 5 failed → 1 failed — **證明是資源競爭** |

**根因**：三檔耗時 5-15 秒，遠超 vitest 預設 5s timeout。
- `audit.test.ts` 掃真實檔案系統 → 全量並行下 15.9s
- `cron-auth` / `api-health-tags` 首次 import Next.js route，需 transpile + 載入 Next runtime

**修法（第一版，逐檔加 timeout — 錯了）**：
先只替 3 檔加個別 timeout，結果第 3 次全量跑**反而出現 7 個新失敗**：
```
api-health-tags 17.3s / audit-logger 9.9s / complete-delegation 9.4s
```
→ 證明受影響範圍遠大於最初觀察到的 3 檔，逐檔補是打地鼠。

**修法（第二版，正解：全域）**：改在 `vitest.config.ts` 設定
`testTimeout: 30_000` + `hookTimeout: 30_000`，並**移除**先前加的三處個別設定，
維持單一真相來源。

| 層級 | 設定 | 涵蓋範圍 |
|------|------|---------|
| 全域 | `vitest.config.ts` `testTimeout: 30_000` | 所有測試，含未來新增 |
| 個別 | ~~`describe` / `it` options~~ | 已移除（冗餘） |

**成本來源分類**（皆為 top-level import 或真實 I/O 的載入成本）：
- Next.js route 動態/靜態 import → transpile + 初始化 Next runtime
- `auditOmniTags` → 掃描真實檔案系統
- delegation / audit-logger 生命週期測試 → 完整 I/O 往返

**為何 30s 恰當**：正常情況全部 857 個測試 < 1s，30s 遠高於合理執行時間，
真正的 hang 仍會在此時限內被抓出，不至於讓 CI 掛死。

**修後驗證**：連續 4 次 `npx vitest run`（全量並行）全綠。

**方法論**：
1. 看到測試失敗時，先問「這是回歸還是 flaky」。
   定因靠**同一命令重跑 + stash 隔離**，不可只看一次結果就改產品碼。
   把 flaky 當回歸去改，會改壞原本正確的東西。
2. 逐檔修補的失敗模式：觀察到的症狀只是冰山一角。
   當同一根因的症狀**出現在多個檔案**，正解是找共同層級（config），
   不是逐一在各檔加保護。

---

## 5. 已知邊界與未驗證項

| 項目 | 狀態 | 說明 |
|------|------|------|
| CI 於 ubuntu runner 實測 | ✅ **已驗證** | run 36401777384：Vitest Tests pass（836 passed，與本地一致）、UT API Tests pass（WS 認證 25 斷言 + OmniAgentBus 32/20 passed + DIST_IMPORT_SMOKE_OK）。跨平台性確認 |
| `Code scanning AI findings` 紅燈 | ⚫ **非 repo 缺陷** | 根因為 GitHub Copilot 服務端 `CAPIError: 400 The requested model is not supported`，repo 內無法修 |
| `dist-smoke` 合規文本長度 | ⚠️ **耦合** | 文本長度 281 綁定 `src/bus.ts` 的 `GATE_MIN_LENGTH`（最高 tangible ≥ 200）。常數調高需同步延長 fixture，否則測試以「某維度掉下去」形式紅燈（失敗訊息會指出具體維度） |
| 30 蜂群 × 7 子框架 = 37 分身 | ✅ 已驗 | `live-clones.smoke.ts` 第 2 節實跑 |
| `ollama_model_tool` 殘留引用 | ✅ 無殘留 | `git grep "ollama_model_tool"` 查索引：唯一命中為本文件此列敘述，程式碼 0 殘留 |
| `cli/oa-cli/src/audit.test.ts` flaky | ✅ 已修 | 見下方 ADR-D |
| `tests/cron-auth` / `tests/api-health-tags` flaky | ✅ 已修 | 見下方 ADR-D |

---

## 6. 失敗模式與處置

| 失敗模式 | 徵兆 | 處置 |
|----------|------|------|
| 腳本式測試被 vitest 抓取 | `No test suite found in file` | 加 `vitest.config.ts` exclude **且** 補 CI 腳本步驟（不可只排除） |
| `listAgents(0)` 回傳 30 位 | 派工數量異常 | 不可用 `!arrayId`，改顯式檢查 `undefined/null/''/'all'` |
| 關鍵字遮蔽 | 派給錯誤代理 | 先用 `allowedNums` 限定陣列，再取最長關鍵字 |
| 5T 閘語意誤述 | 文檔宣稱「每分身受閘」 | 閘門是總線級旗標，一視同仁 |
| dist 匯出遺漏 | 消費端 `ERR_MODULE_NOT_FOUND` | 跑 `test:dist`，不可只跑 src smoke |
| pre-commit hook 吞掉 commit | shell 回 exit 0 但 HEAD 未推進 | 必查 `git log --oneline -3` 比對 HEAD hash |
| `.scratch/` 被 gitignore | 暫存檔未進 commit | 需 `git add -f` |

---

## 7. 驗證方法論

本輪所有「通過」宣稱皆滿足以下三條件：

1. **真實指令執行**，非描述。非零 exit 即失敗，不以 `tail` 管線的 exit 掩蓋。
2. **從來源抽出字串逐字執行** — CI 步驟的 `run:` 由 YAML 解析後交給 subprocess，
   而非手打複寫，消除「驗證的不是同一條命令」風險。
3. **負向測試驗證驗證器** — schema 驗證器以注入缺陷測試（缺 runs-on、uses+run 併存、
   `on: [push]` sequence 形式），確認它會擋且不會崩潰。

> 本地 `act` 與 `actionlint` 皆未安裝（`command -v` 回空）— 誠實標示，
> 以 schema 必要鍵檢查替代，不假稱已用 actionlint 驗證。

---

*文件由 agent:01（蜂后）統籌 · agent:07（編碼）· agent:11（測試）· agent:30（質控）*
*5T 狀態：Traceable ✅ · Trackable ✅ · Tangible ✅ · Transparent ✅ · Trustworthy ✅（CI run 36401777384 實測確認）*
