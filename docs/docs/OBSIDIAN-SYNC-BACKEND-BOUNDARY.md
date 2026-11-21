# OBSIDIAN Sync 後端邊界（Back-end Boundary）

> **對齊**：`docs/vault-canon/OBSIDIAN-SHARED-BRAIN-SYNC.md`（canon）· `docs/soul.md` §1.1 5T（Traceable / Trustworthy / Transparent）  
> **用途**：釐清 **Observion Git 插件**（`obsidian-git`，**git 同步**）與 **Obsidian Headless`ob`（Obsidian Sync**，**雲端同步**）兩套同步路徑，防止錯誤地把同一個 vault 交給兩套系統，導致版本衝突、`vault-canon` 被污染。

---

## 問題

`obsidian-git` 與 `ob`（Obsidian Headless）都是「把 vault 拉到本機並寫回」的同歩器。若同時把它們指到**同一個 vault 目錄**（如 `docs/vault-canon`），會發生：

- 兩邊同時寫 `*.md` → **合併衝突**（git 衝突 + obsidian-sync 版本雜亂）。
- `vault-canon` 內檔案出現非臆造/重複內容（違反 **無幻覺** 與 **全寫 git 溯源**）。
- 共享大腦的記憶與報告檔（`source_origin`、`content_hash`、`base_hash`）被篡改，難以審計。

---

## 邊界規定（Rules）

| 項目 | `docs/vault-canon/`（共享大腦） | `ob` / Obsidian Sync |
|---|---|---|
| **要走的同步** | **obsidian-git**（git → GitHub repo） | —（禁止寫入此區） |
| **本機路徑** | `C:\...\Omniesggo\docs\vault-canon`（或 repo 根後僅編輯此目錄） | **另設一個獨立 vault 目錄**（不含 `vault-canon`） |
| **寫入權限** | obsidian-git push / 手動 git commit | 無（read-only on vault-canon） |
| `soul.md` / `OMN-PRD-001.md` 等禁區 | **絕不以任何同步器寫入** | 同上 |

> 鐵則：**共享大腦永遠只由 git 決定來去；`ob` 只用於一個獨立、非共享的額外 vault。**

---

## 設定方式

### 電腦端（obsidian-git）
1. Obsidian 開啟 `docs/vault-canon` 為 vault。
2. 插件 `obsidian-git` 已啟用（`community-plugins.json`），即可 `Obsidian Git: Pull` → 編輯 → commit（`docs(vault-canon):` prefix）→ push。
3. 禁區（`soul.md`、`OMN-PRD-001.md`、`shared/prd-matrix.json`、程式碼）**絕不編輯**。

### Hermes 端（ob / Obsidian Sync）
- 若要使用 `ob`（headless sync），**必須建立／指定一個不含 `vault-canon` 的獨立 vault**。
- 確認 `ob sync-list-local` 中**沒有** `docs/vault-canon`；若誤列，`ob sync-config` 或移動該 vault 目錄。
- `ob` 所寫的任何筆記都必須走 git（`obsidian-git`）或標記 `source_origin=hermes` 並接受人工審核——**不得直接寫入 `vault-canon`**。

### 若已誤觸：
1. 立刻 `git status`；取出 `docs/vault-canon` 的乾淨祖先。
2. 只保留由 `obsidian-git` 產出的檔案；刪除/還原 `ob` 寫入的雜質。
3. 重新同步，保持 `vault-canon` 只由 git 來去。

---

## 5T 驗證

| 5T | 落實方式 |
|---|---|
| **Traceable** | `vault-canon` 所有筆記皆由 git commit 產生，`source_origin`、`content_hash`、`base_hash` 可溯源 |
| **Trustworthy** | `vault-canon` 禁止 `ob` 寫入；任何非 git 來源的變更都會被擋與清理 |
| **Transparent** | 同步路徑在本檔與 `USERSETUP-FRESHINSTALL.md` 中開源說明 |
| **Trackable** | `obsidian-git` 的 git 歷史 + `events.jsonl` 完整記錄 |
| **Tangible** | `vault-canon` 只剩 git 產出的純 `*.md`，目錄結構清晰 |

---

## 驗證（本地）

```bat
:: 1) 確認 vault-canon 是否出現在 ob 的 sync 清單（不應該出現）
ob sync-list-local

:: 2) 確認本機 git 可正常推（僅 obsidian-git 端）
git -C docs\vault-canon status
```

> 備註：此檔為**規範**（`vault-canon` 6 筆 + 共享大腦架構外的輔助文件），不含每日提交狀態；每日狀態寫在 `docs/vault-canon` 人工筆記（僅讀）或 `apps/esg-swarm` 產出中。
