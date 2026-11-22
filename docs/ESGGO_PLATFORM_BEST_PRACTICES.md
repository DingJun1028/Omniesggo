# ESGGO 平台最佳實踐總集

> **整合自**：esggo-full-stack 技能書、esggo-vps-toolkit、AGENTS.md、esggo-learning-center-ui-cleanup
> **適用對象**：所有在 ESGGO 生態系統中工作的開發者、運維工程師、部署工程師
> **最後更新**：2026-07-23

---

## 目錄

1. [驗證與測試](#驗證與測試)
2. [開發環境](#開發環境)
3. [部署流程](#部署流程)
4. [CI/CD 流水線](#cicd-流水線)
5. [安全與認證](#安全與認證)
6. [Firebase 部署](#firebase-部署)
7. [VPS 運維](#vps-運維)
8. [Cloudflare 設定](#cloudflare-設定)
9. [故障排除](#故障排除)
10. [報告與溝通](#報告與溝通)

---

## 驗證與測試

### 驗證順序 (modernity first)

在宣傳任何變更前，**一律執行**：

```bash
pnpm run test    # 或 npm run test
pnpm run build   # 或 npm run build
```

**適用情況**：
- 修改 i18n 字串
- 修改元件行為
- 修改路由
- 修改 Firebase 對應
- 任何可能影響生產環境的變更

### 測試最佳實踐

- **測試框架**：Vitest (v4.1.10)
- **Windows 環境**：使用 `--no-file-parallelism` 旗標避免 worker timeout
  ```bash
  npx vitest run --no-file-parallelism
  ```
- **測試覆蓋範圍**：i18n translations、survey schema、mock cases

### Lint 約定

- **目標**：0 errors / 0 warnings
- **執行**：`pnpm run lint` / `pnpm run lint:fix`
- **特例**：
  - `src/repositories/**` + `src/db.js`：`no-unused-vars` 關閉（Firestore imports 為設計意圖）
  - `src/i18n/`：`no-dupe-keys` 關閉（不同父物件的同名 key 為正常結構）
  - 空 catch 允許（如 `catch {}` 吞掉 `delete window[cbName]` 錯誤）

---

## 開發環境

### 工作環境

- **工作目錄**：`C:\\Project\\esggo-learning-center`
- **路徑格式**：使用 POSIX/MSYS 風格（如 `/c/Project/esggo-learning-center`）
- **Node.js**：v24.18.0
- **包管理器**：pnpm v11.15.1

### OpenCode + Nous 整合

**OpenCode 版本**：1.18.4  
**模型**：`nous/poolside/laguna-s-2.1:free`  
**配置位置**：`~/.config/opencode/opencode.json`

**環境變數**：
```bash
export NOUS_API_KEY=<從 Hermes auth.json 提取的 access_token>
```

**配置範例**：
```json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "nous": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "Nous Research",
      "options": {
        "baseURL": "https://inference-api.nousresearch.com/v1",
        "apiKey": "{env:NOUS_API_KEY}"
      },
      "models": {
        "poolside/laguna-s-2.1:free": {
          "name": "Laguna S 2.1 (Free)",
          "limit": {
            "context": 262144,
            "output": 8192
          }
        }
      }
    }
  },
  "model": "nous/poolside/laguna-s-2.1:free"
}
```

**驗證**：
```bash
opencode models nous  # 應顯示 nous/poolside/laguna-s-2.1:free
opencode models       # 應包含 nous/poolside/laguna-s-2.1:free
```

### 技術棧

| 層級 | 技術 | 版本 |
|------|------|------|
| 構建工具 | Vite | 6.4.3 |
| 前端框架 | React | 18.3.1 |
| 樣式 | Tailwind CSS | - |
| 測試 | Vitest | 4.1.10 |
| 部署 | Firebase Hosting | - |
| 備援部署 | Vercel | - |
| 數據庫 | Firestore | - |

### 環境變數

- **`.env` 是唯一可信來源**：勿在元件內硬編碼目標網址
- **`.env` 不得讀入或出現在任何輸出中**
- **必要變數**：
  ```bash
  VITE_FB_API_KEY=AIzaSy...
  VITE_FB_AUTH_DOMAIN=esggo-learning-center.firebaseapp.com
  VITE_FB_PROJECT_ID=esggo-learning-center
  VITE_FB_STORAGE_BUCKET=esggo-learning-center.appspot.com
  VITE_FB_MESSAGING_SENDER_ID=1234567890
  VITE_FB_APP_ID=1:1234567890:web:abcdef123456
  VITE_BOOKING_URL=https://calendly.com/esggo-consulting
  VITE_ADMIN_PASS=your-admin-password
  ```

---

## 部署流程

### Firebase 部署 (主要)

**安全預設**：使用 combined 部署

```bash
firebase deploy --only hosting,firestore:rules
```

**hosting-only 快速路徑**：僅在確認 `firebase.json` 與 `.firebaserc` 完整、且本次無修改 `firestore.rules` 時使用。

**驗證**：部署後必須重新跑一次 `pnpm run build` 並確認無連動回歸。

### Vercel 部署 (備援)

```bash
vercel --prod --yes
```

### 部署前檢查清單

- [ ] `pnpm run test` 通過
- [ ] `pnpm run build` 成功
- [ ] `pnpm run lint` 0 errors / 0 warnings
- [ ] 確認 `.env` 變數完整
- [ ] 確認 `firebase.json` 與 `.firebaserc` 正確
- [ ] 若修改 `firestore.rules`，使用 combined 部署

---

## CI/CD 流水線

### GitHub Actions 工作流程

#### CI 工作流程 (`.github/workflows/ci.yml`)

```yaml
name: learning-center-ci
on:
  push:
    branches: [main, learning-center-init]
  pull_request:
    branches: [main]
```

**步驟**：
1. Checkout
2. Setup pnpm v11.15.1
3. Setup Node.js v24.18.0
4. Install dependencies (`pnpm install`)
5. Build (`pnpm run build`)
6. Test (`pnpm run test`)

#### 部署工作流程 (`.github/workflows/deploy.yml`)

**觸發**：push to `main` 或 `learning-center-init`

**部署目標**：
1. **Vercel** (production)
2. **Firebase** (production)
3. **Type sync check** (cross-repo)

### 必要的 GitHub Secrets

| Secret 名稱 | 用途 | 狀態 |
|-------------|------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 驗證 | ✅ 已設定 |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin SDK 金鑰 | ✅ 已設定 |
| `VERCEL_TOKEN` | Vercel 部署驗證 | ⏳ 待設定 |
| `VERCEL_ORG_ID` | Vercel 組織 ID | ⏳ 待設定 |
| `VERCEL_PROJECT_ID` | Vercel 專案 ID | ⏳ 待設定 |
| `FIREBASE_TOKEN` | Firebase 部署授權 | ⏳ 待設定 |

---

## 安全與認證

### Firebase 安全規則

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function authenticated() {
      return request.auth != null;
    }
    function isAdmin() {
      return authenticated() && request.auth.token.role == 'admin';
    }
    // ... 詳見 firestore.rules
  }
}
```

### Google OAuth 生產環境

檢查 GCP Console 設定：
1. Firebase Console → Authentication → Sign-in method → **Google enabled**
2. GCP Console → APIs & Services → Credentials → **Authorized domains** 包含：
   - `esggo-learning-center.web.app`
   - `esggo-learning-center.firebaseapp.com`
   - `localhost:5173`

### 密碼管理

- `.env` 檔案不得提交到版本控制
- 生產環境密碼通過 GitHub Secrets 管理
- Firebase service account key 安全處理（不展示私鑰內容）

---

## Firebase 部署

### 專案設定

- **Firebase 專案 ID**：`esggo-learning-center`
- **部署目標**：Firebase Hosting + Firestore
- **分支策略**：`main` → production, `learning-center-init` → staging

### Firebase 指令

```bash
# 登入
firebase login

# 使用指定專案
firebase use esggo-learning-center

# 預覽模擬器
firebase emulators:start

# 部署
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only functions
```

### Firebase Functions

- **Node.js 版本**：20
- **package.json engines**：
  ```json
  {
    "engines": {
      "node": "20"
    }
  }
  ```

---

## VPS 運維

### 伺服器規格

- **主機 IP**：161.118.252.147
- **作業系統**：Ubuntu 22.04 LTS (ARM64)
- **Web 伺服器**：Nginx
- **應用程式**：React SPA + API 代理

### Nginx 路由規劃

```
/        → React SPA (建置後的 dist/)
/api/    → 127.0.0.1:3000 (API 伺服器)
/ftg/    → /var/www/ftg-tours
```

### SSL 憑證

- **工具**：certbot
- **域名**：esggo.co / ftg.esggo.co
- **有效期**：至 2026-10-20

### 日常運維指令

```bash
# 查看服務狀態
sudo systemctl status esggo-nginx
sudo systemctl status esggo-api

# 重啟服務
sudo systemctl restart esggo-nginx
sudo systemctl restart esggo-api

# 查看日誌
pm2 logs esggo-api
tail -f /var/log/nginx/esggo-access.log

# SSL 續期
sudo certbot renew --dry-run
```

### Docker 容器化

**Docker 映像建置與部署**：

```bash
# 建置映像
docker build -t esggo-learning-center .

# 推到 VPS
docker save esggo-learning-center | gzip > esggo.tar.gz
scp esggo.tar.gz ubuntu@161.118.252.147:/tmp/

# 在 VPS 上載入
ssh ubuntu@161.118.252.147 "docker load < /tmp/esggo.tar.gz"

# 重啟容器
ssh ubuntu@161.118.252.147 "docker-compose down && docker-compose up -d"
```

**Docker Compose 配置**：

```yaml
version: '3.8'
services:
  esggo-frontend:
    build: .
    ports:
      - "80:80"
    volumes:
      - ./dist:/usr/share/nginx/html
    restart: unless-stopped
```

---

## Cloudflare 設定

### DNS 設定

- **域名**：esggo.co
- **SSL 模式**：Full (strict)
- **API 規則**：
  - 錯誤 9109：需透過 SSH 從 VPS 端執行 API
  - API 驗證：`Authorization: Bearer *** 或 `<account-token>`

### Rocket Loader 警告

- **Free 計劃**：Zone settings API 返回 invalid object identifier
- **解決方案**：在 Cloudflare Dashboard 手動關閉 Rocket Loader
- **影響**：Rocket Loader 會將 `<script type="module">` 改寫為動態 nonce type，導致全站全白

### R2 物件儲存

- **帳戶 ID**：`d9d7ecd92cbad6d858fba3e529b9cb7b`
- **S3 端點**：`https://d9d7ecd92cbad6d858fba3e529b9cb7b.r2.cloudflarestorage.com`
- **免費額度**：10GB 儲存, 1M A類作業, 10M B類作業
- **貯體**：尚未建立

---

## 故障排除

### 1. 部署失敗：Node.js 版本不匹配

```bash
# 檢查 Node.js 版本
node --version  # 需為 20.x
```

### 2. 服務無法啟動

```bash
# 檢查 PM2 進程
pm2 list
pm2 logs esggo-api

# 檢查 Nginx 配置
sudo nginx -t
sudo systemctl status nginx

# 檢查端口佔用
sudo lsof -i :3000
sudo lsof -i :80
```

### 3. SSL 證書問題

```bash
# 檢查證書狀態
sudo certbot certificates

# 續期
sudo certbot renew
```

### 4. Cloudflare 錯誤 9109

- **原因**：API 請求來自 Cloudflare 代理 IP，而非 VPS IP
- **解決**：在 VPS 端設定 API 驗證，或使用 Cloudflare Workers 代理

### 5. Firebase Functions 部署失敗

- **原因**：Node.js 版本不匹配
- **解決**：確認 `functions/package.json` 中的 `engines.node` 設定為 `"20"`

---

## 報告與溝通

### 步驟報告約定

- **編號完整性**：執行任何有編號的驗證/流程時，**每一個步驟編號都要交代**
- **跳過標註**：被正確跳過的步驟必須顯示「Step N：skipped（原因）」
- **禁止合理化**：不得以「不需要」「skill 沒要求」等說法繕飾缺口
- **誠實報告**：報告缺口是誠實問題，不是格式問題

### 溝通語言

- **主要語言**：繁體中文
- **適用範圍**：所有 UI 文本、輸出、錯誤訊息、UI 文案
- **i18n 原則**：新增或修改字串時，請同步補上對應 i18n key，不要殘留未翻譯的硬編碼英文字串

### 編輯與重構原則

- **小範圍修正**：使用 `patch`
- **重寫整檔**：先 read back 確認目前內容，避免遺漏 stale literal
- **Windows CJK 工作區**：以 read back 結果為準；write/patch 回報成功不構成最終答案，build 也不會發現殘留字串問題

---

## OpenCode + Hermes 雙向整合

### 整合概述

OpenCode 和 Hermes 之間建立雙向整合，實現工具共享和任務委派。

**詳細文檔**：`C:\Project\ESGGO VPS\docs\opencode-hermes-integration.md`

### 共享 MCP 伺服器

| 伺服器 | 用途 | 配置 |
|--------|------|------|
| `my-server` | 文件系統訪問 | `npx -y @modelcontextprotocol/server-filesystem /c/Project/esggo-learning-center` |
| `shared-url-mcp` | 共享 URL 讀取 | `node /c/Users/dingj/shared_url_mcp/dist/index.js` |

### 整合腳本

**位置**：`C:\Project\ESGGO VPS\scripts/opencode-hermes-integration.sh`

```bash
# 驗證整合
./opencode-hermes-integration.sh verify

# 同步 MCP 伺服器
./opencode-hermes-integration.sh sync

# 執行任務（自動選擇工具）
./opencode-hermes-integration.sh run "請分析 src/ 目錄" auto /c/Project/esggo-learning-center
```

### 自動工具選擇

| 任務類型 | 選擇工具 | 理由 |
|----------|----------|------|
| 分析、檢查、列出、閱讀、修改、編輯、重構、測試、建置 | OpenCode | 更適合程式碼分析和編輯 |
| 複雜推理、多步驟任務、協作 | Hermes | 更強大的推理和協作能力 |

### Hermes 作為 MCP 伺服器

```bash
hermes mcp serve  # 啟動 Hermes 作為 MCP 伺服器
```

---

## Hermes CLI + OpenCode CLI 完全整合

### 整合概述

Hermes CLI 和 OpenCode CLI 之間建立完全的雙向整合，實現工具共享和智能任務分配。

**詳細文檔**：`C:\Project\ESGGO VPS\docs/hermes-opencode-cli-integration.md`

### 統一命令介面

**位置**：`C:\Project\ESGGO VPS\scripts/hermes-opencode-cli-integration.sh`

```bash
# 驗證整合
./hermes-opencode-cli-integration.sh verify

# 顯示狀態
./hermes-opencode-cli-integration.sh status

# 使用 Hermes CLI
./hermes-opencode-cli-integration.sh hermes "請分析 ESGGO 專案架構" /c/Project/esggo-learning-center

# 使用 OpenCode CLI
./hermes-opencode-cli-integration.sh opencode "請列出 src/ 目錄的主要檔案" /c/Project/esggo-learning-center

# 智能選擇工具
./hermes-opencode-cli-integration.sh smart "請部署 ESGGO Learning Center 到 Firebase"
```

### 智能工具選擇

| 任務類型 | 選擇工具 | 理由 |
|----------|----------|------|
| 分析、檢查、列出、閱讀、修改、編輯、重構、測試、建置、程式碼 | OpenCode CLI | 更適合程式碼分析和編輯 |
| 部署、發布、配置、設置、故障排除、架構、策略、推理、協作 | Hermes CLI | 更強大的推理和協作能力 |
| 其他任務 | Hermes CLI | 預設選擇 |

### Hermes CLI 作為 MCP 伺服器

```bash
hermes mcp serve  # 啟動 Hermes 作為 MCP 伺服器
```

OpenCode CLI 可以通過配置使用 Hermes MCP 伺服器，實現 OpenCode → Hermes 的呼叫。

### 共享 MCP 伺服器

| 伺服器 | 用途 | Hermes CLI | OpenCode CLI |
|--------|------|------------|-------------|
| `my-server` | 文件系統訪問 | ✅ | ✅ |
| `shared-url-mcp` | 共享 URL 讀取 | ✅ | ✅ |
| `hermes` | Hermes 對話功能 | N/A | ✅ |

---

## 快速參考

### 常用開發指令

```bash
# 開發模式
pnpm run dev

# 編寫測試
pnpm run test

# 建置
pnpm run build

# Lint 修復
pnpm run lint:fix

# 部署
pnpm run deploy:all        # 完整部署
pnpm run deploy:hosting    # 僅部署 Hosting
pnpm run deploy:rules      # 僅部署 Firestore 規則
```

### 版本同步

- **共享類型**：`scripts/export-shared-types.js` 從 esggo monorepo 匯出
- **同步檢查**：`scripts/check-types-sync.js` 檢查兩個倉庫的類型是否同步
- **CI 驗證**：`TYPES_IN_SYNC` 表示同步成功

---

*Generated on: 2026-07-23*
*Team: 萬能蜂群 (Omni-Bee Colony)*
*Status: 整合完成 · 等待部署 Secrets 完成*
