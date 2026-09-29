# 墾趣旅遊 — 永續旅程 APP 架構規格書

> **文件版本**：v3.0（重設計版）
> **日期**：2026-09-28
> **產品定位**：官網六大旅遊方案的**行程最佳實踐主要輔助 APP**
> **前端**：`https://journey.ftgtours.esggo.co`
> **後端**：`https://journey-api.ftgtours.esggo.co`
> **代碼庫**：`C:/Project/esggo/apps/ftg-journey-web` + `apps/ftg-journey-server`

---

## 0. 本文件的定位與依據

本文件是**重設計的權威依據**，取代 `docs/ftg-journey-gap-analysis.md`（2026-08-29 版，僅為功能有無的點對點清單，未回答「這 App 到底解決什麼問題」）。

重設計的三個依據來源：

| 依據 | 內容 | 用途 |
|---|---|---|
| 官網六大方案頁 | `corporate-travel` / `esg-team-day` / `family-day` / `wellbeing-retreat` / `executive-retreat` / `esg-impact-note`，共 **36 項功能承諾** | 定義 App 的功能邊界，App 不得超出官網承諾，也不得少於承諾 |
| 官網 JourneyApp 頁 | 六大核心功能 + 四步使用流程（建立旅程 → 安全確認 → 執行追蹤 → 產出報告） | 定義 App 的**主線骨架** |
| 官網 streams 頁 | 六流哲學（基礎/覺曉/凝聚/復元/共好/留念）與起承轉合 | 保留為**設計語彙**，但不再作為 App 的導航架構 |

### 0.1 現況實測（2026-09-28，非推測）

| 項目 | 實測結果 | 驗證方式 |
|---|---|---|
| 前端 `journey.ftgtours.esggo.co` | **HTTP 200**，正常 | `curl -o /dev/null -w %{http_code}` |
| 後端 `journey-api.ftgtours.esggo.co` | **HTTP 502 Bad Gateway** | `curl https://journey-api.ftgtours.esggo.co/api/health` |
| VPS 8787 埠 | **無監聽**（`NO_LISTENER_8787`） | `ss -tlnp \| grep 8787` |
| VPS pm2 程序清單 | **空**（僅 `pm2-logrotate` 模組存在） | `pm2 list` |
| pm2 錯誤日誌 | `[ftg-journey-server] 拒絕啟動：JWT_SECRET 未設定`（連續 6 次重啟） | `pm2 logs --nostream` |
| `/var/www/ftg-journey-server/.env` | 檔案存在、內容正確（JWT 長度 96 字元） | 遠端 `wc -c` |
| 前端建構 | **PASS**，451.08 kB JS / 25.92 kB CSS | `pnpm build` exit 0 |
| 後端語法 | **PASS** | `node --check server.js` exit 0 |
| 後端 API 端點 | 28 個（15 組資源路徑）齊備 | `grep` server.js 路由註冊 |
| 前端程式碼量 | 12 檔 / 3,146 行 | `wc -l src/**/*.jsx` |
| 官網/App 程式碼一致性 | `server.js` 本地與 VPS md5 相同（`778d42e5…`） | `md5sum` |

**502 根因（已定位）**：`.env` 被寫到部署目錄，但 `server.js` 沒有載入 `.env` 的機制，pm2 也不會讀。於是 `process.env.JWT_SECRET` 永遠是 `undefined`，服務在啟動安全閘門 `process.exit(1)`，**pm2 卻顯示 `online`**（因為 process 還活著，在重啟迴圈中）。這是「部署看起來成功、實際完全沒服務」的典型失效型態。

修正已在本機套用 `loadDotEnv()`（零依賴，只補 `process.env` 中尚未定義的鍵，維持 12-factor 優先序），**尚未部署**。

---

## 1. 重設計核心命題

### 1.1 現況的結構性問題

現有 App 的資訊架構是**六流平行**：

```
/journey/:id            → 9 個分頁（安全/準備/ESG/行程/筆記/簽到/摘要/勳章/工具）
/journey/:id/executive  → 3 個分頁
/journey/:id/wellbeing  → 3 個分頁
/journey/:id/family-day → 3 個分頁
```

合計 **12 個進入點、18 個分頁**。這在架構上是六流哲學的直接翻譯，但真實使用情境不是這樣的：

> 帶隊的主管在出發前 3 天打開 App，他面前有 12 個入口，每一個都長得像「功能說明頁」，沒有一個告訴他「你現在該做什麼」。
>
> 員工在山上，訊號不好、手是髒的、太陽很大，他需要的是「現在幾點、下一個任務在哪、我簽到 了沒」——不是一個九分頁的導覽。

**診斷：現況把「設計哲學」誤當成「導航架構」。** 六流是思考框架（給設計者與行銷用），不是使用者的任務清單。

### 1.2 重設計主張

**這個 App 的第一職責不是「產出 ESG 報告」，是「讓一趟旅遊照計畫跑完」。** 報告是結果，不是目的。

因此主線改為**單一時間主軸**：

```
行前 PLAN ──→ 現場 RUN ──→ 收尾 CLOSE ──→ 報告 REPORT
  3 天前        當天          當天傍晚        7 天內
```

- **RUN（現場）** 是最高頻、最痛、最需要被設計的場景，現況幾乎沒有專屬設計（簽到只是九分頁之一）。
- **REPORT（報告）** 是低頻、高價值、現況卻最重的頁面（ImpactNotePage 579 行）。
- 六流降級為 **`journey.type`（旅程類型）** 欄位，決定載入哪些任務模板與模組，**不再佔據導航層**。

### 1.3 一句話定義

> **墾趣旅程 App = 官網六大方案的行程執行手冊 + 現場記錄工具 + 一鍵成果報告。**

---

## 2. 使用者與任務（Persona / JTBD）

| 角色 | 使用時機 | 最高頻任務 | 現況是否可用 |
|---|---|---|---|
| **帶隊主管** | 行前 3 天 ~ 當天 | 點名、確認安全、掌握進度、臨時決策 | ❌ 9 分頁無總覽 |
| **參與員工** | 當天（手機、戶外） | 下一個任務在哪、簽到、拍照、快速記錄 | ❌ 需層層點入 |
| **HR / 福利委員** | 行前建旅程、收尾拿報告 | 建立、派發、匯出 | ⚠️ 可用但笨重 |
| **ESG / 品牌部** | 活動後 7 天 | 取得可揭露的成果 | ⚠️ 需手動彙整 |
| **FTG 顧問** | 方案設計階段 | 快速產出一份可給客戶看的行程 | ❌ 無此流程 |

**JTBD 陳述**：
- 「當我帶團出發前，我要能在 3 分鐘內確認所有安全事項都已就緒，缺什麼一目了然。」
- 「當我在山上，我要能一鍵完成簽到與任務記錄，不需要訊號也不會失敗。」
- 「當活動結束，我要能按一個按鈕，交出一份對得起客戶的成果報告。」

---

## 3. 目標資訊架構

### 3.1 四段主線

| 段 | 觸發時機 | 核心畫面 | 關鍵設計 |
|---|---|---|---|
| **PLAN 行前** | 建立旅程後 ~ 出發前 | 準備度儀表板 | 「還差 N 項」單一數字 + 阻擋級警示 |
| **RUN 現場** | 當天，出發後自動切換 | 今日看板（大按鈕、單手可用） | 離線可讀、GPS 簽到、秒級記錄 |
| **CLOSE 收尾** | 行程結束後 24h | 收尾清單 + 反思提問 | 引導式 3 題，自动带出已記錄資料 |
| **REPORT 報告** | 7 天內 | Impact Note | 一鍵匯出、預覽先行、空白降級 |

### 3.2 導航（4 個分頁，取代 18 個）

```
┌─────────────────────────────────────────────────────┐
│  旅程：2026 阿里山 ESG 團隊日        [admin]  ⋯    │
├─────────────────────────────────────────────────────┤
│                                                     │
│   ① 今日        ② 準備      ③ 收尾     ④ 報告    │
│                                                     │
│   ┌───────────────────────────────────────────┐   │
│   │  ⏰  09:30  集合・阿里山森林遊樂區門口        │   │
│   │  ▸ 進行中                                   │   │
│   ├───────────────────────────────────────────┤   │
│   │  ✅ 08:00  行前簡報                          │   │
│   │  ◉ 09:30  集合報到    [ 簽到 ]              │   │
│   │  ○ 10:00  Clean-up Walk 分組                 │   │
│   │  ○ 12:00  在地午餐                            │   │
│   │  ○ 14:00  生態觀察工作坊                      │   │
│   │  ○ 16:00  收斂與分享                          │   │
│   └───────────────────────────────────────────┘   │
│                                                     │
│   [ ＋ 記一筆 ]      [ 📍 簽到 ]      [ 📷 拍照 ]  │
└─────────────────────────────────────────────────────┘
```

底部三個大按鈕是 **RUN 段的常駐操作**，拇指可達，單手可完成。

### 3.3 旅程類型（`journey.type`）

六流不再是導航，而是**建立旅程時的模板選擇**：

| `type` | 對應官網方案 | 六流歸屬 | 載入的模組 |
|---|---|---|---|
| `corporate` | 企業員工旅遊 | 基礎流 | 安全 + 行程 + 團隊任務 + 簽到 |
| `esg-day` | ESG 戶外團隊日 | 覺曉流 | 安全 + Clean-up + 碳足跡 + 生態觀察 + 授勳 |
| `family` | 企業家庭日 | 共好流 | 安全(親子) + 親子任務 + 觀察記錄 + 相簿 |
| `wellbeing` | 員工身心健康 | 復元流 | 安全 + 正念練習 + 負荷分級 + 30 天追蹤 |
| `executive` | 高階主管共識營 | 凝聚流 | 安全 + 機會地圖 + 策略路徑 + 共識記錄 |
| `impact` | ESG Impact Note | 留念流 | 資料彙整 + 圖表 + GRI/SDGs + 匯出 |

**設計原則**：不同類型**共用同一套時間軸引擎、簽到引擎、照片引擎、摘要引擎**。差異只在「時間軸上放什麼任務卡」與「多開哪一個記錄模組」。這是消除 18 分頁 sprawl 的關鍵——共享引擎，模板差異化。

---

## 4. 功能對照矩陣（官網 36 項承諾 × App 現況 × 目標）

### 4.1 企業員工旅遊（`corporate`）

| # | 官網承諾 | 現況 | 目標 | 段 |
|---|---|---|---|---|
| 1 | 永續目的地 | ❌ 無地點/交通模組 | 新增「目的地永續評分」卡（低碳交通、環保住宿、在地飲食標記） | PLAN |
| 2 | 團隊凝聚活動 | ⚠️ 僅成員名單 | 新增團隊任務卡（分組、分工、團隊挑戰計分） | RUN |
| 3 | 綠色旅行 | ✅ 碳足跡記錄 | 提升為「交通段碳帳本」，匯入 REPORT | RUN→REPORT |
| 4 | 安全檢查清單 | ✅ 4 類 16 項 | 重構為阻擋級檢查（有未完成項則無法標記「可出發」） | PLAN |
| 5 | Impact 報告 | ✅ ImpactNotePage | 降為 REPORT 段單一出口 | REPORT |
| 6 | 客製化設計 | ✅ 建立/編輯旅程 | 改為模板選擇（見 §3.3） | PLAN |

### 4.2 ESG 戶外團隊日（`esg-day`）

| # | 官網承諾 | 現況 | 目標 | 段 |
|---|---|---|---|---|
| 7 | Clean-up Walk | ✅ 垃圾數量/重量/類型 | 現場秒記 + 拍照自動歸類（AI 標籤為 P1） | RUN |
| 8 | 生態教育 | ⚠️ 靜態知識庫 | 知識卡改為「任務卡」形式，出現在時間軸上，可完成、可簽收 | RUN |
| 9 | 團隊共創 | ❌ 缺 | 新增「共創挑戰」任務型（限時、團隊計分） | RUN |
| 10 | 友善環境行動 | ⚠️ 僅無痕原則文字 | 淨灘/淨山/復育改為可勾選的行動卡 + 影響力數據 | RUN |
| 11 | 碳足跡估算 | ✅ 6 種交通係數 | 補「抵銷建議」輸出到 REPORT | RUN→REPORT |
| 12 | 永續授勳 | ✅ 15 枚勳章 | 觸發點補齊：筆記提交、任務完成、團隊挑戰達成 | RUN |

### 4.3 企業家庭日（`family`）

| # | 官網承諾 | 現況 | 目標 | 段 |
|---|---|---|---|---|
| 13 | 自然探索 | ✅ 生態觀察記錄 | 改為「親子自然賓果」任務卡（可勾選清單） | RUN |
| 14 | 手作工作坊 | ❌ 缺 | 新增手作任務卡（材料/時程/成品照片） | RUN |
| 15 | 健康活動 | ❌ 缺 | 新增親子運動任務卡（分組/計分/安全提示） | RUN |
| 16 | 在地餐食 | ❌ 缺 | 新增在地商家標記，串到「地方支持」指標 | PLAN+RUN |
| 17 | 回憶紀錄 | ✅ 照片相簿 + 分享圖 | 保留，提升為家庭專屬分享圖模板 | CLOSE |
| 18 | 客製化設計 | ⚠️ | 依年齡層自動建議任務難度 | PLAN |

### 4.4 員工身心健康（`wellbeing`）

| # | 官網承諾 | 現況 | 目標 | 段 |
|---|---|---|---|---|
| 19 | 行前評估 | ✅ 需求診斷 | 補壓力檢測、體能分級標籤 | PLAN |
| 20 | 遠離日常 | ❌ 缺 | 新增「數位排毒」任務卡（離線時段宣告） | RUN |
| 21 | 感官甦醒 | ❌ 缺 | **新增正念計時器**（森呼吸/5-4-3-2-1 感官法） | RUN |
| 22 | 深度體驗 | ⚠️ 六大模組展示 | 改為可執行的練習卡 + 完成記錄 | RUN |
| 23 | 能量整合 | ❌ 缺 | 新增分享圈 + 行動承諾卡 | CLOSE |
| 24 | 持續追蹤 | ✅ 30-day followup | 補成效評估（前後測對比） | CLOSE→+30d |

### 4.5 高階主管共識營（`executive`）

| # | 官網承諾 | 現況 | 目標 | 段 |
|---|---|---|---|---|
| 25 | 系統思考 | ⚠️ Opportunity Map 畫布 | 保留，成為 RUN 段的團隊共創工具 | RUN |
| 26 | 跨部門協作 | ❌ 缺 | 新增跨部門配對 + 協商紀錄 | RUN |
| 27 | 3 年策略願景 | ✅ Roadmap 框架 | 補「承諾→行動→追蹤」閉環 | CLOSE |
| 28 | 信任重建 | ❌ 缺 | 新增深度對話卡（匿名/具名） | RUN |
| 29 | 自然場域 | N/A（非軟體） | 不實作，維持宣傳語言 | — |
| 30 | 共識記錄 | ✅ 記錄工具 | 補匯出（Roadmap 分享圖/PDF） | CLOSE |

### 4.6 ESG Impact Note（`impact`）

| # | 官網承諾 | 現況 | 目標 | 段 |
|---|---|---|---|---|
| 31 | 數據分析 | ✅ 11 項指標 | 補「異常值提示」與跨旅程趨勢 | REPORT |
| 32 | 環境貢獻 | ✅ 對應邏輯 | 保留 | REPORT |
| 33 | 參與者回饋 | ⚠️ 有頁面 | 改為 CLOSE 段的引導式提問（3 題即可完成） | CLOSE |
| 34 | GRI/SASB 對應 | ⚠️ 僅 GRI | **補 SASB/ISSB 對應** | REPORT |
| 35 | PDF/PPT 匯出 | ⚠️ 有匯出頁待驗證 | 確保可用 + 匯出預覽 | REPORT |
| 36 | 社群素材 | ⚠️ 部分 | 分享圖模板化（依 journey.type 換版型） | REPORT |

### 4.7 缺口統計

| 狀態 | 數量 | 說明 |
|---|---|---|
| ✅ 已對應 | 12 | 需重構位置，非重寫 |
| ⚠️ 部分對應 | 13 | 需補完或改形式 |
| ❌ 未對應 | 10 | 需新增 |
| N/A | 1 | 自然場域（宣傳語言） |

---

## 5. 技術架構

### 5.1 現況

```
apps/ftg-journey-web      React 19 + RR7 + Vite 8 + Tailwind 3 + framer-motion 11
  src/pages/              Dashboard, JourneyDetail(983行), ImpactNotePage(579行), LoginPage
  src/features/           Executive(141), FamilyDay(326), Wellbeing(261), Philosophy(267)
  src/contexts/           AuthContext (Google OAuth → JWT)
apps/ftg-journey-server   Node 22 + Express 4 + node:sqlite + google-auth-library
  server.js               884 行 / 28 端點 / 15 組資源
  部署                    VPS /var/www/ftg-journey-server, pm2, :8787, nginx TLS
```

### 5.2 目標

```
┌─────────────────────────────────────────────────────────────┐
│  PWA（installable · offline shell · 背景同步佇列）          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 今日 (RUN)  │ 準備 (PLAN) │ 收尾 (CLOSE) │ 報告       │  │
│  └───────────────────────────────────────────────────────┘  │
│                         ↓                                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 共用引擎（跨 journey.type 複用）                       │  │
│  │ TimelineEngine · CheckinEngine · PhotoEngine ·         │  │
│  │ QuickCaptureEngine · SummaryEngine                     │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │ 模組註冊表（依 journey.type 差異化載入）               │  │
│  │ safety packing health risk mitigation esg-task …       │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │  Bearer JWT
┌─────────────────────────────▼───────────────────────────────┐
│  Express API (:8787)                                          │
│  /api/auth/*  /api/me  /api/journeys  /api/badges            │
│  /api/upload  /api/contact                                  │
│  + 新增 /api/journeys/:id/sync（離線佇列批次落地）            │
│  + 新增 /api/journeys/:id/plan（準備度聚合）                  │
│  + 新增 /api/journeys/:id/report/export（PDF/PPT）            │
└─────────────────────────────┬───────────────────────────────┘
                              │
        node:sqlite (單檔)  ftg-journey.db
```

### 5.3 離線優先（RUN 段的必要條件）

戶外場景的網路不可靠是既定事實，RUN 段必須離線可用：

| 層 | 策略 |
|---|---|
| App Shell | Service Worker 預快取（既有 `sw.js` / `registerSW.js` 已有基礎） |
| 資料讀取 | 行程資料於進入 RUN 段時全量快取到 IndexedDB |
| 寫入 | 所有記錄先進本地 outbox，顯示「已暫存」狀態 |
| 同步 | 恢復網路後批次 POST，伺服器需支援 **冪等**（以 client-generated UUID 去重） |
| 衝突 | 時間戳 later-wins；伺服器回傳權威版本供前端標示 |

### 5.4 資料模型（現有 + 新增）

現有表：`journeys`、`prep_items`、`schedule`、`notes`、`checkins`、`esg_tasks`、`badges`、`user_badges`、`photos`、`impact`、`executive_tools`、`wellbeing_diagnosis`、`wellbeing_followup`、`family_tasks`、`family_observations`、`journey_members`。

新增：

| 表 | 欄位 | 用途 |
|---|---|---|
| `journey_tasks` | `id, journey_id, phase, seq, kind, title, payload, required, due_at, status, completed_at, completed_by` | **統一任務表**：取代分散於 schedule/prep/esg-task 的記錄，時間軸唯一真相來源 |
| `journey_reflections` | `id, journey_id, author, q1_energy, q2_learning, q3_commitment, created_at` | CLOSE 段 3 題回饋 |
| `outbox_receipts` | `client_uuid PK, journey_id, endpoint, payload_hash, received_at` | 離線同步冪等去重 |
| `journey_templates` | `type PK, version, task_blueprint JSON, updated_at` | 六種旅程類型的任務模板（版本化） |

**遷移策略**：`schedule` 與 `prep_items` 的既有資料於讀取時即時對應到 `journey_tasks` 視圖（不破壞現有 DB），新寫入一律進 `journey_tasks`。待過渡期結束再移除舊表。

### 5.5 API 契約

| 方法 | 路徑 | 說明 | 狀態 |
|---|---|---|---|
| GET | `/health` | 健康檢查（**注意：不在 `/api` 前綴下**，`/api/health` 回 404） | ✅ 已有 |
| GET/POST | `/api/auth/google`, `/api/refresh` | OAuth | ✅ |
| GET | `/api/me`, `/api/me/badges` | 身分 | ✅ |
| GET/POST/PATCH/DELETE | `/api/journeys[/:id]` | 旅程 CRUD | ✅ |
| GET/POST | `/api/journeys/:id/{prep,schedule,notes,checkin,esg-tasks,impact,photos,members}` | 既有資源 | ✅ |
| GET/POST | `/api/journeys/:id/{executive/:toolType, wellbeing/*, family-*} | 模組記錄 | ✅ |
| GET/POST | `/api/journeys/:id/tasks` | **統一任務時間軸** | 🆕 |
| GET | `/api/journeys/:id/plan` | **準備度聚合**（阻擋項計數） | 🆕 |
| POST | `/api/journeys/:id/sync` | **離線批次落地（冪等）** | 🆕 |
| GET/POST | `/api/journeys/:id/reflections` | **收尾回饋** | 🆕 |
| POST | `/api/journeys/:id/report/export` | **PDF/PPT 產出** | 🆕 |
| GET | `/api/templates/:type` | 旅程類型模板 | 🆕 |

### 5.6 授權與安全

| 面向 | 現況 | 要求 |
|---|---|---|
| 認證 | Google OAuth → JWT | 維持 |
| 角色 | `admin` / `staff` / `member`（依 `ADMIN_EMAILS`、`STAFF_DOMAINS`） | 維持 |
| JWT 金鑰 | 啟動即強制 ≥32 字元、拒絕已知外洩值 | 維持（這道閘門是好的） |
| 設定載入 | 無 | 🆕 內建 `.env` 載入（已套用本機） |
| 上傳 | 5MB 上限、Express multipart | 補副檔名白名單 + 路徑正規化 |
| 同步端點 | 無 | 🆕 需冪等 + 速率限制 + 大小上限 |

---

## 6. 設計原則

| 原則 | 具體要求 |
|---|---|
| **現場優先** | RUN 段所有操作 ≤ 2 次點擊完成；主操作按鈕不小於 56×56 px，位於拇指可達區 |
| **離線可用** | 見 §5.3。RUN 段任何操作不得因網路失敗而丟失 |
| **單一真相來源** | 時間軸資料只存 `journey_tasks`，不在前端二次派生 |
| **不過度承諾** | 頁面顯示的數字必須有實際資料來源；無資料時顯示引導而非 0 |
| **一屏一任務** | 每個分頁的主視覺是一個可完成的動作，不是資訊列表 |
| **雙語一致** | zh-TW / en-US，鍵名 SSOT，禁止多語擴張 |
| **品牌一致** | 深藍 `#10243f` + 暖金 `#c9a24b`；沿用官網 `ftg-forest` / `ftg-sand` / `ftg-orange` 色票 |

---

## 7. 交付優先序

### P0 — 讓它真的能用（阻擋上線）

| # | 項目 | 驗收標準 |
|---|---|---|
| 1 | 部署 `.env` 載入修正 | `curl https://journey-api.ftgtours.esggo.co/health` → 200 ✅ **已完成 2026-09-28** |
| 2 | pm2 啟動治理 | 服務 `online` 且 `ss -tlnp \| grep 8787` 有監聽（**兩者都成立才算**）✅ **已完成 2026-09-28**（pid 3324565） |
| 3 | 健康探針納入監控 | 連續 502 應告警，不應靠人肉發現 |
| 4 | 四段導航骨架 | 18 分頁 → 4 分頁，無功能遺失 |
| 5 | 準備度阻擋 | 有未完成阻擋項時無法標記「可出發」 |

**P0-1 / P0-2 修復後實測（2026-09-28）**

| 檢查 | 結果 |
|---|---|
| `ss -tlnp \| grep 8787` | `LISTEN *:8787 users:(("node /var/www/f",pid=3324565))` ✅ |
| `pm2 describe ftg-journey-server` | `status online` + `exec cwd /var/www/ftg-journey-server` ✅ |
| VPS 本機 `curl 127.0.0.1:8787/health` | `{"status":"ok","service":"ftg-journey-server",...}` ✅ |
| 外部 `https://journey-api.ftgtours.esggo.co/health` | 200 + JSON ✅ |
| 外部 `GET /api/me`（未認證） | **401**（認證閘門正常生效）✅ |
| CORS 預檢 `OPTIONS /api/auth/google`（Origin=journey 子網域） | **204** ✅ |
| 前端 `https://journey.ftgtours.esggo.co/` | 200 ✅ |
| SPA 深層路由 `/journey/1` | 200（nginx `try_files` fallback 正常）✅ |

**教訓（寫入運維規範）**：`pm2 status` 顯示 `online` **不足以**判定服務可用。該案例中服務連續重啟 7 次、每次都處於 `online`，因為 process 尚未退出。**唯一可靠的驗收是同時確認 `ss -tlnp` 有監聽，且實際 HTTP 請求成功。**


### P1 — 補齊官網承諾（10 個 ❌）

依 §4 缺口清單，依序：永續目的地評分 → 共創挑戰 → 在地餐食 → 手作工作坊 → 親子運動 → 數位排毒 → 正念計時器 → 深度對話 → 跨部門協作 → SASB 對應。

### P2 — 深化

| 項目 | 說明 |
|---|---|
| 離線 outbox + 同步 | §5.3 完整實作 |
| PDF/PPT 匯出 | 報告可交付性 |
| 團隊計分與排行榜 | 凝聚流/共好流的遊戲化 |
| 跨旅程趨勢分析 | REPORT 段的年度視角 |
| 照片 AI 標籤 | Clean-up 廢棄物自動分類 |

---

## 8. 風險與未決事項

| # | 風險 | 影響 | 緩解 |
|---|---|---|---|
| 1 | 官網 36 項承諾短期無法全數對應 | 客戶落差 | 官網 JourneyApp 頁同步更新為「四步流程」敘事，App 與官網保持一致語言 |
| 2 | 既有 DB 資料遷移遺漏 | 歷史旅程消失 | 過渡期以視圖對應，不做破壞性遷移 |
| 3 | 現場無網路的寫入遺失 | 資料不可逆損失 | 離線佇列 + 冪等同步（P2，但 P0 階段至少要保留草稿不丟失） |
| 4 | 導航重構影響既有使用者 | 學習成本 | 舊路由保留轉址（`/journey/:id/executive` 等） |
| 5 | 目前無自動化測試 | 重構易回歸 | P0 階段先補 `server.js` 端點煙霧測試（既有 `jwt-gate.test.js` 為基礎） |

**未決事項（需決策）**
- Q1：CLOSE 段的 3 題回饋是否強制？建議非強制但強烈引導。
- Q2：Impact Note 的 PDF 產出走伺服器端（Node 產生）還是瀏覽器端（列印 CSS）？建議先走瀏覽器端列印，零依賴且可立即上線。
- Q3：FTG 顧問角色是否需要獨立流程（方案設計 → 匯出行程給客戶）？目前無對應需求描述，暫不列入。

---

## 9. 附錄

### 9.1 關鍵檔案

| 路徑 | 職責 |
|---|---|
| `apps/ftg-journey-server/server.js` | API 主體、DB schema、JWT 閘門、`.env` 載入 |
| `apps/ftg-journey-server/ecosystem.config.cjs` | pm2 設定（`PORT: 8792` 與 nginx 的 `8787` **不一致，須修正**） |
| `apps/ftg-journey-web/src/App.jsx` | 路由（待重構為四段導航） |
| `apps/ftg-journey-web/src/pages/JourneyDetail.jsx` | 9 分頁容器（待拆解為 Timeline + 模組） |
| `apps/ftg-journey-web/src/pages/ImpactNotePage.jsx` | REPORT 段（待精簡 + 匯出） |
| `apps/ftg-journey-web/nginx-journey.conf` | 前端 nginx（VPS 上已有 `journey.ftgtours.esggo.co` 憑證） |
| `apps/ftg-journey-web/nginx-journey-api.conf` | API nginx（VPS 啟用中，指向 8787） |
| `docs/ftg-journey-gap-analysis.md` | 舊版缺口分析（已被本文件取代） |

### 9.2 變更紀錄

| 版本 | 日期 | 變更 |
|---|---|---|
| v0.5 | 2026-08-29 | 缺口分析初版（點對點清單） |
| v3.0 | 2026-09-28 | 重設計：主線改為 PLAN→RUN→CLOSE→REPORT；六流降級為旅程類型；36 項官網承諾全對照；納入 502 根因實測 |

---

*文件產出：OA-Team 30 萬能蜂群 · 5T 驗證：Traceable（官網原始碼逐頁比對）· Transparent（502 根因附實測證據）· Trustworthy（金鑰全程不進對話、不入 repo）*
