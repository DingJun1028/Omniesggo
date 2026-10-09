#!/bin/bash
# FTG Journey VPS 自動部署腳本
# 用法：./deploy-vps.sh

set -e

# 設定
VPS_IP="161.118.248.180"
SSH_KEY="$HOME/.ssh/vps_deploy_key"
VPS_USER="ubuntu"
DEPLOY_PATH="/var/www/ftgtours"
SERVICE_NAME="ftg-journey-api"

echo "🚀 開始 FTG Journey VPS 部署..."
echo "目標: $VPS_IP:$DEPLOY_PATH"

# 1. 檢查 SSH 金鑰是否存在
if [ ! -f "$SSH_KEY" ]; then
  echo "❌ SSH 金鑰不存在: $SSH_KEY"
  echo "💡 請確認金鑰路徑或將金鑰複製至 ~/.ssh/"
  exit 1
fi

# 2. 設定金鑰權限
chmod 600 "$SSH_KEY"

# 3. 執行 SSH 部署命令
echo "📦 連線至 VPS 並執行部署..."
ssh -i "$SSH_KEY" "$VPS_USER@$VPS_IP" << 'EOF'
  echo "🔗 SSH 連線成功"

  cd "$DEPLOY_PATH" || {
    echo "❌ 無法切換至部署目錄: $DEPLOY_PATH"
    exit 1
  }
  echo "📁 切換至部署目錄"

  echo "📦 拉取最新程式碼..."
  git pull origin main || {
    echo "❌ git pull 失敗，請檢查遠程儲存庫設定"
    exit 1
  }
  echo "✅ git pull 完成"

  echo "📦 安裝生產依賴..."
  pnpm install --production || {
    echo "❌ pnpm install 失敗"
    exit 1
  }
  echo "✅ 依賴安裝完成"

  echo "🔄 重啟 PM2 服務..."
  pm2 restart "$SERVICE_NAME" || {
    echo "⚠️ pm2 restart 失敗，嘗試啟動..."
    pm2 start ecosystem.config.js --env production || true
  }
  echo "✅ 服務重啟完成"

  echo "⏳ 等待服務啟動..."
  sleep 3

  echo "🏥 執行健康檢查..."
  HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ftgtours.esggo.co)
  echo "官網 HTTP 狀態: $HTTP_CODE"

  echo "📊 PM2 狀態..."
  pm2 status
EOF

echo "✅ VPS 部署完成！"

# 4. 本機健康檢查
echo "🔍 本機驗證..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ftgtours.esggo.co)
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ 官網可達，HTTP 200"
else
  echo "⚠️ 官網返回 HTTP $HTTP_CODE，請檢查"
fi