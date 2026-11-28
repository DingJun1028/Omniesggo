# ESG-GO / DingJun1028

> **ESG 永續報告書平台 × 即時雙語語音工具鏈 × AI 代理蜂群**
> 一體化 pnpm/turbo monorepo — 從行銷觸點、轉換線索、交付應用到治理平台的完整產品棧

[![CI Green Gate](https://github.com/DingJun1028/esggo/actions/workflows/ci-green-gate.yml/badge.svg)](https://github.com/DingJun1028/esggo/actions/workflows/ci-green-gate.yml)
[![Deploy to Oracle VPS](https://github.com/DingJun1028/esggo/actions/workflows/deploy-oracle.yml/badge.svg)](https://github.com/DingJun1028/esggo/actions/workflows/deploy-oracle.yml)
[![Quality Gate](https://sonarcloud.io/api/project_badges/measure?project=esggo-monorepo&metric=alert_status)](https://sonarcloud.io/summary/overall?id=esggo-monorepo)
[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL--3.0-blue.svg)](LICENSE)

---

## 1. 專案總覽

本倉庫是 **ESG-GO 產品家族的單一真相源（Single Source of Truth）**，涵蓋三條客戶產品線與一支內部代理基礎設施。專案治理以 **萬能聖典 OmniBook（docs/vault-canon/OMNIBOOK.md，現行 v1.3.0）** 為正典：技術棧政策、架構地圖、四層品質治理、代理手冊與知識庫總綱皆以聖典為權威。

| 產品線 | 定位 | 主網域 | 技術棧 |
|---|---|---|---|
| **ESGO 平台**（根 `app/`） | GRI 2024 / CSRD ESRS 永續報告書工作台：動態表單引擎、重大性矩陣、碳工具、證據庫、哈希鎖鏈 | `esggo.co` | Next.js App Router · React 19 · Prisma · Supabase · Tailwind |
| **FTG 墾趣旅遊**（`apps/ftg-*`） | 企業永續旅遊：行銷站＋行程伴隨 App（Impact Note / ESG 任務 / 徽章）；行銷站為全倉 RWD 標竿（595 個 RWD 前綴 class、WCAG 對比度實測工程） | `ftgtours.esggo.co` · `journey.ftgtours.esggo.co` | React 19 + Vite + Tailwind（行銷）· Express + SQLite（API） |
| **語音工具鏈**（`apps/omnilive` `omnisub` `universal-translator` `stt`） | 零金鑰即時雙語字幕／轉譯：系統音訊擷取 → STT（VOSK/VoxSpica＋faster-whisper）→ 翻譯級聯 → SSE 字幕 | `omnilivetranslation.esggo.co` · `omnisub.esggo.co` · `translate.esggo.co` | Node ESM 零依賴 · Python FastAPI（STT） |
| **HTB 高科海藻**（`apps/htb-b2b`） | 永續海洋資源 B2B 官網（客戶交付案） | Vercel 部署 | Vue 3 + Vite + Tailwind 4 |
| **Learning Center**（`apps/learning-center`） | Berkeley ESG 課程學員中心：作業上傳、回放、Calendly 諮詢 | `esggo-learning-center.web.app` | React 19 + Vite + Firebase |
| **內部基礎設施** | OmniAgent Gateway（代理匯流排）、MCP Gateway（契約式唯讀 AI 原生閘道）、OmniFactory（README 即部署）、JunAikey 萬能元鑰（代理成長層）、OmniTag 標籤、蜂群框架、CSV 分析代理、OmniNote 徐變統合筆記 | `omniagent.esggo.co`（內網為主） | Node · WebSocket · NCB/local 雙後端 |

**設計哲學**：5T 協定（Traceable / Transparent / Trustworthy / Transferful / True）＋「零金鑰優先」（工具類產品不需註冊即可用）＋「Cloudflare 邊緣 + Oracle Free Tier 零成本底座」＋「De-Google 政策」（推理層採自架 Ollama，平台資料層以 Supabase 為正主）＋「行動優先 RWD」（三視口 375/768/1280 硬標準，見 §6）。

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
資料層：Supabase/Postgres（平台）· Cloudflare D1（FTG 線索）· SQLite（journey API）
        · NCB（代理記憶）· RAG 向量層 Weaviate Cloud 免費沙箱（REST Search API）
```

### RAG 向量層（Weaviate Cloud）

- 已由棄用之 GraphQL 遷移至 **REST Search API**（`POST /v1/search/{collection}/near-vector`，preview）：平面封套回應、真實 HTTP 狀態碼、JSON `where` 過濾器；`limit` 必須顯式指定（REST 預設 10 ≠ GraphQL 100）。
- WCD 免費層生命週期：7 天無活動暫停 → 30 天永久刪除（刪除前 1 天預警信）；每 6 小時 GH Actions 探測 keep-alive 對策已入正典。
- 正典：`docs/vault-canon/RAG-VECTOR-LAYER.md`；端到端驗收：`node scripts/verify-weaviate-cloud.mjs e2e`（待 WEAVIATE_URL/WEAVIATE_API_KEY 交付後可跑）。

### STT → 翻譯 → 字幕鏈（語音產品核心）

```
麥克風/系統音訊 ─► apps/stt (:8791)          VOSK(VoxSpica cn+en-us) 引擎,
                 │  ffmpeg→16kHz PCM        zh 自動 s2t 繁體化, 雙模型置信仲裁
                 ▼
apps/universal-translator (:8788)            LibreTranslate → MyMemory → 原文兜底
                 │                           （可選 Ollama 本地模型）
                 ▼
apps/omnilive (:8797) / apps/omnisub         SSE 雙語字幕 / 單檔零後端字幕浮窗
```

---

## 4. 倉庫結構

```
esggo/
├── app/ src/              # ★ ESGGO 平台（Next.js App Router, ~40 路由）
├── apps/                  # ★ 36 個應用（詳見 §1 產品表）
│   ├── omnilive/           #   即時雙語字幕（server.mjs + public/index.html）
│   ├── stt/                #   STT 微服務（FastAPI, VOSK 模型在 models/）
│   ├── universal-translator/
│   ├── ftg-tours-website/  #   FTG 行銷站（含 CF Worker 線索 API；RWD 標竿）
│   ├── ftg-journey-web/    #   FTG 行程 App 前端
│   ├── ftg-journey-server/ #   FTG 行程 App 後端（Express+SQLite）
│   ├── htb-b2b/            #   HTB 官網（Vue 3）
│   ├── learning-center/    #   學員中心（Firebase）
│   ├── gateway/            #   OmniAgent Gateway v3
│   ├── mcp-gateway/        #   MCP Gateway（tzin 試點：契約式唯讀 AI 原生閘道）
│   ├── omni-factory/       #   萬能工廠：MEDCE 規格 → 組裝 → Cloudflare Pages
│   ├── omni-note/ omninote-web/  # 萬能筆記（App + Web，Block-CRDT/熵值全域總覽）
│   ├── csv-analyst（agents/）#  CSV 分析代理（7 項離線測試納 CI）
│   ├── vibe-ci-monitor/ aistation/ esg-swarm/ evolution-engine/ self-healing/
│   ├── knowledge-lifeform/ agent_mesh/ oneringai/ zoom-live-caption/
│   ├── cf-tunnel-manager/ tencentdb-memory/ omni-blueprint-hub/ omni-api/
│   └── ftg-1.5 ~ ftg-3.0   #   FTG 歷史版本存檔
├── packages/              # ★ 27 個 workspace 套件（見 §9 核心模組）
│   ├── omni-core/          #   IComponentCore 心核介面 + sealComponentCore Hash Lock 刻印
│   ├── omni-arch/          #   12大萬能架構：12模組 + OmniHeart × OmniBrain + OmniHive 全知蜂巢（共享黑板＋動態競標）+ OmniProphet 先知矩陣 + 三模化身（tri-mode）+ 工具信任閘
│   ├── aios-matrix/        #   AIOS 融合矩陣：5 大行為核心 × 12 MECE 維度（元件即代理, verifyAiosTopology MECE 驗證）
│   ├── oa-framework/       #   OA 萬能元框架（7 子框架 + 5T 管線，offline 可驗）
│   ├── omni-agent/         #   代理本體（5T Gate）
│   ├── omni-agent-bus/     #   萬能代理總線（事件骨幹, 冪等重放/分裂快照）
│   ├── ollama-mcp/         #   自架 Ollama MCP 橋（De-Google 推理層）
│   ├── tailwind-preset/    #   @esggo/tailwind-preset：共用設計代幣（FTG 品牌色票/語意別名/字體，三站收斂，見 §6）
│   ├── oesg-pulse/ oesg-report/ oesg-audit/ oesg-exchange/ oesg-dao/ oesg-supabase/  # OESG 五站資料管線（Pulse→Report→Audit→Exchange→DAO）＋ Supabase sink
│   └── omni-memory/ omni-db/ omni-forge/ omni-bridge/ capacities/ omninote-unified/ omni-tag/ shared/ errors/ ui/ omni-ui/ i18n/ cli/
├── libs/ cli/              # 共用函式庫與 CLI（esggo / oa-cli / omnicli）
├── shared/                 # 跨倉共享層（prd-matrix.json PRD 矩陣正本）
├── tools/ts-matrix/        # TS 終始矩陣雙向驗證器 + drift baseline
├── vps/                    # VPS 運維：junaikey 萬能元鑰、優化、診斷
├── worker/                 # Cloudflare Worker（esggo-web 邊緣）
├── docs/vault-canon/       # ★ 聖典金庫（OMNIBOOK.md 萬能聖典、AIOS/OMNI-ARCH 正典、RAG 向量層、共享大腦公約）
├── omnibook/versions/      # ★ 聖典版本沿革全文快照（封存歷版，git 歷史後盾）
├── docs/                   # ★ 全部架構/ADR/手冊/交付證書（見 §10 文件索引）
├── tests/ e2e/             # 單元測試 + Playwright E2E（三視口 RWD 防護網，見 §6）
├── .github/workflows/     # ★ 41 條 CI/CD 流水線（見 §8 品質治理）
├── scripts/                # 治理腳本（sonar-quality-gate / check-soul-lineage / generate-schema-traceability / verify-weaviate-cloud…）
├── ecosystem.config.cjs    # VPS PM2 六服務定義
├── soul.md                 # ★ 版本血脈正本（soul-lineage.yml CI 守護）
├── pnpm-workspace.yaml     # workspace + overrides（安全釘版正主層；pnpm 12.16.1）
└── ARCHITECTURE.md         # ★ 架構分析與產品落地指導
```

---

## 5. 快速開始

### 前置需求

- Node.js ≥ 20（CI 用 22）、pnpm 12（root `packageManager` 為權威，`corepack enable` 自取）、Git
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
| `.env.local` | 本機私鑰（gitignored）：NCB token、CF token… |
| `apps/ftg-journey-server/.env.example` | Journey API（JWT/Google OAuth） |
| `worker/wrangler.toml` | CF Worker 綁定（D1/KV） |

| 關鍵變數 | 用途 |
|---|---|
| `NCBDB_API_TOKEN` / `NCBDB_PROJECT_ID` | JunAikey NCB 後端 |
| `VITE_RECAPTCHA_SITE_KEY` | FTG Contact 防濫（需搭配 Worker 端驗證） |
| `GOOGLE_CLIENT_ID` / `JWT_SECRET` | Journey App 登入 |
| `SONAR_TOKEN`（僅 GitHub Actions Secrets） | SonarCloud 品質閘 API 查核（無 token 時優雅跳過） |
| `WEAVIATE_URL` / `WEAVIATE_API_KEY` | Weaviate Cloud RAG 向量層（交付後端到端驗收解鎖） |

### 測試與品質閘

```bash
pnpm test                        # vitest（根）
pnpm typecheck                   # tsc -p tsconfig.core.json
node tests/junaikey.test.mjs     # JunAikey + OmniTag（29 測試）
npx playwright test              # E2E 三視口（desktop 1280 / tablet 768 / mobile 375；需先 pnpm dev）
npx playwright test --project=mobile   # 僅跑 375px 行動視口
node scripts/sonar-quality-gate.mjs   # SonarCloud 品質閘本地查核（零依賴 Node 22）
node scripts/verify-weaviate-cloud.mjs e2e   # WCD RAG 端到端（需憑證）
node tools/ts-matrix/verify.mjs  # TS 終始矩陣雙向驗證（輸出 drift-report.json）
pnpm verify:matrix              # 終始矩陣驗證（terminal-origin）
pnpm verify:prd-matrix           # PRD 矩陣驗證（OMN-PRD-001 FR/NFR 追溯）
pnpm verify:gap-matrix           # Gap 矩陣驗證
bash .hermes/auto-repair/ci-gate.sh --list HEAD   # 列出遠端 check 狀態
```

**CI 全綠閘**：任何 PR 上 `CI Green Gate` job 會輪詢同 commit 所有 check-runs，未全綠即紅燈——這是「不得開下一個 PR」的硬規則（詳見 `.hermes/auto-repair/CI-GATE.md`）。

---

## 6. RWD UI/UX 介面設計標準（OmniBook §5，2026-11 入典）

全倉 UI 一律遵循行動優先與三視口硬標準，_ftg-tours-website 為標竿實作_：

| 面向 | 硬標準 |
|---|---|
| 三視口 | 375px（mobile）/ 768px（tablet）/ 1280px（desktop）皆 **零水平捲動**（`scrollWidth ≤ clientWidth`） |
| 觸控目標 | CTA 可點擊區 ≥ 44×44px |
| 對比度 | 正文 ≥ 4.5:1；大字 ≥ 3:1（WCAG） |
| 載入體驗 | LCP < 2.5s、CLS < 0.1 |
| 佈局模式 | 行動優先 `flex-col sm:flex-row` |
| 表單防濫 | honeypot ＋ server 端 reCAPTCHA（接 lead-api 管線） |

**設計代幣單一真相源**：`packages/tailwind-preset`（`@esggo/tailwind-preset`）匯出 FTG 品牌色票（green/forest/leaf/sand/cream/orange）、語意別名（sunlight→sand、deepgreen→forest，引用而非複製 hex）與 fontFamily（sans: Inter，serif: Noto Serif TC）。各站 `tailwind.config.js` 以 `presets: [tailwindPreset]` 引用（Phase 1 已收斂 FTG，其餘站點漸進收敛）；站內不再複製色票，改色只動 preset 一處。

**E2E 防護網**：`playwright.config.ts` 內建三視口 projects（desktop 1280×720 / tablet 768×1024 / mobile 375×667），`e2e/rwd-viewport.spec.ts` 對首頁與 /omni-center 於 375/768 斷言零水平捲動；三份既有 spec 以三視口各跑一遍。

---

## 7. 部署

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

## 8. 品質治理與 CI/CD 體系

本倉庫以「治理即程式碼」為原則，`.github/workflows/` 共 41 條流水線，分五層：

### 8.1 硬閘門（PR/main 必經）

| Workflow | 能力 |
|---|---|
| `ci-green-gate.yml` | 同 commit 全 check-runs 輪詢，未全綠即紅——「不得開下一個 PR」硬規則 |
| `ts-matrix.yml` | TS 終始矩陣雙向驗證閘：正向（宣告→實作）＋反向 shadow 掃描；棘輪規則——基線外新增 drift 即失敗（只減不增），drift-report 以 artifact 上傳為 5T 證據 |
| `schema-traceability.yml` | TypeBox schema 追溯閘：`scripts/generate-schema-traceability.mjs --check` 對照 `shared/prd-matrix.json` 正本（OMN-PRD-001 FR/NFR 追溯），已提交報告與 canon 不一致即失敗 |
| `soul-lineage.yml` | `soul.md` 版本血脈守護：`scripts/check-soul-lineage.mjs` 驗證 `docs/soul-lineage.json` 血脈連續，防斷鏈改寫 |
| `sonar-quality-gate.yml` | SonarCloud 品質閘 API 查核：零依賴 Node 22 腳本於 PR 與 main 查詢 quality gate 狀態；`SONAR_TOKEN` 未設時優雅跳過不阻斷 |
| `repo-repair-checks.yml` | actionlint（由鎖定檔編譯）workflow 語法驗證＋oa-framework 離線 typecheck/build/5T 煙霧測試＋祕密掃描 regex fixture 驗證 |
| `security-audit.yml` | 週期安全審計（每週一 02:00 UTC）：pnpm audit（critical 即敗）、全庫祕密樣式掃描（AWS/GitHub/Stripe/Slack/私鑰）、.env 入庫檢查、過期依賴報告 |
| `5t-auto-verify.yml` | 5T OmniCore Hyper-Awakened Gatekeeper：5T 協定全自動驗證閘 |
| `csv-analyst-tests.yml` | CSV 分析代理 7 項離線測試 |

### 8.2 自動修復（OA-TWINS Auto-Repair v2）

`auto-repair.yml`：監聽 OmniCore CI / ESG-GO CI/CD / AI Station 映像建置失敗，下載真實日誌 → 8 類錯誤分類（TypeScript / ESLint / test / build / dependency / secret / docker / unknown）→ 可修復類自動 fix（如 `: any`→`: unknown`、lint --fix、lockfile 重建）→ 驗證後開 `auto-repair/*` 分支 PR → tracker issue（去重）＋ Telegram／Email 通知 → OA 框架自驗（oa-selfcheck.sh）。

### 8.3 組裝與鑄造

| Workflow | 能力 |
|---|---|
| `omni-factory.yml` | 萬能工廠「README 即部署」：批次組裝 `apps/omni-factory/specs/` MEDCE 模組 → 5T/RWD/IComponentCore 追溯/暗色模式/R-SEAL 八項驗證 → main 部署 Cloudflare Pages |
| `sacred-pipeline.yml` | 三段式「原罪煉金」熵減管線：靜態掃描＋神聖契約單元測試 → Docker 映像鑄造（main）→ 零停機部署段 |
| `deploy-ghcr.yml` / `build.yml` / `ci.yml` | 生產容器映像建置推送 GHCR（GHA cache）與建置驗證 |

### 8.4 與派遣與運維

`crewai-run.yml`（代理派遣）、`omnitag-weekly-audit.yml`（OmniTag 週審）、`oa-swarm-ci.yml`、`omninote-unified-ci.yml`、`omninote-web-ci.yml`、`skill-sync.yml`、`oci-launch-vps.yml`、`vps-8642-direct.yml`／`vps-8642-onetime.yml`／`vps-ssh-diagnose.yml`（VPS 通道）、`deploy-deerflow.yml`、`deploy-bilingual.yml`、`deploy-worker.yml`、`worker-bootstrap.yml`、`omnilive-dns.yml`、`deploy-ftgtours-pages.yml`、`ftg-build-check.yml`、`check-design.yml`、`test.yml`／`test-dispatch.yml`／`ci-check.yml`。

### 8.5 多代理協作公約

- **認領制**：代理行動前於協調 issue 留言認領，結案後回報；分支行動以 PR head 最新 check runs 為權威判讀（舊 head 收尾紅燈不阻合併）。
- **共享知識公約**：`docs/vault-canon/AGENT-SHARED-KNOWLEDGE.md` 規範共享大腦區讀寫、代理登錄表與交接協議。
- **合併紀律**：CI 全綠閘 success、mergeable_state clean 後方得 squash 合併 `main`。

---

## 9. 核心模組速覽

### Workspace 套件生態（`packages/`，27 套件）

| 套件 | 能力 |
|---|---|
| `@esggo/omni-core` | IComponentCore 心核介面＋`sealComponentCore` Hash Lock 刻印（Object.freeze + 雜湊鎖，不可竄改元件邊界） |
| `@esggo/oa-framework` | OA 萬能元框架：7 子框架＋5T 管線，可離線 typecheck/build/註冊煙霧驗證 |
| `@esggo/omni-agent` | 代理本體（5T Gate 出入口） |
| `@esggo/omni-agent-bus` | 萬能代理總線：事件／訊息骨幹，冪等重放、分裂快照、conduit 模式、OA 橋接、TencentDB 團隊記憶 |
| `@esggo/omni-arch` | 12大萬能架構實作：12 模組（四大維度）＋ OmniArch／OmniEngine／OmniTheme／OmniSeed／OmniUserRegistry ＋ OmniHeart × OmniBrain 生命體編排 ＋ OmniHive 全知蜂巢（共享黑板＋動態競標）／OmniProphet 先知矩陣（多重宇宙並行）／三模化身 tri-mode／工具信任閘 tool-trust-gate；正典見 `docs/vault-canon/OMNI-ARCH-12-MODULES.md` |
| `@esggo/aios-matrix` | AIOS 終極融合矩陣：5 大行為核心 × 12 大 MECE 維度（元件即代理）＋ `verifyAiosTopology()` MECE 拓撲驗證；正典見 `docs/vault-canon/AIOS-FUSION-MATRIX.md` |
| `@esggo/tailwind-preset` | 共用設計代幣 preset：FTG 品牌色票＋語意別名＋字體，三站 RWD 收斂 SSOT（見 §6） |
| `@esggo/ollama-mcp` | 自架 Ollama MCP 橋（De-Google 推理層） |
| `@esggo/omninote-unified` | 萬能筆記統合契約（TypeBox 契約, Block-CRDT） |
| OESG 五站管線 | `oesg-pulse`→`oesg-report`→`oesg-audit`→`oesg-exchange`→`oesg-dao`＋`oesg-supabase` sink |
| 其餘 | `omni-memory` `omni-db` `omni-forge` `omni-bridge` `capacities` `omni-tag` `shared` `errors` `ui` `omni-ui` `i18n` `cli` |

### MCP Gateway（`apps/mcp-gateway`，tzin 試點）

AI 原生 MCP 閘道（唯讀）：契約即 OpenAPI/MCP，default-deny 認證骨架（Bearer/X-Omni-Token、timingSafeEqual、fail-closed 503）、僅私有網路部署、非 root 容器。

### JunAikey 萬能元鑰（`vps/junaikey.mjs`）

代理成長層：記憶、技能、進度、閉環；NCBDB primary + local fallback。

```bash
node vps/junaikey.mjs awaken                       # 載入覺醒
node vps/junaikey.mjs doctor                       # 雙後端體檢
node vps/junaikey.mjs grow "skill-name" "描述" --traits=永恆
node vps/junaikey.mjs remember "事件摘要"          # 記憶（限長, 勿超欄位上限）
node vps/junaikey.mjs tag oracle-bv agent:13       # OmniTag 6 維
```

### OmniTag × Trust Label

6 維 MECE 結構化標籤＋可驗證信任分級（low 0.70 / medium 0.85 / high 0.95 / critical 1.00 / authenticated 0.90）；API `esggo.trustScore/trustGate/trustLabel`。

### Cloudflare Billing 自動化（`scripts/cf-create-billing-token.mjs`）

Puppeteer 建 read-only billing token 寫入 `.env.local`。

---

## 10. 文件索引

| 文件 | 內容 |
|---|---|
| **[ARCHITECTURE.md](ARCHITECTURE.md)** | ★ 產品落地指導：UI/UX/RWD/客戶旅程/品質閘/路線圖 |
| **`docs/vault-canon/OMNIBOOK.md`** | ★ 萬能聖典 OmniBook（現行 v1.3.0）：專案正典＋跨對話代理手冊＋知識庫總綱；含技術棧政策正典、四層品質治理、標準修法、§5 RWD UI/UX 標準；歷版快照封存 `omnibook/versions/` |
| `docs/esggo-platform-architecture.md` | 平台內部架構 |
| `docs/ARCH-SPEC-omnilive-translation.md` | OmniLive 規格書 |
| `docs/ESGGO-VPS-COMPLETE-GUIDE.md` | VPS 完整指南 |
| `docs/BRAND-GUIDE-2026-09-28.md` / `DESIGN.md` | 品牌與設計規範（DESIGN.md 對齊 editorial.* CSS 變數 SSOT） |
| `docs/USER_MANUAL_COMPLETE.md` | 使用者手冊 |
| `docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md` | Schema 追溯正典 |
| `docs/vault-canon/OMNI-ARCH-12-MODULES.md` | 12大萬能架構實作正典（模組對應表、接線、揭露） |
| `docs/vault-canon/AIOS-FUSION-MATRIX.md` | AIOS 終極融合矩陣正典（5 核心 × 12 維度 MECE） |
| `docs/vault-canon/RAG-VECTOR-LAYER.md` | RAG 向量層正典（WCD 遷移與 REST Search API 完成紀錄） |
| `docs/vault-canon/AGENT-SHARED-KNOWLEDGE.md` | 全代理共享知識公約（代理登錄表、認領／交接協議） |
| `docs/adr/`（`docs/` 下 ADR-*.md） | 架構決策紀錄 |
| `.hermes/auto-repair/CI-GATE.md` | CI 全綠閘規則 |
| `soul-chapter-*.md` / `soul.md` | 版本血脈章節（soul-lineage CI 守護） |

---

## 11. 開發規範

- **聖典至上**：技術棧政策、標準修法與品質治理以 `docs/vault-canon/OMNIBOOK.md` 為正典；變更聖典本身須走版本迭代 PR。
- **Commit**：5T 五行格式 ＋ `[best-practice:awakened]` 標籤；`git commit -F` 從檔讀取避免編碼問題。
- **Secrets**：一律 `.env.local`（gitignored）；pre-commit 掃描攔截；CI 端 `security-audit.yml` 全庫掃描兜底。
- **依賴安全**：overrides 鉗制在各安裝根 `pnpm-workspace.yaml`（root / learning-center / my-worker / oa-swarm），原則不跨 major；新增 workspace 套件時鎖檔以一次性 lockfile-sync 工作流同步（聖典標準修法）。
- **PowerShell 落檔**：native 指令輸出要給程式讀時用 `cmd /c "命令 > file"`（PS 5.1 `>` 會轉 UTF-16LE）。
- **分支**：`feature/*` 開 PR → CI 全綠閘 → squash 合併 `main` → 自動部署。機器人提交一律走功能分支 PR，不得直推 `main`。
- **硬編碼禁令**：fail-fast，禁止祕密與環境值入碼；TypeBox schema 為契約正本，PRD 追溯以 `shared/prd-matrix.json` 為準。
- **RWD 紀律**：任何 UI 變更不得違反 §6 三視口硬標準；PR 宜附 E2E 三視口執行結果。

## 12. 專業領域評述（2026-11-28 入典）

本節為 DevOps／CI-CD、軟體架構、資安與供應鏈三個專業領域對本倉庫現況之評述。觀點以第 7、8 節、ADR 級決策紀錄與 2026-10 至 11 月之實際 CI 事證為據，屬治理決策參考；各項主張之原始實證見對應工作流與 PR 紀錄。

### 12.1 DevOps／CI-CD 工程觀點

- **治理成熟度高**：41 條流水線分層（硬閘門／自動修復／組裝鑄造／派遣運維），`ci-green-gate.yml` 以同 commit 全量 check-runs 輪詢落實「全綠才可併」之硬規則，免除人工核對清單；同規模專案多數仍倚賴人工 CI 審閱，此處已程式化。
- **訊號品質治理值得肯定**：SSH 可達性預檢閘制（deploy-oracle／deploy-ftg-static／deploy-deerflow）將「外部基礎設施狀態」與「倉庫交付健康」分離，杜絕外部阻塞對 CI 觀測面之長尾紅燈污染；quality-gate 之 settle＋fresh-verdict 穩定雙窗處理 SonarCloud Automatic Analysis 競態，屬深入研究級修復（連續三次同型競態後之結構性收斂）。
- **風險提醒（單點集中）**：2026-11-25 GitHub 帳號因帳務問題遭鎖定，全部流水線與 Dependabot 同時停擺、失敗形態為零步驟 3 秒即敗——顯示交付體系與單一帳號健康度完全綁定。建議：(a) 帳務／配額告警通道獨立於 GitHub Actions（外部直達，如 Telegram bot 自行排程）；(b) 關鍵部署腳本保留可於 VPS 或本機直跑之離線路徑（`fix/hermes-serve-recovery` 之 workflow_dispatch 修復工作流即為此型之先例，應擴及部署主鏈）。
- **度量建議**：四項 DORA 指標（部署頻率、變更前置時間、變更失敗率、復原時間）尚無儀表板化資料；部署頻率可由 workflow runs 回推、變更失敗率可由 OA-TWINS tracker issue 統計，建議納入下一治理迭代，令「全綠文化」有量化基準。

### 12.2 軟體架構與系統設計觀點

- **契約閉環設計完整**：TypeBox schema 為契約正本、`shared/prd-matrix.json` 為 PRD 追溯正本、`soul-lineage` 守護版本血脈——「文件—程式—測試」三方以機器可驗證方式閉環，具備多數 monorepo 缺乏之縱向追溯能力；schema-traceability 閘令追溯斷鏈即紅，追溯不再是口號。
- **棘輪（ratchet）模式正確**：TS 終始矩陣之 drift 基線採只減不增規則，屬漸進償債之標準作法，避免全量清償凍結演進；drift-report 以 artifact 上傳為 5T 證據，令債務成為可觀測存量。
- **套件生態治理集中化**：overrides 鉗制集中於各安裝根 `pnpm-workspace.yaml`（root／learning-center／my-worker／oa-swarm）而非 package.json，已正確回應 pnpm 12 之行為變化；新增 workspace 套件之鎖檔同步以一次性 lockfile-sync 工作流處理，屬可複用標準修法。
- **風險提醒（治理耦合）**：5T 驗證與聖典高度耦合（soul.md 變更即觸發血脈閘），聖典演進須嚴格走版本迭代 PR，防止治理規則反成演進阻力；ADR 制度（docs/adr/）已具備，建議重大技術決策維持「無 ADR 不落地」紀律，令評述類內容（含本節）與決策類內容分流。

### 12.3 資安與供應鏈風險觀點

- **供應鏈防護面完整**：actionlint 由鎖定檔編譯驗證 workflow 語法、每週 `security-audit.yml` 執行 pnpm audit（critical 即敗）＋全庫祕密樣式掃描（AWS／GitHub／Stripe／Slack／私鑰）＋.env 入庫檢查＋過期依賴報告；機器人提交一律走功能分支 PR 不得直推 main，供應鏈變更路徑單一可控。
- **憑證治理成熟**：明文永不入庫、vault 分層管理、指紋比對驗證、一次性 OTS 交接、公開倉庫報告只輸出布林值與指紋——此套紀律於公開倉庫屬少見嚴格，且已由歷次（self-leak 自犯自補後之立即輪替）實證具備事件應變能力。
- **風險提醒一（權限最小化）**：一次性 probe 工作流之 `permissions` 應逐案按需賦予（contents／actions／issues: write 各自獨立），且不得使用非白名單鍵；建議將此慣例入第 11 節開發規範成文。
- **風險提醒二（部署鏈依賴晉級）**：wrangler 與 TypeScript major 已隨 Dependabot 自動晉級（typescript 7.0.2、wrangler 4.166），而 PR CI 綠不等於部署綠（pdf-parse→@napi-rs/canvas 建置圖譜事故之實證）；部署鏈依賴（wrangler／vinext／vite／pdf-parse）之任何更新，其部署工作流實跑結果應視為合併前置條件。
- **風險提醒三（審計離線路徑）**：排程安全審計與帳號健康度連動，帳務鎖定期間週期審計同步停擺；workflow_dispatch 預檢模式（探針觸發排程工作流實跑）應保留為常規預演手段，於重大合併波次後主動預檢，勿待週期自然到來方發現阻塞。

---

## License

AGPL-3.0 — 詳見 [LICENSE](LICENSE)。
