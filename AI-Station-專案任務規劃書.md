# AI Station × 壽司博士 Dr. Source — 專案任務規劃書

> 文件版本：v1.0　｜　產出日期：2026-08-09　｜　規劃負責人：default（規劃代理人）
> 對應規格：soul.md §9「AI Station 與壽司博士 Dr. Source 專案整合」＋ `C:\Project\aistation\README.md` / `PROPOSAL.md`
> 執行框架：OA-Team 30 萬能蜂群（5T 協定、30 矩陣、協作缺口補齊）

---

## 0. 規劃範疇聲明（重要）

原始 Kanban 卡片僅含標題「專案任務規劃」，無任何專案說明。本規劃書以**當前對話上下文與本機確認存在的專案**中，唯一具備完整目標／範疇／約束的標的為對象：

**AI Station 全自動影音生產線 × 創價未來｜壽司博士 Dr. Source**（主持人 楊坤修博士／善向永續 ESG Sunshine）。

此標的已於 `C:\Project\aistation` 落地（FastAPI + ffmpeg + edge-tts + Pillow，28 測試通過，docker 映像就緒），且 soul.md §9 已定義 7 模組生產線、5T 品牌預設、P0/P1/P2 優先序與 OA-Team 角色對照。

⚠️ **這是一個規劃假設**。若原意係其他專案，請於「待確認事項」回覆，規劃書將重新產出。

---

## 1. 專案目標（Objective）

把「寫一段腳本」到「出一支帶品牌開場、逐字字幕、可立即分發的影片」之間的七道工序，壓縮成一條**全自動生產線**：

- **預設零雲端成本**：edge-tts + ffmpeg + Pillow，不依賴任何付費金鑰即可產出。
- **需要更高品質時再插上雲端金鑰**：ElevenLabs（語音）、Runway（B-roll）、OpenAI GPT-4o（解析）、AWS S3（託管）。
- **AI 不取代人**：思想、經驗、價值判斷來自壽司博士；AI 負責研究／初稿／視覺／剪輯／分發。
- **5T 合規**：Traceable / Trackable / Tangible / Transparent / Trustworthy 全程貫穿。

**成功判準（試營運 P0）**：3 支 on-brand 樣片產出 ＋ 對外 HTTPS 服務上線，且品牌一致性通過 OA-Team 30 號質控蜂驗證。

---

## 2. 範疇（Scope）

### 2.1 In Scope（納入）
- 7 模組生產線（編排中心 → 文字解析 → 語音 → 視覺 → 渲染 → 儲存 → 溯源庫）。
- 壽司博士品牌預設：深藍 `#10243f`、暖金 `#c9a24b`、米白 `#f3ede1`、綠 `#3c6e47`；開場台詞「大家好，我是壽司博士」；腳本 DNA 標記【場景】【衝突】【洞察】【方法】【反思】。
- 品牌禁區：藍紫霓虹、機器人大腦、漂浮數據。
- 優雅回落機制：任一雲端金鑰失效，自動回到免費路徑，不中斷生產。
- 試營運 3 支樣片、VPS 部署、n8n 排程、雲端增強（視金鑰）、S3 發布與指標盤。

### 2.2 Out of Scope（排除）
- 壽司博士的內容創作與觀點判斷（屬人，非 AI）。
- 付費 API 的長期營運成本（僅「可選插拔」，不預設常駐）。
- 其他頻道／品牌的生產線（除非後續擴充）。
- 模型訓練或微調（僅使用現成 TTS／視覺 API）。

---

## 3. 約束條件（Constraints）

| 類別 | 約束 | 對應 5T |
|---|---|---|
| 成本 | 預設零雲端成本；雲端為可選插拔 | Transparent |
| 品牌 | 色彩／台詞／DNA 標記／禁區強制套用 | Tangible |
| 可溯源 | 所有腳本與產出標註 source_origin | Traceable |
| 可追蹤 | 渲染／webhook／錯誤皆寫入生命週期日誌 | Trackable |
| 不可篡改 | 產出影片與作業庫紀錄 Hash Lock + freeze | Trustworthy |
| 安全 | webhook 認證（`WEBHOOK_SECRET` + HMAC）、路徑穿越防護 | Trustworthy |
| 可靠性 | 雲端失敗優雅回落，生產不中斷 | Transparent |

---

## 4. 利害關係人（Stakeholders）

| 角色 | 對象 | 關切點 |
|---|---|---|
| 發起人／主持人 | 楊坤修博士（壽司博士 Dr. Source） | 品牌調性、內容原創性、頻道憲法 |
| 營運方 | 善向永續 ESG Sunshine | 產能、分發、指標 |
| 執行團隊 | OA-Team 30 萬能蜂群（default / oa-team 配置） | 5T 合規、自動化率、熵減 |
| 基礎設施 | VPS / 網域 / 雲端金鑰持有者 | 部署憑證、成本授權 |

---

## 5. 工作分解結構（WBS）— 5 主要階段

> 每階段含：目標、交付物、建議負責（OA-Team 成員 ID ＋ Hermes 配置）、依賴。

### Phase 1 — 試營運樣片（P0，無外部依賴）
- **目標**：用首季母題生成 3 支 DNA 影片，確認品牌調性。
- **交付物**：
  1. 3 支 on-brand 影片（深藍→暖金開場、逐字字幕、DNA 結構）。
  2. 品牌一致性報告（30 號質控蜂驗收簽章）。
- **建議負責**：
  - 15 文案蜂（腳本 DNA 標記）
  - 12 設計蜂（品牌視覺 UI）
  - 16 音頻蜂（edge-tts 配音）
  - 11 測試蜂（E2E 渲染驗證）+ 30 質控蜂（品牌驗收）
- **配置**：`oa-team`
- **依賴**：無（可在本地立即啟動）。

### Phase 2 — VPS 部署與網域（P0，需 VPS / 網域）
- **目標**：將生產線對外暴露為 HTTPS 服務。
- **交付物**：
  1. `docker-compose` + nginx + HTTPS 對外服務。
  2. 容器映像 `docker.io/dingjunhong1028/aistation:latest` 部署紀錄。
  3. 健康檢查端點 `/api/metrics` 可公開存取。
- **建議負責**：
  - 22 探路蜂（VPS / nginx / HTTPS 部署）
  - 20 運營蜂（docker-compose / CI-CD）
- **配置**：`oa-team`
- **依賴**：Phase 1（品牌確認後再對外）＋ 外部：VPS 主機、網域、DNS/TLS 憑證。

### Phase 3 — n8n 排程上線（P1）
- **目標**：定時觸發週更「壽司切片」自動化生產。
- **交付物**：
  1. n8n workflow（定時觸發 → AI Station webhook）。
  2. webhook 認證整合紀錄（HMAC 通過）。
- **建議負責**：
  - 17 市場蜂（發布策略）
  - 19 增長蜂（批次／排程優化）
- **配置**：`oa-team`
- **依賴**：Phase 2（需部署就緒的 webhook 端點）。

### Phase 4 — 雲端增強（P1 / P2，需金鑰）
- **目標**：提升配音與視覺質感，驗證優雅回落。
- **交付物**：
  1. ElevenLabs 語音接入 ＋ 失敗回落 edge-tts 驗證（16 音頻蜂 + 23 外交蜂）。
  2. Runway B-roll 實測 ＋ 失敗回落 Pillow 驗證（13 圖像蜂 + 23 外交蜂）。
  3. 可選：OpenAI GPT-4o 解析增強（08 算法蜂 + 15 文案蜂）。
- **配置**：`oa-team`
- **依賴**：Phase 1（品牌結構就緒）＋ 外部：ElevenLabs / Runway / OpenAI 金鑰。

### Phase 5 — S3 發布與指標盤（P2）
- **目標**：公開托管成品並建立產能看板。
- **交付物**：
  1. S3 公開托管管線（22 探路蜂）。
  2. KPI dashboard（成功率、平均渲染、品牌分布）（10 數據蜂）。
- **配置**：`oa-team`
- **依賴**：Phase 2（儲存端點）＋ 外部：AWS S3 金鑰。

---

## 6. 時程與里程碑（Schedule & Milestones）

| 里程碑 | 所屬階段 | 預估工期 | 入口依賴 |
|---|---|---|---|
| M1 3 支樣片驗收 | Phase 1 | 1 週 | 無 |
| M2 對外 HTTPS 上線 | Phase 2 | 1 週 | M1 ＋ VPS/網域 |
| M3 週更自動化啟動 | Phase 3 | 0.5 週 | M2 |
| M4 雲端質感增強 | Phase 4 | 1 週 | M1 ＋ 金鑰 |
| M5 指標盤公開 | Phase 5 | 0.5 週 | M2 ＋ S3 金鑰 |

**關鍵路徑（Critical Path）**：Phase 1 → Phase 2 → Phase 3。
**可並行**：Phase 4、Phase 5 在各自依賴滿足後與關鍵路徑並行。

---

## 7. 依賴關係圖（Dependencies）

```
Phase 1 (試營運) ──┬─> Phase 2 (部署) ──> Phase 3 (排程)
     │              │                         
     │              └─> Phase 5 (S3+指標) [需 S3 金鑰]
     │              
     └─> Phase 4 (雲端增強) [需 ElevenLabs/Runway/OpenAI 金鑰]

外部依賴（需人提供）：
  - VPS 主機 + 網域 + DNS/TLS   → 阻塞 Phase 2
  - ElevenLabs / Runway / OpenAI 金鑰 → 阻塞 Phase 4
  - AWS S3 金鑰                  → 阻塞 Phase 5
```

---

## 8. 風險與緩解（Risks）

| 風險 | 影響 | 緩解 |
|---|---|---|
| VPS/網域未取得 | Phase 2 阻塞 | 先完成 Phase 1 本地樣片；部署待憑證到位即啟動 |
| 雲端金鑰未取得 | Phase 4/5 延後 | 免費路徑已可產出，金鑰為增強非必需 |
| 品牌調性不符 | 需人審回退 | Phase 1 即送 30 號質控蜂驗收，未過不進 Phase 2 |
| webhook 被濫用 | 安全事件 | `WEBHOOK_SECRET` + HMAC `compare_digest` 常數時間比對 |
| 路徑穿越 | 資安漏洞 | resolve 後確認在 `/storage` 內，否則 403 |

---

## 9. 待確認事項（Open Items — 需人類決策）

1. **專案標的確認**：本書以 AI Station × 壽司博士為標的是否正確？或是其他專案？
2. **VPS / 網域憑證**：Phase 2 需一組 VPS 主機、網域、DNS/TLS（誰提供？）。
3. **雲端金鑰**：ElevenLabs / Runway / OpenAI / AWS S3 金鑰是否授權取得（P1/P2）。
4. **試營運母題**：首季 3 支樣片的「母題／主題」由誰定稿？

---

## 10. 附錄 — OA-Team 角色對照（本專案）

| 編號 | 成員 | 本專案角色 | Phase |
|---|---|---|---|
| 07 | 編碼蜂 | 管線架構師（FastAPI） | 1–5 |
| 08 | 算法蜂 | LLM 腦設計 | 1,4 |
| 10 | 數據蜂 | 資料管道／指標 | 5 |
| 11 | 測試蜂 | E2E 測試 | 1 |
| 12 | 設計蜂 | 品牌 UI | 1 |
| 13 | 圖像蜂 | 視覺生成 | 1,4 |
| 14 | 動畫蜂 | 動態字幕 | 1 |
| 15 | 文案蜂 | 腳本 DNA | 1,4 |
| 16 | 音頻蜂 | 語音合成 | 1,4 |
| 17 | 市場蜂 | 發布策略 | 3 |
| 19 | 增長蜂 | 增長優化 | 3 |
| 20 | 運營蜂 | 專案管理／CI-CD | 2 |
| 22 | 探路蜂 | 部署探索 | 2,5 |
| 23 | 外交蜂 | 雲端金鑰協調 | 4 |
| 27 | 安全蜂 | webhook 防護 | 2,3 |
| 30 | 質控蜂 | 品牌驗收 | 1 |

---

*本規劃書為結構化專案任務規劃交付物；後續執行由 OA-Team 各階段負責成員依 5T 協定推進。*
