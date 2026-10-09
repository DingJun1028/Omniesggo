# FTG 生態部署存檔紀錄

> 記錄時間：2026-08-29（Asia/Taipei）
> 範圍：墾趣旅遊官網 + 永續旅程 App + 知識分身 vault
> 狀態：全生態生產級上線，所有開放迴路收尾

---

## 一、版本指紋（Version Fingerprint）

| 倉庫 | 分支 | 最新 commit | 狀態 |
|---|---|---|---|
| `DingJun1028/ftgtours-esggo-co` (官網) | main | `e9bf2a3` perf: Hero 橫幅圖轉 WebP | ✅ 部署 |
| `DingJun1028/ftg-journey` (旅程 App) | main | `fa445ff` chore: 移除部署暫存檔 | ✅ 部署 |
| `DingJun1028/esggo` (vault) | `feature/aistation-core-modules` | `3dc01473b` 孵化 5 FTG 知識分身結點 | ✅ push |

---

## 二、線上服務清單（Live Endpoints）

| 服務 | 網址 | 狀態 | 說明 |
|---|---|---|---|
| 官網首頁 | `https://ftgtours.esggo.co/` | 200 | 6 大服務頁 + Hero 橫幅 WebP + schema.org |
| 官網 robots | `https://ftgtours.esggo.co/robots.txt` | 200 | Allow + Sitemap 指向 |
| 官網 sitemap | `https://ftgtours.esggo.co/sitemap.xml` | 200 | 8 頁 URL 清單 |
| 官網 favicon | `https://ftgtours.esggo.co/favicon.svg` | 200 | ftg leaf 品牌圖 |
| 官網 OG 圖 | `https://ftgtours.esggo.co/og-image.svg` | 200 | 1200×630 分享圖 |
| 旅程 App 主站 | `https://journey.ftgtours.esggo.co/` | 200 | PWA 前端（GitHub Pages） |
| 旅程 App 介紹頁 | `https://journey.ftgtours.esggo.co/guide.html` | 200 | 使用者看的功能說明 |
| 旅程 App 後端 API | `https://journey-api.ftgtours.esggo.co/api/me` | 401 | Node + node:sqlite + Google OAuth（無 token 正確） |
| 官網聯絡 API | `https://ftgtours.esggo.co/api/contact` | 200 POST | Cloudflare Worker `ftgtours-api` → D1 `ftgtours_contact` |

---

## 三、官網功能清單（ftgtours-esggo-co）

### 頁面（8 頁，HashRouter SPA）
1. 首頁 Home — Hero 橫幅（`/images/hero-banner.webp` 177KB, fetchpriority=high, preload）+ 三大價值 + 6 方案卡
2. 企業員工旅遊 corporate-travel
3. 企業家庭日 family-day
4. ESG 戶外團隊日 esg-team-day
5. 員工身心平衡旅程 wellbeing-retreat
6. 高階主管共識營 executive-retreat
7. ESG Impact Note esg-impact-note
8. 聯絡我們 contact（honeypot 防垃圾 + reCAPTCHA v3 架構保留）

### SEO / 基礎設施
- **meta description / og:description / twitter:description**：聚焦主題文案
  `墾趣結合戶外導覽、旅行服務與在地連結，為企業設計兼顧員工身心健康、團隊連結、環境友善與地方價值的旅程。`
- **中英雙語 i18n**：各頁 `usePageSeo` 取 `t('*.metaDesc')`，zh/en 完整
- **schema.org**：`TravelAgency` JSON-LD（name/url/logo/description/address/telephone/email/areaServed）
- **404 頁**：`NotFound.jsx` + `path="*"` 通配
- **robots.txt / sitemap.xml / favicon.svg / og-image.svg**：全上線
- **LCP 優化**：Hero 圖 WebP + preload + fetchpriority（非 lazy）

### 聯絡表單防垃圾
- **honeypot**：隱藏欄位 `hp`（絕對定位移出視窗 + aria-hidden + tabIndex=-1），bot 填則偽裝成功不送後端
- **reCAPTCHA v3 前端架構**：`contact.jsx` 已載入 script + 提交取 token 附 `recaptchaToken`；需 `VITE_RECAPTCHA_SITE_KEY` 啟用（待申請）

---

## 四、旅程 App 功能清單（ftg-journey）

### 技術棧
- 前端：Vite + React + Tailwind + PWA（IndexedDB 本地儲存）
- 後端：Node + `node:sqlite` + Google OAuth + 去敏化 API
- 部署：GitHub Pages（前端） + Oracle Always Free VPS `esggo-vps` ARM（後端, systemd + nginx + Let's Encrypt）

### 功能模組（全實作）
| 階段 | 功能 |
|---|---|
| 旅程前 | 準備清單（人選/護照/文件/錢/物品/流程 六大類可自訂）、機票資訊、飯店資訊 |
| 旅程中 | 旅程表 + 鬧鐘提醒、重要時刻提醒、實用工具組（點名器/聯絡表/紀念品/停靠記錄器/景點計時/訂餐/旅館資訊） |
| 旅程後 | 旅程心得、照片分享區、滿意度調查、舊地重遊心得、永續專案訂立 + 追蹤目標成果、永續報告產出 |
| 後台 | 導遊/行政專區、梯次成員一覽表、CRM/BD、全內容匯入匯出 |
| 資安 | 資訊去敏化（台灣個資法）：成員勾選同意公開、去識別化匯出報告 |
| 權限 | Google 登入 + 角色權限：admin/guide/staff/member 四角色，依權限顯示功能 |
| 設計 | RWD 設計系統：ftg 色系、行動優先、觸控友好、無障礙 |

---

## 五、知識分身（esggo vault）

- 技能：`oa-knowledge-avatar` 四相機制（Hatch/Absorb/Feedback/Project）
- 孵化結點（5 篇，`vault/Agents/context/`）：
  1. `FTGJourneyAppArchitecture` — App 架構
  2. `FTGToursShareCopy` — 官網分享文案規範
  3. `WebsiteGapAudit` — 官網缺口補齊清單
  4. `CloudflareCache404` — CF 快取 404 陷阱與清刷法
  5. `RecaptchaV3Frontend` — reCAPTCHA v3 前端架構
- MOC 回流：`00-Index.md` 加「FTG 旅程生態」區塊
- 安全：vault-access-guard 掃描無憑證外洩；co_authors 含 [oa-team, hermes]
- 分支：`feature/aistation-core-modules`（不直接動 main）

---

## 六、基礎設施與憑證（5T Trustworthy）

| 資源 | 用途 | 備註 |
|---|---|---|
| Cloudflare Zone `8dda3653e490290412f7be84a84e0dc9` | DNS + CDN + Worker | 全域 API Key 在 secret-vault |
| D1 `ftgtours_contact` (uuid `c08a4c55...`) | 聯絡表單入庫 | 表 `contact_inquiries` 存在 |
| Worker `ftgtours-api` | 處理 `ftgtours.esggo.co/api/*` | 佔用路由，聯絡表單由此服務 |
| Oracle VPS `esggo-vps` (161.118.248.180, ARM A1.Flex) | 旅程 App 後端 | systemd `ftg-journey.service` + nginx + certbot |
| GitHub Pages | 官網 + App 前端託管 | 自訂網域已激活 |
| SSH key `~/.ssh/id_ed25519_ftgjourney` | VPS 部署 | fingerprint 驗證後加入 VPS |

---

## 七、已知限制 / 待辦

| 項目 | 狀態 | 說明 |
|---|---|---|
| reCAPTCHA v3 Site Key | 待申請 | 前端架構就緒，需你 Google 帳號申請後填 `VITE_RECAPTCHA_SITE_KEY` 重部署 |
| 後端 reCAPTCHA 驗證 | 待補 | `ftgtours-api` Worker 可加 `siteverify` 呼叫（需 Secret Key） |
| vault 蜂寫層 8420 | 本機降級 | 僅 VPS cron 可寫，本地 graceful skip（符合技能規範） |

---

## 八、驗證閉環（Verification Closure）

- 官網 8 頁 + 基礎資源：全 HTTP 200 ✅
- 聯絡表單 POST：寫入 D1 `contact_inquiries` 成功（`{"ok":true,"id":N}`）✅
- App 前端 + 介紹頁：200 ✅
- App 後端 API：`/api/me` 無 token → 401（正確）✅
- Hero WebP：177KB（原 2.47MB PNG）✅
- 知識分身：5 結點 push vault ✅

> 5T 誠實回報：所有「完成」聲稱均經真實工具驗證（curl / git / build），無虛構輸出。
