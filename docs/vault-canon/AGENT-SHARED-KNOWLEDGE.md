# 全代理共享知識公約（Agent Shared Knowledge）

> 文件代號：AGENT-SHARED-KNOWLEDGE · 對齊：OBSIDIAN-SHARED-BRAIN-SYNC.md（共享大腦區與讀寫範圍）、soul.md §1.1 5T（Traceable/Trackable/Transparent/Trustworthy）。
> 共享區：本倉庫 `docs/vault-canon/` 為唯一共享大腦區；本文件為全代理（Hermes／OmniAgent、Vibe、Claude、其他 agent）共享知識與協調之入口文件。

## 一、目的

- 建立跨代理共享知識機制：任何代理開始工作前，先讀本文件取得全域現況，避免重複工作、分支衝突與決策矛盾。
- 所有代理之任務狀態、重大決策、阻塞事項與交接紀錄，皆以本文件及其連結之文件為唯一共享事實來源（single source of truth）。

## 二、讀寫規則

- 本文件與代理狀態檔之寫入一律走 git 提交（commit 前綴 `docs(vault-canon):`），禁止繞過版本控制改檔。
- 標記 `AUTO-GENERATED` 之檔案禁止手改，僅得經對應生成腳本重新生成。
- `soul.md`（三份副本）、`docs/OMN-PRD-001.md`、`shared/prd-matrix.json` 為禁區，完全不得寫入。
- 任何密碼、API Token、憑證、SSH 金鑰等敏感值永不寫入（Tier 2 禁存）；憑證交接一律走 OneTimeSecret 一次性連結流程（見 `scripts/ots-vault-handoff.ts` 與 issue #91 相關紀錄）。
- 狀態更新格式：每筆更新必須含 UTC 時間戳、代理標記（source_origin）、變更摘要；舊紀錄不刪除，採時間堆疊。

## 三、代理登錄（Agent Registry）

各代理於每次開始／結束工作階段時更新自身條目。

| 代理 | 範圍 | 目前任務 | 狀態 |
| --- | --- | --- | --- |
| Vibe（自主萬能知識分身） | Omniesggo 全域查核、CI 後合併、知識庫維護 | issue #91 全域推進、PR #103 合併後查核 | 活躍（2026-10-29T18:30Z） |
| Claude（issue #91 受託代理） | issue #91 第 1 項（feat/zod-to-typebox） | Zod → TypeBox 遷移；commit 1bbc503 後無新提交，尚無 PR | 待更新（2026-10-29T18:20Z 查核） |
| Hermes／OmniAgent（VPS） | 部署、監控、Vault 讀寫（依 OBSIDIAN-SHARED-BRAIN-SYNC 權限表） | hermes-serve 修復（DIN-21，阻塞待使用者 bastion） | 待更新 |

## 四、協調協議

1. 認領制：代理開始一項工作前，於本文件其條目登錄認領；已認領項目他人不得重複開工，僅得以 issue／PR 留言協調。
2. 交接制：工作階段結束或受阻時，更新狀態並載明阻塞原因與解阻塞路徑（何人、何權限、何動作）。
3. 合併慣例：CI 全綠且 mergeable_state clean 後 squash 合併；自動生成檔須經腳本重新生成驗證。
4. 衝突處理：以 main 為準；向功能分支同步 main 時留意 tsconfig plugins 區塊自動融合損毀風險（見知識教訓紀錄）。

## 五、現況快照（2026-10-29T18:30Z，由 Vibe 記錄）

- issue #91 五項升級：第 2/3/4/5 項已合併（PR #97/#98/#99/#100）；第 1 項進行中（feat/zod-to-typebox，1bbc503，尚無 PR）。
- PR #103（OTS API v2 修復）：CI 大多綠，餘 Docker Build Test、CI Green Gate 執行中；排程任務待全綠後自動 squash 合併。
- 阻塞待使用者：DIN-13（GROQ_API_KEY 寫入 repo Secrets，唯寫需使用者 gh secret set）、DIN-21／issue #90（bastion SSH 操作）。
- 不動項：esggo PR #1449（使用者指示留給其他代理）。

## 六、未驗證部分（如實聲明）

- 本公約為規範性文件，各代理實際遵循程度無法自動驗證，僅能靠 git 歷史與 issue／PR 紀錄事後追溯。
- Hermes 於 VPS 之實際存取行為未驗證（依既有限制不觸 VPS）。

## 七、回退方式

本公約為單一新檔，revert 即完全回退；不影響任何程式碼與既有文件。
