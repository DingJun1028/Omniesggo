# ESG GO — OmniAgent Project Context
# 自動注入每次 session，保持簡潔（每字元消耗 token 預算）

## 專案架構
- **框架**：Next.js 15 App Router + TypeScript（strict mode）
- **資料庫**：Supabase Postgres（主）+ Firebase Firestore（ESG evidence vault）
- **AI**：Genkit JS（AI Flow pipeline）、Firebase AI Logic（Gemini API）
- **UI**：Liquid Glass Cyan 設計語言（`#06b6d4` · `#10b981` · `#020617`）
- **測試**：Vitest（單元）+ Playwright（E2E）
- **部署**：Firebase App Hosting（`main` 分支自動觸發）

## 目錄結構
```
app/          Next.js App Router 頁面
src/core/     T5Protocol、BerkeleyComponent（核心治理邏輯）
shared/       types.ts（IEvidence、IComponentCore — 唯一真理來源）
lib/          db.ts、agent/（Genkit flows、ESG schemas）
components/   Liquid Glass 元件庫
.agents/      omni-agent/（此配置目錄）
```

## 型別合規規則（必遵）
- `IEvidence` 欄位：`formula_ref` · `tangible_metric` · `source_origin` · `lifecycle_hooks`
- `IComponentCore` 必須實作：`formula` · `impact_metric` · `status` · `hash_lock`
- **不可使用**過時欄位：`iso_standard_ref` · `id` · `hash_value` · `lifecycle_path`
- 所有寫入操作自動附帶：`uuid` · `version` · `timestamp` · `source_origin`

## 編碼規範
- 使用 `async/await`，禁止 `.then()` 鏈式寫法
- 禁止 `any` 型別（strict TypeScript）
- 測試指令：`npx vitest run`（單元）/ `npx playwright test`（E2E）
- 格式化：`npx prettier --write .`
- **不可直接編輯** Supabase migration 檔案，使用 CLI 生成

## MCP 工具路由原則
- **Firestore 查詢** → `firebase-mcp-server`（偏好）或 `mcp_firebase-mcp-server_*`
- **資料庫操作** → `nocodebackend`（NCB API）
- **UI 設計** → `StitchMCP`（可並行）
- **AI Flow** → `genkit-mcp-server`（不可並行，有狀態）
- **破壞性操作**（刪除、清除）→ 必須先詢問使用者確認，再執行

## 安全邊界
- 絕不生成含明文密鑰的程式碼（使用環境變數）
- Supabase RLS 必須在任何公開端點前啟用
- Hash Lock 一旦套用，不可靜默修改 evidence 記錄
- Firebase 黑名單操作：`firestore_delete_database` · `firestore_delete_document` · `firebase_delete_app`

## 子代理委派指引
- 子代理對父對話一無所知，`context` 必須自給自足
- 兩個子代理不可同時修改同一檔案（race condition）
- 並行研究 / 程式碼審查 → 使用 `delegate_task`
- 機械式多步驟（有邏輯關聯）→ 直接 `execute_code`
- 使用 `[SILENT]` 避免排程任務洗版通知頻道

## 常用指令
```bash
npm run dev          # 啟動開發伺服器（port 3000）
npx vitest run       # 執行單元測試
npm run build        # 驗證生產構建（只在確認正確性時執行）
git push origin main # 觸發 Firebase App Hosting 自動部署
```
