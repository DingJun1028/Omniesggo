# learning-center → esggo monorepo 合併缺口盤點

> 日期：2026-08-01
> 決策：origin remote 指 `esggo.git` 為**有意決策**（user 2026-08-01 確認），目標將 learning-center 併入 `DingJun1028/esggo` monorepo。
> 限制：本分析在「無 terminal / 無 git」session 完成，lockfile 與 git 實際狀態以〔待驗〕標註，需正常 session 複核。

---

## 1. 技術棧對比（實測）

| 維度 | learning-center（本地） | esggo monorepo（main） | 衝突 |
|---|---|---|---|
| 套件管理 | `pnpm`（無 `packageManager` 欄位） | `pnpm@11.5.2`（強制） | ⚠️ 需補 `packageManager` |
| 建置工具 | **Vite 6**（SPA, `vite build`） | **Next.js 16**（SSR/App Router, `next build`） | 🔴 範式不同 |
| 框架 | React **18.3.1** | React **19.2.7** | 🔴 大版號差 |
| UI 庫 | lucide-react **0.395.0** | lucide-react **0.507.0** | ⚠️ 需對齊 |
| firebase | ^12.16.0 | ^12.15.0 | ✅ 近版相容 |
| 獨有依賴 | `@supabase/supabase-js` ^2.110.7 | 無 | ⚠️ monorepo 未含，需加 |
| 後端函式 | `functions/` = `esggo-admin-rbac`（CJS, firebase-functions 4.5） | `worker/`, `my-worker/`（Cloudflare） | ⚠️ 部署目標不同 |
| 型別來源 | `types/generated/esggo-shared.d.ts` ← `shared/types.ts` | `shared/types.ts`（canonical） | ✅ 已 IN SYNC 21/21 |
| CI | 自帶 `ci.yml`（`check-types-sync`） | 根 `ci.yml`（vitest/eslint/next） | ⚠️ 需合併 |
| 部署 | Firebase Hosting + Firestore rules | VPS(rsync)+Next+Cloudflare+Vercel | 🔴 雙軌道 |
| soul.md | **0-byte**（空） | 真聖典在 `C:\Project\esggo\soul.md` | ✅ 合併後應移除本地空檔 |

---

## 2. 實證驗證（2026-08-01，live GitHub raw fetch，非宣稱）

> 受限 session 無 terminal / execute_code 被 cron_mode 阻擋，故改用 `web_extract` 對稱抓取 canonical 與 consumer 兩端原始 bytes，逐 block 人工比對（與 `scripts/check-types-sync.js` 同邏輯：strip `//` 註解後比對）。

**來源**
- canonical: `https://raw.githubusercontent.com/DingJun1028/esggo/main/shared/types.ts`
- consumer: `https://raw.githubusercontent.com/DingJun1028/esggo-learning-center/main/types/generated/esggo-shared.d.ts`

**逐 block 比對結果（21/21 全數一致）**

| # | 名稱 | 類型 | src 欄位 | dst 欄位 | 結果 |
|---|---|---|---|---|---|
| 1 | ESGKnowledgeBase | enum(8) | 8 成員 | 8 成員 | ✅ |
| 2 | ARVOStage | enum(4) | 4 | 4 | ✅ |
| 3 | SkillCategory | enum(5) | 5 | 5 | ✅ |
| 4 | MasteryLevel | enum(5) | 5 | 5 | ✅ |
| 5 | IKnowledgeRecord | iface | id,content,source,kb,metadata?,embedding?,createdAt | 同 | ✅ |
| 6 | IRAGResult | iface | answer,sources,confidence,tokensUsed? | 同 | ✅ |
| 7 | IARVOPlan | iface | taskId,currentStage,findings,reasoning,verificationStatus,skillsRequired | 同 | ✅ |
| 8 | IAgentProfile | iface | id,name,role,skills,status,memory_pt | 同 | ✅ |
| 9 | ISkillNode | iface | id,uuid?,name,layer,category,description,hitlRequired,level,experience,unlocked_at?,certificate_hash? | 同（含 `// 0-7` 註解，雙邊同被 strip） | ✅ |
| 10 | IAwakeningResult | iface | thought,action,reasoning,confidence,metadata?,skill_points_earned? | 同 | ✅ |
| 11 | IHITLProposal | iface | id,agentId,action,parameters,status,rationale | 同 | ✅ |
| 12 | IServiceModule | iface | id,uuid,name,route,domain | 同 | ✅ |
| 13 | IEsgMetric | iface | id,metric_id?,category,year,name,metric_name?,value,target_value?,unit,status | 同 | ✅ |
| 14 | IEvidenceRecord | iface | id,record_id,type,timestamp,hash,status,variant,owner_id? | 同 | ✅ |
| 15 | IMaterialityTopic | iface | id,topic_name,category,business_impact,stakeholder_importance,description? | 同 | ✅ |
| 16 | ISupplyChainVendor | iface | id,vendor_name,tier,compliance_score,carbon_emission,risk_level,last_audit_date,status | 同 | ✅ |
| 17 | IUserProfile | iface | id,username,email,role,avatar_url?,goodness_coins,sustainability_gems | 同 | ✅ |
| 18 | ICommunityPost | iface | id,title,content,author_id,category,likes,created_at | 同 | ✅ |
| 19 | IVillageMember | iface | id,user_id,village_name,level,title,reputation | 同 | ✅ |
| 20 | IOmniNote | iface | id,note_id,type,title,content,variant,dimensions{5},tags,created_at,updated_at,spirit_feedback?,hash? | 同 | ✅ |
| 21 | IApiResult | iface | data:T, error?:any | 同（雙邊 `T` 泛型對稱，web_extract 對 `<>` 跳脫對稱，不影響比對） | ✅ |

**結論：`missing=0, extra=0, mismatched=0` → TYPES_IN_SYNC（已實證，非宣稱）**

> 註：IApiResult 的 `<T>` 泛型標頭在 web_extract 輸出中被對稱跳脫（`IApiResult {` 而非 `IApiResult<T> {`），但兩端皆同樣跳脫且 `data: T;` 均出現，故雙邊一致；此點早於 2026-08-01 初輪以 browser raw（未跳脫）確認過 21/21 含 `IApiResult<T>`。

---

1. **G-1 建置範式衝突**（🔴）：Vite SPA vs Next.js。turbo pipeline 的 `build` 預設 `next build`，直接塞 `apps/learning-center` 會被當 Next 處理而失敗。
2. **G-2 React 大版號**（🔴）：18→19 升級需驗證 JSX / 第三方 hook 相容性（集大成本地已用 React 18 元件）。
3. **G-3 依賴缺漏**（⚠️）：`@supabase/supabase-js` 須加入 monorepo（workspace 或 root dep）。
4. **G-4 型別生成器路徑契約**（⚠️）：`scripts/export-shared-types.js` 的 `DEST = cwd/types/generated/`。併入後 `cwd` 變成 monorepo 根，產物會寫錯位置；須改為 `apps/learning-center/types/generated/`。
5. **G-5 Firebase Functions 落點**（⚠️）：`functions/` 現為獨立 CJS 專案，monorepo 用 ESM + pnpm workspace，須決定放 `apps/learning-center/functions/` 或頂層 `functions/`。
6. **G-6 CI 合併**（⚠️）：learning-center 的 `check-types-sync` gate 須搬進 monorepo CI（或保留為 `apps/learning-center` 專屬 workflow）。
7. **G-7 soul.md 空檔**（✅）：合併後刪除 `esggo-learning-center/soul.md`（真聖典已在 monorepo）。
8. **G-8 lockfile 一致性**〔待驗→已確認衝突〕：本地同時存在 `pnpm-lock.yaml` **與** `package-lock.json`（npm + pnpm 並存），monorepo 強制 `pnpm@11.5.2`；須刪 `package-lock.json`，統一 pnpm。
9. **G-9 缺少 tsconfig.json**：learning-center 未顯式定義 `tsconfig.json`（Vite 用 esbuild 隱式），monorepo 多 tsconfig 管線（core/app/omni/verify）須補 `apps/learning-center/tsconfig.json` 並納入 `tsconfig.verify.json` 包含集。

---

## 3. TypeScript 同步（已完成部分，無需重做）

```
esggo/shared/types.ts (canonical, v3.1.0-Omni)
   └─▶ scripts/export-shared-types.js (map 21 blocks)
         └─▶ types/generated/esggo-shared.d.ts  ✅ IN SYNC (21/21)
   └─▶ CI gate check-types-sync (esggo-learning-center ci.yml)  ✅ 在線
```
合併後只需修正 G-4 的 DEST 路徑，同步機制可原樣沿用。

---

## 4. 建議遷移路徑

### 方案 A（推薦）：作為 `apps/learning-center` 子應用，保留 Vite SPA
- 最小破壞：不重寫框架，learning-center 自帶 `vite build` + Firebase 部署。
- turbo 加 `apps/learning-center` 專屬 task（`build` 走 vite 而非 next）。
- 共享型別經 G-4 修正後繼續雙向同步。
- 工作量：中（config + 路徑修正 + 依賴補齊）。

### 方案 B：重寫為 Next.js App Router 頁面
- 完全融合 monorepo 技術棧，但需把全部 JSX/React 18 元件遷到 19 + App Router。
- 工作量：高（風險大，非必要不做）。

---

## 5. 合併執行清單（Checklist）

- [ ] **C1** 在 monorepo 建 `apps/learning-center/`，搬入 learning-center 源碼（排除 `.git`、`node_modules`）。→ 腳本自動
- [ ] **C2** 修正 `export-shared-types.js` DEST → `apps/learning-center/types/generated/`（G-4）。→ 另須修 checker SRC（腳本已含）
- [ ] **C3** learning-center `package.json` 加 `"packageManager": "pnpm@11.5.2"`；對齊 lucide-react 0.507.0；升 React 18→19（G-2，手動驗證）。→ 腳本自動（React19 手動）
- [ ] **C4** 根 `pnpm-workspace.yaml` 已含 `apps/*`，無需改；加 `@supabase/supabase-js` 至 root 或 workspace dep（G-3）。→ 手動
- [ ] **C5** `functions/` 落點決策並調整（G-5）。→ 手動
- [ ] **C6** turbo.json 加 `apps/learning-center` 專屬 build task（vite，非 next）（G-1）。→ 手動
- [ ] **C7** 合併 CI：把 `check-types-sync` 搬入 monorepo `.github/workflows/`（G-6）。→ 手動
- [ ] **C8** 刪除 learning-center `soul.md` 空檔（G-7）。→ 腳本自動
- [ ] **C9** 〔待驗→已確認〕lockfile 衝突：刪 `package-lock.json`，統一 pnpm（G-8）。→ 腳本自動
- [ ] **G-9** 補 `apps/learning-center/tsconfig.json` 並納入 verify 包含集。→ 腳本自動
- [ ] **C10** 驗證：`pnpm -F learning-center build` + `pnpm check:types-sync` 通過。→ 手動

> **自動化產物**：`scripts/merge-to-esggo.ps1`（方案 A，DryRun 可用）。自動項 = C1/C2部分/C3部分/C8/C9/G-9；手動決策項 = C3(React19)/C4/C5/C6/C7/C10。

---

## 7. 覺結界條款審計（OA-Team Swarm 最佳實踐 v1.0）

> 適用對象：本輪「全域全端全量雙向 TypeScript 同步」＋「learning-center → esggo monorepo 合併盤點」
> 四條款：預設合規 / 不帶病上線 / 頂標要求 / 結界繼承

| 條款 | 判定 | 證據 |
|---|---|---|
| **① 預設合規** | ✅ 合規 | origin 指 `esggo.git` 為 user 2026-08-01 確認之有意決策（非誤改）；CI gate `check-types-sync` 已部署（2026-07-28）；5T 協議（Traceable/Transparent/Trustworthy）落實於 checker 輸出 `TYPES_IN_SYNC` |
| **② 不帶病上線** | ⛔ 未達（禁區） | 合併**禁止直接 push**：C3(React18→19 升級)、C4(@supabase 補依賴)、C5(functions 落點)、C6(turbo vite task)、C7(CI 搬移)、C10(驗證) 共 6 項未解。腳本僅自動化 C1/C2部分/C3部分/C8/C9/G-9。未解項 = 「病」，未清除前不得併入 main |
| **③ 頂標要求** | ✅ 達標 | TypeScript 同步 IN SYNC **21/21**（4 enum + 17 interface 逐欄位）；block-level 零幻覺比對；generator+checker 雙向閉環 |
| **④ 結界繼承** | ✅ 繼承 | 真聖典 `soul.md` 在 monorepo（本地空檔 G-7 待刪）；Hash Lock 契約（`Object.freeze`/寫入即凍結）沿用；5T 驗算小隊(25-30) 職責由 CI gate 承襲；不可篡改原則＝遷移腳本對來源樹只讀、所有寫入僅落 `apps/learning-center/` |

**結界裁定**：
- 🟢 TS 同步本體：符合覺結界，准予維持現狀（IN SYNC）。
- 🔴 合併動作：觸犯「不帶病上線」禁區。在 C3/C4/C5/C6/C7/C10 全數清零前，**禁止**執行 `merge-to-esggo.ps1` 實寫或 `git push` 到 esggo main。
- 🔵 降險路徑：先在正常 session 跑 `.\scripts\merge-to-esggo.ps1 -DryRun` 驗證自動項無副作用；再逐項手動清 C3–C10；最後 `pnpm -F learning-center build` + `check:types-sync` 綠燈，方解除禁區。

---
*本審計依據 OA-Team Swarm 覺結界條款 v1.0（預設合規、不帶病上線、頂標要求、結界繼承）出具。*

- **R1** 併入後 Firebase 部署與 VPS/Cloudflare 部署如何共存？（雙軌道須明確分工）
- **R2** React 19 升級是否破壞現有 learning-center 元件（需實機跑 `vite build` 驗證）。
- **R3** 實際 git 操作（branch/PR）須在正常 session 或用 `_hermes-cron\sync-esggo.ps1` 執行；本 session 僅產出盤點。
- **R4** IP 衝突紀錄（161.118.248.180 vs 161.118.252.147）需合併部署前釐清。
