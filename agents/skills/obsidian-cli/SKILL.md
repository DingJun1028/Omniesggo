---
name: obsidian-cli
description: "Obsidian 共享大腦三向同步與 omni-agent 整合指引。包含 obsidian-headless CLI、電腦/手機/Hermes 三向同步，以及萬能筆記 OmniNote 與 OmniAgent 整合。"
version: 1.0.0
author: Hermes Agent (DingJun1028)
license: AGPL-3.0
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [obsidian, vault-sync, headless-cli, ob, omniagent, shared-brain, multi-agent, sync]
---

# Obsidian CLI（headless）

> 萬能筆記 OmniNote：Obsidian 共享大腦（電腦／手機／Hermes）三向同步與 OmniAgent 整合指引。

---

## 1. 何謂 Obsidian CLI（headless）

`obsidian-headless` 是 Obsidian Sync 的無桌面命令列用戶端，用於：
- 沒有桌面程式時，透過命令列同步 Obsidian vault（CI、伺服器、排程）。
- 將本地檔案庫與 Obsidian Sync 遠端同步。
- 查詢 / 讀取 / 還原 vault 版本記錄。
- 替代或補充「Obsidian Git 插件」的多平台 git 同步。

> 注意：它**不是** GitHub 的 `github-sync` 插件。這裡的同步是 Obsidian Sync 雲端同步，不是 git。

---

## 2. 安裝（可重複執行，已在本機驗證）

本機機器的 git-bash 内建 `npm` 無法正確解析路徑；請直接以 64 位元 Node 執行 npm CLI。

```bat
# 1. 確定 Node.js >= 22
node --version

# 2. 全域安裝 obsidian-headless
node node_modules\npm\bin\npm-cli.js install -g obsidian-headless

# 3. 驗證安裝
node node_modules\npm\bin\npm-cli.js ls -g --depth=0
ob --version          # 應回傳 0.0.14
```

> 替代方案：直接以 `node` 執行 npm CLI（無須像 `npm` 那樣經由 bash 解析）：
> `node node_modules\npm\bin\npm-cli.js install -g obsidian-headless`

---

## 3. 與 Obsidian Git 插件的關係

- **Obsidian Git 插件**（`obsidian-git` 2.39.0，已啓用）是主要的多平台 git 同步（電腦／手機／hermes），`docs/vault-canon` 作為共享大腦。
- **Obsidian Headless CLI**（`ob`）為另一種基於 Obsidian Sync 的同步方式。走雲端、可選 E2EE，適合無桌面程式的自動化。
- 兩者不可對同一 vault 重複啓用。選擇一套同步底層即可。
  - 桌面 + 手機，靠穩可靠：用 Obsidian Git 插件。
  - 伺服器 / CI / 無桌面：用 `ob` headless。

---

## 4. 操作流程

1. `ob login` — 登入/顯示登入狀態（需要 Obsidian Sync 帳號與訂閱）。
2. `ob sync-list-remote` — 列出可用的遠端 vaults。
3. `ob sync-setup --vault "<vault 名稱>" --path "<本地資料夾>" [--password] [--device-name "<name>"]`
4. `ob sync`（單次）或 `ob sync --continuous`（持續監聽變動）。
5. `ob sync-config` / `ob sync-status` 檢查設定與狀態。

---

## 5. 主要命令

| 目的 | 指令 |
| --- | --- |
| 登入 | `ob login` |
| 列出可用遠端 | `ob sync-list-remote` |
| 列出本機 | `ob sync-list-local` |
| 建立遠端 vault | `ob sync-create-remote --name "..." --encryption standard --password "..."` |
| 配置本地 vault | `ob sync-setup --vault "..." --path "..." [--password] [--device-name "..."]` |
| 單次 / 持續同步 | `ob sync` / `ob sync --continuous` |
| 檢查設定 / 狀態 | `ob sync-config` / `ob sync-status` |
| 歷史 / 讀 / 還原 | `ob sync:history path="..."`, `ob sync:read path="..." version=3`, `ob sync:restore path="..." version=3` |

---

## 6. 電腦／手機／Hermes 三向同步

對應 **萬能筆記 OmniNote** 的三向同步架構：

```
        ┌──────────┐   push/pull   ┌─────────────┐   push/pull   ┌──────────┐
        │  電腦     │◄────────────►│   hub        │◄────────────►│  手機     │
        │ desktop  │  3-way merge  │ (共享正典)   │  3-way merge  │  phone   │
        └────┬─────┘               └──────┬──────┘               └──────────┘
             │ Hermes bridge（唯讀 vault-canon / 寫報告）          ▲
             └────────────► hub ◄──────── 多代理共享記憶  ────│
                              │
                    source_origin 溯源 + content_hash 防竄改
```

- **電腦**：Obsidian（`docs/vault-canon`）或 OBSIDIAN-GIT 插件；本機筆記庫。
- **手機**：手機端 Obsidian（或 iCloud 輔助瀏覽）；`ob sync` 持續同步。
- **Hermes**：OmniAgent；唯讀 `docs/vault-canon` / 寫報告；`SharedMemoryLayer` 共同記憶。
- **hub**：共享正典（`docs/vault-canon`），3-way merge 後分佈到三端。

---

## 7. 電腦／手機／Hermes 共享記憶層整合

把多代理共同記憶層接入 OmniNote 的三向同步：

```python
from omni_note.ingest import SharedMemoryIngest
from omni_note.store import NoteStore

# hub = 共享正典；ingest 把共享記憶彙整成 OmniNote 筆記
ingest = SharedMemoryIngest(hub)
ingest.ingest(entries)          # 每 topic 一筆彙整 + 一筆摘要
```

### 更多細節

- `omni_note.note.OmniNote`：萬能筆記模型（`content_hash`、`base_hash`、`source_origin`）。
- `omni_note.store.NoteStore`：本機筆記儲存（每筆一 `.md` + `state.json`）。
- `omni_note.ingest.SharedMemoryIngest`：多代理共享記憶彙整。

---

## 8. 電腦／手機／Hermes 共享記憶層整合

把多代理共同記憶層接入 OmniNote 的三向同步：

```python
from omni_note.ingest import SharedMemoryIngest
from omni_note.store import NoteStore

# hub = 共享正典；ingest 把共享記憶彙整成 OmniNote 筆記
ingest = SharedMemoryIngest(hub)
ingest.ingest(entries)          # 每 topic 一筆彙整 + 一筆摘要
```

### 更多細節

- `omni_note.note.OmniNote`：萬能筆記模型（`content_hash`、`base_hash`、`source_origin`）。
- `omni_note.store.NoteStore`：本機筆記儫存（每筆一 `.md` + `state.json`）。
- `omni_note.ingest.SharedMemoryIngest`：多代理共享記憶彙整。

---

## 9. 手機（iPhone）＋ iCloud 維護

本節對應 `OBSIDIAN-SHARED-BRAIN-SYNC.md` 的 iPhone Path B，以及你之前的問題：「手機有 iCloud，要怎麼放入 iCloud 並維護？」

### 鐵則
- **`.git` 嚴禁放進 iCloud**。iCloud Drive 會產生 `.icloud` 暫存副本與同名衝突檔，足以永久損毀 git 歷史。
- `docs/vault-canon` 走 `obsidian-git`（git）；`ob` / Obsidian Sync 只能用於另一個獨立的非共享 vault。

### 兩種手機路徑
1. **路徑 A（推薦／穩定）**——手機走 obsidian-git 行動版／Working Copy，兩向同步：
   - 先 Pull → 編輯 → Commit → Push；訊息前綴 `docs(vault-canon):xxx`。
2. **路徑 B（iCloud 輔助瀏覽）**——只讀／匯出：
   - 把 `docs/vault-canon` 的純筆記匯出至 iCloud Drive 供行動閱讀（不含 `.git`）。

### 若要真走 `ob`（Obsidian Sync）到雲端
- 必須另設獨立非共享 vault；流程：`ob login` → `ob sync-list-remote` → `ob sync-setup --vault "手機 iCloud" --path "<獨立目錄>"` → `ob sync --continuous`。

---

## 10. OmniAgent 整合

### 什麼是 OmniAgent
- `agents/skills/smart-ai-router/OMNiAgent.ts`（重建版）——多代理路由器。
- 3 個核心模組：
  - `OllamaFreeCompute`（本機免算力，零 key，`/api/chat`，`AGENTIC_TWIN_OLLAMA_URL`，`AGENTIC_TWIN_OLLAMA_MODEL=qwen2.5`）；
  - `OmniAgentRegistry`（管理專區：多 agent 註冊／生命週期／意圖治理）；
  - `SharedMemoryLayer`（多代理共同記憶黑板：`publish` / `recall` / `query` / `subscribe` / 持久化 hook）。
- 對接 `SmartAIRouter`（免費雲端模型 3 級 fallback）+ `OAG` 零幻覺驗算。

### 為何納入共享大腦
- OmniAgent 傳出的每筆結果，經 `SharedMemoryLayer` `publish`，進入多代理共同記憶（`source_origin` 可溯源），再由 `hub` 分發到電腦／手機／hermes。
- 4T / 5T：Traceable（`source_origin`）· Trackable（`events.jsonl`）· Tangible（可讀 `.md` + 衝突標記）· Transparent（全開源）· Trustworthy（`content_hash` + `base_hash` 決定期權）。

---

## 11. 常見陷阱（先發現，請勿反覆踩）

1. **不要對同一 vault 兩種同步底併行啓用**：Obsidian Git 插件與 Obsidian Headless 走不同後端，混用會衝突。
2. **`.git` 不可與 iCloud 同時存在同一個資料夾**（OBSIDIAN-SHARED-BRAIN-SYNC 鐵則）。
3. **Obsidian Sync 需先登入**：`ob login` 為空代表未登入或無訂閱；`ob sync-list-remote` 空代表無權限。
4. **不要使用 git-bash 的 npm**：其路徑解析異常；直接使用 64 位元 Node 的 `node` 執行 `node_modules\npm\bin\npm-cli.js`（已於本機驗證）。
5. **注意路徑相對**：`ob sync-config` 預設目錄是當前工作目錄，不是你預期的 `C:\Program Files (x86)\nodejs`；可先 `ob sync-setup` 指定 `--path`。

---

## 12. 驗證（本機與 OmniAgent）

- `ob --version` → 0.0.14。
- `ob sync-list-remote` → `No account logged in. Run "ob login" first.`（代表指令可執行，未登入）。
- `ob sync-list-local` → `No vaults configured.`（代表指令可執行且資料夾乾淨）。
- OmniAgent：`agents/skills/smart-ai-router/OMNiAgent.ts` LSP 0 錯；`pnpm`/`tsc` 需 64-bit Node 或 CI 驗。

---

## 更新紀錄

- v0.1.0：加入手機＋iCloud 維護（iPhone Path B）與 OmniAgent 整合。
