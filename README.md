# ESG-GO / DingJun1028

> **ESG 永續報告書平台 × 即時雙語語音工具鏈 × AI 代理蜂群**
> 一體化 pnpm/turbo monorepo — 從行銷觸點、轉換線索、交付應用到治理平台的完整產品棧

[![CI Green Gate](https://github.com/DingJun1028/esggo/actions/workflows/ci-green-gate.yml/badge.svg)](https://github.com/DingJun1028/esggo/actions/workflows/ci-green-gate.yml)
[![Deploy to Oracle VPS](https://github.com/DingJun1028/esggo/actions/workflows/deploy-oracle.yml/badge.svg)](https://github.com/DingJun1028/esggo/actions/workflows/deploy-oracle.yml)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

---

## 1. 專案總覽

本倉庫是 **ESG-GO 產品家族的單一真相源（Single Source of Truth）**，涵蓋三條客戶產品線與一支內部代理基礎設施：

| 產品線 | 定位 | 主網域 | 技術棧 |
|---|---|---|---|
| **ESGO 平台**（根 `app/`） | GRI 2024 / CSRD ESRS 永續報告書工作台：動態表單引擎、重大性矩陣、碳工具、證據庫、哈希鎖鏈 | `esggo.co` | Next.js App Router · React 19 · Prisma · Supabase · Tailwind |
| **FTG 墾趣旅遊**（`apps/ftg-*`） | 企業永續旅遊：行銷站＋行程伴隨 App（Impact Note / ESG 任務 / 徽章） | `ftgtours.esggo.co` · `journey.ftgtours.esggo.co` | React 19 + Vite + Tailwind（行銷）· Express + SQLite（API） |
| **語音工具鏈**（`apps/omnilive` `omnisub` `universal-translator` `stt`） | 零金鑰即時雙語字幕／轉譯：系統音訊擷取 → STT（VOSK/VoxSpica＋faster-whisper）→ 翻譯級聯 → SSE 字幕 | `omnilivetranslation.esggo.co` · `omnisub.esggo.co` · `translate.esggo.co` | Node ESM 零依賴 · Python FastAPI（STT） |
| **HTB 高科海藻**（`apps/htb-b2b`） | 永續海洋資源 B2B 官網（客戶交付案） | Vercel 部署 | Vue 3 + Vite + Tailwind 4 |
| **Learning Center**（`apps/learning-center`） | Berkeley ESG 課程學員中心：作業上傳、回放、Calendly 諮詢 | `esggo-learning-center.web.app` | React 19 + Vite + Firebase |
| **內部基礎設施** | OmniAgent Gateway（代理匯流排）、JunAikey 萬能元鑰（代理成長層）、OmniTag 標籤、30 蜂群框架 | `omniagent.esggo.co`（內網為主） | Node · WebSocket · NCB/local 雙後端 |

**設計哲學**：5T 協定（Traceable / Transparent / Trustworthy / Transferful / True）＋「零金鑰優先」（工具類產品不需註冊即可用）＋「Cloudflare 邊緣 + Oracle Free Tier 零成本底座」。

---

## 2. 產品地圖與客戶旅程

```
【認知】行銷觸點                    【轉換】線索                    【交付】價值
─────────────────────            ─────────────────────            ─────────────────────
ftgtours.esggo.co                POST /api/contact                journey.ftgtours.esggo.co
  行銷站（12 頁）     ──CtaForm──►  CF Worker ftgtours-api ──► D1    行程儀表板 / Impact Note
  產品頁 ×6 + Contact             （honeypot+reCAPTCHA）    contact_inquiries
esggo.co（平台入口）                                        esggo.co
  報告書工作台                                                sustain-write / verifier
esggo-learning-center.web.app                               學員中心
omnisub / omnilivetranslation / translate                   零金鑰工具（免轉換直接交付價值）
```

詳細架構分析、缺口盤點與落地路線圖見 **[ARCHITECTURE.md](ARCHITECTURE.md)**。

---

## 3. 系統架構

```
                     Cloudflare（邊緣 TLS/WAF/Tunnels/Workers）
                                │
        ┌───────────────────────┼────────────────────────┐
        ▼                       ▼                        ▼
   esggo.co 主站          *.esggo.co 子域          Workers 前端
        │                       │                  （esggo-web / ftgtours-api）
        ▼                       ▼
┌─────────────────── Oracle VPS（nginx 反代, PM2 ×6）───────────────────┐
│  :3000  esggo-core            （Next.js 平台, deploy-oracle.yml）     │
│  :8642  omniagent-gateway     （REST+WSS, API-key 閘）                │
│  :8788  universal-translator  （翻譯級聯: LibreTranslate→MyMemory）   │
│  :8791  stt-whisper           （VOSK VoxSpica + faster-whisper, 內網）│
│  :8797  omnilive-translator   （即時雙語字幕層）                      │
│  deerflow                     （研究代理）                            │
│  /var/www/ftgtours            （FTG 靜態站）                          │
└──────────────────────────────────────────────────────────────────────┘

並行部署通道：Vercel（root + htb-b2b + learning-center）· Firebase Hosting（learning-center）
資料層：Supabase/Postgres（平台）· Cloudflare D1（FTG 線索）· SQLite（journey API）· NCB（代理記憶）
```

### STT → 翻譯 → 字幕鏈（語音產品核心）

```
麥克風/系統音訊 ─► apps/stt (:8791)          VOSK(VoxSpica cn+en-us) 引擎,
                 │  ffmpeg→16kHz PCM        zh 自動 s2t 繁體化, 雙模型置信仲裁
                 ▼
apps/universal-translator (:8788)            LibreTranslate → MyMemory → 原文兜底
                 │                           （可選 Ollama+Gemini 本地模型）
                 ▼
apps/omnilive (:8797) / apps/omnisub         SSE 雙語字幕 / 單檔零後端字幕浮窗
```

---

## 4. 倉庫結構

```
esggo/
├── app/ src/              # ★ ESGGO 平台（Next.js App Router, ~40 路由）
├── apps/                  # ★ 31 個應用（詳見 §1 產品表）
│   ├── omnilive/          #   即時雙語字幕（server.mjs + public/index.html）
│   ├── stt/               #   STT 微服務（FastAPI, VOSK 模型在 models/）
│   ├── universal-translator/
│   ├── ftg-tours-website/ #   FTG 行銷站（含 CF Worker 線索 API）
│   ├── ftg-journey-web/   #   FTG 行程 App 前端
│   ├── ftg-journey-server/#   FTG 行程 App 後端（Express+SQLite）
│   ├── htb-b2b/           #   HTB 官網（Vue 3）
│   ├── learning-center/   #   學員中心（Firebase）
│   └── gateway/           #   OmniAgent Gateway v3
├── packages/              # ★ 20 個 workspace 套件（omni-core/agent/tag/ui/i18n…）
├── libs/ cli/             # 共用函式庫與 CLI（esggo / oa-cli / omnicli）
├── vps/                   # VPS 運維：junaikey 萬能元鑰、優化、診斷
├── worker/                # Cloudflare Worker（esggo-web 邊緣）
├── docs/                  # ★ 全部架構/ADR/手冊/交付證書（見 §8 文件索引）
├── tests/ e2e/            # 單元測試 + Playwright E2E
├── .github/workflows/     # CI/CD（deploy-oracle / ci-green-gate / learning-center-ci…）
├── ecosystem.config.cjs   # VPS PM2 六服務定義
├── pnpm-workspace.yaml    # workspace + overrides（安全釘版正主層）
└── ARCHITECTURE.md        # ★ 架構分析與產品落地指導
```

---

## 5. 快速開始

### 前置需求

- Node.js ≥ 20、pnpm 11（`corepack enable`）、Git
- （語音鏈）Python 3.11+、ffmpeg、（可選）Ollama

### 本地開發

```bash
git clone https://github.com/DingJun1028/esggo.git
cd esggo
pnpm install                      # 根 workspace（含 prisma generate）

# ESGGO 平台
pnpm dev                          # http://localhost:3000

# 應用（各自目錄）
pnpm -C apps/ftg-tours-website dev    # FTG 行銷站
pnpm -C apps/htb-b2b dev              # HTB 官網
node apps/omnilive/server.mjs         # OmniLive（:8797）
node apps/universal-translator/server.mjs   # 翻譯（:8788）
python apps/stt/server.py             # STT（:8791, 需先裝 requirements.txt）

# JunAikey 萬能元鑰
node --env-file=.env.local vps/junaikey.mjs awaken
node --env-file=.env.local vps/junaikey.mjs doctor
```

### 環境變數

複製對應樣板後填值（**絕不 commit 密鑰**）：

| 檔案 | 用途 |
|---|---|
| `.env.example` / `.env.production.example` | 平台核心 |
| `.env.local` | 本機私鑰（gitignored）：NCB token、CF token、Gemini… |
| `apps/ftg-journey-server/.env.example` | Journey API（JWT/Google OAuth） |
| `worker/wrangler.toml` | CF Worker 綁定（D1/KV） |

| 關鍵變數 | 用途 |
|---|---|
| `NCBDB_API_TOKEN` / `NCBDB_PROJECT_ID` | JunAikey NCB 後端 |
| `GEMINI_API_KEY` | OmniLive 可選 LLM 潤飾 |
| `VITE_RECAPTCHA_SITE_KEY` | FTG Contact 防濫（需搭配 Worker 端驗證） |
| `GOOGLE_CLIENT_ID` / `JWT_SECRET` | Journey App 登入 |

### 測試與品質閘

```bash
pnpm test                        # vitest（根）
pnpm typecheck                   # tsc -p tsconfig.core.json
node tests/junaikey.test.mjs     # JunAikey + OmniTag（29 測試）
npx playwright test              # E2E（需先 pnpm dev）
bash .hermes/auto-repair/ci-gate.sh --list HEAD   # 列出遠端 check 狀態
```

**CI 全綠閘**：任何 PR 上 `CI Green Gate` job 會輪詢同 commit 所有 check-runs，未全綠即紅燈——這是「不得開下一個 PR」的硬規則（詳見 `.hermes/auto-repair/CI-GATE.md`）。

---

## 6. 部署

| 通道 | 標的 | 觸發 | 健康閘 |
|---|---|---|---|
| **deploy-oracle.yml** | VPS 全服務（PM2 ×6 + nginx + 磁碟衛生） | push `main` | `esggo.co/health`、`omniagent.esggo.co/health` |
| **deploy-cloudflare.yml** | Worker `esggo` 邊緣 | push `main` | — |
| **deploy-ftg-static.yml** | `/var/www/ftgtours` 靜態 | push `main`（apps/ftg-*） | — |
| **learning-center-ci.yml** | Firebase + Vercel 雙通道 | push `main`（apps/learning-center） | — |
| **Vercel Git** | root 平台 / htb-b2b / learning-center | push/PR | — |

VPS 新機一鍵：`sudo node vps/junaikey-optimize.mjs`（Docker log rotation、prune cron、swap、sysctl）。

---

## 7. 核心模組速覽

### JunAikey 萬能元鑰（`vps/junaikey.mjs`）

代理成長層：記憶、技能、進度、閉環；NCBDB primary + local fallback。

```bash
node vps/junaikey.mjs awaken                       # 載入覺醒
node vps/junaikey.mjs doctor                       # 雙後端體檢
node vps/junaikey.mjs grow "skill-name" "描述" --traits=永恆
node vps/junaikey.mjs remember "事件摘要"          # 記憶（限長, 勿超欄位上限）
node vps/junaikey.mjs tag oracle-bv agent:13       # OmniTag 6 維
```

### OmniTag 萬能標籤

6 維 MECE 結構化標籤 + 信任分級， cheat-sheet 見 `docs/OMNITAG-TRUSTLABEL-CHEATSHEET.md`。

### Cloudflare Billing 自動化（`scripts/cf-create-billing-token.mjs`）

Puppeteer 建 read-only billing token 寫入 `.env.local`。

---

## 8. 文件索引

| 文件 | 內容 |
|---|---|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | ★ 產品落地指導：UI/UX/RWD/客戶旅程/品質閘/路線圖 |
| `docs/esggo-platform-architecture.md` | 平台內部架構 |
| `docs/ARCH-SPEC-omnilive-translation.md` | OmniLive 規格書 |
| `docs/ESGGO-VPS-COMPLETE-GUIDE.md` | VPS 完整指南 |
| `docs/BRAND-GUIDE-2026-09-28.md` / `DESIGN.md` | 品牌與設計規範 |
| `docs/USER_MANUAL_COMPLETE.md` | 使用者手冊 |
| `docs/adr/`（`docs/` 下 ADR-*.md） | 架構決策記錄 |
| `.hermes/auto-repair/CI-GATE.md` | CI 全綠閘規則 |

---

## 9. 開發規範

- **Commit**：5T 五行格式 ＋ `[best-practice:awakened]` 標籤；`git commit -F` 從檔讀取避免編碼問題。
- **Secrets**：一律 `.env.local`（gitignored）；pre-commit 掃描攔截。
- **依賴安全**：overrides 鉗制在各安裝根 `pnpm-workspace.yaml`（root / learning-center / my-worker / oa-swarm），原則不跨 major。
- **PowerShell 落檔**：native 指令輸出要給程式讀時用 `cmd /c "命令 > file"`（PS 5.1 `>` 會轉 UTF-16LE）。
- **分支**：`feature/*` 開 PR → CI 全綠閘 → squash 合併 `main` → 自動部署。

## License

AGPL-3.0 — 詳見 [LICENSE](LICENSE)。
