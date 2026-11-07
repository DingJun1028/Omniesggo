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
title: junaikey

# JunAikey 萬能元鑰 / 萬能永憶 — Agent Growth Layer
> 永恆習得・共享記憶・閉環
> 層級位置:L0 JunAikey > L1 OmniKey > L2 OmniMasterKey > L3 SUMMON_LAYERS
> 雙後端:NCBDB (primary, 跨代理共享) + `~/.junaikey/` (local fallback)
> 召喚關鍵字:`JunAikey` / `萬能元鑰` / `萬能永憶` 出現於輸入 → 觸發載入
## 觸發時機 (When to use)
- 用戶/代理說 "JunAikey" / "萬能元鑰" / "萬能永憶" / "awaken" / "reflect"
- 需要跨 session 持續保存代理成長(技能/記憶/進度)
- 多代理需要共享同一份上下文(透過 NCBDB)
- 需要記錄跨會話記憶、reflect 學習、grow 技能、查沉澱層級統計
- 需要 OmniTag 標籤分類、結界 inheritance、血緣 lineage 查詢
- 想要形成 closed-loop:載入 → 執行 → 反思 → 寫回
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
## 快速使用 (Quick use — 經包裝器)
### 1. 每次 session 開始時被動載入
回傳 backend / skills count / recent memories / current progress。
### 2. 學習新技能時 grow
bash "C:/Project/esggo/vps/junaikey.sh" grow "encoding-check" "所有 shell 指令前先驗證編碼" --traits=永恆,被動,自主
### 3. 記錄事件到共享記憶
bash "C:/Project/esggo/vps/junaikey.sh" remember '{"event":"task-done","status":"ok"}'
### 4. 任務完成時反思 (閉環)
bash "C:/Project/esggo/vps/junaikey.sh" reflect "成功遷移" --learn=encoding-check,oci-bv-attach
### 5. 查詢
bash "C:/Project/esggo/vps/junaikey.sh" query --limit=20
bash "C:/Project/esggo/vps/junaikey.sh" recall encoding-check
### 6. 健康診斷
bash "C:/Project/esggo/vps/junaikey.sh" doctor
bash "C:/Project/esggo/vps/junaikey.sh" backend
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
## 沉澱層級（F-04）
L1 事件 → L2 模式 → L3 策略 → L4 法則 → L5 領域聖經
`growSkill` 支援 `level` 參數；`promote` 升級並寫血緣。
## OmniTag 維度（見 tags.mjs）
security / agent(01-30) / squad / lifecycle / priority / platform / best-practice / **superpowers**(12 項：7 階段+5 支援)
自訂 tag 亦可（非 Omni 維度視為 custom）。
> NCB memory schema 限欄位（ts/event/summary/tags/...）：`stage`/`status` 不可直寫（400 Unknown column），統一以 summary 前綴 `<stage>:<status>` 編碼，讀取端 `stageStatusOf()` 解析還原。`awaken` 自動觸發 superpowers 啟動引導（首次點亮 brainstorming，其後 skipped 去重）。
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
強制 local backend 避免 NCB 網路逾時（`JUNAKEY_BACKEND: 'local'`）。
## 已註冊自動施放（超能力覺醒，2026-10-13）
| 技能 | 層級 | 觸發 |
|------|------|------|
| superpowers | L4 | 元路由，命中即施放 |
| oa-team-swarm-ultra | L4 | swarm/多代理/bee-colony |
| universal-automation-ultra | L4 | automation/pipeline/workflow |
| best-practice-awakening | L4 | best-practice/checklist/entropy |
全部 trait 含「自動施放」+ tag `auto-cast:ultra` + `lifecycle:active`。
## NCBDB (共享) vs local (fallback)
| 後端 | 何時用 | 配置 |
|---|---|---|
| NCBDB (primary) | 跨代理/跨主機共享;資料存在雲端 NCB (`project=54686_junaikey`) | `NCBDB_API_TOKEN` + `NCBDB_PROJECT_ID` 來自 vault;4 tables 已就緒 |
| local (fallback) | 單機;NCB 不可達時自動降級 | 永遠可用,寫入 `~/.junaikey/` |
選擇策略:`JUNAKEY_BACKEND=auto|ncb|local` (default `auto`,有 NCB env + 健康自動用 NCB,否則 local)。
## 4 個 NCB Tables (需在 Dashboard 手動建)
`junaikey_skills` / `junaikey_memory` / `junaikey_progress` / `junaikey_journal` —
完整規格見 `C:/Project/esggo/junaikey-ncb-spec.md` 或執行:
node "C:/Project/esggo/vps/junaikey-setup.mjs" check     # 驗證
node "C:/Project/esggo/vps/junaikey-setup.mjs" spec-md   # 規格
## 完整文件
詳細 API、trait 過濾、誠實邊界:見 `C:/Project/esggo/skills/security/omni-master-key/SKILL.md` 的
「JunAikey 萬能元鑰 — Agent Growth Layer (代理成長層) + 萬能永憶」章節。
## 與 hermes 互動的典型流程
hermes 啟動
  ↓
[被動] 載入 junaikey skill → 執行 awaken()
用戶對話中輸入 "JunAikey" / "萬能元鑰" / "萬能永憶"
hermes 載入 JunAikey 模組 → 讀 skills / memory / progress
代理依上下文執行任務 (編碼檢查、oci 指令、...)
任務結束 → 執行 reflect() (寫新技能 + 反思事件)
下次 hermes 啟動 → 自動看到新技能與記憶 ← 閉環
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

- **doctor／backend 與 awaken 必須用同一組參數**：均需 `--env-file=vault`
- **`stdin is not a tty`** 問題：經 `junaikey.sh` 包裝器導向 `</dev/null`
- **NCB_TOKEN 未定義** 問題：非帶 `--env-file` 即誤報 `activeBackend=local`

---

## 快捷鍵與快速存取 (Hotkeys & Shortcuts)

> 系統層級的快速存取鍵，無需打開命令列即可快速觸發 junaikey 功能。

### 快捷鍵清單

| 快捷鍵 | 功能 | 操作方式 | 優先級 |
|--------|------|---------|--------|
| `Ctrl+Alt+J` | 喚醒系統（awaken） | 打開/喚醒 junaikey | 高 |
| `Ctrl+Alt+S` | 成長技能（grow） | 快速記錄新技能 | 高 |
| `Ctrl+Alt+R` | 反思學習（reflect） | 快速記錄學習心得 | 中 |
| `Ctrl+Alt+Q` | 查詢記憶庫（query） | 查詢過去記錄 | 中 |
| `Ctrl+Alt+H` | 健康診斷（doctor） | 檢查系統狀態 | 低 |
| `Ctrl+Alt+B` | 切換後端（backend） | 切換 NCBDB / local | 低 |
| `Ctrl+Alt+T` | 標記記憶（tag） | 快速標記 | 低 |
| `Ctrl+Alt+P` | 顯示進度（progress） | 查看任務進度 | 低 |

### 快捷鍵配置文件

快捷鍵配置位於：`~/.config/junaikey/hotkeys.json`

```json
{
  "hotkeys": {
    "awaken": {
      "key": "Ctrl+Alt+J",
      "description": "喚醒系統",
      "enabled": true
    },
    "grow": {
      "key": "Ctrl+Alt+S",
      "description": "成長技能",
      "enabled": true
    },
    "reflect": {
      "key": "Ctrl+Alt+R",
      "description": "反思學習",
      "enabled": true
    },
    "query": {
      "key": "Ctrl+Alt+Q",
      "description": "查詢記憶庫",
      "enabled": true
    },
    "doctor": {
      "key": "Ctrl+Alt+H",
      "description": "健康診斷",
      "enabled": true
    },
    "backend": {
      "key": "Ctrl+Alt+B",
      "description": "切換後端",
      "enabled": true
    },
    "tag": {
      "key": "Ctrl+Alt+T",
      "description": "標記記憶",
      "enabled": true
    },
    "progress": {
      "key": "Ctrl+Alt+P",
      "description": "顯示進度",
      "enabled": true
    }
  },
  "shortcuts": {
    "window": "C:\Project\esggo\vps\junaikey.sh",
    "envelope": "C:\Project\esggo\vps\junaikey.mjs",
    "config": "~/.config/junaikey/hotkeys.json"
  }
}
```

### 快捷鍵使用說明

**Windows 系統：**

```powershell
# 直接在 PowerShell 執行
Set-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Explorer\Desktop\ShellIcons" -Name "(Default)" -Value "junaikey"
```

**Linux/macOS 系統：**

```bash
# 透過 desktop entry 建立快捷鍵
cat > ~/.local/share/applications/junaikey.desktop << 'EOF'
[Desktop Entry]
Name=JunAikey 萬能元鑰
Comment=Agent Growth Layer - 永恆習得・共享記憶・閉環
Exec=bash /path/to/vps/junaikey.sh %u
Icon=junaikey
Terminal=true
Type=Application
Categories=Development;
Keywords=agent;memory;growth;knowledge;junaikey;
EOF

# 建立快捷鍵
ln -sf ~/.local/share/applications/junaikey.desktop ~/.local/share/applications/mimeinfo.cache
```

---

## 關聯文件
- `junaikey-ncb-spec.md` — NCB 4 個 tables 規格
- `vps/junaikey.sh` — 防呆包裝器
- `vps/junaikey.mjs` — 純 CLI 工具
- `vps/junaikey-setup.mjs` — 初始化與驗證
- `oa/junaikey-growth/VERSION` — 版號封印
- `src/core/ai/skills/best-practices.ts` — 5T 驗證規範
- `OMNITAG_INTEGRATION.md` — OmniTag 標籤關聯規則
## 自然語觸發 (Natural Language Trigger)
### 1. 觸發關鍵字清單 (Trigger Keywords)
> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。
#### 核心觸發詞 (Core Triggers)
| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 萬能元鑰 | JunAikey | 全體觸發入口 | 5.0 |
| 萬能永憶 | OmniMemory | 記住當前內容 | 4.5 |
| 覺醒 | Awaken | 啟動/喚醒系統 | 4.5 |
| 反思 | Reflect | 反思學習 / 寫回記憶 | 4.0 |
| 成長 | Grow | 建立/更新技能 | 3.5 |
| 分享記憶 | Shared Memory | 跨代理共享記憶 | 3.0 |
| 存檔 | Save | 保存目前狀態 | 3.0 |
| 讀取 | Recall | 讀取技能/記憶 | 2.5 |
| 查詢 | Query | 查詢記憶庫 | 2.0 |
| 尋求幫助 | Help | 顯示協助資訊 | 1.0 |
#### 進階觸發詞 (Advanced Triggers)
| 指令 | Command | 執行 CLI 指令 | 4.0 |
| 工具 | Tool | 自動使用工具 | 3.5 |
| 自動執行 | Auto-run | 自動執行模式 | 3.0 |
| 查詢工具 | Query Tool | 查詢資源 | 2.0 |
| 重啟 | Restart | 重啟系統 | 3.0 |
| 關閉 | Shutdown | 關閉系統 | 3.0 |
| 反向 | Reverse | 逆向操作 | 2.0 |
| 觀察 | Observe | 觀察系統狀態 | 2.5 |
| 檢查 | Check | 健康檢查 | 2.5 |
| 初始化 | Init | 系統初始化 | 3.0 |
### 2. 觸發規則 (Trigger Rules)
#### 2.1 預設觸發機率 (Default Trigger Probability)
| 觸發模式 | 權重 | 說明 |
|---------|------|------|
| 核心關鍵字 (萬能元鑰/覺醒/反思/成長) | 100% | 必然觸發 |
| 進階關鍵字 (指令/工具/查詢) | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配，保留置信度分數 |
| 歧義命中 | 15% | 需要用戶確認或上下文補充 |
#### 2.2 機率加權 (Probability Weighting)
觸發時機會算 = (關鍵字相關分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)
- 單一高權重關鍵字：自動觸發，機率 = 1.0
- 多關鍵字組合：權重加總，上限 1.0
- 低權重命中 (< 0.3)：記錄至 `junaikey_journal`，需要用戶確認
#### 2.3 自然語解析 (Natural Language Parsing)
```typescript
// 輸入："awaken 並成長編碼檢查技能"
// 解析後：
{
  triggers: ["awaken", "grow skill"],
  actions: ["awaken()", "growSkill('encoding-check')"],
  priority: ["awaken", "grow"],
  probability: 1.0
}
// 輸入："我今天學到新的編碼風格"
  triggers: ["growth", "memory"],
  actions: ["recordLearning()", "remember('new-coding-style')"],
  priority: ["memory"],
  probability: 0.6
// 輸入："有沒有東西要我幫忙？"
  triggers: ["help", "query"],
  actions: ["doctor()", "query()"],
  priority: ["help", "query"],
  probability: 0.8
### 3. 自動工具選擇 (Auto Tool Selection)
#### 3.1 工具選擇權重表
| 工具類別 | 典型關鍵字 | 預設權重 | 更新權重 |
|---------|------------|---------|----------|
| 記憶查詢 | recall, query, 查詢, 讀取 | 0.8 | 0.9 |
| 技能成長 | grow, 成長, 建構 | 0.7 | 0.8 |
| 反思與學習 | reflect, 學習, 記住 | 0.75 | 0.85 |
| 系統初始化 | awaken, 啟動, 初始化 | 0.9 | 1.0 |
| 共享記憶 | shared memory, share, 協作 | 0.65 | 0.75 |
| 結界 inherit | inherits, 繼承 | 0.5 | 0.6 |
#### 3.2 多工具並發觸發
當輸入同時包含多個觸發關鍵字時：
// 輸入："awaken 並成長新的編碼技能，並記住今天的學習"
const triggers = {
  awaken: { weight: 1.0 },
  growSkill: { weight: 0.8, args: { name: "coding-style", body: "新學到的編碼風格" } },
  remember: { weight: 0.9, event: "learning", summary: "今天學到新的編碼風格" }
};
// 執行順序：awaken → growSkill → remember
// 每步權重：1.0 → 0.8 → 0.9
### 4. 信心分數與反饋 (Confidence Score & Feedback)
| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行，若失敗則詢問 |
| 0.4 - 0.7 | 詢問用戶確認 |
| < 0.4 | 記錄至 `junaikey_journal`，不執行 |
### 5. 實際示例
#### 5.1 簡短自然語
**輸入**："awaken"
**解析**：核心關鍵字 → 自動觸發
**輸出**：執行 `awaken()`
**輸入**："成長編碼檢查"
**解析**：成長關鍵字 + 技能名稱
**輸出**：`growSkill("coding-check", "所有 shell 指令前先驗證編碼")`
**輸入**："記住今天學到的方法"
**解析**：成長 + 記憶關鍵字
**輸出**：`remember("learning", "今天學到的方法")`
#### 5.2 複雜自然語
**輸入**："我今天學到新編碼技巧，希望能跟其他代理分享並記住"
**解析**：
- 關鍵字：`growth`, `shared`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`
**輸入**："讓我反思一下昨天的學習"
**解析**：反思關鍵字
**輸出**：`reflect("昨天的學習")`, `query("reflect")` 確認