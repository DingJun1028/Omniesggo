# 🌐 ESG-GO & AI Station 系統全域完整使用說明書

> **版本**：v1.0.0 (2026 旗艦版)  
> **核心標準**：5T 數據與行為協定 (Traceable, Trackable, Tangible, Transparent, Trustworthy)  
> **系統架構**：OA-Team 30 萬能蜂群矩陣 + AI Station 7 模組自動化生產線  

---

## 📖 目錄

1. [系統簡介與核心公約](#1-系統簡介與核心公約)
2. [環境需求與快速入門 (Quick Start)](#2-環境需求與快速入門-quick-start)
3. [AI Station 短影音生產線操作說明](#3-ai-station-短影音生產線操作說明)
4. [Universal Translator 萬能即時翻譯使用說明](#4-universal-translator-萬能即時翻譯使用說明)
5. [第二大腦與知識分身 (Knowledge Avatar) 同步指南](#5-第二大腦與知識分身-knowledge-avatar-同步指南)
6. [系統維運與 VPS 部署手冊 (Ops & Deployment)](#6-系統維運與-vps-部署手冊-ops--deployment)
7. [常見問題與疑難排解 (Troubleshooting & FAQ)](#7-常見問題與疑難排解-troubleshooting--faq)

---

## 1. 系統簡介與核心公約

### 1.1 5T 數據與行為協定 (5T Protocol)
ESG-GO 全系統之資料寫入、服務調用與產物輸出皆遵循 5T 誠實驗證原則：
- **Traceable (可溯源)**：每筆產出代碼、API 回應與任務紀錄必標註 `source_origin` 原始起點。
- **Trackable (可追蹤)**：全生命週期 Hook 追蹤，可即時追蹤資料流轉狀態。
- **Tangible (可感知)**：提供高質感 UI/UX 回饋、即時進度狀態與可驗證的產物檔案。
- **Transparent (可透明)**：演算邏輯公開，完全通過零幻覺驗算 (Zero-Hallucination Audit)。
- **Trustworthy (不可篡改)**：資料寫入後即刻執行 **SHA-256 Hash Lock** 與 `Object.freeze()`。

### 1.2 狀態機控制法則（4 可 1 不可）
- ✅ **可自理**：獨立完成節點內之邏輯閉環與自我修復。
- ✅ **可協作**：透過萬有引力協定交織 30 代理蜂群網絡。
- ✅ **可演化**：定期執行熵減煉金，自動清償技術債。
- ✅ **可溯源**：完整記錄全生命週期日誌與驗證證明。
- ❌ **不可篡改**：核心契約與 Hash Lock 寫入即凍結，嚴禁後門竄改。

### 1.3 30 人萬能代理矩陣 (30 Souls Matrix)
分為 5 大陣列：
1. **策略組 (01-06)**：萬能蜂后、規劃蜂、分析蜂、策効蜂、風險蜂、優化蜂。
2. **技術組 (07-12)**：編碼蜂、算法蜂、架構蜂、數據蜂、測試蜂、設計蜂。
3. **創意組 (13-18)**：圖像蜂、動畫蜂、文案蜂、音頻蜂、市場蜂、社群蜂。
4. **營銷組 (19-24)**：增長蜂、運營蜂、商業分析蜂、探路蜂、外交蜂、調研蜂。
5. **守衛組 (25-30)**：測場蜂、追蹤蜂、安全蜂、維護蜂、支援蜂、質控蜂。

---

## 2. 環境需求與快速入門 (Quick Start)

### 2.1 系統需求
- **作業系統**：Windows 11 (Git-Bash / MSYS) 或 Linux / Ubuntu 22.04 LTS
- **Node.js 平台**：Node.js v20+ / pnpm v11+
- **Python 平台**：Python 3.11+ (含 `uv` / `pytest` / `fastapi` / `openpyxl`)
- **影音渲染**：`ffmpeg` (系統必備)

### 2.2 快速安裝步驟
```bash
# 1. 複製專案倉庫
git clone git@github.com:DingJun1028/esggo.git
cd esggo

# 2. 安裝 Node / pnpm 依賴套件
pnpm install

# 3. 準備 Python 虛擬環境與套件
python -m pip install -r pyproject.toml openpyxl
```

### 2.3 核心測試驗證
```bash
# 執行 TypeScript 測試 (Vitest)
pnpm test

# 執行 Python 測試 (Pytest)
pytest

# 執行類型檢查與核心單元測試
pnpm run check
```

---

## 3. AI Station 短影音生產線操作說明

AI Station 將影音製作 7 道工序壓縮為全自動生產線：
1. **編排中心** (FastAPI 背景任務)
2. **文字解析** (壽司博士 DNA 標記解析 `【場景】【衝突】【洞察】【方法】【反思】`)
3. **語音合成** (`edge-tts` 免費語音 / ElevenLabs 高階語音)
4. **視覺生成** (Pillow 品牌漸層套色 / Runway B-roll)
5. **渲染引擎** (`ffmpeg` + 逐字動態字幕)
6. **雲端託管** (Local `/storage` 或 S3 儲存)
7. **作業溯源** (SQLite + 指標盤)

### 3.1 啟動 AI Station 服務
```bash
# 本地開發啟動 (預設埠 8000)
python -m apps.aistation.src.cli --host 127.0.0.1 --port 8000

# Docker 容器化啟動
docker run -p 8000:8000 dingjunhong1028/aistation:latest
```

### 3.2 呼叫生成 API
```bash
# POST /v1/generate/inc (增量 5T 驗證管道)
curl -X POST http://127.0.0.1:8000/v1/generate/inc \
  -H "Content-Type: application/json" \
  -d '{
    "script": "【場景】企業面臨 ESG 碳排盤查壓力。【衝突】數據零碎無法整合。【洞察】5T 協定提供不可篡改與可溯源機制。【方法】引入 30 人萬能蜂群自動化。【反思】永續不僅是合規，更是核心競爭力。",
    "series": "壽司博士ESG切片",
    "voice": "zh-TW-YunJheNeural"
  }'
```

---

## 4. Universal Translator 萬能即時翻譯使用說明

Universal Translator (UT) 為獨立高可用翻譯服務，具備字幕雙行顯示與雙向即時廣播功能。

### 4.1 服務特性
- **運行埠**：`8788` (Node.js 原生 HTTP + WebSocket / SSE 服務)
- **視覺規範**：上段白字原音、下段暖金 (#c9a24b) 繁中翻譯。
- **純淨觀眾頁**：`/viewer.html?room=<房間號>` (無按鈕、免登入、純淨串流 UI)。
- **零依賴 QR 碼**：自動生成專屬房間 QR Code。

### 4.2 啟動與測試
```bash
# 啟動翻譯服務
node apps/universal-translator/server.mjs

# 檢查健康狀態
curl http://127.0.0.1:8788/health
# 回應: {"status":"ok","version":"1.7.0"}
```

---

## 5. 第二大腦與知識分身 (Knowledge Avatar) 同步指南

### 5.1 Obsidian 雙向同步架構
- **Vault 路徑**：`C:/Project/esggo/vault/`
- **MOC 知識地圖**：`vault/Agents/context/00-Index.md`
- **Canonical 型別**：`packages/shared/src/types.ts`

### 5.2 七相傳承迴路操作命令
```bash
# 1. 孵化知識分身 (Hatch & Absorb)
node scripts/knowledge-avatar.mjs

# 2. 存取權限與安全檢查 (VaultGuard)
node scripts/vault-access-guard.mjs

# 3. 測試型別清理 (Cleanup)
node scripts/avatar-cleanup.mjs

# 4. MOC 知識地圖同步 (MOC Sync)
node scripts/avatar-moc-sync.mjs
```

---

## 6. 系統維運與 VPS 部署手冊 (Ops & Deployment)

### 6.1 Oracle ARM VPS (esggo-vps) 架構
- **核心實例**：4 OCPU / 24GB RAM (Always Free)
- **語音 Agent (s2s-voice)**：Port `8765` (喚醒詞：「嗨馬修」，Edge TTS + faster-whisper)
- **TencentDB Memory Core**：Port `8420` (內網寫入通道)
- **Cloudflare Tunnel**：
  - `memory.esggo.co` -> 8096 (Proxy)
  - `gateway.esggo.co` -> 8420 (Core)
  - `translate.esggo.co` -> 8788 (UT)

### 6.2 部署與服務重啟流程
```bash
# SSH 連線至 VPS
ssh ubuntu@esggo.co

# PM2 服務狀態與重啟
pm2 status
pm2 reload ecosystem.config.js

# Docker 容器日誌監控
docker logs -f tdai-memory-core
```

---

## 7. 常見問題與疑難排解 (Troubleshooting & FAQ)

### 7.1 常見問題處理
| 現象 / 錯誤訊息 | 根因說明 | 解決方式 |
|---|---|---|
| `Cannot find package '@lib/...'` | TypeScript / Vitest 別名未正確對應 | 檢查 `vitest.config.ts` 與 `tsconfig.json` 的 `@lib` -> `./src/lib` 別名 |
| `Cloudflare Workers error code 10042` | `wrangler.toml` 包含無效 `${VAR}` 的 KV ID | 移除無效 KV 綁定或替換為真實 ID |
| `Cloudflare Workers error code 10021` | `main` 錯引 `my-worker` Notion SDK | 將 `main` 指向 `worker/src/index.ts` |
| `soul-dialogue-mapping.json 找不到` | 測試圖片映射 JSON 未還原 | 執行 `git checkout auto-repair/restore-soul-dialogue-mapping-20260827` 補齊 |

### 7.2 一鍵診斷指令
```bash
# 執行全系統 5T 誠實診斷
pnpm run check && pnpm test && pytest
```

---
*ESG-GO 萬能蜂群團隊 簽署 *
