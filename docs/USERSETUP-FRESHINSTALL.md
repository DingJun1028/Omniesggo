# 重安裝 / 新機器 完整指南

> **repo**：`https://github.com/DingJun1028/Omniesggo.git`  
> **branch**：`feature/oesg-esg-swarm-soul-d`（6 個 commit，已 push 至 origin）  
> **寫成時間**：2026-11-02 · 授權 AGPL-3.0  
> **本機**：Windows 10/11（預設 32-bit node；Python 與 OmniNote 完全可跑，TS 建構需 CI 驗）

本指南假設你是**剛重灌或剛拿到新載具**，要從零把五個系統整起來：

| # | 系統 | 技術的言語/地點 | 本地可否完整驗 |
|---|------|----------------|---------------|
| 1 | Obsidian 共享大腦 | `docs/vault-canon/` + obsidian-git 插件 | ✅ 設置+驗（以裝置瀏覽） |
| 2 | OmniNote 萬能筆記 | `apps/omni-note/`（Python） | ✅ 可本地跑完整 demo |
| 3 | OMNiAgent | `agents/skills/smart-ai-router/OMNiAgent.ts` | ⚠️ 已寫 LSP 0 錯，需 CI 建 |
| 4 | 多代理共享記憶層 | `agents/skills/smart-ai-router/shared-memory.ts` | ⚠️ 同上，需 CI 建 |
| 5 | Mistral Workflows 產品級 swarm | `apps/esg-swarm/` | ✅ 已 cloud verified overall 82 |

> 符號：`[已驗]`本地可跑且已驗過  `[可選]`可選  `[待 CI]`離線/無法本地建構需 CI 驗證

---

## 目錄

1. 步驟 0：前置條件
2. 步驟 1：克隆 repo 與切換分支
3. 步驟 2：安裝 Python（準繩）
4. 步驟 3：（選）安裝 64-bit Node 做 TS 建構驗證
5. 步驟 4：Obsidian 共享大腦設置
6. 步驟 5：Mistral API key
7. 步驟 6：跑 OmniNote（本地驗證）
8. 步驟 7：跑 esg-swarm 產品級 swarm（cloud verified）
9. 步驟 8：OMNiAgent 與共享記憶層（TS，需 CI）
10. 步驟 9：發 PR（可選）
11. 步驟 10：CI 驗證清單
12. 常見問題

---

## 步驟 0：前置條件

| 項目 | 建議 |
|---|---|
| 作業系統 | Windows 10 / 11 |
| Git | 有（含 **Git Credential Manager**，推 GitHub 要用 PTY 模式） |
| Python | 3.11+ |
| Node.js | 任意，**但 64-bit 供 TS 建構**；本機預設 32-bit（可） |
| 編輯器 | VS Code（推薦） |
| Obsidian | 桌面版（給 ① 共享大腦用） |
| 網路 | 可出站（GitHub、Mistral Studio API、Cloudflare/Supabase 可選） |

> Git 推 GitHub 時，**請用背景 PTY 模式**（`terminal(..., background=true, pty=true)`），否則認證視窗不會被讀取。

---

## 步驟 1：克隆 repo 與切換分支

```bat
cd C:\Users\Administrator\Documents\Project
git clone --depth 1 https://github.com/DingJun1028/Omniesggo.git
cd Omniesggo

:: 把目標分支抓進本地（深度 80，足夠）
git fetch origin feature/oesg-esg-swarm-soul-d --depth 80
git checkout feature/oesg-esg-swarm-soul-d

:: 確認
git log --oneline -6
git status
```

期待輸出：6 個 commits（含 `aba546792 docs(omni-note)...`、`e952b10cc feat(smart-ai-router)...`、`300243221 feat(omni-note)...` 等）。

---

## 步驟 2：安裝 Python（準繩）

OmniNote 與 `apps/omni-note` **只用標準庫**（`json / hashlib / pathlib / datetime`），**不需要 pip**。

```bat
python --version          :: 應顯示 3.11+，例如 3.14.9
python -c "import omni_note; print(omni_note.__file__)"   :: 只有你本機有此模組時才會顯示路徑
```

### esg-swarm 所需的 `mistralai` （選填但推薦）

`apps/esg-swarm/` 需要 `mistralai`；本機**沒有** pip 環境。已經裝好：

```
C:\Users\Administrator\Documents\Project\mistral-workflows\.venv\Scripts\python.exe
```

各個 esg-swarm 腳本直接用這個 Python 跑。

---

## 步驟 3：（選）安裝 64-bit Node 做 TS 建構驗證

本機預設是 **32-bit node**，`tsc` / `vitest` / `pnpm` 的 **原生 ia32 二進位缺失**，所以 **TS 改動本地無法建構**——這是專案限制，不是你的錯。

### 找出 64-bit node

```
C:\Users\Administrator\AppData\Local\hermes\tools\node-26.12.1-win32-x64\node.exe
```

### 如何用

- **避免用 git-bash 啟動 64-bit npm**（本機上 `npm` 自 git-bash 呼叫會壞）。
- 用 **命令提示字元（cmd.exe）** 直接連 `node.exe`：
  ```
  C:\Users\Administrator\AppData\Local\hermes\tools\node-26.12.1-win32-x64\node.exe --version
  ```
- TS 檔案（`OMNiAgent.ts`、`shared-memory.ts`）可在**文字編輯器**裡看型別；真正建構請用 CI。

> 若要完整本地驗 TS，可用 64-bit node 外部 toolchain，但本機 `pnpm` 全域套安裝仍有衝突（`apps/omnilive` vs `apps/omnlive` 同名 → `EDUPLICATEWORKSPACE`），**屬現有 repo 問題，非本次作業**。

---

## 步驟 4：Obsidian 共享大腦設置

這是 ① 的骨幹，含 obsidian-git 插件（已進 git 追蹤）。

1. **安裝 Obsidian 桌面版**。
2. **開啟 `docs/vault-canon/` 作為 vault**。
3. 檢查 `.obsidian/`（已在 git 追蹤）：
   - `obsidian-git` 插件（v2.39.0）已安裝與 **啟用**（`community-plugins.json` 列出）。
   - `sync`、`file-explorer`、`backlink`、`graph`、`daily-notes` 等核心插件已啟用。
4. **obsidian-git：電腦端**（Windows + Obsidian）
   - 開發前先 `Obsidian Git: Pull`（先拉後寫，避免衝突）。
   - 編輯範圍限定 `docs/vault-canon/` 筆記；**不改** `soul.md`、`docs/OMN-PRD-001.md`、`shared/prd-matrix.json` 與任何程式碼。
   - 結束編輯 → commit（訊息前綴 `docs(vault-canon):`）→ push。
5. **手機端**（Obsidian Git 行動版 / Working Copy）
   - 前置 Sync-backend boundary：`docs/vault-canon/` 永遠只走 `obsidian-git`（git）；`ob`（Obsidian Sync）只用於另一個獨立的非共享 vault；詳見 `docs/OBSIDIAN-SYNC-BACKEND-BOUNDARY.md`。

   - `.git` 資料夾**嚴禁放進 iCloud**（會產生 `.icloud` / 衝突副本，足以損毀 git 歷史）。
   - iCloud 只放不帶 `.git` 的筆記匯出副本，二者不可混放。

---

## 步驟 5：Mistral API key

所有 Mistral 存 `MISTRAL_API_KEY`（`mstrl_…` 型式 45 字元），**不進 repo**。

```bat
copy C:\Users\Administrator\Documents\Project\mistral-workflows\.env C:\Users\Administrator\Documents\Project\Omniesggo\apps\esg-swarm\.env.local
```

- `mistral-workflows/.env` — Mistral Workflows runtime chche
- `apps/esg-swarm/.env.local` — esg-swarm，`.gitignore` 已忽略，不走版本控制

驗證金鑰可猜：

```bat
python apps/esg-swarm/trigger_cloud.py --demo
```

（見步驟 7）

---

## 步驟 6：跑 OmniNote（本地完整驗證）

```bat
cd C:\Users\Administrator\Documents\Project\Omniesggo

:: 完整 7 步 demo（三端點同步 + 衝突偵測 + 共享記憶彙整）
python apps/omni-note/run_demo.py
```

期望：`conflict ... 雙方皆修改` 與 4 筆共享記憶彙整筆（`sm-主題-demo`、`sm-主題-summary-demo`）。

### CLI 操作

```bat
python -m omni_note.cli status  --hub ./hub
python -m omni_note.cli new     --title "議題" --body "內容" --endpoint desktop --hub ./hub
python -m omni_note.cli sync    --endpoint desktop --hub ./hub --store ./desktop
python -m omni_note.cli ingest  --hub ./hub --file shared-memory.json
```

### 7 個檔案一覽

| 檔 | 職責 |
|---|---|
| `omni_note/note.py` | `OmniNote` 模型（`source_origin` / `content_hash` / `base_hash`，5T 自描述） |
| `omni_note/store.py` | 本端 `NoteStore`（每筆一 `.md` + `state.json` 索引） |
| `omni_note/sync.py` | `SyncEngine` 三向 3-way merge（push/pull/衝突 + `events.jsonl`） |
| `omni_note/hermes_bridge.py` | HermesBridge：唯讀 vault-canon / 寫報告 / 禁區不寫 |
| `omni_note/ingest.py` | `SharedMemoryIngest`：多代理共享記憶層 snapshot → 彙整 + 摘要筆記 |
| `omni_note/cli.py` | CLI：`status` / `sync` / `new` / `ingest` |
| `run_demo.py` | 完整 7 步驗 |

---

## 步驟 7：跑 esg-swarm 產品級 swarm（cloud verified）

**cloud overall = 82**（E85 / S85 / G75），由 `apps/esg-swarm/` 定義。

```bat
cd C:\Users\Administrator\Documents\Project\Omniesggo

:: 用 dev venv Python（含 mistralai）
"C:\Users\Administrator\Documents\Project\mistral-workflows\.venv\Scripts\python.exe" \
  apps/esg-swarm/trigger_cloud.py --demo
```

期望：`overall 82`。若要本地測，不用 cloud：

```bat
"C:\Users\Administrator\Documents\Project\mistral-workflows\.venv\Scripts\python.exe" apps/esg-swarm/run_local.py
```

---

## 步驟 8：OMNiAgent 與多代理共享記憶層（TS，需 CI）

該兩檔已寫（`smart-ai-router/index.ts` 已 export 共享記憶層），**LSP 0 錯**，但 **32-bit node 擋 `tsc`/`vitest`**——所以：

- 本地 **只能看型別**、**不能本地建構**。
- 需在 **64-bit node / CI** 執行 `tsc --noEmit` / `vitest`。
- 若本地想最小驗，可用 64-bit node 外部 toolchain，但本機 `pnpm` 本地安裝有衝突（見步驟 3 注意）。

## 步驟 9：發 PR（可選）

本機已無 `gh` CLI。推薦：

```bat
git push origin feature/oesg-esg-swarm-soul-d
```

按 GitHub 一鍵建 PR：

```
https://github.com/DingJun1028/Omniesggo/pull/new/feature/oesg-esg-swarm-soul-d
```

或安裝 `gh` CLI（需 64-bit node + 許可）後：

```bat
gh auth login
gh pr create --base main --head feature/oesg-esg-swarm-soul-d --title "..." --body "..."
```

---

## 步驟 10：CI 驗證清單

本地 **無法** 完整建構的雙方，需 CI 跑：

```
pnpm run typecheck   :: omni-arch 與 smart-ai-router 的 TS
pnpm run test        :: 任何 vitest
pnpm run check       :: lint / 品質閘
```

| 組件 | 本地狀態 | 需 CI 驗 |
|---|---|---|
| `apps/omni-note/`（Python） | ✅ 完整本地跑 | 否 |
| `apps/esg-swarm/` | ✅ cloud verified 82 | 否 |
| OMNiAgent.ts + shared-memory.ts | ⚠️ LSP 0 錯，無法 `tsc`（32-bit） | ✅ |
| soul.md §D / vault-canon | ✅ 本地檔案檢查 | 否 |

---

## 常見問題

**Q：本機 clone 能不能 `tsc`？**
A：不能。32-bit node 缺 ia32 原生二進位。把 TS 檔給 64-bit node / CI 檢；本機只驗 Python（OmniNote）與已有邏輯。

**Q：`.obsidian` 為什麼進 git？**
A：本 repo 把 vault 配置（含 obsidian-git 插件選項）納入版本控制；而 `workspace.json` 與 `workspace-mobile.json` 因人機差異被 `.gitignore` 忽略。

**Q：`hub` / `store` 跟 `docs/vault-canon` 的關係？**
A：`docs/vault-canon` 是**共享正典**（Git 骨幹）；`apps/omni-note` 另有一套**筆記模型 + 三向 merge** 層，可作為它上的相容介面。兩者都以 `docs/vault-canon` 為共享大腦的上層。

**Q：Hermes 能不能寫？**
A：能，但**只寫自己的報告筆記**（檔名含日期 + `source_origin=hermes`）；**不能寫** `soul.md` / `OMN-PRD-001.md` / `shared/prd-matrix.json`。這由 `HermesBridge` 強制。

---

## 兩周更新回顧（本指南依據）

本指南的依據是 repo 222 筆提交（2026-10-19→11-02）：~70% CI / lockfile / 品質閘維護、~30% 實質建設（soul 教義 → 12-arch TS 契約 → OmniHive/OmniProphet → Mistral Workflows → OmniNote）。相關文檔：

- `docs/soul.md`（§D 血脈更新 v2026-11）
- `docs/vault-canon/OBSIDIAN-SHARED-BRAIN-SYNC.md`
- `apps/esg-swarm/SYSTEM.md`
- `tools/capability-explorer/`
