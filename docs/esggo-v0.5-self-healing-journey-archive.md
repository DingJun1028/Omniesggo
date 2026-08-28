# ESG GO v0.5 — Self-Healing Engine & FTG Journey App 建置存檔

> 日期：2026-08-29
> 版本：ESG GO v0.5.0 (InfoOne Core + Self-Healing Engine + FTG Journey)
> 状态：生産部署完成

---

## 一、系統架構總覽

```
┌─────────────────────────────────────────────────────────────────┐
│                        GitHub Actions                           │
│                           │ 失敗事件                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  Self-Healing Engine (VPS :8792)                                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ GitHub       │  │ Ollama       │  │ Telegram Notifier      │ │
│  │ Webhook      │  │ qwen3:8b     │  │ OA_Hermes_Superbot     │ │
│  │ HMAC 驗證    │  │ 遞迴修復     │  │ 修復通知               │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ 5T 治理層    │  │ Gmail Poller │  │ ESG GO 統一資料表      │ │
│  │ Hash Lock   │  │ IMAP 輪詢    │  │ SQLite + 證明庫        │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│  FTG Journey App                                                │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ journey     │  │ journey-api  │  │ Google OAuth           │ │
│  │ -frontend   │  │ -server      │  │ JWT 驗證               │ │
│  │ React SPA   │  │ Express API  │  │ 角色權限               │ │
│  └─────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 二、Self-Healing Engine v0.5.0

### 2.1 技術棧

| 技術 | 版本/説明 |
|------|---------|
| Node.js | v22.23.2 |
| 框架 | 原生 Node.js http（零依賴） |
| AI 引擎 | Ollama qwen3:8b |
| 進程管理 | PM2 |
| 反向代理 | nginx + Let's Encrypt |
| 通知 | Telegram Bot API |
| 郵件 | Gmail IMAP（Python fallback） |

### 2.2 核心檔案

| 路徑 | 説明 |
|------|------|
| `apps/self-healing/server.mjs` | 主伺服器（Webhook + 修復引擎 + 5T 治理） |
| `apps/self-healing/telegram-notifier.mjs` | Telegram 通知模組 |
| `apps/self-healing/gmail-poller.mjs` | Gmail 輪詢 Worker |
| `apps/self-healing/ecosystem.config.cjs` | PM2 常駐設定 |
| `apps/self-healing/Dockerfile` | 容器映像 |
| `apps/self-healing/test/server.test.mjs` | 測試（9/9 通過） |

### 2.3 API 端點

| 端點 | 方法 | 説明 |
|------|------|------|
| `/webhook/github` | POST | GitHub Actions 失敗事件接收 |
| `/webhook/gmail` | POST | Gmail 信件觸發接收 |
| `/api/5t` | GET | 5T 協定狀態查詢 |
| `/api/tasks` | GET | 任務狀態查詢 |
| `/health` | GET | 健康檢查 |

### 2.4 5T 治理標籤

| 原則 | 實作 |
|------|------|
| Traceable | `source_origin: GitHub-Actions-Error` |
| Trackable | UUID + 生命週期 Hook |
| Transparent | 零幻覺驗算標註 |
| Trustworthy | SHA-256 Hash Lock + Object.freeze() |
| Tangible | 動態狀態回報 |

### 2.5 遞迴自我修復迴圈

```
觸發 → 分析錯誤 → 提取目標路徑 → 呼叫 Ollama → 寫入檔案 → 沙箱測試
                                                          │
                                    失敗 ←────────────────┘
                                      ↓ 最多 5 次疊代
                                    再次修復 → 通過 → HEALED
```

### 2.6 GitHub Webhook 設定

```json
{
  "config": {
    "url": "https://self-healing.esggo.co/webhook/github",
    "content_type": "json",
    "secret": "4e9494...7747"
  },
  "events": ["workflow_run", "push"],
  "active": true
}
```

---

## 三、FTG Journey App

### 3.1 技術棧

| 技術 | 版本 |
|------|------|
| React | 19.2.x |
| Vite | 8.1.x |
| Framer Motion | 11.18.x |
| React Hook Form | 7.86.x |
| Express | 4.21.x |
| node:sqlite | 同步 API |
| Google Auth Library | 9.14.x |

### 3.2 前端架構（React）

```
ftg-journey-web/
├── src/
│   ├── components/
│   │   ├── ui/              # 設計系統元件
│   │   │   └── index.jsx    # Button, Card, Input, Modal, Badge
│   │   └── Layout.jsx       # 主導航佈局
│   ├── contexts/
│   │   └── AuthContext.jsx  # Google OAuth 認證
│   ├── pages/
│   │   ├── Dashboard.jsx    # 旅程列表
│   │   ├── JourneyDetail.jsx # 旅程詳情（Tab 切換）
│   │   └── LoginPage.jsx    # Google 登入
│   ├── styles/
│   │   └── theme.mjs        # 設計系統 Tokens
│   ├── App.jsx              # 路由配置
│   └── main.jsx             # 入口
└── .env.example             # 環境變數範例
```

### 3.3 後端架構（Express）

| 資料表 | 説明 |
|--------|------|
| `users` | 使用者（email, name, picture, role） |
| `journeys` | 旅程（title, destination, dates, purpose） |
| `journeys_members` | 成員（journey_id, email, role, consent_public） |
| `prep_items` | 準備事項（category, text, done） |
| `schedule` | 行程（title, date, time, location, alarm） |
| `notes` | 筆記（date, mood, text, photo） |
| `impact` | 影響力指標（metric_id, value, note） |

### 3.4 API 端點

| 端點 | 方法 | 説明 |
|------|------|------|
| `/api/me` | GET | 取得當前使用者資訊 |
| `/api/journeys` | GET/POST | 旅程列表/新增 |
| `/api/journeys/:id` | PUT/DELETE | 旅程編輯/刪除 |
| `/api/journeys/:id/prep` | GET/POST | 準備事項 |
| `/api/prep/:pid` | PUT | 更新準備事項 |
| `/api/journeys/:id/schedule` | GET/POST | 行程 |
| `/api/journeys/:id/notes` | GET/POST | 筆記 |
| `/api/journeys/:id/impact` | GET/POST | 影響力 |
| `/api/journeys/:id/public-report` | GET | 公開報告 |

### 3.5 角色權限

| 角色 | 説明 |
|------|------|
| admin | ADMIN_EMAILS 列表中的使用者 |
| staff | STAFF_DOMAINS 結尾的使用者 |
| member | 其他所有人 |

---

## 四、VPS 部署架構

### 4.1 服務矩陣

| 服務 | 埠號 | 技術 | 狀態 |
|------|------|------|------|
| self-healing | 8792 | Node.js | ✅ |
| gmail-poller | PM2 | Node.js | ✅ |
| oa-swarm | 8800 | Node.js | ✅ |
| universal-translator | 8788 | Node.js | ✅ |
| omniagent-gateway | 8642 | Node.js | ✅ |
| ftg-journey-server | 8787 | Node.js | ✅ |
| deerflow | Docker | - | ✅ |
| stt-whisper | Docker | Python | ✅ |
| hermes-webui | 8790 | Docker | ✅ |

### 4.2 nginx 虛擬主機

| 設定檔 | 對應域名 |
|--------|---------|
| `ftg-journey` | journey.ftgtours.esggo.co |
| `ftg-journey-api` | journey-api.ftgtours.esggo.co |
| `self-healing.esggo.co.conf` | self-healing.esggo.co |
| `oa.esggo.co.conf` | oa.esggo.co |
| `esggo-https-redirect.conf` | esggo.co |

---

## 五、秘密聖櫃（Secret Vault）

| 檔案 | 説明 |
|------|------|
| `ENV20230818.env` | 主環境變數（GitHub Token, Telegram, Gemini） |
| `ENV20260820.env` | 延伸環境變數 |
| `cloudflare_global_key.env` | Cloudflare Global API Key |
| `cloudflare_ftgtours_tokens.env` | Cloudflare ftgtours tokens |
| `gmail_app_password.env` | Gmail 帳密 |
| `tdai_gateway.env` | TDAI Memory Gateway |
| `esggo_original` | SSH 金鑰 |

---

## 六、安全性措施

| 項目 | 實作 |
|------|------|
| Webhook 驗證 | HMAC SHA-256 (`x-hub-signature-256`) |
| Google OAuth | JWT ID Token 驗證 |
| 速率限制 | express-rate-limit 120 req/min |
| CORS | 啟用 |
| 路徑解析 | 安全檢查防止路徑穿越 |
| SQL 注入 | 參數化查詢（prepared statements） |
| SSL | Let's Encrypt + TLS 1.2/1.3 |

---

## 七、OA-Twins 雙蜂組對應

| 蜂王隊（暗 01-30） | 蜂后隊（光 31-60） |
|---------------------|---------------------|
| 錯誤分析與修復 | 修復結果廣播 |
| Ollama API 呼叫 | Telegram 通知 |
| 沙箱測試執行 | 文件與紀錄更新 |
| Hash Lock 計算 | UI 狀態更新 |

---

## 八、進化路線圖

| 階段 | 時間 | 目標 |
|------|------|------|
| Phase 1 | 完成 | Self-Healing Engine + FTG Journey 基礎架構 |
| Phase 2 | 進行中 | Gmail 輪詢啟用、Telegram 通知強化 |
| Phase 3 | 規劃 | 自動 PR 提交、智慧修復建議 |
| Phase 4 | 規劃 | 全球蜂群網路 + 跨團隊協作 |

---

## 九、已知限制與待辦

| 項目 | 説明 |
|------|------|
| Gmail App Password | 需 16 位 App Password 才能啟用 IMAP |
| FTG Journey SSL | 目前使用 journey-api 憑證，需獨立憑證 |
| 前端設計系統 | 需加入 Tailwind CSS 或完整 CSS-in-JS |
| 測試覆蓋率 | 後端測試待擴充 |
| 多租戶支援 | 目前單一資料庫，需資料隔離 |

---

*Generated: 2026-08-29*
*Team: 萬能蜂群 (Omni-Bee Colony)*
*Status: Self-Healing Engine v0.5.0 + FTG Journey App v1.0 完成部署*
