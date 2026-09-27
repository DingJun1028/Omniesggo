#!/usr/bin/env bash
# ESGGO VPS Console One-shot Deploy
set -u
LOG=/var/log/esggo-console-deploy.log

run() {
  echo "[$(date '+%F %T')] $*"
  "$@" >> "$LOG" 2>&1
  local rc=$?
  echo "[$(date '+%F %T')] rc=$rc"
  return $rc
}

run mkdir -p /opt/esggo /var/log

echo "=== [1/x] network ==="
ip a || true
ip route || true
hostname -I || true
curl -s --max-time 5 http://checkip.amazonaws.com || echo "checkip unavailable"
ping -c 2 1.1.1.1 || true

echo "=== [2/x] firewall ==="
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 8642/tcp || true
ufw allow 9999/tcp || true
ufw reload || true
ufw status verbose || true

echo "=== [3/x] sshd ==="
systemctl restart sshd || true
ss -ltnp | grep ':22' || true
journalctl -u sshd -n 50 --no-pager || true

echo "=== [4/x] local services ==="
curl -s --max-time 3 http://127.0.0.1:8642/health || echo "health unavailable"
ss -ltnp | grep -E ':22 |:8642 |:3000 ' || true

echo "=== [5/x] write agent ==="
cat > /opt/esggo/vps-agent.sh <<'AGENT'
#!/usr/bin/env bash
set -euo pipefail
RELAY_IP="${1:-100.108.241.29}"
RELAY_PORT="${2:-9999}"
AUTH_TOKEN="${3:-$ESGGO_RELAY_TOKEN}"
POLL_INTERVAL="${POLL_INTERVAL:-3}"
RETRY_INTERVAL="${RETRY_INTERVAL:-10}"
VPS_IP=$(curl -s --max-time 5 http://checkip.amazonaws.com 2>/dev/null || echo "unknown")
GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log(){ echo -e "${GREEN}[AGENT]${NC} $1"; }
warn(){ echo -e "${YELLOW}[WARN]${NC} $1"; }
err(){ echo -e "${RED}[ERR]${NC} $1"; }
info(){ echo -e "${CYAN}[INFO]${NC} $1"; }
cleanup(){ log "Shutting down agent..."; exit 0; }
trap cleanup SIGTERM SIGINT
json_escape(){ python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo '\"\"'; }
exec_command(){
  local cmd_id="$1"; local command="$2"; local start_time=$(date +%s)
  log "Executing: $command"
  local stdout=""; local stderr=""; local exit_code=0
  stdout=$(eval "$command" 2> >(stderr=$(cat); echo "$stderr" >&2)) || exit_code=$?
  local end_time=$(date +%s); local duration=$((end_time - start_time))
  local result
  result=$(cat <<EOF
{
  "commandId": "$cmd_id",
  "vpsIp": "$VPS_IP",
  "stdout": $(printf '%s' "$stdout" | head -c 50000 | json_escape),
  "stderr": $(printf '%s' "$stderr" | head -c 10000 | json_escape),
  "exitCode": $exit_code,
  "duration": $duration,
  "hostname": "$(hostname)",
  "ts": "$(date -Iseconds)"
}
EOF
)
  local http_code
  http_code=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST "http://${RELAY_IP}:${RELAY_PORT}/result" \
    -H "Content-Type: application/json" \
    -H "X-Auth-Token: "$AUTH_TOKEN \
    -d "$result" --max-time 10 2>/dev/null || echo "000")
  if [ "$http_code" = "200" ]; then
    log "Result sent (exit=$exit_code, duration=${duration}s)"
  else
    warn "Failed to send result (HTTP $http_code)"
  fi
}
poll_loop(){
  info "Polling ${RELAY_IP}:${RELAY_PORT} every ${POLL_INTERVAL}s"
  info "VPS IP: ${VPS_IP}"
  info "Auth: ${AUTH_TOKEN}"
  while true; do
    local response
    response=$(curl -s --max-time 5 \
      -H "X-Auth-Token: "$AUTH_TOKEN \
      "http://${RELAY_IP}:${RELAY_PORT}/cmd" 2>/dev/null || echo '{"error":"connection_failed"}')
    if echo "$response" | grep -q '"idle":true'; then sleep "$POLL_INTERVAL"; continue; fi
    if echo "$response" | grep -q '"error"'; then warn "Connection error, retrying in ${RETRY_INTERVAL}s..."; sleep "$RETRY_INTERVAL"; continue; fi
    local cmd_id command
    cmd_id=$(echo "$response"   | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('id',''))" 2>/dev/null || echo "")
    command=$(echo "$response"  | python3 -c "import sys,json; print(json.loads(sys.stdin.read()).get('command',''))" 2>/dev/null || echo "")
    if [ -n "$cmd_id" ] && [ -n "$command" ]; then exec_command "$cmd_id" "$command"; fi
    sleep "$POLL_INTERVAL"
  done
}
log "=========================================="
log "  ESGGO VPS Agent Starting"
log "  Relay: ${RELAY_IP}:${RELAY_PORT}"
log "  VPS:   ${VPS_IP}"
log "=========================================="
info "Testing relay connection..."
if curl -s --max-time 5 -H "X-Auth-Token: "$AUTH_TOKEN "http://${RELAY_IP}:${RELAY_PORT}/status" > /dev/null 2>&1; then
  log "Relay connection OK"
else
  warn "Cannot reach relay at ${RELAY_IP}:${RELAY_PORT}"
  warn "Agent will keep trying..."
fi
info "Registering agent..."
curl -s --max-time 5 -X POST "http://${RELAY_IP}:${RELAY_PORT}/cmd" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: "$AUTH_TOKEN \
  -d "{\"command\":\"echo VPS Agent Connected\",\"description\":\"Agent registration\"}" > /dev/null 2>&1 || true
poll_loop
AGENT
chmod +x /opt/esggo/vps-agent.sh
echo "=== [6/x] start agent ==="
nohup bash /opt/esggo/vps-agent.sh 100.108.241.29 9999 ${ESGGO_RELAY_TOKEN} > /var/log/vps-agent.log 2>&1 &
echo "agent_pid=$!"

echo "=== [7/x] current listening services ==="
ss -ltnp | grep -E ':22 |:8642 |:3000 ' || true
echo "=== [8/x] app check ==="
curl -s --max-time 3 http://127.0.0.1:3000/health || echo "no /health"
curl -s --max-time 3 http://127.0.0.1:3000/ | head -c 200 || echo "no /"
echo "=== [9/x] portal log tail ==="
if [ -f /var/log/esggo-portal.log ]; then tail -n 20 /var/log/esggo-portal.log || true; fi
echo "=== CONSOLE_DEPLOY_DONE ==="
