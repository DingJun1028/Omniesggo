# Obsidian 共享大腦同步指南（docs/vault-canon）

> 文件代號：OBSIDIAN-SHARED-BRAIN-SYNC · 對齊：issue #91 第 4 項、soul.md §7.5（共享大腦唯讀納入）、§1.1 5T（Traceable/Trustworthy）。
> 共享區：本倉庫 `docs/vault-canon/` 為唯一共享大腦區；其餘 `docs/` 文件不屬共享大腦。

## 一、Windows（主要編輯端）— Obsidian Git

1. 環境：Windows + Git + Obsidian + 社群插件 Obsidian Git（需 GitHub PAT，僅授予 repo 存取範圍，最小權限）。
2. Vault 位置：將本倉庫 clone 至本機儲存空間（例如 `D:\Omniesggo`），Obsidian 開啟以 `docs/vault-canon` 為 vault 根（或開 repo 根後僅編輯 `docs/vault-canon/`）。
3. 日常流程：
   - 開始編輯前：`Obsidian Git: Pull`（先拉後寫，避免衝突）。
   - 編輯範圍：僅 `docs/vault-canon/` 內之筆記；不修改 `soul.md`（三份副本）、`docs/OMN-PRD-001.md`、`shared/prd-matrix.json` 與任何程式碼。
   - 結束編輯：commit（訊息前綴 `docs(vault-canon):`）→ push。衝突時以本倉庫 main 為準手動解決後再推。
4. 自動生成檔案（檔頭標 `AUTO-GENERATED` 者，如 `OMN-PRD-001-SCHEMA-TRACEABILITY.md`）禁止手改，須由 `scripts/generate-schema-traceability.mjs` 重新生成。

## 二、iPhone — iCloud 或 Obsidian Git 行動版

路徑 A（建議）：Obsidian Git 行動版（或 Working Copy）直接對 repo 操作 — 與 Windows 同一 git 流程，唯讀瀏覽或小量編輯，先 pull 後 push。

路徑 B：iCloud 輔助瀏覽 — 將 `docs/vault-canon` 之純筆記匯出至 iCloud Drive 供行動閱讀。

### 鐵則：.git 資料夾嚴禁放入 iCloud

- iCloud Drive 會對 `.git/` 內之物件檔、索引與鎖定檔產生衝突副本（`.icloud` 暫存與同名衝突檔），足以永久損毀 git 歷史。
- 因此：含 `.git` 之 repo（工作副本）一律置於裝置本機儲存空間；iCloud 內僅允許存放不帶 `.git` 的筆記匯出副本。兩者不可混放同一資料夾。

## 三、Hermes（OmniAgent）對 docs/vault-canon 之讀寫範圍與限制

| 對象 | 權限 | 範圍 |
| --- | --- | --- |
| `docs/vault-canon/` 人工筆記 | 唯讀 | 全區可讀，禁止改寫 |
| `docs/vault-canon/` 自動生成檔（`AUTO-GENERATED`） | 讀寫（僅經生成腳本） | 僅能透過 `scripts/generate-schema-traceability.mjs` 重新生成，禁止手改內容 |
| Hermes 自身報告類文件 | 寫入 | 僅限新增獨立檔案（檔名含日期與 `source_origin` 標記） |
| `soul.md`（三份副本）、`docs/OMN-PRD-001.md`、`shared/prd-matrix.json` | 禁區 | 完全不得寫入 |
| VPS、junaikey VPS 腳本 | 不觸碰 | 本指南不涉及任何 VPS 操作 |

寫入一律走 git 提交，禁止繞過版本控制直接改檔；所有產出須可溯源（source_origin 標記）。

## 四、無法驗證／未驗證部分（如實聲明）

- 本指南之 Windows Obsidian Git 與 iPhone 流程為書面規範，未於實機逐項驗證（本 PR 為文件交付，無可執行之自動化測試）。
- Hermes／OmniAgent 於 VPS 之實際檔案存取路徑與權限未驗證（依 issue 限制不觸 VPS）；表中權限為規範性宣告，待 VPS 端另行查核。
- iCloud 衝突行為為公開已知風險之彙整，未做破壞性實測。

## 五、回退方式

本指南為單一新檔，revert 即完全回退；不影響任何程式碼與既有文件。
