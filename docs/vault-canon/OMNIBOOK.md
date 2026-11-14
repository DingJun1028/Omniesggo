# 萬能聖典 OmniBook

> **版本**：v1.1.0（內容增修版）｜**發布**：2026-11-12｜**定位**：Omniesggo 總綱性聖典
>
> 2026-11-08 使用者定義本聖典之三重角色：專案正典文件、跨對話代理手冊、知識庫總綱；並裁決採「最佳實踐版本」之版本管理。

## 版本迭代機制（最佳實踐版本）

- **語義化版本**：MAJOR（角色或總綱結構變更）.MINOR（實質內容增修）.PATCH（勘誤與連結修復）。
- **版本沿革**：每次改版必須更新本檔尾部「版本沿革」表。
- **歷程封存**：每次改版將當時全文快照存至 `omnibook/versions/OMNIBOOK-vX.Y.Z.md`，確保「最新版」與「過往版本歷程」並存；git 提交歷史為最終權威後盾。
- **改版程序**：任何修訂一律走功能分支 + PR + CI 全綠後 squash 合併（與專案既有慣例一致），不得直推 main。

---

## 第一重角色：專案正典文件（總綱）

### 1. 專案定位

Omniesggo（DingJun1028/Omniesggo）為 pnpm workspace monorepo（TypeScript），目標撐起「10大萬能系統」平台。首要開發主線為 12大萬能架構、OESG 碳路線圖與 OmniNote 筆記系統。

### 2. 技術棧與政策決策（正典，代理不得違反）

| 決策 | 內容 |
| --- | --- |
| 資料層 | 全面 Supabase（Prisma 僅餘相容層 `src/lib/db/prisma-compat.ts`），不新增 Prisma 依賴 |
| De-Google | Google/Gemini/Firebase 全面禁用；AI 推論自架 Ollama（qwen2.5:14b / nomic-embed-text）＋ OpenRouter/Groq fallback |
| 驗證契約 | Zod 已全量遷移 TypeBox（@sinclair/typebox）；注意 Value.Check 不套用 default 之語義落差 |
| CSS | tailwindcss 維持 3.x（learning-center ignore major） |
| express | root override `express: >=4.21.2 <5` |
| MCP | tzin 契約式唯讀閘道（apps/mcp-gateway），僅私有網路部署 |
| CI 環境 | Node >= 22.13（node:sqlite）；pnpm 已演進為 12.16.1（root packageManager 為權威，本地安裝以 `corepack enable` 依 repo 自取版本，勿釘舊版 11.5.2） |

### 3. 架構地圖

- **@esggo/omni-core**：R1 深凍結、R2 出口封裝、R3 熵帳、R4 冪等重放、R5 分裂快照、R6 預取閘門、R7 學習閉環；Trust Label 契約（trustScore/trustGate）。
- **@esggo/omni-arch**：12大萬能模組（四大維度 × 各三）＋ OmniArch/OmniEngine/OmniTheme/OmniSeed/OmniUserRegistry ＋ OmniHeart × OmniBrain 頂層編排 ＋ OmniHive 全知蜂巢競標 ＋ OmniProphet 先知矩陣多重宇宙 ＋ Tri-Mode 千面化身 ＋ 工具權限 × Trust Label 雙閘。正典：`OMNI-ARCH-12-MODULES.md`。
- **OESG 五站路線圖（2026-11-10 全線通車）**：Pulse（碳排脈動）→ Report（報告生成）→ Audit（漂綠稽核）→ Exchange（減量額度掛牌）→ DAO（額度治理交割/註銷）五站全數落地（DAO 為 PR #216，雙花攔截、attestationHash 七方關聯鎖；測試含五站真實管線閉環 Pulse→DAO 單批驗證）。各站復用 12大萬能模組管線，Supabase sink 對應專用資料表（RLS 僅 service_role）。
- **apps/mcp-gateway**（tzin 0.5.0）：rag_search、query_agent ask/search、bus_events、hive_awards 唯讀契約端點；缺憑證一律 503 優雅降級。
- **RAG 向量層**：src/lib/rag（Weaviate 物件 ID 確定性 UUID、Ollama 嵌入、ownerId 強制過濾）；Weaviate Cloud 免費沙箱為現行資料層（GraphQL 須於 2027-05-01 前遷移，見 WCD 生命週期記錄）。契約測試之 mock 佇列須與實際 fetch 次序對齊（404→POST 建類別路徑為 4 次 fetch），錯位假紅已由 PR #219 修復。
- **OmniNote**：零算力 Ollama 本機回環、TypeBox 契約、Block-CRDT、5T 治理、數據氣密艙隱私承諾（向量資料不出本機）。

### 4. 品質治理與 CI/CD 體系（四層）

1. 硬閘門：CI Green Gate（PR 權威彙總）、TS Matrix 棘輪（drift 歸零）、Schema Traceability、Soul Lineage 血脈鎖、Sonar 品質閘（token 式 sonar-quality-gate 為權威；Automatic Analysis 之 cancelled 屬既有現象）、Security Audit 週審。
2. 自動修復：OA-TWINS Auto-Repair 八類錯誤自動修復。
3. 組裝鑄造：OmniFactory、GHCR、Sacred Pipeline、Cloudflare Pages、Oracle VPS 部署。
4. 派遣運維：AutoSwarm 多代理協調、vibe-ci-monitor（自架 worker 部署中）。

---

## 第二重角色：跨對話代理手冊

### 1. 運作原則（多代理公約）

- 開 PR 前先查核分支最新提交（多代理併行協同頻繁）；動作前於 issue #91 留言認領，完成後回報結案。
- CI 全綠（Green Gate success 為權威；Kilo action_required 屬白名單豁免、CodeRabbit neutral 可接受）且 mergeable_state clean 後方可 squash 合併；一律 squash，不直接推 main。
- 他代理進行中之工作（活躍分支/PR）不得代為開 PR 或合併，留原代理處理。
- 共享大腦區讀寫規則見 `AGENT-SHARED-KNOWLEDGE.md`；AUTO-GENERATED 禁手改，敏感值永不寫入。

### 2. 標準修法（實證收斂，遇同型問題直接套用）

- **lockfile 衝突**：推一次性 lockfile-sync.yml 工作流（paths 自身、pnpm install --no-frozen-lockfile、bot commit 推回、自刪）。
- **分支與 main 衝突**：branch-sync 工作流（git merge origin/main -X ours → 重生 lockfile → push）；bot 推送後 pull_request 工作流轉 action_required 屬審批機制，以 push_files 重推既有檔同內容解鎖。
- **Dependabot 誤解 overrides**：root pnpm override 覆寫 direct spec 時 Dependabot 會反覆開 lockfile-only PR，可比照 express 政策衝突結案。
- **Sonar 品質閘**：失敗必先取 issue 明細（token 查 API）再修，勿盲目假說迭代；pollGate 競態已由 --settle 安定窗口修復。
- **TS Matrix drift**：本地改名（前綴消歧）＋ `export type { 新名 as 原名 }` 相容別名（PR #96 慣例）。

### 3. 高頻陷阱摘要

- packages/* node16/nodenext：跨根相對匯入必須 .js 副檔名；oa-framework rootDir 限制禁匯入根 src/。
- PR CI 綠不等於 main 綠：deploy.yml 僅 on push main 跑全量測試，套件/lockfile 變更會喚醒潛伏缺口。
- Dockerfile 必須 USER node（S6471 以 VULNERABILITY 計入 rating）。
- 工作流 YAML：run 區塊 heredoc 本體必須帶區塊縮進；${{ }} 與 shell ${...} 勿被轉義；手抄 base64 不可靠，本地產生並比對長度。
- 開分支後必以 create_branch 回傳之 sha 重抓 raw 檔核對基底（main lockfile 演進快）。
- 舊 head 之紅燈會殘留 pipeline UI：判讀一律以 PR head 最新 check runs 為準。

### 4. 憑證與安全（氣密艙原則）

- 憑證明文永不寫入知識庫、對話或倉庫；僅存聖櫃實體（Supabase public.vault_secrets service role、VPS .env.secrets 600）與 GitHub Actions Secrets（唯寫）。
- 交接一律走 OneTimeSecret（v2 兩段式 reveal，首次回應原樣落盤）；程序見 scripts/ots-vault-handoff.ts 與輪替作業手冊。
- 90 日輪替查核：權威為 vault_secrets updated_at（75 日提醒、90 日逾期）。
- probe 分支報告僅寫布林值與指紋是否相符，凡新生成憑證明文永不 commit；公開倉庫環境尤須警惕。

---

## 第三重角色：知識庫總綱

### 1. vault-canon 正典索引（本倉庫內）

| 聖典 | 內容 |
| --- | --- |
| 12大萬能 OMNI-CANON.md | 12大萬能架構總綱 |
| OMNI-ARCH-12-MODULES.md | omni-arch 契約正典 |
| Omniesggo 解說聖典.md | 專案解說全集 |
| OMN-PRD-001 終始矩陣.md／SCHEMA-TRACEABILITY.md | PRD 與 schema 需求追溯 |
| 5T Protocol.md | Traceable/Trackable/Tangible/Transparent/Trustworthy 治理 |
| ESG GO Sacred Pipeline CI-CD.md | 神聖管線 |
| RAG-VECTOR-LAYER.md | 向量層設計 |
| AGENT-SHARED-KNOWLEDGE.md | 共享大腦區與多代理協議 |
| OBSIDIAN-SHARED-BRAIN-SYNC.md | Obsidian 共享大腦同步 |
| VIBE-CLI-INTEGRATION.md | Vibe CLI 接入設計 |
| 萬能永憶主體 JunAiKey.md | 永憶主體 |
| 創世實錄 — 萬能開發 奧義 v2026-10.md | 開發奧義 |

### 2. 代理私有知識主題（跨對話延續，不入倉庫）

代理之個人知識庫承載跨對話脈絡，主題含：Omniesggo 專案決策與事故史、Jun.Ai.Key 萬能元鑰（憑證後設索引，僅指紋）、萬能知識分身授權、12大萬能架構藍圖、OmniNote Unified、以及其他業務主題。敏感資料依氣密艙原則永不入庫；本聖典僅登載主題名稱，詳細內容由各代理於其知識庫維護。

### 3. 已知外部阻塞（即時快照，代理接手時先驗證）

- VPS 斷聯（2026-11-06 起，2026-11-10 定案診斷）：161.118.248.180 全埠 TCP 逾時，主機層斷聯，高度疑 Oracle Cloud Always Free 個體閒置回收。OCI API 憑證 MISMATCH：私鑰推導公鑰指紋 `bc1c688c393fa5a47d6a44d585d4b897` 與 secrets.OCI_API_FINGERPRINT 不符，需使用者於 OCI Console 重新簽發 API Signing Key 並同步 OCI_API_KEY／OCI_API_FINGERPRINT（必要時核對 OCI_USER_OCID）。修復工作流 fix/hermes-serve-recovery 已備 workflow_dispatch（v10），憑證到位即可執行；Deploy to Oracle VPS 於 main 恆紅屬此事故既有紅燈，非倉庫回歸，issue #179 追蹤。
- Weaviate Cloud：待使用者註冊沙箱並交付 WEAVIATE_URL／WEAVIATE_API_KEY，驗證工具 verify-weaviate-cloud.mjs 已備。
- main 0f42bd94（PR #219 合併）推送 CI 已全綠結案（16 run 中 15 success，唯一 failure 即上述 VPS 既有紅燈）。

---

## 版本沿革

| 版本 | 日期 | 摘要 |
| --- | --- | --- |
| v1.0.0 | 2026-11-10 | 創始版：確立三重角色、版本迭代機制（最佳實踐版本）、技術棧政策正典、架構地圖、代理手冊、知識庫總綱。 |
| v1.1.0 | 2026-11-12 | 內容增修：OESG 五站路線圖全線通車（DAO 落地，PR #216）；CI 環境 pnpm 演進更正為 12.16.1（packageManager 為權威）；RAG mock 佇列錯位假紅修復入向量層條目（PR #219）；外部阻塞快照更新（VPS 定案診斷、OCI 指紋 MISMATCH、main 0f42bd94 全綠結案）。 |
