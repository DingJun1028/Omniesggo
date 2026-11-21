# ESGGO Hub — Hermes 桌面外掛安裝包

本目錄是由 Hermes 代理在本會話中重構/暫存的完整安裝包。
**來源約束**：本會話無 shell 執行通道、GUI driver 已離線（cua-driver session 結束），
且 MCP 檔案工具僅能寫入 `C:\Project\esggo-learning-center`，因此無法直接落盤到
Hermes home。請在本機執行 `install.ps1` 完成安裝。

## 檔案清單
- `plugin.js` — 前端插件（4 種 UI 表面：status chip / 右側 pane / ⌘K 命令 / 整頁 route + sidebar nav + keybind + 主題）。
- `backend/manifest.json` — 後端掛載 manifest。
- `backend/plugin_api.py` — Python 後端，提供 `GET /api/plugins/esggo-hub/status`，回傳前端所需欄位。
- `install.ps1` — 一鍵安裝腳本（複製檔案 + 合併啟用設定）。

## 重要修正（reinstall 主因）
原始貼上的 `plugin.js` 在主題物件結尾有 `} as const`：
```js
        }
      } as const   // ← TypeScript 語法，uncompiled plain ESM 會 SyntaxError
```
插件是「uncompiled plain ESM」加載，`as const` 在純 JS 是 `SyntaxError`，
會直接觸發 **「Plugin esggo-hub failed to load」**。本包的 `plugin.js` 已移除該行。

## 安裝（本機執行）
```powershell
powershell -ExecutionPolicy Bypass -File "C:\Project\esggo-learning-center\esggo-hub-staging\install.ps1"
```
隨後重啟 gateway（`hermes update --no-backup --yes` 或重開 app），
⌘K → `Reload desktop plugins`。

## 後端欄位對應（前端依賴）
`plugin_api.py` 的 `/status` 回傳：
`path, branch, last_commit, dirty, dist_built, src_files, firestore_rules`
若你有自訂後端邏輯，`install.ps1` 預設不會覆蓋已有 `plugin_api.py`（加 `-ForceBackend` 才強制覆蓋）。

## 驗證
- 狀態列出現 `ESGGO` chip（點擊彈 toast）。
- 右側 pane 顯示 branch / commit / 狀態 / dist / src 數量。
- ⌘K → `Open ESGGO Hub` 開啟整頁；頁面標題列有「複製作業上傳連結」按鈕。
- `mod+shift+r` 手動刷新。
- 若後端未啟用：pane/page 顯示「後端未啟用」提示（已優雅處理，不崩潰）。
