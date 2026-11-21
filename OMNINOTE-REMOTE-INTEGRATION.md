# OmniNote（遠端倉庫整合）

本專案已匯入遠端 `origin/main` 的獨立 OmniNote Web 控制台與 Unified 本機 API 引擎：

- `apps/omninote-web`：Next.js 16 控制台，支援速記、筆記編輯/軟刪除、雙鏈圖譜、搜尋、標籤、草稿、匯入匯出與證據鏈。
- `packages/omninote-unified`：本機 Markdown/附件儲存引擎、CRDT/5T 證據鏈與 REST API。

此為獨立子應用，不取代 ESGGO 主站，且未合併遠端 684 個提交。API 預設只綁定 `127.0.0.1`；不要將其公開綁定到 LAN 或網際網路。若啟用 `OMNINOTE_TOKEN`，Web 的請求會使用該 Bearer token；不要把真正的 token 放在 `NEXT_PUBLIC_*` 變數或提交到 Git。

## 啟動 API 引擎（Windows PowerShell）

```powershell
$env:OMNINOTE_HOME = "$HOME\Documents\OmniNote"
$env:OMNINOTE_PORT = "52710"
# 可選：$env:OMNINOTE_TOKEN = "本機隨機長密鑰"
packages/omninote-unified/node_modules/.bin/tsx.cmd packages/omninote-unified/bin/omninote-server.ts
```

若 `tsx` CLI 尚未安裝，請在此 package 目錄獨立安裝 manifest 所列依賴後再啟動。API 固定綁定回環位址 `http://127.0.0.1:52710`，不應公開到 LAN 或網際網路。

## 啟動 Web 控制台

```powershell
$env:NEXT_PUBLIC_OMNINOTE_API = "http://127.0.0.1:52710"
# 僅當 API 設定 OMNINOTE_TOKEN 時，Web API client 需提供對應 token；請使用 Web server 私有環境變數，勿使用 NEXT_PUBLIC。
cd apps/omninote-web
pnpm dev
```

Web 開發網址預設為 `http://localhost:52720`；Friday 預覽已在隔離副本成功啟動，網址為 `http://localhost:4484`。先啟動 API，再啟動 Web；呼叫 API `/health` 應回 HTTP 200。若 Web 顯示連線失敗，確認 API 正在執行、port 為 52710，以及瀏覽器頁面和 API 在同一台電腦（回環位址只代表本機）。

## 驗證

- Web：`apps/omninote-web` TypeScript no-emit 與 Next production build 已通過。
- API：Unified 核心 TypeScript no-emit 通過；完整測試 70/70 通過，涵蓋 API、安全、CRDT、圖譜、標籤、匯入匯出、草稿與 5T 證據鏈。
- 專案 root 的 `pnpm-workspace.yaml` 與 `pnpm-lock.yaml` 本來就有本機修改；本次未以遠端版本覆寫它們。
