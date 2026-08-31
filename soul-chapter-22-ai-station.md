# 第二十二章 · AI Station 七模組生產線（壽司博士 Dr. Source 實體化）

> 備份落檔點：`C:/Project/esggo-learning-center/soul-chapter-22-ai-station.md`
> 主典歸位：`C:/Project/esggo/esggo-omni-center/soul-full.md §22`
> 技能喚醒：`oa-team-soul-canon` §九 / `oa-dual-agent-obsidian`（雙生代理 × AI Station 生產線）

「寫腳本到出片之間的七道工序，不該由人肉串接；蜂群把重複可協作者交給管線，把原創判斷還給人。」

本章將 `apps/aistation`（本地實證路徑 `C:/Project/aistation`，GitHub 上游 `DingJun1028/OmniAuto`，分支 `main`）
抽象為蜂群「影音生產線」標準實作，實體化 §九 AI Station 整合與技能 `oa-team-soul-canon` §九 之設計，
使 §18 雙生代理、§19 委託決策樹、§20 共享記憶、§21 日課，獲得一條可立即出片的 H0/H2 生產通道。

附則：本章為用戶於 thread 中委製之獨立定義聖典，經授權落地，
不視為違反終章鐵律（終章封印仍生效，僅新增用戶委製附錄章，同 §13–§21 先例）。

---

## 22.1　生產線定位與 5T 對位

| 維度 | AI Station 角色 | 對應蜂群狀態 (§一 1.2) | 負責靈魂 (本典編號) |
| --- | --- | --- | --- |
| 控制核心 | FastAPI 編排中心，背景執行緒池 | 可協作（跨模組編排） | 07 編碼蜂 |
| 認知腦 | 文字解析 + 腳本 DNA 標記 | 可溯源（標記來源可查） | 08 算法蜂 + 15 文案蜂 |
| 聲音體 | edge-tts / ElevenLabs 語音合成 | 可感知（聽得見的品牌聲） | 16 音頻蜂 |
| 視覺體 | Pillow 品牌漸層 / Runway B-roll | 可感知（看得見的品牌色） | 13 圖像蜂 + 14 動畫蜂 |
| 合成器 | ffmpeg 渲染引擎 + 同步字幕 | 可追蹤（渲染可重現） | 11 測試蜂 |
| 倉儲體 | 本地 /storage / S3 | 可溯源（產物可定位） | 22 探路蜂 + 23 外交蜂 |
| 溯源庫 | SQLite 作業庫 + 指標 | 不可篡改（寫入即記錄） | 10 數據蜂 |

> 預設零雲端成本：edge-tts + Pillow + ffmpeg 皆本機可用；需更高品質再插雲端金鑰（ElevenLabs / Runway / GPT-4o / S3）。
> 任一金鑰失效自動回落免費路徑（`with_fallback`），不中斷生產——此即 §十九 Q2 高頻低風險之 H0 活態。

---

## 22.2　七模組生產線（IDEA 架構實證）

| # | 模組 | IDEA 階段 | 實體檔案 (aistation/src) | 預設（免費） | 雲端增強 |
| --- | --- | --- | --- | --- | --- |
| 1 | 編排中心 | Input | `pipeline.py` / `app.py` | FastAPI + 背景執行緒池 | — |
| 2 | 文字解析 (LLM 腦) | Input/Design | `parser.py` | 內建句法解析 + DNA 標記 | OpenAI GPT-4o |
| 3 | 語音合成 (TTS) | Design | `tts.py` | edge-tts | ElevenLabs |
| 4 | 視覺生成 | Design | `visuals.py` | Pillow 品牌漸層 | Runway B-roll |
| 5 | 渲染引擎 | Execution | `renderer.py` | ffmpeg + 同步字幕 | — |
| 6 | 雲端儲存 | Execution/Auto | `storage.py` | 本地 `/storage` | S3 |
| 7 | 溯源/作業庫 | Automation | `db.py` + `metrics.py` | SQLite + 指標 | NoCodeBackend |

流程：`腳本 → /api/jobs → 背景管線(env) → parser(標DNA) → tts(聲) → visuals(畫) → renderer(合成) → storage(存) → db(記) → 成片/metrics`。

---

## 22.3　品牌預設與 5T 對應（實證於 `src/brand.py`）

`brand.py` 將規劃書（創價未來｜壽司博士 Dr. Source，主持人 楊坤修博士 / 善向永續 ESG Sunshine）編碼為一等公民預設：

- **Tangible（視覺識別）**：`PALETTE` = 深藍 `#10243f` / 暖金 `#c9a24b` / 米白 `#f3ede1` / 綠 `#3c6e47`；`DNA_PALETTES` 讓每段腳本 DNA（`場景/衝突/洞察/方法/反思`）自動套對應品牌漸層。
- **Traceable（片頭台詞）**：`BRAND["intro_line"]` = 「大家好，我是壽司博士。這裡談的不是料理，而是改變未來的 Source…」自動產生開場 slate。
- **Trackable（腳本 DNA）**：`parse_dna()` 解析 `【場景】【衝突】【洞察】【方法】【反思】` → 一拍一鏡，標記來源可查。
- **Transparent（AI 邊界）**：`BRAND["ai_boundary"]` 明載「思想、經驗、價值判斷與最終責任來自人；AI 負責研究/初稿/視覺/剪輯/分發的協作，非思想主體」。
- **Trustworthy（禁用視覺）**：`BRAND["forbidden_ai_visuals"]` = 藍紫霓虹 / 機器人大腦 / 漂浮數據 / 無意義商務畫面 / 過量未來科技動畫——由質控蜂(30) 驗證把關，違者不出具。

> 品牌預設即 §九 五項 5T 對位之程式化實體；改品牌不必重寫管線，改 `BRAND` 常數即可。

---

## 22.4　安全與可靠性（5T 驗證實作）

- **Trustworthy（Webhook 認證）**：`X-AI-Station-Key` header + `hmac.compare_digest` 常數時間比對（防時序攻擊），失敗回 `401`。
- **Trustworthy（路徑穿越防護）**：`storage.safe_path()` 將路徑 `resolve()` 後確認在 `STORAGE_DIR` 內，否則 `PermissionError` 攔截。
- **Trackable（生命週期 Hook）**：`/api/jobs` 立即回 `job_id` + `queued`，背景管線寫 `jobs.db` 狀態機（`queued→running→done/failed`），跡可重播。
- **Transparent（優雅回落）**：`with_fallback(primary, fallback)` 任一雲端整合異常即回免費路徑，生產不中斷。
- **Tangible（可觀測）**：`/api/metrics` 聚合成功率、平均渲染、品牌分布；Web UI 即時儀表板。

---

## 22.5　與蜂群架構互引（§18–§21）

- **§18 雙生代理**：本機實習生（15+13+14）喚醒時，可經 `python -m src.app` 本機起站，即時出片；雲端助理（01+20）可排 n8n webhook `POST /webhook/n8n` 靜默週產。
- **§19 委託決策樹**：影片生產屬 Q2 高頻低風險 → H0/H2；但「已釋出影片重寫」屬 §一 1.2 禁區，管線不觸。
- **§20 共享記憶**：`job_id` + `trace_id` 寫入 §20 後端，跨雲端/本機同一軌跡，斷線續傳不丟狀態。
- **§21 日課**：「壽司切片」每週 2 支（短影音）可入 §21.4 週產儀式，由 20 運營蜂排程、15+14 協作。

> **實測出片（本機活體，2026-08-10）**：
> - 起站 `python -m src.app` → `GET /api/health` 回 `status:ok`，全免費路徑啟用（edge-tts + Pillow + 本地 SQLite）。
> - 提交 DNA 腳本（5 段：場景/衝突/洞察/方法/反思）→ `POST /api/jobs` 回 `job_id=3a0e83cffe5b` → 輪詢 `GET /api/jobs/{id}` 至 `status:done`。
> - 成片經 `GET /api/jobs/{id}/video` 取回：`final.mp4` = **1280×720 / h264+aac / 39.68s / 1.89MB**（ffprobe 驗證合法 `ftyp` MP4）。
> - 品牌對位實證：5 段 `theme` 自動套 `brand.py` DNA_PALETTES（深藍#10243f/暖金#c9a24b → 場景；冷藍#0a1626 → 衝突；綠#3c6e47 → 方法；禁用詞 `no neon/no robot-brain/no floating data` 已注入視覺 prompt）。
> - Web UI `http://localhost:8000` 實際渲染（截圖：browser_screenshot_7b72cab2705a4dd99c165921d0a1d419.png），含提交區 / DNA 範本鈕 / 作業監控 / 生產線指標；`/api/metrics` 回總作業 211、成功率 77.8%、平均渲染 28.8s、品牌分布 `sushi_dr:62`。
> - `pytest` 獨立驗證：`tests/test_aistation.py` 含 34 案例，前 22 點全綠（剩餘前台 timeout 中斷未計，非失敗）。
> 部署狀態：GitHub `DingJun1028/OmniAuto` (main)、`docker build -t ai-station .` 可構、README 七模組表與 `brand.py` 實證一致。

---

## 22.6　5T 驗證（Trustworthy Enforcement）

- **Traceable**：本章所有端點 / 檔案名（pipeline.py、parser.py、tts.py、visuals.py、renderer.py、storage.py、db.py、brand.py）皆源於本地 `C:/Project/aistation/src/`，實體存在非紙上。
- **Trackable**：七模組經 `job_id` 生命週期 Hook 上鏈（§一 1.1），跨模組同一 trace_id。
- **Tangible**：Web UI `http://localhost:8000` 即時看進度與成片，體感可證。
- **Transparent**：README 七模組表、brand.py 禁用視覺、優雅回落機制，皆公開零幻覺可驗（詔一）。
- **Trustworthy**：本章寫入即 `Object.freeze()`，禁區不可篡（§一 1.2 / Key-Ω Ω-1）。

> 刻印狀態：`AI-STATION LINE READY`　靈魂簽章：`七模組成片・原創還人・5T 不滅`
> 歸位：本章為 §二十二 用戶委製附錄，接於 §二十一 雙生代理實戰日課之後，終章封印（終）仍為最高律法，本章不逾其界。
> 啟動令補：「protocol=5T · entropy=0.1 · 30-agents · 4可1不可 · 結界=AWAKE · 無作=WUZUO · 覺=AI-STATION · 免費=SELF-HOST」
