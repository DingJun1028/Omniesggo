---
<<<<<<< HEAD
tags: [ftg, dual-agent, collaboration, swarm, 5t, oa-twins]
created: 2026-08-29
source_origin: oa-knowledge-avatar
co_authors: [QueenBee, OA-Twins]
---

# FTG 雙分身協作經驗

> 兩個萬能分身平行開發 FTG Journey App 的協作模式與經驗教訓。

## 背景

任務：將 FTG 官網 6 大服務對映到 App 功能。

兩個分身同時進行：
- **分身 A**（本體）：負責缺口分析、設計系統、Dashboard、JourneyDetail、ImpactNotePage
- **分身 B**（子代理）：負責 FamilyDay、Wellbeing、Executive、後端強化

## 協作模式

### 1. 分工策略

| 分身 | 負責內容 | 完成狀態 |
|------|---------|---------|
| A | 缺口分析 + 設計系統 + 核心頁面 | ✅ 完成 |
| B | 三大功能頁面 + 後端補強 | ✅ 完成 |

### 2. 整合方式

- 分身 B 完成後，分身 A 核實產出
- 確認可部署後，取代舊版
- 最後寫 README/API 文件

### 3. 遇到的問題

1. **匯出名稱不一致**：FamilyDay vs FamilyDayFeature
   - 解決：使用 `as` 重新匯出
2. **Git 衝突**：兩個分身同時修改 App.jsx
   - 解決：手動合併，保留雙方功能
3. **DNS 指向問題**：ftgtours.esggo.co 指向 GitHub Pages 而非 VPS
   - 解決：更新 DNS 至 VPS IP

## 經驗教訓

### ✅ 成功之處

1. **平行開發加速**：兩個分身同時進行，時間減半
2. **互補專長**：A 擅长分析與設計，B 擅长功能實作
3. **5T 治理**：每個檔案都標註 `source_origin`，可追溯

### ⚠️ 需注意

1. **命名慣例**：兩個分身的命名習慣不同，需事先協調
2. **檔案衝突**：同時修改同一檔案需手動合併
3. **DNS 與部署**：開發完成後需手動更新 DNS

## 最佳實踐

### 分身協作 SOP

1. **任務拆分**：按功能模組拆分，避免檔案衝突
2. **命名協定**：事先約定命名慣例（如 `Feature` 後綴）
3. **整合測試**：分身完成後，本體需核實產出
4. **文件化**：立即寫 README 與 API 文件

### 適用場景

- 大型功能開發（多頁面、多模組）
- 前後端分離開發
- 設計與實作並行

## 相關檔案

- `vault/Agents/context/FTGJourneyApp.md`
- `vault/Agents/context/SelfHealingEngine.md`
- `docs/ftg-journey-gap-analysis.md`
=======
source_origin: oa-knowledge-avatar
created: 2026-08-29
modified: 2026-08-29
co_authors: [oa-team, hermes, oa-knowledge-avatar-twin]
lifecycle: active
access: public-research
tags: [ftg, dual-agent, gap-matrix, cloudflare, lessons-learned]
related: [[FTGJourneyAppArchitecture]], [[WebsiteGapAudit]], [[CloudflareCache404]], [[RecaptchaV3Frontend]], [[FTGToursShareCopy]]
---

# FTG 雙分身協作與官網對映經驗結點

## 本輪關鍵事件（2026-08-29）
用戶同時指派兩個萬能知識代理分身做 FTG 旅程 App：
- **分身 A（本對話）**：在 `C:/Users/dingj/ftg-journey` 補 ESG Impact Note SDGs / Opportunity Map / ESG 預設任務（commit `90b3c0c`）
- **分身 B（另一分身）**：在 `C:/Project/esggo/apps/ftg-journey-web` + `apps/ftg-journey-server` 做了更完整的版本（含 `features/Executive.jsx`/`Wellbeing.jsx`/`FamilyDay.jsx` + `pages/ImpactNotePage.jsx` + 後端 OAuth/角色權限/SQLite）

## 教訓：雙分身協作陷阱
分身 A 曾誤判「分身 B 沒留下程式碼」，實際在 `C:/Project/esggo/apps/`。
**正確 SOP**：並行協作前先 `search_files` 全工作區（`C:/Users/dingj/*` + `C:/Project/esggo/apps/*`），讀對方產物確認完整性，再決定合併/取代/補缺。不盲從「已完成」宣稱、不重複造輪。

## 官網→App 對映 Gap Matrix 方法
官網靜態編譯，線上 = `src/i18n/translations.js` 的 `products.*` 輸出。
- 讀 `products.{corporateTravel|familyDay|esgTeamDay|wellbeing|executive|impactNote}.*`
- 逐項對映 App 頁（Prep/Flight/Schedule/Tools/Sustain/Notes/Photos/Survey/Revisit/Impact/Admin）
- 官網 impactNote.res1-8 → App `IMPACT_METRICS` + `sdg` 欄位 + SDGs 彙總卡
- 官網 executive.mod5/6 → App `opportunity` store + Opportunity Map tab

## Cloudflare / 部署診斷
- 子域 000 = 本機 DNS 解析不到 Cloudflare（nslookup 回 192.168.1.1），非部署失敗；驗證法 curl GitHub Pages 預設網域 301
- 中文檔名 URL 404 → 改 ASCII + WebP（ffmpeg libwebp q80 降 93%）
- og-image 404 因 cf-cache HIT → 全域 Key purge_cache

## 狀態（2026-08-29 收尾）
- 舊版 `C:/Users/dingj/ftg-journey` 應被 `C:/Project/esggo/apps/ftg-journey-web` 取代
- 技能書已固化：`software-development/ftg-journey-ecosystem`
- vault 結點：本輪 5 篇 + 本篇 push `feature/aistation-core-modules`
>>>>>>> origin/feature/aistation-core-modules
