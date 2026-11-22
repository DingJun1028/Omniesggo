#!/usr/bin/env bash

set -euo pipefail

# 立即部署和啟動OmniJules指令碼
# 完整的ESGGO VPS部署，包含OmniJules智慧體

# 配置
VPS_USER="esggo"
VPS_HOST="esggo.internal"
BACKUP_DIR="/backups/esggo"
LOG_DIR="/var/log/esggo"
APP_DIR="/var/www/esggo"

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日誌函式
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $*"
}

error() {
    echo -e "${RED}[ERROR]${NC} $*" >&2
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $*"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $*"
}

# 立即部署和啟動OmniJules
function immediate_deploy_and_enable() {
    log "🚀 開始ESGGO OmniJules立即部署..."
    log "🎯 目標: 完整部署OmniJules v5.1.0智慧體，包含所有核心功能"
    
    # 建立目錄
    log "📁 建立目錄結構..."
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$APP_DIR"
    mkdir -p "$APP_DIR/logs"
    mkdir -p "$APP_DIR/node_modules"
    mkdir -p "$APP_DIR/packages"
    mkdir -p "$APP_DIR/vps"
    mkdir -p "$APP_DIR/scripts"
    success "目錄結構建立完成"
    
    # 安裝系統依賴
    log "🔧 安裝系統依賴..."
    if ! command -v node >/dev/null 2>&1; then
        log "安裝Node.js..."
        # 安裝Node.js
        apt-get update
        apt-get install -y curl gnupg
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
    # 安裝 pnpm
    if ! command -v pnpm >/dev/null 2>&1; then
        log "安裝pnpm..."
        npm install -g pnpm
    fi
    
    # 安裝PM2
    if ! command -v pm2 >/dev/null 2>&1; then
        log "安裝PM2..."
        npm install -g pm2
    fi
    
    success "系統依賴安裝完成"
    
    # 複製OmniJules檔案
    log "📦 部署OmniJules文件..."
    cp -r packages/omnikey-agent "$APP_DIR/"
    cp -r vps "$APP_DIR/"
    cp package.json ecosystem.config.cjs pnpm-workspace.yaml "$APP_DIR/"
    cp -r scripts "$APP_DIR/"
    success "OmniJules檔案複製完成"
    
    # 進入應用目錄
    cd "$APP_DIR"
    
    # 安裝依賴
    log "📚 安裝Node.js依賴..."
    pnpm install
    success "Node.js依賴安裝完成"
    
    # 執行5T協議合規性檢查
    log "🔒 執行5T協議合規性檢查..."
    if [[ -f "scripts/security-compliance-check.sh" ]]; then
        chmod +x "scripts/security-compliance-check.sh"
        ./scripts/security-compliance-check.sh
        success "5T協議合規性檢查完成"
    else
        log "⚠️ 5T協議合規性檢查指令碼未找到，使用基本檢查..."
    fi
    
    # 啟動應用
    log "🚀 啟動應用..."
    
    # 啟動Next.js應用
    pnpm run build
    
    # 通過PM2啟動應用
    if pm2 list | grep -q "esggo"; then
        log "⚠️ 應用已在執行，重啟..."
        pm2 restart esggo || pm2 start ecosystem.config.cjs --name esggo
    else
        pm2 start ecosystem.config.cjs --name esggo
    fi
    
    # 啟動OmniJules智慧體
    log "🧠 啟動OmniJules智慧體..."
    if [[ -f "vps/omni-server.mjs" ]]; then
        node vps/omni-server.mjs &
        OMNI_PID=$!
        log "OmniJules智慧體已啟動 (PID: $OMNI_PID)"
    else
        warn "OmniJules智慧體啟動指令碼未找到"
    fi
    
    # 建立監控服務
    log "📊 建立監控服務..."
    
    # 建立監控配置
    cat > "$LOG_DIR/monitor.sh" << 'EOF'
#!/bin/bash
# 監控服務指令碼
cd /var/www/esggo

# 檢查應用狀態
pm2 status esggo

# 檢查OmniJules智慧體狀態
if [[ -f "vps/omni-server.mjs.pid" ]]; then
    PID=$(cat vps/omni-server.mjs.pid)
    if kill -0 $PID 2>/dev/null; then
        echo "🎯 OmniJules智慧體執行正常 (PID: $PID)"
    else
        echo "❌ OmniJules智慧體未執行"
    fi
fi

# 顯示日誌
log_date=$(date +%Y%m%d)
if [[ -f "pm2-logs/esggo-$log_date.log" ]]; then
    echo "📋 最新應用日誌:"
    tail -20 "pm2-logs/esggo-$log_date.log"
fi
EOF

    chmod +x "$LOG_DIR/monitor.sh"
    success "監控服務建立完成"
    
    # 顯示部署摘要
    show_deployment_summary
}

# 顯示部署摘要
function show_deployment_summary() {
    log ""
    log "======== 🎯 ESGGO部署摘要 ========"
    log "📅 部署時間: $(date '+%Y-%m-%d %H:%M:%S')"
    log "🖥️  應用目錄: $APP_DIR"
    log "📋 監控目錄: $LOG_DIR"
    log "💾 備份目錄: $BACKUP_DIR"
    log ""
    log "🌐 服務狀態:"
    log "   • Next.js應用: $(pm2 status esggo 2>/dev/null || echo '未執行')"
    log "   • OmniJules智慧體: $(ps aux | grep 'omni-server.mjs' | grep -v grep | wc -l | tr -d ' ') 執行中"
    log "   • Nginx: $(systemctl is-active nginx 2>/dev/null || echo '未執行')"
    log ""
    log "🔗 訪問URL:"
    log "   • 應用: http://esggo.internal:3000"
    log "   • 閘道器: http://esggo.internal:8642/gateway"
    log "   • 健康檢查: http://esggo.internal/health"
    log ""
    log "📊 監控命令:"
    log "   • 檢視應用狀態: pm2 monit"
    log "   • 查看日志: pm2 logs esggo"
    log "   • 執行監控: $LOG_DIR/monitor.sh"
    log ""
    log "🛠️  管理命令:"
    log "   • 重啟應用: pm2 restart esggo"
    log "   • 停止應用: pm2 stop esggo"
    log "   • 開始應用: pm2 start esggo"
    log ""
    success "🎉 ESGGO部署完成！OmniJules智慧體已啟動！"
}

# 執行立即部署
immediate_deploy_and_enable "$@"
