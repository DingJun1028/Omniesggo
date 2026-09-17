# FTG 永續旅程 App (ftg-journey-web)

> 墾趣旅遊 FTG TOURS 官方企業永續旅程 Companion App — 前端（React + Vite + Tailwind）。
> 搭配後端 `../ftg-journey-server`（Node + node:sqlite + Google OAuth）。

---

## 一、功能概览

| 模組 | 對應官網頁 | 說明 |
|---|---|---|
| 儀表板 Dashboard | — | 旅程列表、建立新旅程 |
| 旅程詳情 JourneyDetail | 全 | 準備事項 / 行程 / 筆記 / 成員 |
| Impact Note | `esg-impact-note` | ESG 成果收集 + SDGs 對應 + 報告產出 |
| Executive 工具 | `executive-retreat` | Opportunity Map / Roadmap / 共識記錄 |
| Wellbeing 工具 | `wellbeing-retreat` | 身心平衡旅程引導 |
| FamilyDay 工具 | `family-day` | 家庭日親子任務 |
| 登入 Login | — | Google OAuth 角色權限（admin/staff/member） |

---

## 二、技術棧

- **React 19** + **React Router 7** + **Vite 8**
- **Tailwind CSS 3** + **framer-motion 11**（動畫）
- **react-hook-form 7**（表單）+ **date-fns 4**（日期）
- 純前端 SPA，狀態經 `AuthContext` 管理 Google token

---

## 三、目錄結構

```
src/
  main.jsx                入口
  App.jsx                 路由
  index.css               Tailwind 基礎
  components/
    Layout.jsx            全域佈局
    ui/index.jsx          UI 元件庫
  contexts/
    AuthContext.jsx       Google 登入 + token 儲存
  features/
    Executive.jsx         高階主管共識營（Opportunity Map）
    Wellbeing.jsx         身心平衡引導
    FamilyDay.jsx         家庭日任務
  pages/
    LoginPage.jsx         登入
    Dashboard.jsx         旅程列表
    JourneyDetail.jsx     旅程詳情（prep/schedule/notes/members）
    ImpactNotePage.jsx    ESG Impact Note
```

---

## 四、環境變數（前端）

在 `.env` 或構建環境設定：

| 變數 | 說明 |
|---|---|
| `VITE_API_BASE` | 後端基址，如 `https://journey-api.ftgtours.esggo.co` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID |

API 呼叫統一經 `API_BASE` 常數 + `apiFetch()` 封裝（見 `AuthContext.jsx`）。

---

## 五、後端 API 清單（`../ftg-journey-server`）

所有受保護端點需 `Authorization: Bearer <token>`。

### 認證
| Method | Path | 說明 |
|---|---|---|
| POST | `/api/auth/google` | 接收 Google `credential`，驗證後回傳 JWT + user |
| POST | `/api/refresh` | Token 過期後 7 天寬限期內換發新 Token |
| GET | `/api/me` | 取得當前使用者資料 |

### 旅程
| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/api/journeys` | 使用者 | 列出擁有/被邀請的旅程 |
| POST | `/api/journeys` | 使用者 | 建立旅程 |
| GET | `/api/journeys/:id` | 擁有者/成員 | 旅程詳情 |
| PUT | `/api/journeys/:id` | 擁有者 | 修改旅程 |
| DELETE | `/api/journeys/:id` | 擁有者 | 刪除旅程 |

### 成員管理
| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/api/journeys/:id/members` | 擁有者/成員 | 成員列表（含 consent_public） |
| POST | `/api/journeys/:id/members` | 擁有者 | 邀請成員 |
| PUT | `/api/journeys/:id/members/:email` | 擁有者 | 改角色/同意公開 |
| DELETE | `/api/journeys/:id/members/:email` | 擁有者 | 移除成員 |

### 子資源（prep / schedule / notes / impact）
| Method | Path | 權限 | 說明 |
|---|---|---|---|
| GET | `/api/journeys/:id/prep` | 擁有者/成員 | 準備事項 |
| POST | `/api/journeys/:id/prep` | 擁有者 | 新增準備項 |
| GET | `/api/journeys/:id/schedule` | 擁有者/成員 | 行程 |
| POST | `/api/journeys/:id/schedule` | 擁有者 | 新增行程 |
| GET | `/api/journeys/:id/notes` | 擁有者/成員 | 筆記 |
| POST | `/api/journeys/:id/notes` | 擁有者 | 新增筆記 |
| GET | `/api/journeys/:id/impact` | 擁有者/成員 | 影響指標 |
| POST | `/api/journeys/:id/impact` | 擁有者 | 新增指標 |

### 檔案上傳
| Method | Path | 權限 | 說明 |
|---|---|---|---|
| POST | `/api/upload` | 使用者 | base64 圖片上傳（≤5MB），回傳 `/uploads/xxx` |

---

## 六、後端環境變數（`ftg-journey-server`）

| 變數 | 預設 | 說明 |
|---|---|---|
| `PORT` | 8787 | 監聽埠 |
| `GOOGLE_CLIENT_ID` | — | Google OAuth Client ID |
| `JWT_SECRET` | dev-only | JWT 簽章密鑰（生產必改） |
| `DB_PATH` | `./ftg-journey.db` | SQLite 路徑 |
| `UPLOAD_DIR` | `/var/www/ftg-journey-web/uploads/` | 上傳目錄 |
| `ADMIN_EMAILS` | `dingjunhong1028@gmail.com` | 管理員清單（逗號） |
| `STAFF_DOMAINS` | `@esggo.co,@ftg.com.tw` | 員工網域 |

---

## 七、開發與建置

```bash
cd apps/ftg-journey-web
pnpm install        # 或 npm install
pnpm dev            # 本地開發 (Vite)
pnpm build          # 產出 dist/
pnpm preview        # 預覽構建結果
```

後端：

```bash
cd apps/ftg-journey-server
node server.js      # 需 Node 22+（node:sqlite）
```

---

## 八、部署

- **前端**：GitHub Pages → `journey.ftgtours.esggo.co`
- **後端**：Oracle VPS（esggo-vps）→ `journey-api.ftgtours.esggo.co`，systemd + nginx + Let's Encrypt
- 靜態資源（uploads/）由 nginx 直接服務

---

## 九、角色權限

| 角色 | 來源 | 權限 |
|---|---|---|
| admin | `ADMIN_EMAILS` | 全部（含成員管理/刪除旅程） |
| staff | `STAFF_DOMAINS` 網域 | 後台/CRM/BD |
| member | 其他 | 自身旅程/筆記/照片 |

---

> 本文件由 Hermes 萬能知識代理分身依 `server.js` + `package.json` + `src/` 實際程式碼產出（2026-08-29），與線上部署版本一致。
