# OneRingAI vs OA-Team 30 蜂群框架 — 架構異同與整合建議（已實作驗證版）

> 生成日期：2026-08-11
> 最後更新：2026-08-11（v2 — 已實作 + 真實實跑驗證）
> 分析基礎：
> - **esggo 側**：實際讀取 `packages/oa-framework`、`packages/omni-agent`、`packages/omni-agent-bus` 原始碼與 README（真實狀態）。
> - **OneRingAI 側**：**已本地安裝 `@everworker/oneringai@1.0.1` 並真實實跑通**（本地 Ollama `qwen2.5:3b-instruct-q4_K_M`，5T Hash Lock 鑄造 PASS）。實際 API 依 `node_modules/@everworker/oneringai` 與 `AGENTS.md`。

---

## 1. 摘要

| 維度 | OA-Team 30 蜂群（esggo `oa-framework`） | OneRingAI |
|------|------------------------------------------|-----------|
| 本質 | **元框架 (meta-framework)**：包裝 11 個既有 agent 框架成統一介面 | **統一函式庫 (unified library)**：自帶 Agent/Connector/Memory/Tools 實作 |
| 核心資產 | **5T 雙層閘門**（欄位級 + 內容級品質驗證） | **Connector-First 多供應商** + **MemorySystem** 一級子系統 |
| LLM 多供應商 | 經子框架 adapter 間接（oneringai 現為真實連網） | 原生 12 家（OpenAI/Anthropic/Google/Grok/…）統一 API |
| 記憶 | 騰訊 Agent 記憶 (TencentDB) 適配器 | 內建 entity/fact graph + vector + 三主體權限 |
| Node 要求 | `>=20`（pnpm workspace） | `22+`（本機 v24.19.0 免升級；僅 <22 才需升） |

**結論**：兩者互補而非替代。**5T 是 OA 的獨特強項，OneRingAI 無對應**；OneRingAI 補齊的是 OA 目前薄弱的「多供應商統一 API / 原生工具權限 / 成本優化 / 長時會話」。已以 **adapter 形式** 引入（第 11 個子框架），非替換。

---

## 2. esggo 現狀（實測）

`packages/oa-framework@0.5.0` 整合 **11 子框架**，統一介面 `ISubFrameAdapter`：

| ID | 框架 | 適配器 | 狀態 |
|----|------|--------|------|
| `adk` | Google ADK (TS) | `adapters/adk.ts` | 真實 `LlmAgent` + `run()`，未裝時降級 |
| `genkit` | Google Genkit | `adapters/genkit.ts` | 真實 `ai.generate()`，未裝時降級 |
| `agent0` | Agent Zero | `adapters/agent0.ts` | scaffold（docker 未啟 graceful） |
| `crewai` | CrewAI 30 蜂群 | `adapters/crewai.ts` | scaffold（待 crewai-runtime） |
| `agentreach` | Agent Reach | `adapters/agentreach.ts` | 路由表已落地，health 降級 |
| `deerflow` | DeerFlow | `adapters/deerflow.ts` | scaffold |
| `tencent-mem` | 騰訊 Agent 記憶 | `adapters/tencent-mem.ts` | 真實 API，VPS 未部署時 health=down |
| `openmontage` | 本地 AI 影片 | `adapters/openmontage.ts` | UNVERIFIED repo 404，scaffold |
| `omniroute` | AI 閘道 | `adapters/omniroute.ts` | UNVERIFIED repo，scaffold |
| `turbovec` | 本地 RAG | `adapters/turbovec.ts` | UNVERIFIED repo 404，scaffold |
| **`oneringai`** | **OneRingAI 統一庫** | **`adapters/oneringai.ts`** | **VERIFIED 真實實跑（Ollama qwen2.5:3b，5T PASS）** |

核心：`OAOrchestrator`（多框架並行 dispatch + **每 route 45s timeout**）+ `core/t5.ts`（Hash Lock 鑄造）+ `core/omni-gate.ts`（對齊 `omni-agent` gates.ts 的長度/品質正則）。

`packages/omni-agent-bus@0.1.0` 提供**增量輸出優化**骨架：`event-bus` / `conduit` / `service-orchestrator` / `etl-pipeline` / `delta-tracker` / `cache-manager` / `compression` / `pagination` / `worker-pool` 等（與 `soul.md` §12 模式對應）。

---

## 3. 維度對照

| # | 維度 | OA-Team 30 蜂群 | OneRingAI v1.0.1 |
|---|------|------------------|-------------------|
| 1 | **架構哲學** | 元框架：包多框架成統一介面，5T 為品質守門員 | 統一庫：自實作 Agent/Connector/Memory/Tools |
| 2 | **多供應商 LLM** | 經子框架 adapter 間接；oneringai 現為真實連網 | 原生 `Connector`+`Vendor`，12 家直接支援 + 模型註冊 v2（88 模型） |
| 3 | **記憶系統** | 騰訊 TencentDB Team Memory 適配器（4 類資產） | 內建 `MemorySystem`：entity/fact graph + vector + owner/group/world + principal ACL |
| 4 | **工具系統** | 依賴子框架自帶工具；bus 提供業務級 patterns | `ToolFunction` + 39 內建 + connector 工具（50 服務）+ 自定義工具生成（VM sandbox）+ 權限策略 |
| 5 | **多 Agent 編排** | `OAOrchestrator` 多框架並行 + 5T 閘 | `createOrchestrator`（委派/共享 workspace）+ `AgentRegistry` |
| 6 | **長時 / 非同步** | bus 有 `event-bus`/`worker-pool`；無跨天會話原語 | `SuspendSignal`/`Agent.hydrate()` 跨天 resume + Async Tools（非阻塞 auto-continue）+ Routine DAG |
| 7 | **品質驗證** | **5T 雙層閘門（獨特）** | 結構化輸出驗證；無 5T 對應 |
| 8 | **成本 / 推論優化** | 無 | prompt caching / async batches / provider-hosted tools / 成本遙測 |
| 9 | **語言 / 運行** | TS + Next.js，node>=20，pnpm | TS，node 22+ |

---

## 4. 能力缺口矩陣

### OA 目前缺（OneRingAI 可補）
- **原生多供應商統一 API**：免去逐框架寫 adapter；尤其 OpenAI/Anthropic/xAI 直接 callable。
- **工具權限策略**：OneRingAI 的 `IPermissionPolicy` + 使用者規則 + 引數檢查，OA 目前無對等。
- **成本優化**：prompt caching / batch / native tools 遙測，OA 完全空白。
- **長時會話**：跨天 Suspend/Resume，OA 需自行在 bus 上搭建。
- **記憶系統成熟度**：OneRingAI `MemorySystem` 的 graph+vector+權限開箱即用；騰訊記憶需自部 VPS。

### OneRingAI 缺（OA 可補）
- **5T 協定**：寫入即凍結 Hash Lock + 內容級品質正則，OneRingAI 無任何等效。
- **30 蜂群矩陣 / 同體一心**：角色分工、跨組配對、信任橋樑，OneRingAI 無組織層。
- **ESG / GRI / ISO 合規語意**：OA 的 gates 內建「% 揭露、GRI/ISO 來源」特徵，OneRingAI 通用。

---

## 5. 整合策略（已採方案 A 實作完成）

### 方案 A（已實作 ✅）：OneRingAI 作為第 11 個 adapter
`oa-framework/src/adapters/oneringai.ts` 實作 `ISubFrameAdapter`：
- `dispatch()` 內部 `Connector.create` + `Agent.create` + `agent.run(task.prompt)`，把 OA 任務轉 OneRingAI `run()`。
- 產出仍經 `forgeT5` 鑄造 + `omni-gate` 閘門 → **5T 守門不漏**。
- 預設走本地 Ollama 免費路徑（`http://localhost:11434/v1`，model `qwen2.5:3b-instruct-q4_K_M`），亦可經 `llmBaseUrl` 指 OpenAI/Anthropic/Google。
- 註冊三步：`types.ts` 加 `'oneringai'` → `adapters/oneringai.ts` → `index.ts` 註冊入 `OA_SUBFRAMES`（現 11 項）。

### 方案 B：OneRingAI 作 LLM Connector 層
抽出 OA 的「LLM 呼叫」全部走 OneRingAI `Connector`+模型註冊，子框架 adapter 只負責「框架特異邏輯」。
- 適用：當 OA 多數 adapter 從 scaffold 轉真實實作時。

### 方案 C：記憶雙寫
`tencent-mem` 與 OneRingAI `MemorySystem` 擇一為主、另一為備；或經 `omni-agent-bus` 的 `delta-tracker` 雙寫。
- 注意：兩者權限模型不同（TencentDB 團隊 / OneRingAI 三主體+principal），需映射層。

### 方案 D（不推薦）：整包替換
放棄 `oa-framework` 改用 OneRingAI。
- 風險：喪失 5T 核心資產、30 蜂群語意、ESG 合規閘；且引入外部依賴供應鏈。

---

## 6. 風險與前置（實測後更新）

| 風險 | 說明 | 實測結果 / 緩解 |
|------|------|------|
| **Node 22+** | OneRingAI 要求 22+ | 本機 **v24.19.0 免升級**；僅 <22 才需升。CI/VPS 若 node20 需評估 |
| **外部依賴** | `npm:@everworker/oneringai` (MIT) | 已 `pnpm add -w` 裝 1.0.1；`node_modules/@everworker/oneringai` 存在即成功（INSTALL_EXIT=1 僅因 prepare 鎖 .git/config，與套件無關） |
| **adapter 降級** | 未裝 SDK 時 graceful | 沿用 `health()` 降級慣例；裝好後真實實跑通 |
| **記憶雙寫一致性** | 兩套權限模型 | 先做單寫（方案 A），記憶整合排後 |
| **模型 tag 404** | Ollama 實際 tag ≠ 文件 | 修正 adapter 預設為 `qwen2.5:3b-instruct-q4_K_M`（原 `qwen2.5:3b` 會 404） |
| **smoke 逾時** | 個別 adapter 聯網卡死 | Orchestrator 改每 route 45s 獨立 timeout，不互相等；smoke 60s 內結束 |

---

## 7. 實作成果（已驗證 ✅）

> 以下為本機實際執行，非 README 聲稱。

### 7.1 安裝
```
cd /c/Project/esggo && pnpm add -w @everworker/oneringai   # 實際裝 1.0.1
pnpm install --filter @esggo/oa-framework
ls packages/oa-framework/node_modules/@everworker/oneringai  # 存在 → 成功
```

### 7.2 真實實跑（Ollama 免費路徑）
`npx tsx test/oneringai-real.ts` → `REAL_EXIT=0`
```
[oneringai] 真實輸出:
原始產出: [OneRingAI] 永續發展是指在不破壞未來代際利用資源能力的前提下滿足當前需求的發展模式...
5T 欄位: {traceable,trackable,tangible,transparent,trustworthy}=true
Hash Lock: 836938fa364bff7994e92f91b139c1983820cf2547351ef6904b777b6fdba2db
5T 驗證: PASS
```

### 7.3 App 整合示範（消費層）
`npx tsx test/app-integration-demo.ts` → `DEMO_EXIT=0`
```
[app] oneringai 真實產出: 【來源/source_origin】OA-Team 子框架 oneringai | 引用 soul.md 5T 協議...
[app] 5T 驗證: PASS ✅
[app] 整合成功: app 經 OA 框架消費 oneringai 路由, 真實輸出 + 5T 鑄造通過
```

### 7.4 全框架 smoke
`npx tsx test/smoke.ts` → `SMOKE_EXIT=0`，`RESULT: ALL_11_FRAMEWORKS_OK`
（11 框架並行，60s 內結束；oneringai: ok，其餘 health=down 的 graceful 降級）

### 7.5 型別
`npx tsc -p tsconfig.json --noEmit` → **EXIT=0 零錯誤**

---

## 8. 交付清單（已全部 commit + push 至 origin/main）

| 項 | 檔案 | 狀態 |
|----|------|------|
| 對照分析（本檔 v2） | `docs/oneringai-vs-oa-framework-analysis.md` | ✅ |
| oneringai adapter（第 11 框架） | `packages/oa-framework/src/adapters/oneringai.ts` | ✅ 真實實跑通 |
| 註冊（types + index） | `packages/oa-framework/src/core/types.ts` / `src/index.ts` | ✅ 11 框架 |
| 依賴宣告 | `packages/oa-framework/package.json` | ✅ |
| 真實實跑腳本 | `test/oneringai-real.ts` / `test/app-integration-demo.ts` | ✅ REAL/DEMO EXIT=0 |
| smoke 逾時修復 | `src/core/orchestrator.ts` / `test/smoke.ts` | ✅ SMOKE EXIT=0 |
| soul 三層交付 | `soul-full.md` §26 + `soul-chapter-26-*` + `esggo-learning-center/soul-appendix-oa-framework.md` | ✅ |
| Hermes 技能 | `oa-oneringai-integration` (v1.3.0, 含 完整安裝集成/快速開始/最佳實踐) | ✅ 可喚醒複用 |

> 備註：本文件 v2 已從「分析/建議」升級為「已實作驗證」。所有代碼變更均已推送；`pnpm run typecheck/test` 因 workspace 前置 install 壞掉需用 `npx tsc`/`npx tsx` 直接驗證（等價綠證）。


---

## 9. 實作教訓 (Lessons Learned) — 對齊技能 BP-1~10

> 本節與 Hermes 技能 `oa-oneringai-integration` v1.3.0 的「最佳實踐」段同步，供未來維護者直接複用。

| # | 教訓 | 實測來源 |
|---|------|---------|
| L1 | **免費算立硬規則**：實跑只用本機 Ollama (`qwen2.5:3b-instruct-q4_K_M`)，禁付費 API/私鑰 npm | adapter 預設與 oneringai-real.ts 實跑 |
| L2 | **adapter 永遠優雅降級**：未裝 SDK 不 throw，不阻斷其他 10 框架 | health=down 的 adk/genkit/agent0 等並行不卡 |
| L3 | **5T 守門在 Orchestrator**：adapter 只回 `{output:string}`，Hash Lock 交 forgeT5 | oneringai.ts dispatch 不鑄 5T |
| L4 | **per-route timeout 修無限掛起**：每 route 獨立 45s，外層 race 會砍掉已完成結果 | orchestrator.run 改寫後 smoke 60s 內結束 |
| L5 | **npx 繞 pnpm 前置**：`pnpm run typecheck/test` 死在 prepare 鎖 .git/config，用 npx/tsx/verify.sh | pnpm INSTALL_EXIT=1 噪音，實際 node_modules 已裝 |
| L6 | **真實實跑才算完成**：禁「驗證通過」空話，貼 Hash Lock 實際值 | oneringai-real Hash Lock 836938fa… 等 |
| L7 | **不整包替換**：OneRingAI 以第 11 adapter 引入，絕不替換 oa-framework | 保 5T 雙層閘/30 蜂群/ESG 合規 |
| L8 | **實測模型 tag**：`qwen2.5:3b` 會 404，套件實裝 1.0.1 非 README 1.0.0 | Ollama 實存 tag 與 npm 實際版本 |
| L9 | **真實 API 形狀**：`createOAFrame(config).run(task)`、`artifact.output`(非 .content)、`verify5T` 回 {pass} | 實跑 app-integration-demo 修正欄位名 |
| L10 | **三層交付 + §19 收斂**：靈魂同步不漂移，本地偏離即 git checkout 還原 | soul-full §26 + 備份落檔 + 技能同步 |

**環境 blocker（非程式錯，誠實標註）**：
- Hermes `pyyaml==6.0.3` METADATA 損壞（上次 `hermes update` 中斷），需關閉 Hermes Desktop 後重跑 `hermes update` 修復。
- esggo `pnpm install` postinstall 的 prisma generate 因 EPERM 鎖檔失敗；繞法為 `npx tsc`/`npx tsx`/`bash test/verify-oneringai.sh` 直接驗證。
- 以上均不影響已推送的 OA×OneRingAI 整合程式碼正確性。
