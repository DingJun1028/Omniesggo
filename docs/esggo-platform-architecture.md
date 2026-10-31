# ESGGO 平台架構 — 免費層整合圖（連動已上線 esggo）

> 更新：2026-07-15
> 根目錄：`/var/www/esggo`（VPS live repo）
> 線上狀態：nginx 80/443 → PM2 `esggo-core`(3000) + `omniagent-gateway`(8642)

---

## 1. 已上線サービスの現狀

| 層 | 実體 | 位置 | 狀態 |
|---|---|---|---|
| Frontend | Next.js 16 App Router | `/var/www/esggo/app` + `/var/www/esggo/src/app` | online |
| Backend | Next.js API Routes | `/var/www/esggo/app/api/**` | online |
| Gateway | Express + WS | `/var/www/esggo/apps/gateway` | online |
| 反向代理 | nginx | `/etc/nginx/sites-available/esggo` | active |
| 行程管理 | PM2 | `ecosystem.config.cjs` | online |
| DB | SQLite + Redis | `/var/www/esggo/prisma/dev.db` + `127.0.0.1:6379` | online |
| AI 路由 | model-router | CF / Gemini / Groq / OpenRouter | 依 env 切換 |

---

## 2. 多雲免費層角色分配

### 2.1 Oracle Cloud Always Free（主營運平台）

角色：主機房 / 邊界 / 備份 / 監控

| 資源 | 免費額度 | ESGGO 使用方式 |
|---|---|---|
| ARM Ampere A1 | 2 OCPU / 12 GB | OA_VPS 主機 (esggo-core + gateway) |
| Block Vol | 200 GB | 系統 + `.next` / node_modules |
| Object Storage | 20 GB | `esggo-secret-backup` 加密備份 |
| Autonomous DB | 2  instances × 20 GB | OMNI_DB 備用 / RAG 向量（規劃中） |
| Monitoring | 5 億/10 億數據點 | CPU / 記憶體 / 網路監控告警 |
| Notification | Email 3000/月 | CD / 系統失敗警報 |
| Bastion | 全免 | 維運跳板（替代 22/8042） |

與 esggo 連動：
- `infra/vps/comms/keepalive.sh` → 保活防收割
- `infra/vps/omni/sql/` → ADB schema 建表（已規劃）
- OCI Vault → 存放 App Secret（不進 git）

---

### 2.2 GCP Free Tier（AI / 離線備援）

角色：Gemini / Firestore / BigQuery / 免費 AI 兜底

| 資源 | 免費層 | ESGGO 使用方式 |
|---|---|---|
| Gemini API | Free tier RPM/RPD | `apps/gateway/model-router.mjs` 主模型 |
| Firebase Spark | Firestore 5 萬讀/2 萬寫 | 使用者偏好 / session cache |
| Firestone Hosting | 免費靜態託管 | 若未來拆前端 static export |
| GCP Cloud Run | 200 萬 req/月 | 無伺服器函式（事件驅動） |
| BigQuery | 1 TB 掃描/月 | ESG 數據分析 |

與 esggo 連動：
- `.env` 內 `FIREBASE_PROJECT_ID=esg-sunshine`
- `@google/genai` 為依賴
- `model-router.ts` provider 包含 `gemini`

注意：
- 已存在 `docs/GCP-FREE-TIER-SAFETY-GUIDE.md` 規範
- Cloud Run 服務已設定 `max-instances=1` + `cpu-throttling=true`

---

### 2.3 Firebase Free（Spark）

角色：前端 auth + firestore cache

| 資源 | 免費層 | ESGGO 使用方式 |
|---|---|---|
| Firestore | 5 萬讀/2 萬寫/日 | 使用者設定快取 |
| Auth | 無限匿名登入 | 訪客身份 |
| Hosting | 10 GB | esggo.app fallback |
| Functions | 125 萬調用/月 | webhook / cron |

與 esggo 連動：
- `firebase-service-account.json` 已存在根目錄
- `.firebaserc` 綁定專案
- `.env` 有 `FIREBASE_*` 變數

---

### 2.4 第三方免費應用

角色：知識庫 / 郵件 / 邊緣 AI / 支付

| 服務 | 免費層 | ESGGO 使用方式 |
|---|---|---|
| Notion | 免費 workspace | 5T 合規資產同步（`notion-sync-service.ts`） |
| Cloudflare AI Workers | 10K req/日 | 免費 LLM 兜底（Llama 8B/70B, Mistral） |
| Telegram Bot | 免費 | 警報與 agent 通知 |
| Upstash Redis | 免費 10K req/日 | Rate limit / session |
| Groq | 免費 RPM | LLM 推理加速 |
| OpenRouter | 免費層 | 多模型路由 |

與 esggo 連動：
- `apps/gateway/.env` 內有 `CLOUDFLARE_*` / `NOTION_DATABASE_ID`
- `model-router.mjs` 路由含 `cloudflare` provider
- `src/core/services/notion-sync-service.ts` 寫入 Notion

---

## 3. 建議平台架構圖

```
/var/www/esggo/
├── apps/
│   └── gateway/              # Express + WS → 8642（PM2）
├── src/ + app/               # Next.js frontend + API → 3000（PM2）
│   ├── app/api/              # Route handlers
│   └── src/core/             # Services: model-router, notion-sync, ...
├── lib/                      # 業務邏輯層
├── infra/                    # 平台層
│   ├── nginx/                # nginx 設定參照
│   ├── pm2/                  # PM2 構成檔
│   ├── docker/               # Docker compose
│   ├── vps/comms/            # keepalive 等
│   ├── vps/omni/sql/         # ADB schema
│   └── scripts/              # 部署/維運腳本
├── platform/
│   ├── config/               # 環境/功能開關
│   ├── ops/                  # 維運 runbooks
│   └── runbooks/             # 事故回應
├── data/
│   ├── prisma/               # dev.db + schema
│   ├── reports/              # 產出報告
│   └── cache/                # 執行期快取
├── docs/
│   ├── GCP-FREE-TIER-SAFETY-GUIDE.md
│   ├── esggo-platform-architecture.md  ← 本檔案
│   └── ...
├── packages/                 # @esggo/* monorepo
├── package.json              # pnpm workspaces
└── ecosystem.config.cjs      # PM2
```

---

## 4. 與 esggo 的連動矩陣

| 免費層 | ESGGO 模組 | 連動方式 | fallback 策略 |
|---|---|---|---|
| Oracle VPS | esggo-core / gateway | nginx → localhost:3000/8642 | 無 |
| OCI Bastion | 維運入口 | bastion → 私網 22 | 公網 22 已關 |
| OCI Vault | secrets | gateway/.env 讀取 | 本地 env fallback |
| OCI Object | 加密備份 | gpg → scp → oci os put | 本地 tar.gz |
| OCI ADB | RAG / vector（規劃） | oracledb thin mode | staying local SQLite |
| GCP Gemini | model-router | `provider: "gemini"` | CF / Groq / OpenRouter |
| Firebase | Firestore cache | Admin SDK | memory cache |
| Cloudflare AI | LLM 兜底 | `provider: "cloudflare"` | 本地 gemma |
| Notion | 5T 合規資產 | notion-sync-service.ts | 靜態 markdown |
| Telegram | 告警 / agent | node-telegram-bot-api | email / log |
| Upstash | rate limit | `@upstash/redis` | memory store |

---

## 5. 建議執行步驟

1. 確認 VPS 分支：`git checkout vps/live`
2. 依本架構圖整理資料夾
3. 保留 `.env` / `.env.production` 不動
4. 逐步遷移 `infra/`、`platform/`、`data/`
5. 更新 `ecosystem.config.cjs` cwd
6. rebuild + restart PM2
7. 保留 `docs/GCP-FREE-TIER-SAFETY-GUIDE.md` 作為 GCP 合規參照

