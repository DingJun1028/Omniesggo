# 課程回放自動化 — 部署指南

## 前置需求
- Google Drive 資料夾（放課程影片）
- Google Apps Script（免費）
- 你的前端網址：https://esg-sunshine.web.app

## 步驟 1：開啟 Apps Script
https://script.google.com/

## 步驟 2：建立專案
- 新專案 → 命名為「ESG回放自動化」
- 刪除預設的 `Code.gs`
- 將 `scripts/replaySync.gs` 的全部內容貼上

## 步驟 3：修改設定
```javascript
var CONFIG = {
  FOLDER_ID: '你的Google Drive資料夾ID',
  SETTINGS_SHEET_ID: '',
  VIDEO_MIME: ['video/mp4', 'video/quicktime', ...],
  DEFAULT_WEEK_PREFIX: '第 '
};
```

## 步驟 4：安裝觸發器
1. 點選 `install()` 函數
2. 執行（首次需要授權 Google Drive / Sheets）
3. 確認觸發器列表出現 `onDriveChange`

## 步驟 5：部署為 Web App
1. 部署 → 新部署
2. 類型：Web app
3. 說明：「replay-sync-v1」
4. 執行身份：我
5. 存取權：任何人都可以存取（匿名）
6. 部署 → 複製網址

## 步驟 6：設定前端
在 `.env` 加入：
```
VITE_REPLAY_WEB_APP_URL=https://script.google.com/macros/s/你的ID/exec
```

## 步驟 7：本地重建並推送
```bash
cd C:\Project\esggo-learning-center
pnpm run build
git add -A && git commit -m "feat: configure REPLAY_SYNC web app URL"
git push origin main
```

## 疑難排解
- `onDriveChange` 無法存取資料夾：確認執行身份是資料夾擁有者
- JSONP 無回應：確認 CORS / 存取權設定為「任何人都可以存取」
- 影片未公開：`ensurePublicView` 需要 Drive 權限
