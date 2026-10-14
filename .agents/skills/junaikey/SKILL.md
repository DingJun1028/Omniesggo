---
name: junaikey
category: memory-growth
description: JunAiKey 萬能元鑰 Agent Growth Layer — 永恆習得 / 共享記憶 / 閉環 / 知識沉澱 L1-L5 / OmniTag 標籤 / 結界 inheritance，操作 vps/junaikey.mjs CLI
tags: junaikey, memory, growth, knowledge, sedimentation, omnitag, boundary, esggo, vps
load: on_match
---

# JunAiKey 萬能元鑰 — Agent Growth Layer

> 永恆習得・共享記憶・閉環
> L0 JunAikey > L1 OmniKey > L2 OmniMasterKey > L3 SUMMON_LAYERS

---

## 何時載入

- 使用者提到 JunAiKey / 萬能元鑰 / 永憶 / 共享記憶 / 知識沉澱
- 需要記錄跨會話記憶、reflect 學習、grow 技能、查沉澱層級統計
- 需要 OmniTag 標籤分類、結界 inheritance、血緣 lineage 查詢

---

## CLI 用法（`node --env-file=.env.local vps/junaikey.mjs <cmd>`，workdir = `C:\Project\esggo`）

| 指令 | 說明 |
|------|------|
| `awaken` | 啟動/喚醒 |
| `grow <name> <body...> [--traits=a,b,c]` | 建立/更新技能（level 預設 L1） |
| `recall <name>` | 讀技能 |
| `forget <name>` | 刪技能 |
| `dedup` | 去重 |
| `remember '<json-event>'` | 寫記憶（event 超長會炸欄位長度，短句為佳） |
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

> NCB memory schema 限欄位（ts/event/summary/tags/...）：`stage`/`status` 不可直寫（400
> Unknown column），統一以 summary 前綴 `<stage>:<status>` 編碼，讀取端 `stageStatusOf()`
> 解析還原。`awaken` 自動觸發 superpowers 啟動引導（首次點亮 brainstorming，其後 skipped 去重）。

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

究極版奧義 v1.1 | JunAiKey Agent Growth Layer（2026-10-13 superpowers 7 階段融合）
