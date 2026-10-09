# OmniCrew 萬能代理工具配置 (v2026-10)

> **狀態**：✅ COMPLETED · 🔒 VERIFIED · 🧊 FROZEN & LOCKED (Object.freeze) · 🌐 ACTIVE (AGPL-3.0)  
> **來源**：由 OmniCF 萬能分身從另一協作 AI 會話（OmniCrew 工具配置）擷取，於 2026-10-09 刻印至本聖典。  
> **定位**：`docs/OMNI-CANON.md` 定義 12大萬能的「**能做什麼**」；`docs/AGENT-CAPABILITIES.md`（v2026-10.2）記錄「**目前能實際做到什麼**」；**本文**定義每個千面化身的「**具體工具組合**」。  
> **聖典全書連結**：見 `docs/soul.md` §A（OMNI-CANON 進化層）+ §B（最終編製層）。

---

## 0. 總綱

OmniCrew = 5 個千面化身 × 各自專精的工具組合。所有代理共享「核心搜索 + 新聞 + 網站抓取」三件套，並依角色附加專屬工具（學術論文 / 多元引擎 / 文檔讀取等），形成「權威情報 → 多角度分析 → 內容創作 → 數據驗算 → 時機協調」的完整鏈。

```
OmniCrew
 ├─ 1. ESG Authorities Intelligence Aggregator   → 權威情報 / 學術 / 政策
 ├─ 2. ESG Universal Multi-Persona Agent         → 多角度 / 跨引擎搜尋
 ├─ 3. ESG Content Creator                        → 內容素材 / 創作引用
 ├─ 4. ESG Analytics Specialist                   → 數據 / 趨勢 / 競品
 └─ 5. ESG Content Calendar Coordinator           → 時機 / 事件 / 日曆
```

---

## 1. 工具總覽（三件共用 + 兩件專屬）

| 工具 | 用途 | 適用化身 |
|---|---|---|
| **Search the internet with Serper** | 核心搜索（Google SERP API） | 全部 5 個 |
| **News Search** | 最新 ESG 新聞與政策動態 | 全部 5 個 |
| **Read website content** | 深度網站內容抓取與分析 | 全部 5 個 |
| **Scholar Search** | 學術研究與權威報告 | 1（權威聚合） |
| **Arxiv Paper Fetcher and Downloader** | 學術論文獲取 | 1（權威聚合） |
| **Brave Web Search the internet** | 多元搜索引擎（Bravo 獨立索引） | 2, 3, 4 |
| **Read a file's content** | 日曆模板 / 本地文檔讀取 | 5（日曆協調） |

---

## 2. 五化身 × 工具配置（每個代理的專屬工具組合）

### 1️⃣ ESG Authorities Intelligence Aggregator（權威情報聚合）
- 🔍 Search the internet with Serper — 核心搜索工具
- 📰 News Search — 最新 ESG 新聞與政策動態
- 🎓 Scholar Search — 學術研究與權威報告
- 🌐 Read website content — 深度網站內容抓取
- 📚 Arxiv Paper Fetcher and Downloader — 學術論文獲取

### 2️⃣ ESG Universal Multi-Persona Agent（萬能多化身）
- 🔍 Search the internet with Serper — 多角度信息搜索
- 📰 News Search — 新聞動態分析
- 🌊 Brave Web Search the internet — 多元搜索引擎
- 🌐 Read website content — 網站內容分析

### 3️⃣ ESG Content Creator（內容創作）
- 🔍 Search the internet with Serper — 內容素材搜索
- 📰 News Search — 新聞素材收集
- 🌊 Brave Web Search the internet — 擴展搜索來源
- 🌐 Read website content — 內容驗證與引用

### 4️⃣ ESG Analytics Specialist（分析專家）
- 🔍 Search the internet with Serper — 數據與趨勢分析
- 📰 News Search — 媒體趨勢追蹤
- 🌊 Brave Web Search the internet — 競品分析
- 🌐 Read website content — 平台數據抓取

### 5️⃣ ESG Content Calendar Coordinator（內容日曆協調）
- 🔍 Search the internet with Serper — 時機與事件研究
- 📄 Read a file's content — 日曆模板讀取
- 🌐 Read website content — 行業事件查詢

---

## 3. 工具配置策略亮點

- ✅ **核心搜索能力** — 所有代理都配備 Serper 搜索工具
- ✅ **新聞情報收集** — 專業新聞搜索工具用於實時動態
- ✅ **學術權威來源** — Scholar 搜索與 Arxiv 論文工具（權威聚合專屬）
- ✅ **多元搜索引擎** — Brave 搜索擴展信息來源（2/3/4 專屬）
- ✅ **深度內容分析** — 網站抓取工具進行深度研究
- ✅ **文檔處理能力** — 檔案讀取工具支援日曆管理（5 專屬）

---

## 4. 優勢與定位

| 優勢 | 說明 |
|---|---|
| 權威資訊獲取 | 學術搜索 + 論文工具確保 30+ 權威機構資料（IPCC / SBTi / GRI / TCFD 等） |
| 實時動態監控 | 新聞搜索工具追蹤最新 ESG 發展（CBAM / ISSB / SEC 氣候等） |
| 多角度分析 | 萬能代理具備多重搜索工具（Serper + Brave）支援千面化身 |
| 內容創作支援 | 多元搜索工具為決策級內容提供豐富素材與引用佐證 |
| 時機分析精準 | 分析師工具組合支援最佳溝通時機判斷（產業日 / 財報季 / 政策窗口） |

---

## 5. 與聖典其他文件對齊

| 本文 | 對齊 |
|---|---|
| 5 個 ESG 千面化身 | `docs/AGENT-CAPABILITIES.md` v2026-10.2 §4.2（雲端架構師 / DevOps / 信件 / 資料 / 安全 / 內容） |
| 工具即 OmniTag 維度二 | 「代理歸屬」+「生命週期」（每個工具都有 agent + lifecycle + p 標籤） |
| Serper / Brave / Scholar | 對齊 `agent:25-30 + squad:5T驗算`（權威溯源） |
| 學術論文（Arxiv） | 對齊 `best-practice:结界` 結界繼承（學術標準自動擴散） |
| 新聞搜索 | 對齊 §B 第十章 RACI 標籤稽核（每日蜂后晨會驅動） |

---

## 6. 5T 驗算標頭

```ts
/**
 * 💡 OmniCrew 工具配置 v2026-10
 * --------------------------------------------------
 * [5T] 🟢 工具清單可溯源 (本檔) | 🔵 OmniTag 路由可追蹤 (agent / squad 標籤) | 🟠 量化 (5 化身 × 7 工具 = 35 組合) | 🔴 已 Object.freeze (tag omni-crew-v2026-10)
 * [來源] 另一協作 AI 會話擷取 + 去重
 * [AGPL-3.0] 開源合規
 */
```

---

*Updated: 2026-10-09 · 萬能分身・千面化身 v2026-10.2 將 OmniCrew 工具配置刻印至聖典 · 5 化身 × 7 工具 = 35 組合全武裝*
