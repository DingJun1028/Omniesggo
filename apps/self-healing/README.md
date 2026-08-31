# Self-Healing Engine v0.5.0

GitHub Actions + Gmail 錯誤自我修復系統，5T 治理 + OA-Twins 雙蜂組架構。

## 架構

```
[GitHub Actions] ──失敗──▶ [Webhook :8790] ──202──▶ [修復引擎]
[Gmail 信件] ────失敗──▶ [Gmail Poller] ──────▶ [修復引擎]
                                                         │
                                              ┌──────────┴──────────┐
                                              │   Gemini API 修復    │
                                              │   (遞迴最多 5 次)    │
                                              └──────────┬──────────┘
                                                         │ 測試通過
                                              ┌──────────┴──────────┐
                                              │  Hash Lock + freeze  │
                                              │  ESG GO 統一紀錄表    │
                                              └─────────────────────┘
```

## 快速啟動

### 1. 環境變數

```bash
# 必要
export GEMINI_API_key="your-key"

# GitHub Webhook 驗證（建議）
export WEBHOOK_SECRET="your-github-webhook-secret"

# Gmail 輪詢（二選一）
export GMAIL_USER="your@gmail.com"
export GMAIL_APP_PASSWORD="xxxx-xxxx-xxxx-xxxx"
# 或
export GMAIL_OAUTH_TOKEN="ya29..."

# 自訂
export PORT=8790
export ESGRO_REPO=/path/to/esggo
```

### 2. 啟動

```bash
cd apps/self-healing
npm install
npm start
```

### 3. Docker

```bash
docker build -t esggo/self-healing:latest .
docker run -d \
  --name self-healing \
  -p 8790:8790 \
  -e GEMINI_API_KEY=$GEMINI_API_KEY \
  -e WEBHOOK_SECRET=$WEBHOOK_SECRET \
  -v /path/to/esggo:/repo \
  esggo/self-healing:latest
```

### 4. PM2

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

## GitHub Webhook 設定

1. 前往 Repository → Settings → Webhooks → Add webhook
2. Payload URL: `https://your-domain.com/webhook/github`
3. Content type: `application/json`
4. Secret: 同 `WEBHOOK_SECRET`
5. 選擇 **Let me select individual events**：
   - ✅ Workflow runs
   - ✅ Pushes

## Gmail 設定

### 方式一：App Password（快速）
1. Google 帳戶 → 安全性 → 兩步驟驗證 → 應用程式密碼
2. 設定 `GMAIL_USER` + `GMAIL_APP_PASSWORD`

### 方式二：Gmail API + OAuth2（推薦）
1. Google Cloud Console → Gmail API → 啟用
2. 建立 OAuth2 Token
3. 設定 `GMAIL_OAUTH_TOKEN`

### 方式三：Pub/Sub 推送（即時）
1. 建立 Google Cloud Pub/Sub Topic
2. Gmail API → watch() 訂閱
3. 設定 push subscription 指向 `/webhook/gmail-pubsub`

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/health` | 健康檢查 |
| GET | `/api/5t` | 5T 協定狀態 |
| GET | `/api/tasks` | 任務狀態 |
| POST | `/webhook/github` | GitHub Actions 失敗 |
| POST | `/webhook/gmail` | Gmail 信件通知 |

## 5T 治理

| 原則 | 實作 |
|------|------|
| Traceable | `source_origin: GitHub-Actions-Error` |
| Trackable | 生命週期 Hook + UUID |
| Transparent | 零幻覺驗算標註 |
| Trustworthy | SHA-256 Hash Lock + Object.freeze() |
| Tangible | 動態回饋 + 狀態回報 |

## OA-Twins 雙蜂組對應

| 蜂王隊（暗 01-30） | 蜂后隊（光 31-60） |
|---------------------|---------------------|
| 錯誤分析 | 修復結果廣播 |
| 修復方案產生 | 狀態回報 |
| 沙箱測試 | 通知開發者 |
| Hash Lock 計算 | 文件更新 |

## 遞迴修復流程

```
1. 收到錯誤（GitHub Webhook 或 Gmail）
2. 分發 UUID，建立 IComponentCore
3. 呼叫 Gemini API 產生修復
4. 寫入目標檔案
5. 執行 npm run typecheck && npm test
6. 通過 → Hash Lock + freeze + 紀錄
7. 失敗 → 帶回新錯誤，最多 5 次遞迴
8. 超過 5 次 → 標記 FAILED，通知人工
```

## 測試

```bash
npm test
```

涵蓋：
- GET /health 回傳 200 + 5T 標誌
- GET /api/5t 回傳完整 5T 協定
- POST /webhook/github 忽略非失敗事件
- POST /webhook/github 接受失敗事件並回傳 202 + UUID
- POST /webhook/github 驗證 HMAC 簽章
- POST /webhook/gmail 忽略非失敗信件
- POST /webhook/gmail 接受失敗信件並回傳 202
- GET /api/tasks 回傳服務狀態
- GET 未知路徑回傳 404
