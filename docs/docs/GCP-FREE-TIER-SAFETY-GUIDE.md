# Google Cloud Platform (GCP) 免費層安全調配與預算防禦指南

本指南旨在為 **ESG GO** 專案調配最嚴格的 GCP 安全與成本控制措施，確保所有元件（Cloud Run、Firestore、BigQuery、Gemini API）在任何情況下皆**不產生計費**，並在遭遇 DDoS 攻擊或惡意調用時提供自我防衛機制。

---

## 目錄
1. [已完成：Cloud Run 安全執行個體與 CPU 調配](#1-已完成cloud-run-安全執行個體與-cpu-調配)
2. [GCP 帳單預算與自動中斷機制 (Billing Budgets & Alerts)](#2-gcp-帳單預算與自動中斷機制-billing-budgets--alerts)
3. [API 額度與用量上限控制 (API Quotas & Caps)](#3-api-額度與用量上限控制-api-quotas--caps)
4. [Firebase Spark (免費層) 計畫限制防禦](#4-firebase-spark-免費層-計畫限制防禦)
5. [應用層 (Next.js & Gateway) 速率限制與 DDoS 防禦](#5-應用層-nextjs--gateway-速率限制與-ddos-防禦)

---

## 1. 已完成：Cloud Run 安全執行個體與 CPU 調配

Cloud Run 預設會根據流量無上限自動擴展（最高 100 個執行個體），且若啟用「CPU 始終分配（Always-on CPU）」，即使無流量亦會持續計費，這極易導致免費額度耗盡。

我們已對專案內所有五個活動中的 Cloud Run 服務進行了安全升級與硬限制調配：

| 服務名稱 (`Service`) | 部署區域 (`Region`) | 已調配最大執行個體 (`max-instances`) | 已調配 CPU 閒置機制 (`cpu-throttling`) |
| :--- | :--- | :---: | :---: |
| **`esg-go-v5-omnicore`** | `us-central1` | **`1`** | **`true` (閒置時不計費)** |
| **`esggo`** | `asia-east1` | **`1`** | **`true` (閒置時不計費)** |
| **`esggo-omni`** | `us-central1` | **`1`** | **`true` (閒置時不計費)** |
| **`esg-live`** | `us-west1` | **`1`** | **`true` (閒置時不計費)** |
| **`esggo-platform`** | `us-central1` | **`1`** | **`true` (閒置時不計費)** |

### 防禦效果：
- **消滅閒置計費：** 特別是將 `esg-go-v5-omnicore` 的 Always-on CPU 關閉（啟用 `cpu-throttling`），確保只有在「API 請求執行中」才會消耗免費層的 vCPU-seconds 額度。
- **杜絕自動擴展成本：** 將最大規模硬鎖死在 `1`，即使專案被惡意腳本連續攻擊，也絕不會在雲端多開任何一個 VM 容器，從源頭切斷計費鏈（GCP Cloud Run 免費層每月提供 200 萬次請求與大量 CPU/RAM 額度，單一執行個體在閒置節流下極難超出免費限額）。

---

## 2. GCP 帳單預算與自動中斷機制 (Billing Budgets & Alerts)

雖然我們限制了雲端容器，但為了防止其他共用雲端資源（例如 Cloud Storage、Egress 網路流量）溢出，必須設定預算警報。

### 步驟 A：設定 $1 預算警報
1. 登入 [Google Cloud Console Billing](https://console.cloud.google.com/billing)。
2. 進入左側選單的 **Budgets & alerts (預算與警示)**。
3. 點擊 **Create budget (建立預算)**：
   - **Scope (範圍)：** 選擇您的專案 `esg-sunshine`。
   - **Amount (金額)：** 選擇 `Specified amount`（指定金額），輸入 **`1`** (TWD 或 USD，視您幣別而定)。
   - **Actions (警示觸發)：** 
     - 設定百分比為 `50%`、`90%`、`100%`。
     - 勾選 **"Email alerts to billing admins and users"**，一旦有任何計費達到 $0.5，您將立刻收到信件。

### 步驟 B：自動中斷計費（安全柵欄 - 進階）
若想在預算 100% 溢出時，自動關閉專案內的所有計費或服務，可建立一個自動化 Pub/Sub 機制：
1. 建立預算時，在最下方勾選 **"Connect a Pub/Sub topic to this budget"**（將 Pub/Sub 主題連接至此預算）。
2. 新建一個 Topic（例如 `billing-alerts`）。
3. 建立一個簡單的 Cloud Run 函數或 Cloud Functions 訂閱此 Topic，當收到 `amount > budget` 的 JSON 訊息時，調用 GCP API 自動停用該專案的 Billing：
   ```gcloud
   # 停用專案計費的 API 指令（自動化腳本內執行）
   gcloud billing projects unlink esg-sunshine
   ```
   *註：計費帳戶解綁後，所有收費服務會立刻暫停，保障資金絕對安全。*

---

## 3. API 額度與用量上限控制 (API Quotas & Caps)

為了防止 Gemini 或是 BigQuery 的免費查詢額度被大量消耗，我們需要為這些 API 上鎖。

### 📌 BigQuery 每日查詢上限（免費層為每月 1TB 掃描量）
預設情況下，一條寫得不好的 SQL（如 `SELECT *` 大表）可能一次就掃描數百 GB。
1. 進入 GCP Console 的 **APIs & Services > Enabled APIs & Services**。
2. 找到 **BigQuery API**，點擊進入 **Quotas & System Limits (配額與系統限制)**。
3. 尋找 **"Query usage per day per user"** (每位使用者每日查詢用量) 與 **"Query usage per day per project"**。
4. 將配額值從無限制修改為 **`10 GB`**（或是適合您的低閥值）。
   - **效果：** 即使有人惡意在後端發起重度查詢，BigQuery 在當天掃描滿 10GB 後會拒絕執行並報錯，徹底避免突破每月 1TB 的免費查詢限額。

### 📌 Generative Language API (Gemini Developer API) 額度限制
Gemini API 的免費層有每分鐘請求數（RPM）與每日請求數（RPD）的限制。
1. 在 GCP Console 進入 **APIs & Services > Credentials**。
2. 點擊您提供給網關使用的 API Key。
3. 在 **API Restrictions (API 限制)** 中：
   - 勾選 **"Restrict key"** 並選擇僅允許呼叫 **"Generative Language API"**（確保此 Key 不能被用來調用其他昂貴付費 API）。
4. 進入 **Generative Language API** 的 Quotas 頁面：
   - 將 **"Requests per minute"** 限制為 **`15`** (免費層建議值)。
   - 將 **"Requests per day"** 限制為 **`1500`**。

---

## 4. Firebase Spark (免費層) 計畫限制防禦

**ESG GO** 的資料儲存多依賴 Firestore 和 Firebase 服務。

1. **鎖定 Spark 方案：** 
   - 確保您的 Firebase 專案（在 [Firebase Console](https://console.firebase.google.com/) 底部）顯示為 **`Spark plan` (Free $0/month)**。
   - **絕對不要升級至 `Blaze plan`**。
   - **防禦機制：** Spark 計畫是實體免費計畫，GCP **不允許** Spark 帳戶產生任何扣款。當 Firestore 每日 5 萬次免費讀取、2 萬次免費寫入額度耗盡時，Firebase 會直接回傳 `RESOURCE_EXHAUSTED` 錯誤，而絕對不會暗中扣除您的信用卡款項。這是物理層面的成本防線。

2. **鎖定 API 金鑰安全範圍：**
   - 進入 GCP Console 的 Google Services API 金鑰設定，將前端使用的 Firebase API Key 限制為只能呼叫：
     - Firebase Services
     - Identity Toolkit API
     - Cloud Firestore API
   - 防止該金鑰被挪作他用。

---

## 5. 應用層 (Next.js & Gateway) 速率限制與 DDoS 防禦

當雲端與 API 配置完畢後，最後一關是應用程式本身的自我保護，防止因頻繁調用導致服務中斷或 API 被封鎖。

1. **已生效：網關 API 速率限制 (Rate Limiting)**
   - 我們在網關（`apps/gateway/omni-server.mjs`）配置了：
     - 全域限制：`max: 120` 請求/每分鐘。
     - AI 模型專用限制（`aiLimiter`）：`max: 30` 請求/每分鐘。
   - 在 Next.js API（如投票等）中，也配置了 Redis / 記憶體雙重速率限制（`@/lib/rate-limit.ts`）。

2. **必備：部署 Cloudflare Free 方案**
   - 將您的 `NEXT_PUBLIC_APP_URL` 網域託管於 **Cloudflare Free Tier**：
     - **開啟 DDoS 基礎防護**：CF 自動過濾常見的網絡層、傳輸層惡意洪泛攻擊。
     - **啟用 WAF Page Rules (頁面規則)**：
       - 對於密集 API 路由（如 `/api/ai/*`）啟用速率限制（例如：單一 IP 每 10 秒限制 5 次請求，超出則顯示挑戰頁面或封鎖）。
       - 限制只允許特定國家/地區訪問。
     - **開啟 JavaScript Challenge (防刷驗證)**：當檢測到可疑機器人流量時，自動彈出 Cloudflare 驗證碼，阻斷自動化掃描。

---

### 💡 總結防禦清單 (Checklist)
- [x] **Cloud Run CPU Throttling 啟用** (100% 閒置不計費)
- [x] **Cloud Run `max-instances=1` 硬限制** (100% 防止自動擴展計費)
- [x] **`FREE_TIER_ONLY=true` 已寫入 `.env`** (100% 隔離付費 AI 呼叫)
- [ ] **設定 GCP $1 預算與信件警報** (Console 手動)
- [ ] **設定 BigQuery 每日 10GB 掃描額度** (Console 手動)
- [ ] **確認 Firebase 留在 Spark (Free) 方案** (Console 確認)
- [ ] **網域套用 Cloudflare Free CDN 與 WAF 規則** (網域託管)

本指南調配之安全措施，將在保留專案功能與靈活度的同時，建立物理與邏輯上的「雙重金庫保險箱」，確保 ESG GO 在高枕無憂的零成本環境下平穩運作。
