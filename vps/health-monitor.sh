#!/bin/bash
# vps/health-monitor.sh — 服務健康監控與自動修復
# 使用方式：ssh root@VPS "bash -s" < vps/health-monitor.sh
# 或排程：*/5 * * * * /bin/bash /var/www/esggo/vps/health-monitor.sh >> /var/log/health-monitor.log 2>&1

set -euo pipefail

# 配置
CONFIG_FILE="${1:-/var/www/esggo/vps/health-monitor.conf}"
source "$CONFIG_FILE" 2>/dev/null || {
    # 預設配置
    PM2_APPS=("esggo-core" "omniagent-gateway" "ftg-journey-server")
    CHECK_URLS=("http://127.0.0.1:3000/api/health" "http://127.0.0.1:8642/status" "http://127.0.0.1:8787/api/health" "http://127.0.0.1:8787/api/journeys")
    CPU_THRESHOLD=90
    MEM_THRESHOLD=85
    DISK_THRESHOLD=90
    RESTART_ON_FAILURE=true
    LOG_FILE="/var/log/health-monitor.log"
    ALERT_EMAIL="${ALERT_EMAIL:-}"
}

LOG_FILE="${LOG_FILE:-/var/log/health-monitor.log}"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

log() { echo "[$TIMESTAMP] $*" >> "$LOG_FILE"; }

# 1. 檢查 PM2 進程
check_pm2() {
    for app in "${PM2_APPS[@]}"; do
        STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import json, sys
apps = json.load(sys.stdin)
for a in apps:
    if a['name'] == '$app':
        print(a['pm2_env']['status'])
        break
" 2>/dev/null || echo "missing")

        if [ "$STATUS" != "online" ]; then
            log "WARN: $app is $STATUS (not online)"
            if [ "$RESTART_ON_FAILURE" = true ]; then
                log "ACTION: Restarting $app..."
                pm2 restart "$app" --update-env
                sleep 3
                NEW_STATUS=$(pm2 jlist 2>/dev/null | python3 -c "
import json, sys
apps = json.load(sys.stdin)
for a in apps:
    if a['name'] == '$app':
        print(a['pm2_env']['status'])
        break
" 2>/dev/null || echo "missing")
                log "RESULT: $app restarted → $NEW_STATUS"
            fi
        else
            log "OK: $app is online"
        fi
    done
}

# 2. 檢查 HTTP 端點
check_http() {
    for url in "${CHECK_URLS[@]}"; do
        HTTP_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 10 "$url" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "307" ]; then
            log "OK: $url → $HTTP_CODE"
        else
            log "FAIL: $url → $HTTP_CODE"
        fi
    done
}

# 3. 檢查系統資源
check_resources() {
    # CPU
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print int($2 + $4)}' || echo 0)
    if [ "$CPU_USAGE" -gt "$CPU_THRESHOLD" ]; then
        log "WARN: CPU ${CPU_USAGE}% > ${CPU_THRESHOLD}%"
    else
        log "OK: CPU ${CPU_USAGE}%"
    fi

    # Memory
    MEM_TOTAL=$(free -m | awk '/^Mem:/{print $2}')
    MEM_USED=$(free -m | awk '/^Mem:/{print $3}')
    MEM_PCT=$((MEM_USED * 100 / MEM_TOTAL))
    if [ "$MEM_PCT" -gt "$MEM_THRESHOLD" ]; then
        log "WARN: Memory ${MEM_PCT}% > ${MEM_THRESHOLD}%"
    else
        log "OK: Memory ${MEM_PCT}%"
    fi

    # Disk
    DISK_PCT=$(df -h / | awk 'NR==2{print int($5)}')
    if [ "$DISK_PCT" -gt "$DISK_THRESHOLD" ]; then
        log "WARN: Disk ${DISK_PCT}% > ${DISK_THRESHOLD}%"
    else
        log "OK: Disk ${DISK_PCT}%"
    fi
}

# 4. 檢查 Nginx
check_nginx() {
    if nginx -t >/dev/null 2>&1; then
        log "OK: Nginx config valid"
    else
        log "FAIL: Nginx config invalid"
        # 嘗試恢復
        log "ACTION: Restarting Nginx..."
        nginx 2>/dev/null || nginx -s reload 2>/dev/null || true
    fi
}

# 5. 主程式
main() {
    log "=== Health Check Start ==="
    check_pm2
    check_http
    check_resources
    check_nginx
    log "=== Health Check End ==="
}

main
