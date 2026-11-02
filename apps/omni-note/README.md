# OmniNote 萬能筆記 — Obsidian 共享大腦三向同步

> 對齊：`docs/vault-canon/OBSIDIAN-SHARED-BRAIN-SYNC.md` + `docs/soul.md` §1.1 5T、§六永憶聖所、§七多代理共同記憶。

把 **電腦（桌面 Obsidian）／ 手機（Obsidian Git 行動版）／ Hermes（OmniAgent）** 三端，透過共享 hub（對應 repo 的 `docs/vault-canon` 共享大腦區）做 **3-way merge 同步**，並把 **多代理共享記憶層** 的記憶彙整成筆記。

## 架構

```
        ┌──────────┐   push/pull   ┌─────────────┐   push/pull   ┌──────────┐
        │  電腦     │◄────────────►│   hub        │◄────────────►│  手機     │
        │ desktop  │  3-way merge  │ (共享正典)   │  3-way merge  │  phone   │
        └────┬─────┘               └──────┬──────┘               └──────────┘
             │ Hermes 橋接（唯讀 vault-canon / 寫報告）          ▲
             └────────────► hub ◄──────── 多代理共享記憶彙整 ────┘
                              │
                    source_origin 溯源 + content_hash 防竄改
```

## 模組

| 檔 | 職責 |
|---|---|
| `omni_note/note.py` | `OmniNote` 資料模型（id/title/body/endpoint/source_origin/content_hash/base_hash）+ 5T 自描述 |
| `omni_note/store.py` | 本機 `NoteStore`（每筆一 `.md` + `state.json` 索引） |
| `omni_note/sync.py` | `SyncEngine` — 三向 3-way merge（push/pull/conflict 偵測 + events.jsonl） |
| `omni_note/hermes_bridge.py` | `HermesBridge` — OmniAgent 依 canon 權限讀 vault-canon / 寫報告 |
| `omni_note/ingest.py` | `SharedMemoryIngest` — 多代理共享記憶層 → 彙整 + 摘要筆記 |
| `omni_note/cli.py` | 命令列：`status` / `sync` / `new` / `ingest` |

## 三向同步（3-way merge）

以**端點上次同步 hash**（base）為合併基準：

- 只有一端變 → 單向 push / pull。
- 兩端皆變且 hash 不同 → **衝突**（保留兩版 + 標記，待人工合併）。
- 兩端皆變且 hash 相同 → 已收斂，無衝突。

## 使用

```bash
# 跑完整 demo（建三端點 + 同步 + 衝突 + 共享記憶彙整）
python apps/omni-note/run_demo.py

# CLI
python -m omni_note.cli status  --hub ./hub
python -m omni_note.cli sync    --endpoint desktop --hub ./hub --store ./desktop
python -m omni_note.cli new     --title "議題" --body "內容" --endpoint hermes --hub ./hub
python -m omni_note.cli ingest  --hub ./hub --file shared-memory.json   # 吃 SharedMemoryLayer snapshot
```

## 5T 對齊

- **Traceable**：每筆 `source_origin = omninote://<endpoint>/<id>`。
- **Trackable**：每次同步事件寫 `events.jsonl`。
- **Tangible**：每筆 `.md` 可讀、衝突標記可見。
- **Transparent**：同步邏輯全開源。
- **Trustworthy**：`content_hash` + `base_hash` 3-way merge 決定期權；禁區（soul.md / OMN-PRD-001）Hermes 不得寫。

## 與既有系統的關係

- 共享大腦區沿用 canon 的 `docs/vault-canon/`（git 為同步骨幹）；OmniNote 是其上的**筆記模型 + 三向 merge + 多代理彙整**層。
- 多代理共享記憶層（`agents/skills/smart-ai-router/shared-memory.ts`）的 snapshot 經 `SharedMemoryIngest` 落為 OmniNote，再經三向同步分發到三端。

## Obsidian Git 插件（多平台 GitHub 同步）

==OmniNote 共享大腦的“電腦／手機”同步骨幹==。`obsidian-git` 社群插件（v2.39.0）已安裝＋啟用在 `.obsidian/plugins/`、`community-plugins.json` 中。

### 你的裝置上要做的三件事

1. **電腦（Windows + Obsidian）**：開啟 `docs/vault-canon` 為 vault；
   - 開發前先 `Obsidian Git: Pull`（先拉後寫，避免衝突）；
   - 編輯範圍限定 `docs/vault-canon/` 筆記；結束後 commit（訊息前綴 `docs(vault-canon):`）→ push。
2. **手機（Obsidian Git 行動版 / Working Copy）**：先 pull 後 push，與電腦共用同一個 GitHub repo。
3. **Hermes（OmniAgent）**：唯讀 `docs/vault-canon` 人工筆記；僅新增自己的報告筆記（檔名含日期 + `source_origin=hermes`）；禁區 `soul.md` / `OMN-PRD-001` 絕不寫。

### 權限與安全

- 桌面 Git 插件需 GitHub PAT，**僅授予本 repo 存取**（最小權限），不進 repo。
- `.git` 資料夾嚴禁放入 iCloud（會損毀 git 歷史）；iCloud 只放不帶 `.git` 的筆記匯出。
- 所有寫入走 git 提交，禁止繞過版本控制；OmnNote 凡經 `SyncEngine`/`SharedMemoryIngest` 產出的筆記自帶 `content_hash` + `source_origin`（Trustworthy / Traceable）。

## 與既有系統的關係

