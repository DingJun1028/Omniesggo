# Firebase Console 設定 Google 登入 - esggo-learning-center

> ⚠️ 先確認已依照 `docs/FIREBASE_SETUP.md` 完成 Firebase 專案、Firestore、`.env`。
> 本次**不部署**，僅更新監控畫面說明文件。

## 一、開啟 Google 登入

1. 前往 **Firebase Console → Authentication → Sign-in method**。
2. 點選 **Google**。
3. 把開關切為 **Enable**。
4. 建議務必設定：
   - Project support email：一個你能收信的 Email，Google 會寄聯絡相關通知。
5. 完成後按 **Save**。

成功後，後端允許以 Google 帳號登入並取得 Firebase Access Token，
`src/db.js` 的 `GoogleAuthProvider` 接下來才會真正生效。

---

## 二、授權同意畫面（GCP）

> 依 Google 帳號狀態可能 필요，若登入時提示「gapi.auth2 失敗」或「Developer console 尚未驗證」，請補做以下步驟。

1. 另開頁面前往 **Google Cloud Console → APIs & Services → OAuth consent screen**：
   https://console.cloud.google.com/apis/credentials/consent
2. 選擇 **External**（多數開源/教學專案不用申請 Internal）。
3. 填寫：
   - App name / User support email / Developer contact information（至少一個）
4. Scopes 暫時保留預設即可；除非後續新增 Google Drive / Sheets API，否則不用加。
5. 來到 Test users：
   - 若還沒有正式審核，**必填至少 1 個 Email** 才能在外部使用 OAuth 登入。
   - 將你自己和測試者加進去。
6. 完成後回到 **Credentials → OAuth 2.0 Client IDs** 複製 **Client ID**。

---

## 三、回到 Firebase Auth 補上 OAuth Client ID

1. 回到 **Firebase Console → Authentication → Sign-in method → Google**。
2. 在 **Web SDK configuration** 或 **OAuth redirect domains** 相關欄位放上剛才的 Client ID。
3. 如果你只用前端 `signInWithPopup`，通常只需確認：
   - Firebase Console 裡 **Authorized domains** 已加入你要部署的 domain。

---

## 四、Authorized domains（非常重要）

這是最常見卡關原因。請確認包含：

- `localhost`
- 正式 domain（如 `esggo-learning-center.web.app`、`your-custom-domain.com`）

操作路徑：**Authentication → Settings → Authorized domains**。

---

## 五、將值填入 `.env`

編輯專案根目錄 `.env`，補齊 Google 登入所需欄位：

```env
VITE_GOOGLE_OAUTH_CLIENT_ID=你的-OAuth-Client-ID
```

> `.env` 已在 `.gitignore` 中，不會被提交。請不要在程式碼硬編碼機密。

---

## 六、前端驗證登入流程

```bash
pnpm install
pnpm run dev
```

在瀏覽器開啟開發伺服器：

1. 右上角登入按鈕目前執行 `signInWithPopup`。
2. 成功後會寫入/更新使用者 profile：
   - 預設匿名使用者維持匿名使用。
   - 從匿名升等到 Google 登入的同一個 Firebase UID，沿用既有資料（未配額外 mapping，`uid` 仍屬同一身份）。

若看到使用者資訊且無錯誤，代表：
- Google Provider 已開通
- `.env` 正確
- `Authorized domains` 包含目前網域

---

## 七、本機快速檢查清單

| 項目 | 檢查點 |
|------|--------|
| Firebase Console | Authentication → Google 已 Enabled |
| GCP OAuth consent | 已完成並有 Test user |
| Firebase Auth | Authorized domains 含測試 domain |
| .env | `VITE_GOOGLE_OAUTH_CLIENT_ID` 已填入 |
| 前端畫面 | 登入按鈕可彈出 Google 帳號選擇並完成登入 |

---

## 八、後台監控

Firebase Console 可以即時看到：
- **Authentication → Users**：確認 Google 帳號已進入使用者列表。
- **Firestore → Data**：`artifacts/{appId}/public/data/submissions` 佔位與資料是否正確寫入。

---

## 九、常見問題

- **`signInWithPopup: This operation is not supported in this environment`**
  請用 localhost 或 HTTPS，並確認 Authorized domains 包含目前 host。
- **`DEVELOPER_ERROR` / `gapi.auth2`**
  通常是 GCP OAuth consent 未完成、Client ID 錯誤、redirect mismatch。
- **Header too large / net::ERR_NAME_NOT_RESOLVED**
  這是與本次登入/DB 改動不相關的網路/DNS 問題，先確認電腦 DNS 與防火牆設定。

---

如有需要，我可以下一步直接為你新增一個「診斷頁」，把登入狀態、auth provider、Firebase 連線狀態全部集中顯示。
