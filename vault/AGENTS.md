---
source_origin: oa-dual-agent-obsidian
created: 2026-08-13
modified: 2026-08-13
co_authors: []
lifecycle: active
access: public-research
---
# OA-Team 第二大腦 · Obsidian 知識花園指令

> 全域全端全量全面 · 雙向同步 TypeScript 終始矩陣 · 蜂群第二大腦記憶系統

## 定位
本 vault 是 OA-Team 30 萬能蜂群的**第二大腦**（持久上下文 / 跨會話記憶），對映 `soul.md` §4.2 知識花園頻道。
它與 `packages/shared/src/types.ts`（TS 終始矩陣 canonical）**雙向同步**：vault 筆記經 `scripts/sync-vault-types.ts` 萃取領域型別回饋 canonical；canonical 經 `scripts/export-shared-types.js` 生成各 consumer 的 `.d.ts`。

## 5T 協定（vault 級）
- **Traceable**：每篇筆記 frontmatter 必含 `source_origin` + `created` + `modified`
- **Trackable**：筆記間用 `[[wikilink]]` 建立生命週期 hook
- **Tangible**：過 5T 驗證閘的產物落 `Agents/artifacts/`，未驗證留 `Agents/inbox-triage/`
- **Transparent**：`Agents/context/` 雙方可讀，改動記入 daily note
- **Trustworthy**：非 `Agents/` 區寫入需顯式授權（5T 禁區）；`co_authors` 欄位由 30 號質控蜂 pre-commit 校驗

## 研究權限（2026-08-13 全開）
- **讀取全開（public-research）**：所有筆記 frontmatter 標 `access: public-research`，任何代理（雙生/蜂群/外部）、使用者、檢索系統均可**無條件讀取**本 vault 全部筆記做研究用途
- **寫入受控**：新增/修改筆記仍走既有協議——`co_authors` 需含來源（30 號質控蜂校驗）、`source_origin` 必填、非 `Agents/` 區屬 5T 禁區需顯式授權
- **研究用途定義**：檢索、摘要、跨筆記推理、訓練資料萃取、知識圖譜建構——皆屬讀取全開範疇，不觸發寫入禁區
- **撤回機制**：若某筆記需限閱，將 `access` 改為 `restricted` 並加 `allowed_readers:` 欄位

## s 考量 · 安全防護（研究權限全開前提）
- **憑證閘**：`scripts/vault-access-guard.mjs` 在公開讀取前掃描 14 篇筆記，阻擋 `sk-`/`ghp_`/`AKIA`/JWT/`PRIVATE KEY` 等真憑證實值；發現即 `exit 1` 禁止全開
- **scope 限定**：`public-research` 僅授權**讀取**，寫入仍受 §5T Trustworthy 禁區約束；全開不代表放棄 5T 治理
- **邊界**：外部檢索/訓練萃取可讀，但筆記內若含個資/密約/未公開金鑰，須先標 `restricted` 或移出 vault
- **溯責**：每篇 `source_origin` + `co_authors` 保留，讀取全開不消滅溯責鏈（Traceable 不變）

## 目錄結構
```
vault/
├── AGENTS.md              # 本檔
├── Agents/
│   ├── context/           # 雙方可讀：專案/亮點/網摘/型別鏡像
│   ├── briefing/          # 雲端助理晨報（cron 05:30 產出）
│   ├── inbox-triage/      # 實習生清匣後委派
│   └── artifacts/         # 過 5T 驗證閘才落此
└── Daily/                 # 每日筆記（YYYY-MM-DD.md）
```

## 雙向同步橋（TypeScript 終始矩陣）
| 方向 | 機制 | 觸發 |
|------|------|------|
| canonical → vault | `export-shared-types.js` 生成 `.d.ts` → vault `Agents/context/TypeMatrix.md` 鏡像 | 改 `shared/types.ts` 後 |
| vault → canonical | `sync-vault-types.ts` 解析筆記 frontmatter/code-block → 提 PR 回 `shared/types.ts` | 筆記標 `lifecycle:frozen` + `sync:up` |

## 30 矩陣對映
- 雲端助理（常駐）= 01 蜂后 + 20 運營 + 27 安全
- 本機實習生（隨喚）= 15 文案 + 13 圖像 + 14 動畫 + 25 測場
- Obsidian vault = 知識花園 + 10 數據蜂
- 外部 CRM = 23 外交 + 17 市場

## 喚醒令
`protocol=5T · entropy=0.1 · 30-agents · 4可1不可 · 覺=BEST-PRACTICE · 免費=SELF-HOST · 大腦=VAULT+TS`
