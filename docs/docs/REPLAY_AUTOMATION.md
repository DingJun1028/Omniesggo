# 課程回放自動化（影片上傳即自動顯示）

本文件說明如何讓「柏克萊 ESG 學習中心」的**課程回放**功能自動化：

> 只要有新影片上傳到指定的 Google Drive 資料夾，系統就會**自動抓出影片 ID**，
> 並**自動完成設定**（週次 / 標題 / 日期），前端「課程回放」頁面會立即出現這支影片，
> 不需重新部署網站、也不用手動改程式碼。

整體架構：**Google Drive 資料夾 ⇄ Google Apps Script（監聽 + 產生 JSON）⇄ 前端 React（JSONP 即時抓取）**

---

## 運作方式

1. 管理員把錄影影片（mp4 / mov / webm …）丟進 Google Drive 資料夾
   `https://drive.google.com/drive/folders/1-ZOC6sPNGISeD7Rf6lYT3Q10yYZaTdAy`
2. Apps Script 的 `onDriveChange` 觸發器偵測到新檔案 →
   自動把影片設為「任何知道連結的人都能檢視」→ 寫入「自動化設定」試算表。
3. 學員打開「課程回放」頁面時，前端透過 JSONP 呼叫 Apps Script 的 Web App，
   即時拿到最新影片清單並顯示（iframe 用 `/preview` 播放，無下載連結）。

---

## 一、部署 Google Apps Script（只需做一次）

### 1. 開新專案
- 打開 https://script.google.com
- 左上「新增」→「專案」，命名例如 `ESG回放自動化`

### 2. 貼上程式碼
- 打開本倉庫的 `scripts/replaySync.gs`，把內容**全部複製**到 Apps Script 編輯器（覆蓋預設的 `myFunction`）。
- 確認最上方的 `CONFIG.FOLDER_ID` 是 `1-ZOC6sPNGISeD7Rf6lYT3Q10yYZaTdAy`（就是首頁「學員資源區」連的那個資料夾）。
  > 若你之後想換資料夾，改這一行即可。

### 3. 安裝監聽觸發器
- 在編輯器選單選 `install` 函式 → 點「執行」（首次會要求授權，全部允許）。
- 這會：
  - 建立 **Drive 內容變更**觸發器（之後影片上傳自動觸發）；
  - 立即處理資料夾裡**現有**的影片；
  - 在 Google Drive 建立 `ESG回放自動化設定` 試算表（紀錄每支影片的 id / week / title / date）。

### 4. 部署為 Web App
- 右上「部署」→「新增部署」→ 選「網頁應用程式」
  - 執行身分：**我（你的帳號）**
  - 存取權：**任何人**（前端要能跨域 JSONP 呼叫，必須設為任何人）
- 部署完成後複製給你的 **Web App 網址**，長這樣：
  `https://script.google.com/macros/s/<一大串ID>/exec`

---

## 二、把 Web App 網址貼回前端

打開 `src/App.jsx`，找到最上方的 `REPLAY_SYNC` 設定區：

```js
const REPLAY_SYNC = {
  ENABLED: true,
  WEB_APP_URL: '', // ← 把剛複製的 Web App 網址貼到這裡
  CACHE_TTL_MS: 5 * 60 * 1000
};
```

把網址填進 `WEB_APP_URL`，儲存。

### 除錯：先在本機驗證
在瀏覽器直接開剛才的 Web App 網址（不加 `callback`），應該會看到 JSON，例如：
```json
{ "updatedAt": "2026-...", "videos": [ { "id": "...", "week": "第 1 週", "title": "課程主題一", "date": "2026-01-10" } ] }
```
有資料就代表後端正常，前端只需把 `WEB_APP_URL` 填上即可。

---

## 三、日常使用（管理員）

1. 把錄影影片上傳到該 Drive 資料夾。
2. 文字幾秒到幾分鐘內 → 學員在「課程回放」點進去就會看到新影片。
3. 想改週次 / 標題：直接編輯 `ESG回放自動化設定` 試算表對應那一行（id 欄不可改），
   前端下次載入會以試算表的內容為準（覆寫自動推測值）。
4. 檔名小技巧（可省略）：
   - 檔名含 `第3週` 或 `Week 3` → 自動標成「第 3 週」
   - 否則依上傳順序自動編「第 1 週 / 第 2 週 …」
   - 標題預設為「去副檔名的檔名」

### 關於「禁止下載」
本程式只嵌入 `/preview` 播放、**不提供下載連結**，並禁用右鍵。但要真正隱藏 Drive 的下載鈕，
需對每支影片：共用 → 設為「任何知道連結的人都可以『檢視』」→ 齒輪設定 →
取消勾選「檢視者與留言者可以看見下載選項」→ 儲存。
（`onDriveChange` 已自動把影片設為「知道連結者可檢視」；若該檔案你擁有，下載隱藏選項可在共用介面手動處理。）

---

## 四、備用機制（離線 / 未部署時）

若 `REPLAY_SYNC.ENABLED = false` 或 `WEB_APP_URL` 為空、或抓取失敗（8 秒逾時或網路錯誤），
前端會自動退回 `src/App.jsx` 裡的 `DEFAULT_REPLAY_VIDEOS`（那兩個 `REPLACE_WITH_...` 範例）。
所以**沒部署自動化也不會壞**，只是要手動維護而已。

---

## 五、常見問題

**Q：影片上傳了但頁面沒出現？**
- 確認 `WEB_APP_URL` 已填且 `ENABLED: true`。
- 直接開 Web App 網址看有沒有資料；沒資料表示 Apps Script 端抓不到檔案
  （檢查 `FOLDER_ID` 是否正確、檔案是否真的是影片 MIME、腳本授權是否完整）。
- 觸發器可能幾分鐘才跑一次，可手動在編輯器執行 `onDriveChange()` 強制刷新。

**Q：Want 換資料夾？** 改 `scripts/replaySync.gs` 的 `CONFIG.FOLDER_ID` 並重新部署 Web App。

**Q：前端報 CORS / 跨域錯誤？** 本方案用 JSONP（動態 `<script>`），不受 CORS 限制；
請確認 Web App 存取權設為「任何人」且網址是用 `?callback=...` 呼叫（前端已自動處理）。
