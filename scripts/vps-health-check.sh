#!/bin/bash
# VPS 定期健康檢查腳位
# 用途：排程執行（cron）監控 VPS 服務狀態
# 路徑：scripts/vps-health-check.sh

set -euo pipefail

# 設定
SSH_KEY="${SSH_KEY:-$HOME/.ssh/esggo_original}"
SSH_USER="${SSH_USER:-ubuntu}"
SSH_HOST="${SSH_HOST:-161.118.248.180}"
SSH_PORT="${SSH_PORT:-22}"
LOG_FILE="${LOG_FILE:-logs/vps-health.log}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"  # Telegram/Slack webhook

# 顏色輸出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 日誌函數
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

# 發送警報
send_alert() {
    local message="$1"
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -s -X POST "$ALERT_WEBHOOK" \
            -H 'Content-Type: application/json' \
            -d "{\"text\": \"$message\"}" > /dev/null 2>&1 || true
    fi
}

# SSH 執行遠端命令
remote_exec() {
    ssh -o StrictHostKeyChecking=no \
        -o ConnectTimeout=10 \
        -i "$SSH_KEY" \
        -p "$SSH_PORT" \
        "${SSH_USER}@${SSH_HOST}" \
        "$@" 2>/dev/null
}

# 檢查服務狀態
check_pm2_services() {
    log "檢查 PM2 服務..."
    
    local services_ok=0
    local services_total=0
    local failed_services=""
    
    # 取得 PM2 服務列表
    while IFS= read -r line; do
        if echo "$line" | grep -qE "^\s*[0-9]+"; then
            services_total=$((services_total + 1))
            if echo "$line" | grep -q "online"; then
                services_ok=$((services_ok + 1))
            else
                local name=$(echo "$line" | awk '{print $2}')
                failed_services="$failed_services $name"
            fi
        fi
    done < <(remote_exec "pm2 list" 2>/dev/null || true)
    
    if [ "$services_ok" -eq "$services_total" ] && [ "$services_total" -gt 0 ]; then
        log "${GREEN}✓ PM2 服務：$services_ok/$services_total online${NC}"
    else
        log "${RED}✗ PM2 服務異常：$services_ok/$services_total online${NC}"
        log "${RED}  失敗服務：$failed_services${NC}"
        send_alert "⚠️ VPS PM2 服務異常：$failed_services"
    fi
}

# 檢查系統資源
check_system_resources() {
    log "檢查系統資源..."
    
    # CPU 使用率
    local cpu_usage=$(remote_exec "top -bn1 | grep 'Cpu(s)' | awk '{print \$2}' | cut -d'%' -f1" || echo "N/A")
    log "  CPU: ${cpu_usage}%"
    
    # RAM 使用率
    local mem_info=$(remote_exec "free -m | awk 'NR==2{printf \"%.1f%% (%dMB/%dMB)\", \$3*100/\$4, \$3, \$4}'" || echo "N/A")
    log "  RAM: $mem_info"
    
    # Disk 使用率
    local disk_info=$(remote_exec "df -h / | awk 'NR==2{print \$5 \" (\" \$3 \"/\" \$2 \")\"}'" || echo "N/A")
    log "  Disk: $disk_info"
    
    # 檢查閾值
    if [ "$cpu_usage" != "N/A" ] && [ "${cpu_usage%.*}" -gt 80 ]; then
        log "${RED}⚠ CPU 使用率過高：${cpu_usage}%${NC}"
        send_alert "⚠️ VPS CPU 使用率過高：${cpu_usage}%"
    fi
}

# 檢查 nginx
check_nginx() {
    log "檢查 nginx..."
    
    if remote_exec "sudo nginx -t" > /dev/null 2>&1; then
        log "${GREEN}✓ nginx 配置正確${NC}"
    else
        log "${RED}✗ nginx 配置錯誤${NC}"
        send_alert "⚠️ VPS nginx 配置錯誤"
    fi
    
    if remote_exec "sudo systemctl is-active nginx" | grep -q "active"; then
        log "${GREEN}✓ nginx 運行中${NC}"
    else
        log "${RED}✗ nginx 未運行${NC}"
        send_alert "⚠️ VPS nginx 未運行"
    fi
}

# 檢查 Cloudflare Tunnel
check_cloudflared() {
    log "檢查 Cloudflare Tunnel..."
    
    if remote_exec "sudo systemctl is-active cloudflared" | grep -q "active" 2>/dev/null; then
        log "${GREEN}✓ cloudflared 運行中${NC}"
    else
        log "${YELLOW}! cloudflared 可能未運行${NC}"
    fi
}

# 檢查 TDAI Gateway
check_tdai_gateway() {
    log "檢查 TDAI Gateway..."
    
    if remote_exec "curl -s http://127.0.0.1:8420/health" > /dev/null 2>&1; then
        log "${GREEN}✓ TDAI Gateway 正常${NC}"
    else
        log "${YELLOW}! TDAI Gateway 可能未回應${NC}"
    fi
}

# 主要執行流程
main() {
    log "========================================="
    log "VPS 健康檢查開始"
    log "========================================="
    
    # 檢查 SSH 連線
    if ! remote_exec "echo 'SSH OK'" > /dev/null 2>&1; then
        log "${RED}✗ SSH 連線失敗${NC}"
        send_alert "🚨 VPS SSH 連線失敗！"
        exit 1
    fi
    
    check_pm2_services
    check_system_resources
    check_nginx
    check_cloudflared
    check_tdai_gateway
    
    log "========================================="
    log "VPS 健康檢查完成"
    log "========================================="
}

main "$@"
