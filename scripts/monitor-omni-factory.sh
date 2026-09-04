#!/bin/bash
# OmniFactory 監控 + 告警腳本
# 檢查模組健康度，若異常則透過 Telegram 告警

API_URL="https://omni.esggo.co/api/omni-factory/data"
HEALTH_URL="https://omni.esggo.co"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"
LOG_FILE="/var/log/omni-factory-monitor.log"

log() {
  echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] $*" | tee -a "$LOG_FILE"
}

send_alert() {
  local msg="$1"
  log "ALERT: $msg"
  if [ -n "$TELEGRAM_BOT_TOKEN" ] && [ -n "$TELEGRAM_CHAT_ID" ]; then
    curl -s --max-time 10 \
      -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="$TELEGRAM_CHAT_ID" \
      -d text="[OmniFactory 告警] $msg" \
      -d parse_mode=HTML > /dev/null
  fi
}

log "=== OmniFactory 健康檢查開始 ==="
http_code=$(curl -s --max-time 10 -o /dev/null -w "%{http_code}" "$HEALTH_URL")
if [ "$http_code" != "200" ]; then
  send_alert "主站 HTTP $http_code (預期 200)"
  exit 1
fi
log "✓ 主站 200 OK"

api_response=$(curl -s --max-time 10 "$API_URL")
if [ $? -ne 0 ]; then
  send_alert "API 無回應"
  exit 1
fi
module_count=$(echo "$api_response" | python3 -c "import sys,json; print(json.load(sys.stdin).get('total', 0))")
if [ "$module_count" -lt 30 ]; then
  send_alert "模組數不足: $module_count/30"
fi
log "✓ API OK: $module_count 模組"

avg_5t=$(echo "$api_response" | python3 -c "
import sys,json
d = json.load(sys.stdin)
modules = d.get('modules', [])
scores = []
for m in modules:
    t5 = m.get('t5', {})
    score = sum(1 for v in t5.values() if v)
    scores.append(score)
print(sum(scores) / len(scores) if scores else 0)
")
log "✓ 平均 5T 評分: $avg_5t/5"

log "=== 健康檢查完成 ==="
