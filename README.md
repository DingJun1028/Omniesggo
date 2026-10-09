<<<<<<< HEAD
# ESG-GO / DingJun1028

> ESG 永續報告書 × AI 代理 × Oracle 零成本基礎設施 × Cloudflare 邊緣運算
> OmniAikey 萬能永憶 × 30 代理蜂群協作

## 專案概覽

本倉庫為 **ESG-GO 永續報告書建置平台** 的核心源碼,涵蓋:

- **VPS 部署** (Oracle Cloud Free Tier, 199GB/200GB 容量限制內)
- **Cloudflare Workers** 邊緣 (esggo-web.dingjunhong1028.workers.dev)
- **30 代理蜂群** (OA-Team) 框架 + 工具鏈
- **JunAikey 萬能永憶** (代理成長層, NCBDB + local 雙後端)
- **OmniTag 萬能標籤** (6 維 MECE 結構化標籤系統)

## 核心模組

### JunAikey 萬能元鑰 / 萬能永憶 (`vps/junaikey.mjs`)

代理成長層:記憶、技能、進度、閉環;NCBDB primary + local fallback。

```bash
node vps/junaikey.mjs awaken                                    # 被動載入
node vps/junaikey.mjs grow "encoding-check" "驗證編碼" --traits=永恆
node vps/junaikey.mjs remember '{"event":"task-done","rc":0}'
node vps/junaikey.mjs reflect "summary" --learn=skill1,skill2
node vps/junaikey.mjs tag oracle-bv agent:13,platform:vps         # OmniTag
node vps/junaikey.mjs find agent:1*                              # wildcard
```

### Cloudflare Billing 自動化 (`scripts/cf-create-billing-token.mjs`)

Puppeteer 自動化建 read-only billing token,寫入 `.env.local` (gitignored)。

```bash
node scripts/cf-create-billing-token.mjs
# 開啟 Chrome → 登入 → 手動建 token → 自動偵測並寫入
```

### VPS 一鍵優化 (`vps/junaikey-optimize.mjs`)

Docker log rotation + 自動 prune cron + swap + sysctl 網路優化。

```bash
sudo node vps/junaikey-optimize.mjs   # 新 VPS 一鍵安裝
```

## 模組結構

```
vps/
├── junaikey.mjs                289 行  (主入口 + CLI)
└── junaikey/
    ├── schema.mjs               16 行
    ├── util.mjs                 74 行
    ├── tags.mjs                158 行  OmniTag 6 維
    ├── dispatcher.mjs           31 行
    ├── operations.mjs          272 行
    └── backends/
        ├── local.mjs           151 行
        └── ncb.mjs             303 行

tests/
├── junaikey.test.mjs           191 行  10 個測試
├── junaikey.bench.mjs          72 行   效能基準
└── omnitag.test.mjs            216 行  19 個測試
```

## 快速開始 (Quick Start)

### 本地開發 (Windows / macOS / Linux)

```bash
# 1. clone + 設定
git clone https://github.com/DingJun1028/esggo.git
cd esggo

# 2. 環境變數 (NCB token)
cat > .env.local <<EOF
NCBDB_API_TOKEN=sk_live_your_token
NCBDB_BASE_URL=https://api.nocodebackend.com
NCBDB_PROJECT_ID=54686_junaikey
EOF

# 3. 跑測試 (29/29 應全綠)
node tests/junaikey.test.mjs
node tests/omnitag.test.mjs

# 4. 端到端驗證
node vps/junaikey.mjs doctor
```

### 部署到新 VPS

```bash
# SSH 進新 VPS 後:
sudo node vps/junaikey-optimize.mjs    # 優化 + 自動 cron
# rsync 整個 repo 過來
# (rsync 細節見 docs/migration-guide.md 或 git log)
```

## 環境變數

| 變數 | 用途 | 預設 |
|---|---|---|
| `NCBDB_API_TOKEN` | NCB 認證 token (V2 格式 `sk_live_*`) | — |
| `NCBDB_BASE_URL` | NCB API 端點 | `https://api.nocodebackend.com` |
| `NCBDB_PROJECT_ID` | NCB project ID (e.g. `54686_junaikey`) | — |
| `JUNAKEY_HOME` | local backend 根目錄 | `~/.junaikey` |
| `JUNAKEY_BACKEND` | `auto` / `ncb` / `local` | `auto` |

## 測試

```bash
# 全部測試 (應 29/29 通過)
node tests/junaikey.test.mjs
node tests/omnitag.test.mjs

# 效能基準
node tests/junaikey.bench.mjs
```

## 5T Trustworthy

所有 commits 遵守:
- `5T-Traceable`: 可追溯變更
- `5T-Transparent`: 透明決策
- `5T-Trustworthy`: 不寫 secrets 到 source
- `5T-...`: 完整 5 維見各 commit
- `[best-practice:awakened]` 標籤用於通過覺醒結界審查的 commit

## License

AGPL-3.0
=======
# ESGGO + AI Station - Powered by OA-Team 30 萬能蜂群

> **30 個靈魂，同一個心核** — 在熵增的混沌中，鑄造永恆秩序

---

## 🏗️ 系統架構

```
┌─────────────────────────────────────┐
│   OA-Team 30 萬能蜂群 (Queen Bee)   │
│  戰略總覽 · 資源分配 · 決策鏈控制    │
└────────────┬────────────────────────┘
             │
    ┌────────┴────────┐
    │  7 模組生產線   │
    │  AI Station Core│
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │ 5T Protocol      │
    │ Traceable →     │
    │ Trackable →     │
    │ Tangible →      │
    │ Transparent →   │
    │ Trustworthy     │
    └────────┬────────┘
             │
         ┌───▼───┐
         │ OMNILIVE1 │
         │ 預發布平台 │
         └─────────┘
```

---

## 📊 30 蜂群矩陣 (5 組 × 6 員)

### 策略組 (1-6)
| 編號 | 代理 | 核心職責 | 5T |
|------|------|----------|-----|
| 01 | 萬能蜂后 | 戰略總覽、資源分配 | Traceable+Trackable |
| 02 | 萬能規劃蜂 | 3-5年藍圖、SWOT | Trackable |
| 03 | 萬能分析蜂 | 數據挖掘、趨勢預測 | Transparent |
| 04 | 萬能策效蜂 | 創新解決方案 | Tangible |
| 05 | 萬能風險蜂 | 風險管控、預警 | Trustworthy |
| 06 | 萬能優化蜂 | 流程重組、熵減 | Transparent |

### 技術組 (7-12)
| 編號 | 代理 | 核心職責 | 5T |
|------|------|----------|-----|
| 07 | 萬能編碼蜂 | Traceable 代碼、API | Traceable |
| 08 | 萬能算法蜂 | AI模型、可追蹤訓練 | Trackable |
| 09 | 萬能架構蜂 | 分布式架構 | Trackable |
| 10 | 萬能數據蜂 | 數據管道 | Trustworthy |
| 11 | 萬能測試蜂 | E2E測試 | Tangible |
| 12 | 萬能設計蜂 | UI/UX 體驗 | Tangible |

---

## 🔄 5T Protocol

| 原則 | 中文名 | 實作方式 | 驗證 |
|------|--------|----------|------|
| **Traceable** | 可溯源 | source_origin 標籤 | Git hook 強制 |
| **Trackable** | 可追蹤 | OpenTelemetry | 追蹤平台 |
| **Tangible** | 可感知 | UI/UX 回饋 | 用戶滿意度>4.5 |
| **Transparent** | 可透明 | 算法公開 | 零幻覺驗算 |
| **Trustworthy** | 不可篡改 | Hash Lock + Object.freeze() | 第三方審計 |

---

## 🏭 AI Station 7 模組生產線

| # | 模組 | 預設 | 雲端 | 負責 | 5T |
|---|------|------|------|------|----|
| 1 | 編排中心 | FastAPI | — | 07 | Traceable |
| 2 | 文字解析 | 內建句法 | GPT-4o | 08,15 | Transparent |
| 3 | 語音合成 | edge-tts | ElevenLabs | 16 | Tangible |
| 4 | 視覺生成 | Pillow | Runway | 13,14 | Tangible |
| 5 | 渲染引擎 | ffmpeg | — | 11 | Trackable |
| 6 | 雲端儲存 | 本地 | S3 | 22,23 | Trustworthy |
| 7 | 源源庫 | SQLite | NoCodeBackend | 10 | Trackable |

---

## 🚀 啟動命令

```bash
npx celestial-command \
  --awaken=OA-Team-30-Swarm \
  --soul=QueenBee \
  --protocol=5T \
  --entropy-control=0.1
```

---

*Generated on: 2026-09-05*
*Status: ✅ 所有任務完成*
>>>>>>> origin/feature/aistation-core-modules
