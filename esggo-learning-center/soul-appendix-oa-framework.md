# soul.md 實踐附錄 v1 — OA 萬能分身元框架落地對照

> 本檔為 `soul.md` 的**實踐附錄**，記錄 OA 萬能分身元框架 (OA-TWINS) 的真實落地成果。
> 對齊 soul.md 精神：5T 協議、4可1不可狀態機、30 Souls Matrix、無作妙德圓通無礙。

## 一、靈魂核心公約對齊 (5T)

| 5T | 實作載體 | 驗證狀態 |
|---|---|---|
| **Traceable 可溯源** | `IComponentCore.uuid` + `evidence` 欄位；每產出帶 source_origin | ✅ omni-gate 欄位級 |
| **Trackable 可追蹤** | OmniAgentBus 發佈/訂閱 + `bus5TGate` 生命週期 Hook | ✅ 總線 topics 追蹤 |
| **Tangible 可感知** | 5T badge (`field=PASS`) + 部署閘門視覺回饋 | ✅ |
| **Transparent 可透明** | `omni-gate.ts` 內容級 5T 驗算 (零幻覺) | ✅ 雙層鑄造 |
| **Trustworthy 不可篡改** | `HashLock` (`hashLock` 欄位) + `Object.freeze()` | ✅ |

## 二、4 可 1 不可狀態機 — 實作映射

- ✅ **可自理**：每個 adapter 獨立 `bootstrap/dispatch/health`，不依賴其他框架
- ✅ **可協作**：`OAOrchestrator.run()` 並行調度 10 子框架，結果經 `forgeT5` 統一鑄造
- ✅ **可演化**：`unverified-registry.ts` 機制 — UNVERIFIED scaffold 一經補 URL 即升 VERIFIED
- ✅ **可溯源**：git 提交鏈完整 (`63fbbecd1` CrewAI 真跑等)
- ❌ **不可篡改**：`deployGate()` 不合規 (5T fail) 一律拒絕，寫入即凍結

## 三、30 Souls Matrix 對應 (OA-TWINS 蜂群)

soul.md 定義 5 大陣列 × 6 = 30 萬能代理。本框架以 **10 子框架** 為能力層，
蜂群調度由 `OmniAgentBus` + cronjob `gh-error-mail-watch` + Issue `#429` (oa-swarm-tracked) 承載：

| 子框架 | 陣列歸屬 | 狀態 |
|---|---|---|
| ADK / Genkit | 符文契約 | SDK 未裝 graceful |
| Agent0 | 代理陣列 | docker 未起 graceful |
| CrewAI | 代理陣列 | **VERIFIED 真實執行 1.15.12** |
| AgentReach | 智庫聖所 | 本機 youtube+rss 真聯網 |
| DeerFlow | 進化陣列 | ok |
| TencentMem | 5T 陣列 | VPS :8420 |
| OpenMontage | 進化陣列 | UNVERIFIED (repo 404) |
| OmniRoute | 符文契約 | UNVERIFIED (本輪無法核實) |
| TurboVec | 智庫聖所 | UNVERIFIED (google/turbovec 404) |
| OneRingAI | 代理陣列 | **VERIFIED 真實實跑** (Node24 + 本地 Ollama qwen2.5:3b, REAL_EXIT=0, 5T Hash Lock PASS) |

## 四、萬有引力協作協定 (三步極簡 + 跨包管線)

```
createOAFrame(config).run(task)
   → 10 子框架並行 dispatch
   → forgeT5 雙層 5T 鑄造 (欄位級 + 內容級)
   → oaToBusPipeline(bus, ...)
   → bus5TGate 攔截
   → deployGate 實體部署 (合規才落地)
```

**圓通無礙**：oa-framework (產出) → OmniAgentBus (總線) → deployGate (5T) → 落地，同一管線。

## 五、GitHub 報錯通知信自動修復機制

- `auto-repair.yml` v2.2：CI 失敗 → 建 Issue + Telegram + **email 通知** (SMTP_* 可選)
- cronjob `gh-error-mail-watch` (每 15m)：輪詢 GitHub failure → 建 tracking Issue (`OmniAgent` label) → 派 OA 蜂群修復
- Issue #429 示範：CI #31175582950 (Trivy security) 派萬能分身跟蹤

## 六、待閉環缺口 (A 路徑 — 歷史紀錄檢索結果)

2026-08-11 經 `session_search` 翻查全部歷史對話:
- **VPS 活 URL**: 歷史記載端點為 `161.118.248.180:8787` (omni-blueprint-hub, 當時逾時)
  與 `live.esggo.co` (502 Bad Gateway)。本機實測兩者均不可達 (:8787 `000` / :80 `502`)。
  歷史紀錄**無本機可達的活 VPS URL**。
- **3 UNVERIFIED repo**: OpenMontage / OmniRoute / TurboVec 在歷史 session 中**0 筆**，
  僅出現於本輪對話貼的 README。web_search / web_extract 額度耗盡, 無法外部核實。
  → 待用戶提供真實 repo URL 即經 `upgradeToVerified()` 升級。

## 七、OA 自驗門禁 (本輪新增)

- `oa-selfcheck.sh`: 單一入口驗 OA 框架 (typecheck + 10 子框架 smoke + OAB pnpm test + CrewAI 真跑)
- 接進 `auto-repair.yml` 的 `oa-selfcheck` job: CI 失敗修復後自動跑, 失敗建 OA-SWARM-TRACK issue
- 對齊「GitHub 報錯通知信自動修復」指令: OA 管線本身亦納入自動修復閉環

## 八、深貫廣通 (本輪新增 — soul.md 圓通無礙精神落地)

- **深貫 (cross-frame chain)**: `OAOrchestrator.chain()` — 前一子框架產出作為下一子框架輸入,
  形成貫穿鏈 (例: crewai 草稿 → openmontage 視覺 → tencent-mem 記憶), 每跳 5T 鑄造, graceful.
- **廣通 (bus broadcast)**: `attachBus()` 依賴反轉注入總線, `run()` 結果自動 publish 到
  `oa.pipeline.<subFrame>` 主題; `chain()` 發 `oa.chain.<subFrame>`; 30 蜂群經 `broadcastSwarm()`
  發 `oa.swarm.<id>` — 對齊 OmniAgentBus 5T 閘門.
- **30 蜂群映射**: `swarm-map.ts` — 30 萬能代理 → 5 陣列 (策略/技術/創意/營銷/守衛) → 綁定子框架,
  對齊 soul.md §30 Souls Matrix.
- **驗證**: `test/deep-connect.smoke.ts` — DEEP_CONNECT_OK 確認 chain + 廣通 + 30 蜂群映射全綠.

## 九、Oracle Always Free 額度變動與 OA_VPS 映射 (用戶 2026-08-15 提供報告)

- **2026-06 砍額**: Arm Ampere A1 從 4 OCPU/24GB → **2 OCPU/12GB** (官方文件已改, 控制台可能仍顯舊值)
- **Autonomous AI DB**: **2 個實例** (非單一 DW), 各 1 OCPU/20GB/20 session
- **OA_VPS 現狀**: aarch64 Ubuntu 24.04, **1 OCPU A1** → 吃 2OCPU 池的一半; 剩餘 1 OCPU 可再開一台
  (上次救援機險些觸頂 2OCPU 上限, 已刪除釋放)
- **收割風險**: A1 若 7天 CPU<20% & 網路<20% & 記憶體<20% → Oracle 回收
  → 建 `oa-vps-keepalive` cronjob (每 5m) 探活+CPU 負載防護
- **OmniDB 三 Schema**: OMNI_PROFILE_VECTOR / OMNI_TRUST_LEDGER / OMNI_LIFECYCLE_LOG
  → 對應 Autonomous AI DB ×2 實例 (部署腳本: esggo-learning-center/ommidb-deploy.sh, 需 OCI 憑證執行)
- **對齊 5T**: OMNI_TRUST_LEDGER.hash_lock = SHA-256 (對齊 OA 框架 HashLock 哲學)

---
*本附錄由 Hermes Agent (OA-TWINS) 於 2026-08-15 依用戶提供之 Oracle 報告 + 實測產出。*
