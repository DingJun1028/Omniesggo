#!/bin/bash
# Self-Healing Engine 一鍵設定腳本
# 設定 GitHub Webhook + Gmail + Gemini API Key

echo "========================================"
echo "  Self-Healing Engine v0.5.0 設定精靈"
echo "========================================"
echo ""

# 檢查依賴
command -v node >/dev/null 2>&1 || { echo "❌ 需要 Node.js 18+"; exit 1; }
command -v git >/dev/null 2>&1 || { echo "❌ 需要 Git"; exit 1; }

# 取得 Repository 資訊
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || echo "/c/Project/esggo")
cd "$REPO_ROOT" 2>/dev/null || cd /c/Project/esggo

echo "📁 Repository: $(pwd)"
echo ""

# 1. Gemini API Key
echo "━━━ 步驟 1：Gemini API Key ━━━"
echo "從 https://aistudio.google.com/app/apikey 取得"
read -p "請輸入 GEMINI_API_KEY: " GEMINI_KEY
if [ -z "$GEMINI_KEY" ]; then
  echo "⚠️  未設定 Gemini Key — 修復時將使用 fallback mock 模式"
fi

# 2. Webhook Secret
echo ""
echo "━━━ 步驟 2：Webhook Secret ━━━"
WEBHOOK_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
echo "已自動產生 Webhook Secret: $WEBHOOK_SECRET"
echo "（請將此 Secret 一併填入 GitHub Repository → Settings → Webhooks → Secret）"

# 3. Gmail
echo ""
echo "━━━ 步驟 3：Gmail 設定 ━━━"
echo "選擇 Gmail 接收模式："
echo "  1) IMAP App Password（快速）"
echo "  2) Gmail API OAuth2 Token（推薦）"
echo "  3) 先跳過，稍後設定"
read -p "選擇 [1-3]: " GMAIL_MODE

GMAIL_USER=""
GMAIL_PASS=""
GMAIL_TOKEN=""

case $GMAIL_MODE in
  1)
    read -p "Gmail 地址: " GMAIL_USER
    read -p "App Password: " GMAIL_PASS
    ;;
  2)
    read -p "OAuth2 Token: " GMAIL_TOKEN
    ;;
  3)
    echo "⏭️  跳過 Gmail 設定"
    ;;
esac

# 4. 產生 .env 檔案
echo ""
echo "━━━ 產生 .env 設定檔 ━━━"
SELF_DIR="$(cd "$(dirname "$0")" && pwd)"

cat > "$SELF_DIR/.env" << EOF
# Self-Healing Engine v0.5.0
# 產生時間: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 伺服器
PORT=8790
ESGRO_REPO=$(pwd)

# Gemini API
GEMINI_API_KEY=${GEMINI_KEY}
GEMINI_MODEL=gemini-2.5-flash

# GitHub Webhook 驗證
WEBHOOK_SECRET=${WEBHOOK_SECRET}

# Gmail
GMAIL_USER=${GMAIL_USER}
GMAIL_APP_PASSWORD=${GMAIL_PASS}
GMAIL_OAUTH_TOKEN=${GMAIL_TOKEN}
GMAIL_POLL_INTERVAL_MS=60000

# 修復參數
MAX_HEALING_ATTEMPTS=5
VERIFY_COMMAND=pnpm run typecheck && pnpm run test

# 5T 治理
FIVE_T_ENABLED=true
EOF

echo "✅ 已寫入 $SELF_DIR/.env"

# 5. 安裝全域工具
echo ""
echo "━━━ 安裝 PM2（若需要）━━━"
if ! command -v pm2 &> /dev/null; then
  read -p "是否安裝 PM2 全域套件？[y/N] " INSTALL_PM2
  if [[ $INSTALL_PM2 =~ ^[Yy]$ ]]; then
    npm install -g pm2
  fi
else
  echo "✅ PM2 已安裝"
fi

# 6. 顯示 Webhook URL
echo ""
echo "━━━ GitHub Webhook 設定摘要 ━━━"
echo ""
echo "請在 GitHub Repository 設定："
echo "  Settings → Webhooks → Add webhook"
echo ""
echo "  Payload URL:  https://your-domain.com/webhook/github"
echo "  Content type: application/json"
echo "  Secret:       $WEBHOOK_SECRET"
echo "  Events:       ✅ Workflow runs"
echo "                ✅ Pushes"
echo ""
echo "========================================"
echo "  ✅ 設定完成"
echo "========================================"
echo ""
echo "啟動方式："
echo "  npm start          # 直接啟動"
echo "  pm2 start ecosystem.config.cjs  # PM2 常駐"
echo "  docker build -t self-healing . && docker run -d -p 8790:8790 self-healing"
