# 實施計畫：ORACLE / DB / 萬能標籤配對合成

> 狀態：規劃（未執行）。依用戶「前往並規劃」指令撰寫。
> 調查基準：本機 repo @ main `cf34ea65`

## 背景與目標

將「ORACLE 直連 + DB 寫入 + 萬能標籤配對合成」整合進 esggo。
「萬能標籤配對合成」= 把現有的兩套標籤體系（ESGTag 法規分類 + OmniTag 組件信任）合成一個統一配對層，讓任何實體（法規/報告/快訊/組件）都能被標註並做信任驗證。

## 現狀（調查發現）

### 已有 — Prisma DB（`prisma/schema.prisma`）
- `ESGTag`：name/pillar/category/description，關聯 Regulation/CompanyReport/Alert（三個 junction 表）
- 雙 datasource：SQLite(dev) / PostgreSQL(prod, Supabase/Neon)
- 客戶端：`src/lib/prisma.ts`、`src/lib/prisma-omni.ts`

### 已有 — OmniTag（`lib/omni-tag/index.ts`）
- `OmniTag` 型別：type = GRI|TCFD|TNFD|SDG|custom；status = proof-anchor|evidence|verified|archived
- `createOmniTag()`、`pairTags(anchor, evidence)` → `TagPair`（錨點+證據信任配對）
- 目前是純記憶體/型別層，無 DB 持久化、無 API

### 已有 — Oracle ADB schema（`vps/omni/sql/omni_schemas.sql`）
- `OMNI_PROFILE_VECTOR`：component_vector（uuid/embedding 1536/evidence/hash/frozen）— RAG 基底
- `OMNI_LIFECYCLE_LOG`：event（uuid/event_type/timestamp/payload）— 生命週期
- `OMNI_TRUST_LEDGER`：entry（prev_hash/curr_hash/uuid/action）— hash-chain 防篡改信任帳本
- **阻塞**：SQL 註解「免費額 2/2 已用滿，不新建」→ Oracle ADB 配額耗盡，無法新建實例

### 部署腳本
- `oracle-deploy/`（README + docker-compose + init-server/deploy/keepalive）
- `vps/deploy-omnidb.sh`、`vps/omni/sql/omni_schemas.sql`、`vps/DEPLOY-ORACLE.md`

## 阻塞點

1. **Oracle ADB 免費配額滿（2/2）** → 「ORACLE 直連」短期不可行。
   - 解法 A：釋放一個現有 ADB 實例（需 OCI 控制檯操作，非程式碼）
   - 解法 B：短期用現有 Prisma PostgreSQL（Supabase）做標籤合成 + 信任帳本；Oracle 作為未來 RAG/向量增強（待配額）
   - 解法 C：用 Oracle Always Free 的新 VM（2 OCPU/12GB/200GB，README 有）跑 app，但 ADB 仍滿 → 只用 VM 不用 ADB

## 階段 1（無 Oracle 依賴，可立即執行）：萬能標籤配對合成層

### 1.1 Prisma 擴模型（`prisma/schema.prisma`）
新增統一標籤層，串接 ESGTag 與 OmniTag：
```
model UniversalTag {
  id          String   @id @default(cuid())
  label       String
  kind        String   // 'esg' | 'omni' | 'custom'
  esgTagId    String?  // 關聯 ESGTag.id (若 kind='esg')
  omniType    String?  // GRI/TCFD/TNFD/SDG/custom (若 kind='omni')
  status      String   @default("active") // active/verified/archived
  metadata    String   @default("{}")     // JSON
  createdAt   DateTime @default(now())
  pairs       TagPair[] @relation("tagPairs")
  @@unique([label, kind])
}

model TagPair {
  id            String   @id @default(cuid())
  anchorTagId   String
  evidenceTagId String?
  anchor        UniversalTag @relation("tagPairs", fields:[anchorTagId], references:[id])
  evidence      UniversalTag? @relation("tagPairs", fields:[evidenceTagId], references:[id])
  entityType    String   // regulation/report/alert/component
  entityId      String
  confidence    Float    @default(1.0)
  createdAt     DateTime @default(now())
  @@unique([anchorTagId, entityType, entityId])
  @@index([entityType, entityId])
}
```

### 1.2 Service 層（`src/core/tags/universal-tag-service.ts`）
- `syncEsgTags()`：把現有 ESGTag 同步進 UniversalTag（kind='esg'）
- `createOmniTagPair(anchor, evidence, entity)`：用 `lib/omni-tag` 的 `pairTags` 生成，寫入 UniversalTag(kind='omni') + TagPair
- `autoPair(entityType, entityId, content)`：用本地 Gemma 4（已部署！）分析內容，自動建議 ESGTag + OmniTag 配對，寫入 TagPair
- `getEntityTags(entityType, entityId)`：回傳該實體的所有配對標籤

### 1.3 API routes
- `app/api/tags/universal/route.ts`：POST 建立、GET 查詢
- `app/api/tags/pair/route.ts`：POST 配對（含 autoPair 觸發本地 Gemma 4）

### 1.4 遷移
- `npx prisma migrate dev --name universal_tags` → 生成 migration
- 本地 SQLite 驗證；prod 用 `prisma migrate deploy`（Supabase）

## 階段 2（Oracle 配額釋放後）：ORACLE 直連同步

### 2.1 連線層（`src/lib/oracle.ts`）
- 用 `oci` SDK 或 `@oracle/adb` 直連現有 ADB（需 `OMNI_DB_PWD` from OCI Vault，VPS 的 `.env` 注入）
- 寫入 `OMNI_TRUST_LEDGER.entry`（hash-chain 信任記錄）作為 TagPair 的不可篡改備份
- 寫入 `OMNI_PROFILE_VECTOR.component_vector`（組件知識向量，RAG 基底）

### 2.2 同步 job（`src/lib/cron-jobs.ts` 或 scripts）
- 定時把 TagPair + UniversalTag 同步到 Oracle ADB（僅信任帳本 + 向量，關聯資料留 Prisma）

### 2.3 部署
- `vps/deploy-omnidb.sh` 已存在，擴充加入 Oracle 同步服務
- `vps/omni/sql/omni_schemas.sql` 已在目標庫執行（註解說直接建在現有庫）

## 驗證

- 階段 1：`pnpm prisma generate` + `migrate dev` + vitest 測 `universal-tag-service`（autoPair 用本地 Gemma 4 回標籤配對）
- 階段 2：OCI 連線測試 + 寫一筆 trust_ledger entry 確認 hash-chain
- 全量 `pnpm lint && pnpm typecheck && pnpm build` 通過

## 風險

- Oracle 配額滿是硬阻塞 → 階段 2 需先釋放配額或用現有庫（VPS `.env` 需 `OMNI_DB_PWD`，目前未注入）
- autoPair 用本地 Gemma 4 可能慢（ARM CPU）→ 非同步處理或限頻
- 兩套標籤體系語意不同（ESGTag=分類，OmniTag=信任）→ UniversalTag 需明確 kind 欄位區分

## 下一步決策點

用戶確認：
- [ ] 只做階段 1（Prisma 標籤合成，不碰 Oracle）？
- [ ] 階段 1 + 嘗試釋放 Oracle 配額做階段 2？
- [ ] 僅出計畫，不執行？
