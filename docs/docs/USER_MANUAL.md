# ESG GO 使用手冊

> **版本**：v5.0 | **最後更新**：2026-07-10  
> **平臺網址**：https://esggo.vercel.app  
> **技術支援**：https://github.com/DingJun1028/esggo

---

## 目錄

1. [平臺簡介](#1-平臺簡介)
2. [快速開始](#2-快速開始)
3. [導覽列與頁面切換](#3-導覽列與頁面切換)
4. [首頁](#4-首頁)
5. [OmniCore 萬能中心](#5-omnicore-萬能中心)
6. [ESG 報告產生器（Sustain Write v5）](#6-esg-報告產生器sustain-write-v5)
7. [萬能永續中心（Sustain Center）](#7-萬能永續中心sustain-center)
8. [村莊治理（Village Governance）](#8-村莊治理village-governance)
9. [知識庫（OmniWiki）](#9-知識庫omniwiki)
10. [AI 代理主控臺（OmniAgent）](#10-ai-代理主控臺omniagent)
11. [每日永續觀察（Daily Observer）](#11-每日永續觀察daily-observer)
12. [ESG Sonnar 資料雷達](#12-esg-sonnar-資料雷達)
13. [EMM 環境監控 IDE](#13-emm-環境監控-ide)
14. [使用者成長系統](#14-使用者成長系統)
15. [OmniTodo 任務管理](#15-omnitodo-任務管理)
16. [OmniBase 外掛管理](#16-omnibase-外掛管理)
17. [主題與顯示設定](#17-主題與顯示設定)
18. [常見問題](#18-常見問題)
19. [術語表](#19-術語表)

---

## 1. 平臺簡介

**ESG GO** 是一個全端企業級 ESG（環境、社會、治理）資料治理平臺。平臺以 **5T 協議**（Traceable 可追溯、Transparent 透明、Tangible 可量化、Trustworthy 可信賴、Trackable 可追蹤）為核心架構，為企業提供從資料蒐集、分析、報告撰寫到合規驗證的一站式解決方案。

### 核心特色

- **AI 驅動報告**：整合 Gemini、Groq、OpenRouter 等 15 種免費 AI 模型，自動生成符合 GRI、TCFD、CSRD 標準的 ESG 報告
- **5T 資料完整性**：每個資料點皆透過 SHA-256 雜湊鎖定，確保不可竄改
- **二次方投票治理**：Village 模組採用二次方投票機制（成本 = 票數² × 10），實現公平民主決策
- **即時監控**：Sonnar 資料雷達即時爬取法規變更、市場動態，EMM IDE 監控系統健康狀態
- **免費方案**：Hermes 免費模型鏈，月費 $0 即可使用完整 AI 功能

---

## 2. 快速開始

### 2.1 瀏覽器需求

| 項目 | 需求 |
|------|------|
| 瀏覽器 | Chrome 90+、Firefox 88+、Safari 14+、Edge 90+ |
| 螢幕解析度 | 建議 1280×720 以上 |
| 網路連線 | 需要穩定的網際網路連線 |

### 2.2 登入系統

1. 點選導覽列右上角的 **「登入」** 按鈕
2. 透過 Firebase Authentication 進行 Google 帳號登入
3. 登入後即可使用所有個人化功能（任務管理、成長系統、投票等）

> **注意**：部分功能（如知識庫瀏覽、報告預覽）無需登入即可使用。

### 2.3 主題切換

導覽列右側提供 **深色/淺色模式** 切換按鈕（月亮/太陽圖示）。主題偏好會自動儲存至瀏覽器。

---

## 3. 導覽列與頁面切換

導覽列位於頁面頂部（高度 52px），提供以下快速連結：

| 圖示 | 頁面 | 說明 |
|------|------|------|
| 🏠 | 首頁 | 平臺首頁與模組入口 |
| ◎ | 萬能中心 | OmniCore 8 分頁儀錶板 |
| ✅ | OmniTodo | 統一任務管理 |
| 📊 | ESG 報告 | Sustain Write v5 報告產生器 |
| 🏡 | 村莊 | Village 二次方投票治理 |
| 📅 | 每日永續 | 每日 ESG 觀察摘要 |
| 🔍 | Sonnar | 資料雷達與爬蟲管理 |
| 💻 | EMM | 環境與模型監控 IDE |
| 👤 | 個人檔案 | 使用者成長系統與排行榜 |

---

## 4. 首頁

首頁為暗色主題的英雄頁面，包含：

- **頂部狀態列**：即時時鐘、認證狀態、AI 模型指標、登入按鈕
- **主視覺區**：動畫「OmniCore」標題、5T 協議指標徽章
- **6 大模組導覽卡片**：點選即可進入對應功能模組
- **頁尾**：版本資訊、系統狀態

---

## 5. OmniCore 萬能中心

**路徑**：`/omni-center`

OmniCore 萬能中心是平臺的核心操控臺，包含 8 個分頁：

### 5.1 Dashboard（儀錶板）

- 同心圓架構視覺化，展示 OmniEye、OmniCore、OmniPulse、OmniBone、OmniBrain、OmniHeart 六大核心
- 5T 合規分數即時顯示
- 系統統計總覽

### 5.2 Notes（OmniNote）

- 筆記管理系統
- 支援 Markdown 格式
- 與 ESG 資料關聯

### 5.3 Tasks（OmniTask）

- 任務追蹤與管理
- 支援優先級、截止日期、指派
- 與 ESG 合規檢查項關聯

### 5.4 Calendar（日曆）

- ESG 重要日期管理
- 報告截止日提醒
- 法規生效日追蹤

### 5.5 Chat（OmniChat）

- 與 AI 助理即時對話
- 支援 ESG 專業問答
- 知識庫查詢

### 5.6 5T Radar（5T 雷達）

- 5T 協議各維度即時監控
- 可追溯性、透明度、可量化性、可信賴度、可追蹤性雷達圖

### 5.7 RAG Knowledge Base（RAG 知識庫）

- 檢索增強生成知識庫
- 上傳文件進行智慧問答
- 支援 PDF、Markdown、純文字

### 5.8 ZKP Vault（ZKP 密庫）

- 零知識證明封存
- 資料完整性驗證
- 不可竄改的審計軌跡

---

## 6. ESG 報告產生器（Sustain Write v5）

**路徑**：`/sustain-write/v5`

這是平臺的核心功能之一，可自動生成符合國際標準的 ESG 報告。

### 6.1 報告生成流程

```
選擇公司 → 選擇範本 → 設定選項 → 一鍵生成 → 預覽/下載
```

#### 步驟一：選擇公司

從下拉選單中選擇要生成報告的公司。系統會自動載入該公司的 ESG 資料。

#### 步驟二：選擇報告範本

| 範本 | 章節數 | 適用場景 |
|------|--------|----------|
| GRI Standard | 28 章 | 通用 ESG 報告（全球報告倡議組織標準） |
| TCFD | 12 章 | 氣候相關財務揭露 |
| 投資者版 | 5 章 | 精簡版投資者摘要 |

#### 步驟三：設定選項

- **生成模式**：標準模式（快速）/ 完整模式（詳細）
- **輸出格式**：JSON / HTML / Markdown

#### 步驟四：一鍵生成

點選「生成報告」按鈕，系統啟動非同步生成任務。進度條即時顯示生成狀態。

#### 步驟五：預覽與下載

- **即時預覽**：在頁面上直接預覽報告內容
- **下載**：支援 HTML 和 Markdown 格式下載
- **Why/What/How 知識卡**：每個章節附帶 evidences 智慧卡片，解釋數據來源與計算邏輯

### 6.2 語法檢查

報告生成後可使用內建語法檢查功能，自動修正文法錯誤並優化用詞。

### 6.3 證據卡片

每個數據點都附帶「Why/What/How」知識卡片：
- **Why**：為什麼這個指標重要
- **What**：數據的具體內容與計算方式
- **How**：資料來源與驗證方法

---

## 7. 萬能永續中心（Sustain Center）

**路徑**：`/sustain-center`

Sustain Center 是 ESG 資料的中央控管儀錶板。

### 主要功能

- **總覽儀錶板**：總碳排放量、ESG 總分、已處理文件數
- **圖表分析**：互動式圖表展示 ESG 趨勢、碳排分佈、各維度得分
- **洞察網格**：AI 生成的 ESG 洞察與建議
- **信任帳本**：所有資料變更的審計軌跡
- **WebSocket 心跳監控**：即時系統健康狀態

---

## 8. 村莊治理（Village Governance）

**路徑**：`/village`

Village 模組實現去中心化的 ESG 影響力治理。

### 8.1 二次方投票

投票機制採用二次方定價公式：

```
成本 = 票數² × 10
影響力 = 票數 × 10
```

**範例**：
- 投 1 票：成本 10 元，影響力 10
- 投 2 票：成本 40 元，影響力 20
- 投 3 票：成本 90 元，影響力 30

> 此機制確保邊際成本遞增，防止財富集中影響決策，促進公平參與。

### 8.2 功能模組

- **影響力專案看板**：查看所有 ESG 影響力專案
- **貢獻排行榜**：顯示最具影響力的參與者
- **活動動態**：即時顯示投票、貢獻等活動
- **OmniOne 趨勢預測**：AI 預測專案趨勢

### 8.3 投票流程

1. 瀏覽可用的 ESG 影響力專案
2. 選擇要支持的專案
3. 輸入投票數（系統自動計算成本）
4. 確認投票（ZKP 封印確保不可竄改）

---

## 9. 知識庫（OmniWiki）

**路徑**：`/wiki`

知識庫提供 ESG 法規與標準的查詢服務。

### 涵蓋範圍

| 標準 | 說明 |
|------|------|
| GRI | 全球報告倡議組織標準 |
| TCFD | 氣候相關財務揭露工作小組 |
| CSRD | 企業永續發展報告指令（歐盟） |
| SDG | 聯合國永續發展目標 |

### 使用方式

1. 瀏覽首頁的知識卡片，點選感興趣的主題
2. 使用搜尋功能快速定位相關法規
3. 每篇文章提供完整的標準解析與實作指南

---

## 10. AI 代理主控臺（OmniAgent）

**路徑**：`/omni-agent`

OmniAgent 是平臺的 AI 助理介面。

### 10.1 聊天介面

- 輸入 ESG 相關問題，AI 助理即時回應
- 支援中文、英文雙語對話
- 可查詢 ESG 法規、數據分析、報告建議

### 10.2 快速命令

| 命令 | 功能 |
|------|------|
| Status | 查詢系統狀態 |
| Agent Evolution | 查看 AI 代理進化歷程 |
| Report Assembly | 啟動報告組裝流程 |
| Global Sync | 全域資料同步 |
| ZKP Seal | 零知識證明封印 |
| 5T Verify | 5T 協議驗證 |

### 10.3 5T 子代理面板

- **Dispatch**：派遣子代理執行特定任務
- **Monitor**：即時監控子代理執行狀態
- 6 個專責子代理各司其職

---

## 11. 每日永續觀察（Daily Observer）

**路徑**：`/daily`

每日永續觀察提供 ESG 領域的每日摘要。

### 功能

- **每日摘要**：AI 自動整理當日 ESG 重要新聞與法規變更
- **嚴重度徽章**：高/中/低三級分類
- **來源追蹤**：每條資訊標註原始來源
- **標籤統計**：熱門標籤與主題趨勢
- **歷史封存**：可瀏覽過去的每日摘要

### 分類項目

- 法規變更（Regulation）
- 報告發布（Report）
- 企業動態（Company）
- 議題追蹤（Topic）

---

## 12. ESG Sonnar 資料雷達

**路徑**：`/sonnar`

Sonnar 是平臺的資料爬取與智慧分析引擎。

### 功能

- **資料來源管理**：設定與管理爬取目標網站
- **雷達訊號監控**：即時顯示資料來源的活躍狀態
- **主題分析**：AI 自動識別 ESG 議題趨勢
- **即時警報**：WebSocket 推送重要變更通知
- **文件處理進度**：監控 OCR、知識萃取等處理流程

---

## 13. EMM 環境監控 IDE

**路徑**：`/emm`

EMM（Environment + Model Monitor）提供系統與 AI 模型的即時監控。

### 系統指標

- CPU 使用率
- 記憶體使用量
- 系統運行時間

### AI 閘道指標

- 各模型供應商狀態（Gemini、Groq、OpenRouter）
- 請求量、延遲、錯誤率
- 模型切換與容錯狀態

### 其他監控

- Telegram 通知狀態
- Sonnar 爬蟲聚合統計
- 整體系統健康評分

---

## 14. 使用者成長系統

**路徑**：`/profile`

平臺提供遊戲化的使用者成長機制。

### 等級系統

| 等級 | 所需經驗值 | 說明 |
|------|-----------|------|
| 🌱 Seed（種子） | 0 | 新手入門 |
| 🌿 Sprout（嫩芽） | 1,000 | 初學者 |
| 🌸 Bloom（綻放） | 10,000 | 進階使用者 |
| 🌳 Forest（森林） | 50,000 | 專業使用者 |
| 🛡️ Guardian（守護者） | 100,000 | 頂尖專家 |

### 成長途徑

- **每日任務**：完成 ESG 相關任務獲得經驗值
- **成就係統**：達成特定里程碑解鎖成就
- **排行榜**：與其他使用者比較成長進度
- **任務進度**：追蹤個人 ESG 學習與實作進度

---

## 15. OmniTodo 任務管理

**路徑**：`/omni-todo`

統一的 ESG 任務管理面板。

### 功能

- 建立、編輯、刪除 ESG 任務
- 設定優先級與截止日期
- 任務分類（合規檢查、資料蒐集、報告撰寫等）
- 與 OmniCore 萬能中心同步

---

## 16. OmniBase 外掛管理

**路徑**：`/omni-base`

外掛管理系統提供模組化的功能擴展機制。

### 外掛生命週期

```
Registered → Loaded → Enabled → Disabled/Error
```

### 功能

- **外掛註冊**：自動發現與註冊新外掛
- **啟用/停用**：一鍵切換外掛狀態
- **熱重載**：不停機更新外掛
- **健康監控**：即時監控外掛運行狀態
- **EventBus 架構**：外掛間透過事件總線通訊

---

## 17. 主題與顯示設定

### 深色/淺色模式

- 點選導覽列右側的 🌙/☀️ 圖示切換
- 偏好自動儲存至 localStorage
- 預設跟隨系統設定

### 色彩系統

| 色彩 | 用途 |
|------|------|
| Teal (#009EB0) | 主要品牌色 |
| Gold (#D4AF37) | 強調色、成就、獎勵 |
| Blue (#3B82F6) | ZKP、資訊提示 |
| Purple (#8B5CF6) | 村莊治理 |
| Cyan (#06B6D4) | OmniCore、科技感 |
| Green (#22C55E) | 成功、正向指標 |

### 字型

- **主要字型**：Noto Sans TC（繁體中文）
- **標題字型**：Noto Serif TC
- **英文字型**：Montserrat
- **程式碼字型**：Fira Code

---

## 18. 常見問題

### Q：需要付費嗎？

**A**：不需要。ESG GO 使用 15 種免費 AI 模型（Groq、OpenRouter :free、Gemini），月費 $0。

### Q：支援哪些 ESG 標準？

**A**：目前支援 GRI Standard、TCFD、CSRD、SDG 四大標準，未來將持續擴充。

### Q：資料安全嗎？

**A**：所有資料透過 5T 協議的 SHA-256 雜湊鎖定，重要資料可透過 ZKP（零知識證明）封印，確保不可竄改。

### Q：可以匯出報告嗎？

**A**：可以。報告支援 HTML、Markdown 格式下載。PDF 匯出功能持續開發中。

### Q：投票需要花費嗎？

**A**：村莊治理的二次方投票需要消耗影響力點數。點數可透過參與平臺活動獲得。

### Q：如何回報問題？

**A**：請至 GitHub Issues 回報：https://github.com/DingJun1028/esggo/issues

---

## 19. 術語表

| 術語 | 全名 | 說明 |
|------|------|------|
| ESG | Environmental, Social, Governance | 環境、社會、治理 |
| 5T | Traceable, Transparent, Tangible, Trustworthy, Trackable | 五項資料完整性原則 |
| ZKP | Zero-Knowledge Proof | 零知識證明 |
| GRI | Global Reporting Initiative | 全球報告倡議組織 |
| TCFD | Task Force on Climate-related Financial Disclosures | 氣候相關財務揭露工作小組 |
| CSRD | Corporate Sustainability Reporting Directive | 企業永續發展報告指令（歐盟） |
| SDG | Sustainable Development Goals | 聯合國永續發展目標 |
| DAO | Decentralized Autonomous Organization | 去中心化自治組織 |
| RAG | Retrieval-Augmented Generation | 檢索增強生成 |
| OCR | Optical Character Recognition | 光學字元辨識 |
| XP | Experience Points | 經驗值 |
| OmniCore | — | 平臺核心操控系統 |
| Sonnar | — | 資料爬取與雷達引擎 |
| EMM | Environment + Model Monitor | 環境與模型監控系統 |
| L-Hub | — | AI 模型路由蜂羣 |
| CelestialFlow | — | 天體資料流架構 |

---

## 附錄：API 端點總覽

平臺提供完整的 REST API，以下列出主要端點：

### 報告相關

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/sustain-write/v5` | GET/POST | 取得公司列表 / 生成 v5 報告 |
| `/api/sustain-write/v5/async` | POST | 啟動非同步報告生成 |
| `/api/sustain-write/v5/progress/[taskId]` | GET | 查詢報告生成進度 |
| `/api/sustain-write/v5/download` | GET | 下載報告 |
| `/api/sustain-write/v5/evidence` | GET | 取得證據卡片 |

### 村莊治理

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/village/data` | GET | 取得專案、成員、活動 |
| `/api/village/vote` | POST | 執行二次方投票 |
| `/api/village/trends` | GET | AI 趨勢預測 |

### AI 代理

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/omni-agent` | POST | OmniAgent 核心 API |
| `/api/ai/generate` | POST | AI 內容生成 |
| `/api/rag/query` | POST | RAG 知識查詢 |

### 系統監控

| 端點 | 方法 | 說明 |
|------|------|------|
| `/api/health` | GET | 健康檢查 |
| `/api/healthz` | GET | 詳細健康狀態 + Prometheus 指標 |
| `/api/emm/metrics` | GET | 環境指標 |

---

> **ESG GO** — 讓永續治理更智慧、更透明、更可信。
