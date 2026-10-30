# ESG-GO / DingJun1028

> **ESG 永續報告書平台 × 即時雙語語音工具鏈 × AI 代理蜂群**
> 一體化 pnpm/turbo monorepo — 從行銷觸點、轉換線索、交付應用到治理平台的完整產品棧

[![CI Green Gate](https://github.com/DingJun1028/esggo/actions/workflows/ci-green-gate.yml/badge.svg)](https://github.com/DingJun1028/esggo/actions/workflows/ci-green-gate.yml)
[![Deploy to Oracle VPS](https://github.com/DingJun1028/esggo/actions/workflows/deploy-oracle.yml/badge.svg)](https://github.com/DingJun1028/esggo/actions/workflows/deploy-oracle.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=esggo-monorepo&metric=alert_status)](https://sonarcloud.io/summary/overall?id=esggo-monorepo)
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
| **內部基礎設施** | OmniAgent Gateway（代理匯流排）、MCP Gateway（契約式唯讀 AI 原生閘道）、OmniFactory（README 即部署）、JunAikey 萬能元鑰（代理成長層）、OmniTag 標籤、30 蜂群框架 | `omniagent.esggo.co`（內網為主） | Node · WebSocket · NCB/local 雙後端 |

**設計哲學**：5T 協定（Traceable / Transparent / Trustworthy / Transferful / True）＋「零金鑰優先」（工具類產品不需註冊即可用）＋「Cloudflare 邊緣 + Oracle Free Tier 零成本底座」＋「De-Google 政策」（推理層採自架 Ollama，平台資料層以 Supabase 為正主）。

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
└────────────────────────────────────────────────────────────────────┘

並行部署通道：Vercel（root + htb-b2b + learning-center）· Firebase Hosting（learning-center）
             GHCR 容器映像（deploy-ghcr.yml → ghcr.io/dingjun1028/omniesggo）
             Cloudflare Pages（OmniFactory 組裝產物 → omni-factory.pages.dev）
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
├── apps/                  # ★ 32 個應用（詳見 §1 產品表）
│   ├── omnilive/           #   即時雙語字幕（server.mjs + public/index.html）
│   ├── stt/                #   STT 微服務（FastAPI, VOSK 模型在 models/）
│   ├── universal-translator/
│   ├── ftg-tours-website/  #   FTG 行銷站（含 CF Worker 線索 API）
│   ├── ftg-journey-web/    #   FTG 行程 App 前端
│   ├── ftg-journey-server/ #   FTG 行程 App 後端（Express+SQLite）
│   ├── htb-b2b/            #   HTB 官網（Vue 3）
│   ├── learning-center/    #   學員中心（Firebase）
│   ├── gateway/            #   OmniAgent Gateway v3
│   ├── mcp-gateway/        #   MCP Gateway（tzin 試點：契約式唯讀 AI 原生閘道）
│   ├── omni-factory/       #   萬能工廠：MEDCE 規格 → 組裝 → Cloudflare Pages
│   ├── evolution-engine/   #   進化引擎
│   ├── self-healing/       #   自癒機制
│   ├── knowledge-lifeform/ #   知識生命體
│   ├── agent_mesh/         #   代理網格
│   ├── oneringai/          #   OneRingAI 整合
│   ├── zoom-live-caption/  #   Zoom 即時字幕
│   ├── cf-tunnel-manager/  #   Cloudflare Tunnel 管理
│   ├── tencentdb-memory/   #   TencentDB 團隊記憶
│   ├── omni-blueprint-hub/ #   藍圖中樞
│   └── omni-api/           #   平台 API 層
├── packages/              # ★ 17 個 workspace 套件（見 §8 核心模組）
│   ├── omni-core/          #   IComponentCore 心核介面 + sealComponentCore Hash Lock 刻印
│   ├── oa-framework/       #   OA 萬能元框架（7 子框架 + 5T 管線，offline 可驗）
│   ├── omni-agent/         #   代理本體（5T Gate）
│   ├── omni-agent-bus/     #   萬能代理總線（事件骨幹, 冪等重放/分裂快照）
│   ├── ollama-mcp/         #   自架 Ollama MCP 橋（De-Google 推理層）
│   ├── omni-memory/ omni-db/ omni-forge/ omni-bridge/ capacities/
│   ├── omni-tag/ shared/ errors/ ui/ omni-ui/ i18n/ cli/
├── libs/ cli/              # 共用函式庫與 CLI（esggo / oa-cli / omnicli）
├── shared/                 # 跨倉共享層（prd-matrix.json PRD 矩陣正本）
├── tools/ts-matrix/        # TS 終始矩陣雙向驗證器 + drift baseline
├── vps/                    # VPS 運維：junaikey 萬能元鑰、優化、診斷
├── worker/                 # Cloudflare Worker（esggo-web 邊緣）
├── docs/                   # ★ 全部架構/ADR/手冊/交付證書（見 §9 文件索引）
├── tests/ e2e/             # 單元測試 + Playwright E2E
├── .github/workflows/     # ★ 35 條 CI/CD 流水線（見 §7 品質治理）
├── scripts/                # 治理腳本（sonar-quality-gate / check-soul-lineage / generate-schema-traceability…）
├── ecosystem.config.cjs    # VPS PM2 六服務定義
├── soul.md                 # ★ 版本血脈正本（soul-lineage.yml CI 守護）
├── pnpm-workspace.yaml     # workspace + overrides（安全釘版正主層）
└── ARCHITECTURE.md         # ★ 架構分析與產品落地指導
```

---

## 5. 快速開始

### 前置需求

- Node.js ≥ 20（CI 用 22）、pnpm 11（`corepack enable`）、Git
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
| `SONAR_TOKEN`（僅 GitHub Actions Secrets） | SonarCloud 品質閘 API 查核（無 token 時優雅跳過） |

### 測試與品質閘

```bash
pnpm test                        # vitest（根）
pnpm typecheck                   # tsc -p tsconfig.core.json
node tests/junaikey.test.mjs     # JunAikey + OmniTag（29 測試）
npx playwright test              # E2E（需先 pnpm dev）
node scripts/sonar-quality-gate.mjs   # SonarCloud 品質閘本地查核（零依賴 Node 22）
node tools/ts-matrix/verify.mjs  # TS 終始矩陣雙向驗證（輸出 drift-report.json）
pnpm verify:matrix              # 終始矩陣驗證（terminal-origin）
pnpm verify:prd-matrix           # PRD 矩陣驗證（OMN-PRD-001 FR/NFR 追溯）
pnpm verify:gap-matrix           # Gap 矩陣驗證
bash .hermes/auto-repair/ci-gate.sh --list HEAD   # 列出遠端 check 狀態
```

**CI 全綠閘**：任何 PR 上 `CI Green Gate` job 會輪詢同 commit 所有 check-runs，未全綠即紅燈——這是「不得開下一個 PR」的硬規則（詳見 `.hermes/auto-repair/CI-GATE.md`）。

---

## 6. 部署

| 通道 | 標的 | 觸發 | 健康閘 |
|---|---|---|---|
| **deploy-oracle.yml** | VPS 全服務（PM2 ×6 + nginx + 磁碟衛生） | push `main` | `esggo.co/health`、`omniagent.esggo.co/health` |
| **deploy-cloudflare.yml** | Worker `esggo` 邊緣 | push `main` | — |
| **deploy-ghcr.yml** | `ghcr.io/dingjun1028/omniesggo` 容器映像（latest + sha tag） | push `main`（Dockerfile/app/packages 變更） | 登入失敗僅 build 不 push |
| **omni-factory.yml** | OmniFactory 組裝產物 → Cloudflare Pages | push `main`（specs 變更） | 5T 驗證 + RWD 追溯 |
| **deploy-ftg-static.yml** | `/var/www/ftgtours` 靜態 | push `main`（apps/ftg-*） | — |
| **learning-center-ci.yml** | Firebase + Vercel 雙通道 | push `main`（apps/learning-center） | — |
| **Vercel Git** | root 平台 / htb-b2b / learning-center | push/PR | — |

VPS 新機一鍵：`sudo node vps/junaikey-optimize.mjs`（Docker log rotation、prune cron、swap、sysctl）。

---

## 7. 品質治理與 CI/CD 體系

本倉庫以「治理即程式碼」為原則，`.github/workflows/` 共 35 條流水線，分五層：

### 7.1 硬閘門（PR/main 必經）

| Workflow | 能力 |
|---|---|
| `ci-green-gate.yml` | 同 commit 全 check-runs 輪詢，未全綠即紅——「不得開下一個 PR」硬規則 |
| `ts-matrix.yml` | TS 終始矩陣雙向驗證閘：正向（宣告→實作）＋反向 shadow 掃描；棘輪規則——基線外新增 drift 即失敗（只減不增），drift-report 以 artifact 上傳為 5T 證據 |
| `schema-traceability.yml` | TypeBox schema 追溯閘：`scripts/generate-schema-traceability.mjs --check` 對照 `shared/prd-matrix.json` 正本（OMN-PRD-001 FR/NFR 追溯），已提交報告與 canon 不一致即失敗 |
| `soul-lineage.yml` | `soul.md` 版本血脈守護：`scripts/check-soul-lineage.mjs` 驗證 `docs/soul-lineage.json` 血脈連續，防斷鏈改寫 |
| `sonar-quality-gate.yml` | SonarCloud 品質閘 API 查核：零依賴 Node 22 腳本 `scripts/sonar-quality-gate.mjs` 於 PR 與 main 查詢 quality gate 狀態；`SONAR_TOKEN` 未設時優雅跳過不阻斷 |
| `repo-repair-checks.yml` | actionlint（由鎖定檔編譯）workflow 語法驗證＋oa-framework 離線 typecheck/build/5T 煙霧測試＋祕密掃描 regex fixture 驗證 |
| `security-audit.yml` | 週期安全審計（每週一 02:00 UTC）：pnpm audit（critical 即敗）、全庫祕密樣式掃描（AWS/GitHub/Stripe/Slack/私鑰）、.env 入庫檢查、過期依賴報告 |

### 7.2 自動修復（OA-TWINS Auto-Repair v2）

`auto-repair.yml`：監聽 OmniCore CI / ESG-GO CI/CD / AI Station 映像建置失敗，下載真實日誌 → 8 類錯誤分類（TypeScript / ESLint / test / build / dependency / secret / docker / unknown）→ 可修復類自動 fix（如 `: any`→`: unknown`、lint --fix、lockfile 重建）→ 驗證後開 `auto-repair/*` 分支 PR → tracker issue（去重）＋ Telegram／Email 通知 → OA 框架自驗（oa-selfcheck.sh：10 子框架 + OAB 5T 管線回歸）。

### 7.3 組裝與鑄造

| Workflow | 能力 |
|---|---|
| `omni-factory.yml` | 萬能工廠「README 即部署」：批次組裝 `apps/omni-factory/specs/` MEDCE 模組 → 5T/RWD/IComponentCore 追溯/暗色模式/R-SEAL 八項驗證 → main 部署 Cloudflare Pages |
| `sacred-pipeline.yml` | 三段式「原罪煉金」熵減管線：靜態掃描＋神聖契約單元測試 → Docker 映像鑄造（main）→ 零停機部署段 |
| `deploy-ghcr.yml` / `build.yml` / `verify-root-dockerfile.yml` | 生產容器映像建置推送 GHCR（GHA cache）與 Dockerfile 驗證 |

### 7.4 派遣與運維

`crewai-run.yml`（代理派遣）、`omnitag-weekly-audit.yml`（OmniTag 週審）、`oci-launch-vps.yml`、`vps-8642-direct.yml`／`vps-8642-onetime.yml`／`vps-ssh-diagnose.yml`（VPS 通道）、`deploy-deerflow.yml`、`deploy-bilingual.yml`、`deploy-worker.yml`、`worker-bootstrap.yml`、`omnilive-dns.yml`、`deploy-ftgtours-pages.yml`、`ftg-build-check.yml`、`check-design.yml`、`test.yml`／`test-dispatch.yml`、`ci.yml`、`build.yml`。

---

## 8. 核心模組速覽

### Workspace 套件生態（`packages/`）

| 套件 | 能力 |
|---|---|
| `@esggo/omni-core` | IComponentCore 心核介面＋`sealComponentCore` Hash Lock 刻印（Object.freeze + 雜湊鎖，不可竄改元件邊界） |
| `@esggo/oa-framework` | OA 萬能元框架：7 子框架＋5T 管線，可離線 typecheck/build/註冊煙霧驗證 |
| `@esggo/omni-agent` | 代理本體（5T Gate 出入口） |
| `@esggo/omni-agent-bus` | 萬能代理總線：事件／訊息骨幹，冪等重放、分裂快照、conduit 模式、OA 橋接、TencentDB 團隊記憶 |
| `@esggo/ollama-mcp` | 自架 Ollama MCP 橋（De-Google 推理層） |
| 其餘 | `omni-memory` `omni-db` `omni-forge` `omni-bridge` `capacities` `omni-tag` `shared` `errors` `ui` `omni-ui` `i18n` `cli` |

### MCP Gateway（`apps/mcp-gateway`，tzin 試點）

AI 原生 MCP 閘道（唯讀）：契約即 OpenAPI/MCP，default-deny，服務自架 Ollama agent 群。

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

6 維 MECE 結構化標籤 + 信任分級，cheat-sheet 見 `docs/OMNITAG-TRUSTLABEL-CHEATSHEET.md`。

### Cloudflare Billing 自動化（`scripts/cf-create-billing-token.mjs`）

Puppeteer 建 read-only billing token 寫入 `.env.local`。

---

## 9. 文件索引

| 文件 | 內容 |
|---|---|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | ★ 產品落地指導：UI/UX/RWD/客戶旅程/品質閘/路線圖 |
| `docs/esggo-platform-architecture.md` | 平台內部架構 |
| `docs/ARCH-SPEC-omnilive-translation.md` | OmniLive 規格書 |
| `docs/ESGGO-VPS-COMPLETE-GUIDE.md` | VPS 完整指南 |
| `docs/BRAND-GUIDE-2026-09-28.md` / `DESIGN.md` | 品牌與設計規範 |
| `docs/USER_MANUAL_COMPLETE.md` | 使用者手冊 |
| `docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md` | Schema 追溯正典 |
| `docs/adr/`（`docs/` 下 ADR-*.md） | 架構決策記錄 |
| `.hermes/auto-repair/CI-GATE.md` | CI 全綠閘規則 |
| `soul-chapter-*.md` / `soul.md` | 版本血脈章節（soul-lineage CI 守護） |

---

## 10. 開發規範

- **Commit**：5T 五行格式 ＋ `[best-practice:awakened]` 標籤；`git commit -F` 從檔讀取避免編碼問題。
- **Secrets**：一律 `.env.local`（gitignored）；pre-commit 掃描攔截；CI 端 `security-audit.yml` 全庫掃描兜底。
- **依賴安全**：overrides 鉗制在各安裝根 `pnpm-workspace.yaml`（root / learning-center / my-worker / oa-swarm），原則不跨 major。
- **PowerShell 落檔**：native 指令輸出要給程式讀時用 `cmd /c "命令 > file"`（PS 5.1 `>` 會轉 UTF-16LE）。
- **分支**：`feature/*` 開 PR → CI 全綠閘 → squash 合併 `main` → 自動部署。機器人提交一律走功能分支 PR，不得直推 `main`。
- **硬編碼禁令**：fail-fast，禁止祕密與環境值入碼；TypeBox schema 為契約正本，PRD 追溯以 `shared/prd-matrix.json` 為準。

## License

AGPL-3.0 — 詳見 [LICENSE](LICENSE)。