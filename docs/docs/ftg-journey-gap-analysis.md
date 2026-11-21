# FTG Journey App — 官網承諾 vs App 功能 缺口矩陣

> 日期：2026-08-29
> 版本：v0.5.0 → v1.0.0 缺口分析

---

## 缺口矩陣總覽

| 官網頁面 | 官網承諾數 | App 已對應 | 缺口數 | 優先級 |
|---------|----------|----------|------|------|
| 企業員工旅遊 | 8 | 3 | 5 | P0 |
| 企業家庭日 | 5 | 1 | 4 | P1 |
| ESG 戶外團隊日 | 6 | 3 | 3 | P0 |
| 員工身心健康 | 8 | 3 | 5 | P1 |
| 高階主管共識營 | 8 | 2 | 6 | P1 |
| ESG Impact Note | 6 | 1 | 5 | P0 |

---

## 詳細缺口分析

### P0 — 核心交付物（必須有）

#### 1. ESG Impact Note 報告系統
- **官網頁面**：esg-impact-note.jsx
- **官網承諾**：活動紀實、數據分析、參與者回饋、ESG 揭露（GRI/SASB）、社群素材、報告下載（PDF/PPT）
- **App 現有**：impact 資料表（基礎指標）
- **缺口**：
  - [ ] 報告產出頁面（ImpactNotePage）
  - [ ] PDF 報告生成
  - [ ] GRI/SASB 框架對應
  - [ ] 參與者回饋收集
  - [ ] 數據視覺化圖表

#### 2. 安全提醒與準備清單
- **官網頁面**：corporate-travel.jsx, esg-team-day.jsx
- **官網承諾**：裝備建議與安全提醒、戶外安全與突發應變
- **App 現有**：prep_items（一般清單）
- **缺口**：
  - [ ] 安全提醒專用分類
  - [ ] 體能分級標籤
  - [ ] 急救 SOP 連結
  - [ ] 裝備檢查清單模板

#### 3. ESG 任務追蹤
- **官網頁面**：esg-team-day.jsx
- **官網承諾**：Clean-up Walk 與生態教育、Impact Note 成果記錄
- **App 現有**：prep_items、impact
- **缺口**：
  - [ ] ESG 任務專用分類
  - [ ] Clean-up Walk 記錄
  - [ ] 碳足跡估算

### P1 — 重要功能（應該有）

#### 4. 家庭日功能
- **官網頁面**：family-day.jsx
- **官網承諾**：親子任務卡、自然觀察記錄、手作活動
- **App 現有**：prep_items
- **缺口**：
  - [ ] 親子任務卡模板
  - [ ] 自然觀察記錄
  - [ ] 照片上傳功能

#### 5. 身心健康功能
- **官網頁面**：wellbeing-retreat.jsx
- **官網承諾**：森林療癒、正念練習、運動負荷分級、數位排毒、30-day follow-up
- **App 現有**：prep_items、schedule、notes
- **缺口**：
  - [ ] 正念練習記錄
  - [ ] 負荷分級標籤
  - [ ] follow-up 追蹤

#### 6. 共識營工具
- **官網頁面**：executive-retreat.jsx
- **官網承諾**：系統思考、跨部門協作、3 年策略願景、團隊信任重建
- **App 現有**：journeys、notes
- **缺口**：
  - [ ] Opportunity Map 畫布
  - [ ] Roadmap 追蹤
  - [ ] 共識記錄工具

### P2 — 加分項目（可以有）

#### 7. 照片與影片管理
- **缺口**：
  - [ ] 照片上傳至伺服器
  - [ ] 影片嵌入
  - [ ] 相簿功能

#### 8. 社群分享
- **缺口**：
  - [ ] 分享到 LINE / Facebook
  - [ ] 產生分享圖片

---

## 實作計畫

### Phase 1: P0 核心（本次執行）

1. **ImpactNotePage** — 報告產出頁面
2. **SafetyChecklist** — 安全提醒元件
3. **EsgTasks** — ESG 任務追蹤

### Phase 2: P1 重要（下次執行）

4. **FamilyTasks** — 家庭日功能
5. **WellbeingTracker** — 身心健康追蹤
6. **ExecutiveTools** — 共識營工具

### Phase 3: P2 加分（未來）

7. **PhotoGallery** — 照片管理
8. **SocialShare** — 社群分享

---

*Generated: 2026-08-29*
*Status: 缺口分析完成，開始實作 P0*
