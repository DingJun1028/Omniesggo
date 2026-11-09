# 萬能筆記（/notes）— 部署與驗證 Runbook

對象：把 PR #165 合併後的萬能筆記功能正式佈署到 production（Supabase 免費層）。

## 1. 前置條件

- Supabase 專案（免費層即可）。本倉庫對應的線上專案：`Omniesggo`（project ref `achguefnmctyfprajdsl`）。
- Migration **已套用**並驗證過：`db/migrations/20261104120000_universal_notes.sql`
  （`notes`、`note_attachments` 表 + RLS 政策、`supabase_realtime` publication、`note-attachments` bucket + storage 政策）。
  若是新專案，請在 Supabase SQL Editor 執行該檔，或 `supabase db push`。

## 2. 環境變數

Server（部署環境 secrets）：

```
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role key>   # 伺服器端；勿暴露給瀏覽器
# 後備：SUPABASE_ANON_KEY=<anon key>
# 次線專案：SUPABASE_OMNI_URL / SUPABASE_OMNI_SERVICE_ROLE_KEY
```

Browser（build 時注入）：

```
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

未設定 Supabase 環境時，API 自動落回本地 `data/notes.json`（僅供本地開發／測試；`data/notes.json` 已 gitignore）。

## 3. Supabase Dashboard 設定檢查

- **Authentication → Providers**：啟用 Email（關閉或設定自動確認 email，視需求）。
- **Database → Tables**：確認 `notes`、`note_attachments` 的 **RLS = enabled**，且各自有 4/3 條 policy。
- **Realtime**：`notes` 已加入 `supabase_realtime` publication（多裝置即時同步來自這裡）。
- **Storage**：bucket `note-attachments` 存在且為 public，有 3 條 `storage.objects` 政策（owner 可寫/刪、任何人可讀）。

## 4. 佈署步驟

1. 合併 PR 到 main，確認 CI 全綠（CI Green Gate、SonarCloud、build/test）。
2. 在部署平台設定上述環境變數（server secrets + NEXT_PUBLIC_* build vars）。
3. 觸發 production deploy；等待健康檢查通過。

## 5. 部署後驗證清單（smoke）

1. 開啟 `/notes`：未登入時應看到登入門（Supabase Auth email）。
2. 註冊/登入後：新增一則筆記（標題 + Markdown + 標籤），應出現在列表且即時同步。
3. 第二個瀏覽器視窗登入同一帳號：應即時看到同一則筆記（Realtime）。
4. 編輯儲存 → PUT 200；重新整理仍在。
5. 上傳附件（<10MB）：出現在附件區，可點開下載（公開 URL）。
6. 刪除附件 → 列表移除且 storage 物件一併刪除。
7. 刪除筆記 → 筆記與其附件 metadata/檔案皆消失（RLS cascade + storage cleanup）。
8. API 層：
   - `GET /api/notes` 不帶 token → **401**（設定 Supabase 後的預期行為，可作為 readiness probe）。
   - 以有效 Bearer token 呼叫 → 200 `{success, data:{notes,total}}`。
   - 空標題 POST → 400；不存在的 id PUT/DELETE → 404。
9. Rate limit：同一使用者 60 秒內寫入超過 60 次 → 429。

## 6. 本地／CI 自動化驗證

```
pnpm install --frozen-lockfile
pnpm vitest run tests/notes-api.test.ts        # notes API 單元/整合測試（file fallback + 401 gate）
pnpm vitest run tests/api-routes.test.ts tests/api-health-tags.test.ts
node tools/ts-matrix/verify.mjs                 # 型別漂移閘門
```

## 7. 回滾

- 功能以獨立路由/檔案為主；回滾 = revert 對應 merge commit 即可（不影響其他功能）。
- Supabase 側若要完全移除：刪除 `notes`、`note_attachments` 表與 `note-attachments` bucket（資料會消失，請先匯出）。

## 8. 已知限制（免費層）

- 列表上限 100 筆（`LIMITS.listMax`），總數仍回傳於 `total`。
- 附件單檔上限 10MB、總 bucket 受免費層 1GB 限制；刪除筆記會連動清理 storage 物件。
- 寫入 rate limit：每使用者 60 req/min（記憶體/Redis 固定視窗）。
- 未啟用 Supabase 時為本地 JSON 單機模式，不適合多人正式使用。
