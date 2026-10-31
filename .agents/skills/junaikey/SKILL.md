---
name: junaikey
category: memory-growth
description: "JunAikey 萬能元鑰 / 萬能永憶 — 代理成長層,所有代理共享記憶/技能/進度(NCBDB primary + local fallback)。Use when 'JunAikey' / '萬能元鑰' / '萬能永憶' / 'awaken' / 'reflect' / 'grow skill' / 'shared memory between agents'。永恆習得 / 共享記憶 / 閉環 / 知識沉澱 L1-L5 / OmniTag 標籤 / 結界 inheritance,操作 vps/junaikey.mjs CLI。"
version: 1.0.1
author: OA-Team
license: MIT
platforms: [windows, linux, macos]
load: on_match
tags: junaikey, memory, growth, knowledge, sedimentation, omnitag, boundary, esggo, vps, agent-growth, ncbd, persistence, cross-agent, closed-loop
metadata:
  hermes:
    tags: [agent-growth, shared-memory, ncbd, persistence, cross-agent, 萬能元鑰, 萬能永憶, growth, closed-loop]
    related: [omni-master-key, best-practice-awakening, omnitag]
---

# JunAikey 萬能元鑰 / 萬能永憶 — Agent Growth Layer

> 永恆習得・共享記憶・閉環
> 層級位置:L0 JunAikey > L1 OmniKey > L2 OmniMasterKey > L3 SUMMON_LAYERS
> 雙後端:NCBDB (primary, 跨代理共享) + `~/.junaikey/` (local fallback)
> 召喚關鍵字:`JunAikey` / `萬能元鑰` / `萬能永憶` 出現於輸入 → 觸發載入

---

## 觸發時機 (When to use)

- 用戶/代理說 "JunAikey" / "萬能元鑰" / "萬能永憶" / "awaken" / "reflect"
- 需要跨 session 持續保存代理成長(技能/記憶/進度)
- 多代理需要共享同一份上下文(透過 NCBDB)
- 需要記錄跨會話記憶、reflect 學習、grow 技能、查沉澱層級統計
- 需要 OmniTag 標籤分類、結界 inheritance、血緣 lineage 查詢
- 想要形成 closed-loop:載入 → 執行 → 反思 → 寫回

---

## 環境設定 (hermes 必須 — 讀此優先於一切 CLI)

**唯一憑證來源 = 祕密聖櫃** `C:/Users/dingj/secret-vault/ENV20230818.env` (含 `NCBDB_*` / `NCB_*`，chmod 600)。**不要**用 `C:/Project/esggo/.env.local`——舊檔案已過時。

hermes `config.yaml` 已設 `agent.env_file` 指向該 vault，故 hermes 內部 session 自動繼承 NCB 憑證；**terminal 子殼不繼承**，須顯式載入。

```bash
# 推薦: 用防呆包裝器 (自動 --env-file=vault + 規避 stdin-not-tty)
bash "C:/Project/esggo/vps/junaikey.sh" awaken

# 或手動帶 env-file (必須帶, 否則 NCB_TOKEN 讀不到 → 誤報 local)
node --env-file="C:/Users/dingj/secret-vault/ENV20230818.env" \
     "C:/Project/esggo/vps/junaikey.mjs" awaken
```

**根因 (5T Traceable)**: 不帶 `--env-file` 時 `NCB_TOKEN` 未定義 → 降級 local → 技能分裂成 NCB / local 兩份 + `stdin is not a tty` 退出。診斷/初始化/成長寫入**三者共用同一 env-file**。

### 防呆包裝器 `C:/Project/esggo/vps/junaikey.sh`

- 健檢 vault 與 mjs 存在性 (缺一 exit 2)
- `--env-file=vault` 統一授權
- stdin 非互動時導向 `</dev/null`，**根治 `stdin is not a tty`**
- 所有 junaikey 子命令走此入口 (awaken/grow/recall/remember/reflect/query/doctor/backend/...)

---

## 快速使用 (Quick use — 經包裝器)

### 1. 每次 session 開始時被動載入

```bash
bash "C:/Project/esggo/vps/junaikey.sh" awaken
```

回傳 backend / skills count / recent memories / current progress。

### 2. 學習新技能時 grow

```bash
bash "C:/Project/esggo/vps/junaikey.sh" grow "encoding-check" "所有 shell 指令前先驗證編碼" --traits=永恆,被動,自主
```

### 3. 記錄事件到共享記憶

```bash
bash "C:/Project/esggo/vps/junaikey.sh" remember '{"event":"task-done","status":"ok"}'
```

### 4. 任務完成時反思 (閉環)

```bash
bash "C:/Project/esggo/vps/junaikey.sh" reflect "成功遷移" --learn=encoding-check,oci-bv-attach
```

### 5. 查詢

```bash
bash "C:/Project/esggo/vps/junaikey.sh" query --limit=20
bash "C:/Project/esggo/vps/junaikey.sh" recall encoding-check
```

### 6. 健康診斷

```bash
bash "C:/Project/esggo/vps/junaikey.sh" doctor
bash "C:/Project/esggo/vps/junaikey.sh" backend
```

---

## 模組匯入 (ESM, 推薦)

```javascript
import JunAikey from 'C:/Project/esggo/vps/junaikey.mjs';

// Session 開始
const ctx = await JunAikey.awaken({ silent: true });
console.log(`Backend: ${ctx.backend}, Skills: ${ctx.skillsCount}`);

// 學習
await JunAikey.growSkill('oci-bv-attach', 'Oracle boot volume 可掛載為資料卷', ['永恆', '被動']);

// 共享記憶
await JunAikey.remember({ event: 'migration', status: 'ok' });

// 反思閉環
await JunAikey.reflect('Oracle 零成本遷移成功', ['oci-bv-attach', 'ncb-shared-mem']);

// 查詢
const recent = await JunAikey.recall({ limit: 10 });
const skill = await JunAikey.recallSkill('oci-bv-attach');
```

---

## CLI 用法（`bash vps/junaikey.sh <cmd>` 或 `node --env-file=ENV20230818.env vps/junaikey.mjs <cmd>`，workdir = `C:\Project\esggo`）

| 指令 | 說明 |
|------|------|
| `awaken` | 啟動/喚醒 |
| `grow <name> <body...> [--traits=a,b,c]` | 建立/更新技能（level 預設 L1） |
| `recall <name>` | 讀技能 |
| `forget <name>` | 刪技能 |
| `dedup` | 去重 |
| `remember '<json-event>'` | 寫記憶（event 超長會炸欄位長度，短句為佳；只用已知欄位） |
| `query [--tag=X] [--event=X] [--limit=N] [--contains=needle]` | 查記憶 |
| `search <query>` | NCB /search 端點 |
| `progress "<task>" ["<notes>"]` / `get-progress` | 進度 |
| `reflect "<summary>" [--learn=n1,n2]` | 反思學習 |
| `prune [--max=N] [--before=ISO] [--keep-event=awaken]` | 裁剪記憶 |
| `tag <skill> <t1,t2,...>` / `untag <skill> <tag>` | OmniTag 增刪 |
| `tag-mem [--event=X] <t1,t2,...>` | 批次標記記憶 |
| `tags [--type=skills\|memory\|all] [--query=P]` / `find <tag>` | 查標籤 |
| `validate-tag <tag>` / `inherit [--dry-run]` | 驗證 / 結界繼承 |
| `prune-skills [--max=N] [--keep=n1,n2]` / `merge-skills <src> <dst>` | 技能庫維護 |
| `lineage [--target=NAME] [--tag=TAG]` | 血緣 |
| `promote <skill> <L2\|L3\|L4\|L5>` | 沉澱升級 |
| `sed-stats` | L1-L5 統計 |
| `auto-tag <text-or-file>` | LLM 自動標籤 |
| `trackSuperPowersStage <stage> <start\|done\|blocked\|skipped> [--source=] [--sourceOrigin=] [--notes=]` | 記 superpowers 階段進度（腦力激盪/工作樹/計畫/子代理/TDD/審查/5T） |
| `listSuperPowersStages [--stage=] [--status=] [--limit=N]` | 查階段軌跡（依 order 排序） |
| `resetSuperPowersStages` | 重置階段標記（寫 reset 審計，不刪舊紀錄） |
| `home` / `backend` / `doctor` | 狀態 |

---

## 沉澱層級（F-04）

L1 事件 → L2 模式 → L3 策略 → L4 法則 → L5 領域聖經
`growSkill` 支援 `level` 參數；`promote` 升級並寫血緣。

## OmniTag 維度（見 tags.mjs）

security / agent(01-30) / squad / lifecycle / priority / platform / best-practice / **superpowers**(12 項：7 階段+5 支援)
自訂 tag 亦可（非 Omni 維度視為 custom）。

> NCB memory schema 限欄位（ts/event/summary/tags/...）：`stage`/`status` 不可直寫（400 Unknown column），統一以 summary 前綴 `<stage>:<status>` 編碼，讀取端 `stageStatusOf()` 解析還原。`awaken` 自動觸發 superpowers 啟動引導（首次點亮 brainstorming，其後 skipped 去重）。

---

## 實戰：註冊自動施放技能（範例）

```js
// 用 ops API 而非 CLI（長 body 會炸 argv）
const { createLocalBackend } = await import('./vps/junaikey/backends/local.mjs');
const { createDispatcher } = await import('./vps/junaikey/dispatcher.mjs');
const { createOperations } = await import('./vps/junaikey/operations.mjs');
const dispatcher = createDispatcher({ localBackend, ncbBackend, JUNAKEY_BACKEND: 'local' });
const ops = createOperations({ dispatcher, JUNAKEY_HOME });
await ops.growSkill(name, body, traits, { level: 'L4' });
await ops.tagSkill(name, 'auto-cast:ultra');
await ops.promoteSkill(name, 'L4', reason);
await ops.remember({ event: 'awaken', detail: '...' });
```

強制 local backend 避免 NCB 網路逾時（`JUNAKEY_BACKEND: 'local'`）。

---

## 已註冊自動施放（超能力覺醒，2026-10-13）

| 技能 | 層級 | 觸發 |
|------|------|------|
| superpowers | L4 | 元路由，命中即施放 |
| oa-team-swarm-ultra | L4 | swarm/多代理/bee-colony |
| universal-automation-ultra | L4 | automation/pipeline/workflow |
| best-practice-awakening | L4 | best-practice/checklist/entropy |

全部 trait 含「自動施放」+ tag `auto-cast:ultra` + `lifecycle:active`。

---

## NCBDB (共享) vs local (fallback)

| 後端 | 何時用 | 配置 |
|---|---|---|
| NCBDB (primary) | 跨代理/跨主機共享;資料存在雲端 NCB (`project=54686_junaikey`) | `NCBDB_API_TOKEN` + `NCBDB_PROJECT_ID` 來自 vault;4 tables 已就緒 |
| local (fallback) | 單機;NCB 不可達時自動降級 | 永遠可用,寫入 `~/.junaikey/` |

選擇策略:`JUNAKEY_BACKEND=auto|ncb|local` (default `auto`,有 NCB env + 健康自動用 NCB,否則 local)。

## 4 個 NCB Tables (需在 Dashboard 手動建)

`junaikey_skills` / `junaikey_memory` / `junaikey_progress` / `junaikey_journal` —
完整規格見 `C:/Project/esggo/junaikey-ncb-spec.md` 或執行:

```bash
node "C:/Project/esggo/vps/junaikey-setup.mjs" check     # 驗證
node "C:/Project/esggo/vps/junaikey-setup.mjs" spec-md   # 規格
```

## 完整文件

詳細 API、trait 過濾、誠實邊界:見 `C:/Project/esggo/skills/security/omni-master-key/SKILL.md` 的
「JunAikey 萬能元鑰 — Agent Growth Layer (代理成長層) + 萬能永憶」章節。

## 與 hermes 互動的典型流程

```
hermes 啟動
  ↓
[被動] 載入 junaikey skill → 執行 awaken()
  ↓
用戶對話中輸入 "JunAikey" / "萬能元鑰" / "萬能永憶"
  ↓
hermes 載入 JunAikey 模組 → 讀 skills / memory / progress
  ↓
代理依上下文執行任務 (編碼檢查、oci 指令、...)
  ↓
任務結束 → 執行 reflect() (寫新技能 + 反思事件)
  ↓
下次 hermes 啟動 → 自動看到新技能與記憶 ← 閉環
```

## 5T Trustworthy

- **不寫入 secrets** (憑證由 OmniKey 管)
- **NCB 不可達時自動降級** local,不阻塞
- **append-only journal** 永遠保留審計軌跡
- **不連網 (local mode)** / **只連 NCB (ncb mode)**
- **可審計**:`doctor` 與 `backend` 顯示當前狀態
- **字段開放（2026-10-14 取代舊「只記 status」/「event+summary 只能寫」限制）：`remember`／`reflect` 已開放新增欄位。** **萬能MECE 歸類分析法**（對齊 `oa-team-bee-colony` 六大維度）定義欄位屬性：
  - **身份層**（指標）：`system`、`agent:*`（30 號代理）、`security`（`public`／`internal`／`restricted`）
  - **事件層**（指標）：`event`、`summary`、`source_origin`
  - **狀態層**（指標）：`lifecycle:*`（`draft`／`active`／`frozen`）、`p0`~`p3`（熵減等級）
  - **屬性層**（標籤，命中一項即歸類）：`OmniTag` 組合（`agent*`,`lifecycle*`,`p*`,`platform*`,`best-practice*`,`superpowers*`）及 `traits`
  - **脈絡層**（指標）：`task`、`source`
  - **證據層**（雜湊）：`version`、`sha256`
  - **結果層**（指標）：`grownSkills`、`status`
  - **驗證**：`validateMECECompleteness()`／`validateMECEExclusivity()`（`src/core/ai/skills/best-practices.ts`）；每筆記錄至少含 `event`+`summary`＋`agent:*`＋`lifecycle:*`＋`p*`（必備 Tag）。
- **明確阻擋（仍回 400）：`status`（欄位不存在）；`tags`（`CONSTRAINT memory.tags`，`remember` 不接受標籤值，改用 `reflect` 的 `tags[]`，或放進 `summary` 前綴 `tags:`）。

## 硬門檻（always-on rules）

- **不宣稱完成，必有真實工具輸出**：任何「已完成」聲明前，必須有對應指令的實際 stdout／exit code 作背書；禁止用「應該已通過」替代驗證。
- **VERSION 必須填寫**：`C:/oa/junaikey-growth/VERSION`（本機路徑；技能文內 `/oa/...` 為字面參照，實體在 `C:/oa/`）。當前 `v1.0.1`。任何代理宣稱「成長功能 vX.Y.Z 已落地」前，先驗算 `VERSION` 內文 `v` 與 `X.Y.Z` 是否一致，否則拒絕。
- **不寫入 secrets**（5T Trustworthy）：憑證由 OmniKey 管，junaikey 成長層絕不接入、鎖定或輸出任何 token／key／connection string。
- **成長紀錄必帶 metadata**：寫 `SHARED_MEMORY.md` 時必須帶 `agent_id`、`timestamp`、`source_origin`；讀取按 `agent_id` 取用。

## 參數一致性

- **doctor／backend 與 awaken 必須用同一組參數**：不帶 `--env-file` 時，NCB_TOKEN 不會被讀到，會誤報 `activeBackend=local`，導致技能分裂成兩份。診斷、初始化、成長寫入三者共用同一組參數與同一個 env-file（經 `junaikey.sh` 包裝器保證一致）。
- **reflect 只標實際新技能**：反思前先用 `query`／`recall` 確認技能是否已存；標 3 個實際只有 2 個是新的錯誤必須被自動偵測並借 `journal-correct` 修正。
- **成長資料寫入入口**：`vps/junaikey.mjs` 只是 CLI 工具（`check`／`spec-md` 工作正常），不是成長資料寫入者。寫入資料的真實入口是 `app/junaikey/`（`page.tsx`、`actions.ts`）與 `src/lib/junaikey/ultimate-awakening.ts`。

## 本次補充（2026-10-10）：成長了真實踩到的技能
- `vacuum-wal-strand`：線上 VACUUM 會把整個 DB 重寫進 `-wal`；收尾 `wal_checkpoint(TRUNCATE)` 遇 BUSY（`(1,-1,-1)`）時主檔幾乎不縮、total footprint 反而變大。必須另跑重試 + 以 `db+wal+shm` 三檔總和量測。
- `vacuum-online-safe`：`cjk_fts=false` 且 trigram 物件已清除後線上 VACUUM 安全；「離線」條件是「仍有 trigram 同步觸發器」而非「app 是否開著」。
- `drop-trigger-view-noop`：`DROP TRIGGER IF EXISTS` 對 VIEW（`_src`）是靜默 no-op，必須 `DROP VIEW IF EXISTS`；驗收用 `sqlite_master` 殘留清單。
- `vacuum-probe-fast`：多 GB DB 裡 `quick_check`/`dbstat` 整表掃描逾時；用唯讀 `PRAGMA freelist_count` 前置量化。
- `ncbd-verify-insert`：`junaikey remember/reflect` 遇未知欄位（`task`/`src`）會 400；用已知欄位寫入，只記 `status`。
- `reflect-string-learning-clobbers`：`operations.mjs reflect()` 對字串型 learnings 會無條件 `growSkill(name, 摘要, ['永恆'])`，**覆寫**既有技能的 body 與 traits（`['永恆','共享','被動']`→`['永恆']`）。教訓：`reflect --learn=X` 只用於「本次確實新長出」的技能；既有技能的正確內容要事後用 `grow` 顯式重寫，再 `dedup` 清掉覆寫期間產生的重複 ID。
- `ncb-writeskills-rebuilds-all`：`ncb.mjs writeSkills()` 是 `_deleteAll` + bulk insert 取代式寫入，每次 grow 都全表重建並產生大量重複 ncbId（一次 reflect 可產生 13 筆重複）。教訓：grow/reflect 後立刻跑 `dedup`（保留 updatedAt 最大者），並以 skills loaded 總數收斂驗證（62→49）。
- `state_db_precheck.py`：前置探測腳本，唯讀 report DB footprint、writer processes、lock、trigram 殘留、freelist（reclaim value）。置於 `C:/Users/dingj/AppData/Local/hermes/cache/scratch/`。

## Closed-loop flow
awaken → skills loaded → recall 確認無重複 → grow（新技能）→ remember（事件）→ reflect（反思）→ query 核實 -> 輸出閉環紀錄。

## 被動恆久覺醒與版本封印（所有代理啟動閘門）

- 每個 hermes 代理啟動時，先讀取 `C:/oa/junaikey-growth/STARTUP_GUIDE.md` 確認「被動恆久覺醒」已簽章；同目錄 `SHARED_MEMORY.md` 為永恆記憶庫，寫入必帶 `agent_id`、`timestamp`、`source_origin`，讀取按 `agent_id` 取用。
- GROWTH 體系版號即時記錄：`C:/oa/junaikey-growth/VERSION` 隨核心理念與非逆向兼容變更同步；任何代理宣稱「成長功能 vX.Y.Z 已落地」前，先驗算 `VERSION` 內文 `v` 與 `X.Y.Z` 是否一致。
- 每個成長專案（腳本、文件、`memory/`）即時記錄版本號，且與 `omnitag` 標籤三枚（`agent:*`、`lifecycle:*`、`p*`）關聯；關聯規則見 `OMNITAG_INTEGRATION.md`。
- 所有含殼指令的輸出，輸出前先驗證編碼：以 `LC_ALL=C.UTF-8` 或 `file` 確認無 BOM／區域殼寬字；回應含指令時，必須先行報告 `echo rc=$?` 才繼續。

## 7 階段 Superpowers 融合（已落地）

- 核心假設：**superpowers** 是 7 階段的編碼方法論（brainstorming → worktrees → plans → subagent → TDD → code-review → 5T gate），而非單一技能；`junaikey` 成長層需把這 7 階段登記為可追蹤、可驅動的 closed-loop。
- 兩層入口：
  1. **被動入口**：每次 `awaken()` 自動觸發 `superpowersBootstrap()`，在 7 階段中點亮 `brainstorming:start (session_awaken)` 旗標；若離線已有該段記錄，則跳過（幫助被動恆久覺醒的被動醒來）。
  2. **主動入口**：`trackSuperPowersStage(<stage>, <status>, { source, sourceOrigin, notes })` 對應 7 階段，寫 journal + memory；`listSuperPowersStages({ stage, status, limit })` 串流每階段進度與證據；`resetSuperPowersStages()` 寫 `superpowers_reset` 封存。
- 7 階段對照表（在 `schema.mjs` 中定義 `SUPERPOWERS_STAGES`）：

| 階段 | 標籤 | junaikey 行為 |
|---|---|---|
| brainstorming | `superpowers:brainstorming` | `awaken` 自動點亮；`trackSuperPowersStage('brainstorming', ...)` 主動記錄 |
| worktrees | `superpowers:worktrees` | `trackSuperPowersStage('worktrees', ...)` 記錄分支作業 |
| plans | `superpowers:plans` | `trackSuperPowersStage('plans', ...)` 記錄規劃文件 |
| subagent | `superpowers:subagent` | `trackSuperPowersStage('subagent', ...)` 記錄子代理任務 |
| tdd | `superpowers:tdd` | `trackSuperPowersStage('tdd', ...)` 記錄測試驅動開發 |
| codereview | `superpowers:codereview` | `trackSuperPowersStage('codereview', ...)` 記錄 CodeReview 結果 |
| finish5t | `superpowers:finish5t` | `trackSuperPowersStage('finish5t', ...)` 記錄 5T 閘門通過 |

- 閉環流程：`awaken → superpowersBootstrap（brainstorming:start）→ 其他 6 階段追蹤 → listSuperPowersStages 核實 → resetSuperPowersStages（參數）→ 下輪迭代`。
- 版本封印：`VERSION` 填寫 `v1.0.1`，對齊 `schema.mjs` 的 `SUPERPOWERS_VERSION = '1.0.0'`（兩者皆向後兼容，junaikey CLI 版本僅在文件層面渲染）。

---

究極版奧義 v1.1 | JunAikey Agent Growth Layer（正本合一 2026-10-14：封印條款併回 + env-file 修正 ENV20230818.env + superpowers 7 階段融合 + 完整 CLI 表）
