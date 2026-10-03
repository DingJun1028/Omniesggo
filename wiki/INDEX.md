# ESGGO Wiki — 系統知識庫

## 目錄

1. [系統概述](#系統概述)
2. [5T 誠信協議](#5t-誠信協議)
3. [MEDCE 分類架構](#medce-分類架構) ← **功能分類導覽**
4. [萬能系統 Omni System](#萬能系統-omni-system) ← **新增：萬能目錄 / 工廠 / 模組**
5. [頁面索引](#頁面索引)
6. [API 端點](#api-端點)
7. [OA 技能組](#oa-技能組)
8. [部署指南](#部署指南)
9. [故障排除](#故障排除)

---

## 系統概述

ESGGO 善向永續是一個企業級 ESG 治理平臺，使用 Next.js 16 + TypeScript 5.3 構建，部署於 Vercel。

### 核心技術

- **前端**: Next.js 16 (App Router) + React 18 + Tailwind CSS 4
- **後端**: Supabase (PostgreSQL) + Firebase
- **AI**: Google Generative AI (Gemini)
- **部署**: Vercel Production
- **設計**: 亮色主題（Berkeley Blue #003262 + Gold #FDB515）

### 生產環境

- **URL**: https://esggo.vercel.app
- **GitHub**: https://github.com/DingJun1028/esggo

---

## MEDCE 分類架構

> **MEDCE** 是 ESGGO 平台採用的五大功能分類維度，對應 ESG 治理生命週期的核心五大能力域。

### 五大分類總覽

| 代碼  | 中文名稱 | 英文名稱        | 核心定義                                                  | 對應治理階段 | 功能頁面數 |
| ----- | -------- | --------------- | --------------------------------------------------------- | ------------ | ---------- |
| **M** | **測量** | **Measurement** | 數據採集、指標定義、KPI 監測、基線建立                    | **量化基礎** | 9 頁       |
| **E** | **評估** | **Evaluation**  | 雙重重大性分析、基準比對、風險評分、策略評析              | **質化分析** | 7 頁       |
| **D** | **揭露** | **Disclosure**  | 報告撰寫、對外發佈、利害關係人溝通、透明度建構            | **對外輸出** | 6 頁       |
| **C** | **合規** | **Compliance**  | 法規遵循、審計追蹤、驗證封印、標準對齊、內控管理          | **信任保證** | 7 頁       |
| **E** | **參與** | **Engagement**  | 利害關係人對話、顧問協作、AI 智能協作、教育培力、任務協同 | **生態共創** | 10 頁      |

> **設計原則**：每個功能頁面可具備**單一主分類**與**多重輔助分類**，反映真實業務場景的複合性。

### 分類導覽

| 分類       | 快速連結                            | 核心頁面                                                                                               |
| ---------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **M 測量** | [測量類功能頁面](#m-測量類功能頁面) | 控制台、環境指揮、社會影響、公司治理、數位分身、商情中心、企業健檢、利害關係人、永續財務               |
| **E 評估** | [評估類功能頁面](#e-評估類功能頁面) | 重大性矩陣、企業健檢、淨零路徑、永續財務、供應鏈透明、永續智庫、專家諮詢                               |
| **D 揭露** | [揭露類功能頁面](#d-揭露類功能頁面) | SustainWrite、報告發佈、永續閱覽室、VerifyLink™、證據金庫、永續智庫                                    |
| **C 合規** | [合規類功能頁面](#c-合規類功能頁面) | 審計日誌、證據金庫、專家模板、專家諮詢、VerifyLink™、系統測試、整合中心                                |
| **E 參與** | [參與類功能頁面](#e-參與類功能頁面) | 永續學院、顧問專區、代理專區、顧問服務、AI整合平台、任務中心、利害關係人、專家諮詢、商情中心、數位分身 |

### 完整功能頁面 MEDCE 對照表

<details>
<summary>📋 展開查看完整 39 頁面分類表</summary>

#### M 測量類 (9 頁)

| 頁面       | 路徑             | 主分類 | 輔助分類 |
| ---------- | ---------------- | ------ | -------- |
| 控制台     | `/`              | M      | E、D     |
| 環境指揮   | `/environmental` | M      | C、D     |
| 社會影響   | `/social`        | M      | C、D     |
| 公司治理   | `/governance`    | M      | C、D     |
| 數位分身   | `/digital-twin`  | M      | E、C     |
| 商情中心   | `/intelligence`  | M      | E        |
| 企業健檢   | `/health-check`  | M      | E、C     |
| 利害關係人 | `/stakeholders`  | M      | E        |
| 永續財務   | `/finance`       | M      | E        |

#### E 評估類 (7 頁)

| 頁面       | 路徑            | 主分類 | 輔助分類 |
| ---------- | --------------- | ------ | -------- |
| 重大性矩陣 | `/materiality`  | E      | M、D     |
| 企業健檢   | `/health-check` | E      | M、C     |
| 淨零路徑   | `/roadmap`      | E      | D、C     |
| 永續財務   | `/finance`      | E      | M、D     |
| 供應鏈透明 | `/supply-chain` | E      | M、C     |
| 永續智庫   | `/library`      | E      | D、M     |
| 專家諮詢   | `/advisory`     | E      | C、E     |

#### D 揭露類 (6 頁)

| 頁面         | 路徑            | 主分類 | 輔助分類 |
| ------------ | --------------- | ------ | -------- |
| SustainWrite | `/editor`       | D      | C、E     |
| 報告發佈     | `/publish`      | D      | E、C     |
| 永續閱覽室   | `/reading-room` | D      | E        |
| VerifyLink™  | `/audit-verify` | D      | C、E     |
| 證據金庫     | `/vault`        | D      | C、M     |
| 永續智庫     | `/library`      | D      | E、M     |

#### C 合規類 (7 頁)

| 頁面        | 路徑            | 主分類 | 輔助分類 |
| ----------- | --------------- | ------ | -------- |
| 審計日誌    | `/audit-log`    | C      | M、D     |
| 證據金庫    | `/vault`        | C      | D、M     |
| 專家模板    | `/templates`    | C      | D、E     |
| 專家諮詢    | `/advisory`     | C      | E、D     |
| VerifyLink™ | `/audit-verify` | C      | D、E     |
| 系統測試    | `/system-test`  | C      | M        |
| 整合中心    | `/api-setup`    | C      | M        |

#### E 參與類 (10 頁)

| 頁面       | 路徑            | 主分類 | 輔助分類 |
| ---------- | --------------- | ------ | -------- |
| 永續學院   | `/academy`      | E      | D、C     |
| 顧問專區   | `/advisors`     | E      | C、D     |
| 代理專區   | `/agents`       | E      | M、C     |
| 顧問服務   | `/consulting`   | E      | D、C     |
| AI整合平台 | `/ai-platform`  | E      | M、C     |
| 任務中心   | `/tasks`        | E      | C、M     |
| 利害關係人 | `/stakeholders` | E      | M、D     |
| 專家諮詢   | `/advisory`     | E      | C、D     |
| 商情中心   | `/intelligence` | E      | M、D     |
| 數位分身   | `/digital-twin` | E      | M、C     |

</details>

### 相關文件

- [MEDCE 分類架構詳細文件](./MEDCE-分類架構.md) — 完整分類定義、衝突解決機制、跨分類整合場景
- [功能總覽](./功能總覽.md) — 原有功能分組視角
- [平台總覽](./平台總覽.md) — 平台整體架構

---

## 萬能系統 Omni System

> **定位：** ESGGO 的「單一真實來源」設計系統。以 **MECE 進化版** 雙軸分類法（MEDCE 治理軸 × OMNI 能力軸）對全部功能頁面分類，再由 [萬能工廠](./萬能目錄.md) 以四族原料組裝出 [萬能模組](./wiki/萬能模組-註冊表.md)。

### 核心文件

| 文件                                        | 說明                                                                 |
| ------------------------------------------- | -------------------------------------------------------------------- |
| [萬能目錄](../萬能目錄.md)                  | 主目錄：MECE 進化版雙軸分類 + 四族原料總表 + 模組索引                |
| [萬能工廠](./wiki/萬能工廠.md)              | 組裝流水線 P1–P7 與 5T 品質閘門                                      |
| [萬能函數](./wiki/萬能函數.md)              | Ω-F：可復用邏輯函數清冊（F-AGENT/TAG/THEME/5T/SEAL/MEAS/EVAL/ASSEM） |
| [萬能元件](./wiki/萬能元件.md)              | Ω-C：原子/分子/生物級 UI 元件（Brand* / Solid Card）                 |
| [萬能主題](./wiki/萬能主題.md)              | Ω-T：設計 Token、5T 色板、主題變體                                   |
| [萬能符文](./wiki/萬能符文.md)              | Ω-R：5T / MEDCE / 狀態 / 封印 / 代理 符文系統                        |
| [萬能模組註冊表](./wiki/萬能模組-註冊表.md) | 29 個唯一功能頁面之 WIKI 式設計與 Ω 組裝規格                         |

> **演進關係：** 舊版 `MEDCE-分類架構.md` 僅含治理單軸；萬能系統在其上疊加 OMNI 能力軸，形成真正互斥且窮盡的雙軸分類。

---

## 5T 誠信協議

5T 協議是 ESGGO 的核心資料治理框架，確保資料從產生到報告的完整信任鏈。

### 五維定義

| 編號 | 中文 | 英文 | 定義 | 驗證方式 |
|------|------|------|------|----------|
| T1 | 真 | Truth | 可感知/具體化 | 資料有明確數值、單位、時間戳 |
| T2 | 善 | Goodness | 可溯源 | 資料有來源標記 |
| T3 | 美 | Beauty | 可追蹤 | 資料有稽覈軌跡 |
| T4 | 信 | Trust | 不可篡改 | 資料有 hash_lock |
| T5 | 通 | Transferful | 可透明驗算 | 資料可通過第三方驗證 |

> ⚠️ 舊版英文命名（Tangible/Traceable/Trackable/Transparent/Trustworthy）已棄用。

### 共享常數

- 檔案：`shared/constants/protocol.ts`
- 元件：`Protocol5TStrip` 顯示 5T 狀態

---

## 頁面索引

### 主要頁面

| 路徑 | 說明 |
|------|------|
| `/` | 首頁（系統入口） |
| `/login` | 登入頁面 |
| `/dashboard` | 治理面板 |
| `/5t-dashboard` | 5T 協議儀錶板 |
| `/sustain-write` | 永續撰寫 |
| `/vault` | 證據金庫 |
| `/value-levels` | 價值階梯 |
| `/alliance` | 聯盟協作 |
| `/zkp-blockchain` | ZKP 區塊鏈封印 |
| `/omni-agent` | OmniAgent 控制檯 |
| `/admin` | 系統管理 |

### 管理功能

| 路徑             | 說明                         |
| ---------------- | ---------------------------- |
| `/admin`         | 系統管理（用戶、角色、金鑰） |
| `/system-status` | 系統狀態                     |
| `/system-test`   | 系統測試                     |

---

## API 端點

### 核心 API

| 端點 | 方法 | 功能 |
|------|------|------|
| `/api/agent` | POST | AI 代理執行 |
| `/api/omni-agent/chat` | POST | AI 對話 |
| `/api/vault/seal` | POST | 文件封印 |
| `/api/vault/verify` | POST | 驗證封印 |
| `/api/omni-core/[id]` | * | OmniCore 核心 |
| `/api/swarm/ws` | WS | 蜂羣通訊 |

### 健康檢查

```bash
curl https://esggo.vercel.app/api/system/health
```

---

## OA 技能組

OA（OmniAgent）技能組位於 `skills/oa/` 目錄。

| 技能                | 觸發詞           | 用途                 |
| ------------------- | ---------------- | -------------------- |
| `oa-summon`         | OA、召喚         | 系統啟動、狀態檢查   |
| `oa-page-builder`   | 建置、建立頁面   | 根據設計規格建立頁面 |
| `oa-5t-enforcer`    | 5T、驗證         | 5T 協議合規驗證      |
| `oa-deploy`         | 部署、上線       | 一鍵部署到 Vercel    |
| `oa-design-fix`     | 顏色跑掉、看不到 | 修復亮色主題問題     |
| `oa-supabase-query` | 查詢、資料       | Supabase 資料查詢    |

### CLI 指令

```bash
npm run oa:summon          # 召喚 OmniAgent（輕量，真實探活 gateway）
npm run oa:summon:core     # 同上 + 實際初始化 OmniCore（--core，約 90s）
esggo status               # 查看系統/閘道健康（CLI 子命令，打 /api/health）
# 註：oa:heal 尚無對外指令；核心具 OmniHealing（seed-vault 修復）但未暴露 CLI/npm 入口
```

---

## 部署指南

### 前置需求

- Node.js 24+
- pnpm 11+

### 安裝

```bash
git clone https://github.com/DingJun1028/esggo.git
cd esggo
pnpm install
```

### 環境變數

複製 `.env.example` 並設定：

```bash
cp .env.example .env
# 編輯 .env 填入必要的 API 金鑰
```

### 本地開發

```bash
pnpm run dev
# http://localhost:3000
```

### 生產部署

```bash
# 建置
pnpm run build

# 部署到 Vercel
vercel deploy --prod --force
```

### 常用指令

```bash
pnpm run build            # 建置
pnpm run test             # 測試
pnpm run typecheck        # 型別檢查
pnpm run lint             # Lint 檢查
```

---

## 故障排除

### Build 失敗

#### framer-motion 錯誤

**症狀**: `Cannot read properties of undefined (reading 'div')`
**原因**: framer-motion 與 Next.js 16 + Turbopack 相容問題
**解決**: 已移除首頁的 framer-motion 依賴

#### pdf-parse 錯誤

**症狀**: `ERR_MODULE_NOT_FOUND: pdf-parse`
**原因**: pdf-parse ESM 相容問題
**解決**: 降級到 pdf-parse@1.1.1

#### ToastContainer 錯誤

**症狀**: `Element type is invalid: expected a string or class/function but got undefined`
**原因**: Tailwind class 拼錯（`shadow-lg -md`）
**解決**: 修復為 `shadow-lg`

### 運行時錯誤

#### 5T 治理保護機制觸發

**症狀**: 顯示「系統發生未預期錯誤」
**原因**: 未捕獲的 JavaScript 錯誤
**解決**: 檢查瀏覽器 Console 取得詳細錯誤訊息

### 金鑰相關

#### API 金鑰額度耗盡

**症狀**: 429 RESOURCE_EXHAUSTED
**解決**: GeminiRotator 會自動切換備用金鑰

#### 金鑰更換功能暫停

**說明**: 手動金鑰更換 UI 暫停使用，自動輪轉不受影響
**位置**: `/admin` → API 金鑰分頁

---

## 更新日誌

### 2026-06-19

- ✅ 首頁完全重作（移除 framer-motion）
- ✅ OmniKpiCard 亮色主題修復
- ✅ ToastContainer 修復
- ✅ 金鑰更換 UI 暫停使用
- ✅ OmniAgent CLI 串接閘道 API
- ✅ OA 技能組建立
- ✅ README 更新
- ✅ WIKI 建立
