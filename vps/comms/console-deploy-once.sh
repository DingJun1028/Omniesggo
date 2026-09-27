=== 請整段貼進 Oracle Serial Console ===

cat <<'EOF' > /root/console-deploy.sh
#!/usr/bin/env bash
set -u
echo "=== [1/4] Writing repair script ==="
cat > /root/vps-console-repair.sh <<'REPAIR'
#!/usr/bin/env bash
set -u
echo "=== STEP 1 ==="; ip a || true; ip route || true
echo "=== STEP 2 ==="; ip -brief link show || true; ip -brief addr show || true; hostname -I || true
echo "=== STEP 3 iface ==="; INTF=$(ip -brief addr show | awk '($1 ~ /^(eth|ens|enp|veth|eno)/){print $1; exit}'); echo "detected_iface=${INTF:-none}"; [ "${INTF:-}" != "" ] && ip -4 addr show dev "$INTF" || true
echo "=== STEP 4 firewall ==="; ufw allow 22/tcp || true; ufw allow 80/tcp || true; ufw allow 443/tcp || true; ufw allow 8642/tcp || true; ufw allow 9999/tcp || true; ufw reload || true; ufw status verbose || true
echo "=== STEP 5 sshd ==="; systemctl restart sshd || true; ss -ltnp | grep ':22' || true; journalctl -u sshd -n 50 --no-pager || true
echo "=== STEP 6 local services ==="; (curl -s --max-time 3 http://127.0.0.1:8642/health || echo "health: unavailable") | sed 's/^/[gateway] /'; (ss -ltnp | grep ':22' >/dev/null 2>&1 && echo "ssh: listening" || echo "ssh: not listening") | sed 's/^/[ssh] /'
echo "=== STEP 7 relay probe ==="; (curl -s --max-time 5 "http://100.108.241.29:9999/status" -H "X-Auth-Token: ${ESGGO_RELAY_TOKEN}" || echo "relay: unavailable") | sed 's/^/[relay] /'
echo "=== STEP 8 agent ==="; [ -f /opt/esggo/vps-agent.sh ] && echo "[agent] found:/opt/esggo/vps-agent.sh" || echo "[agent] missing:/opt/esggo/vps-agent.sh"; ps aux | grep -E 'vps-agent|python.*agent|node.*agent' | grep -v grep || true
echo "=== STEP 9 auto fix ==="; if ! ss -ltnp | grep -q ':22 '; then echo "[fix] port22_not_listening"; ufw allow 22/tcp || true; ufw reload || true; systemctl restart sshd || true; fi
echo "=== STEP 10 ip ==="; hostname -I || true; ip -4 -o addr show up primary scope global || true
echo "=== REPAIR_DONE ==="
REPAIR
chmod +x /root/vps-console-repair.sh
echo "=== [2/4] Running repair ==="
bash /root/vps-console-repair.sh
echo "=== [3/4] Writing agent ==="
mkdir -p /opt/esggo
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
json_escape(){ python3 -c "import sys,json; print(json.dumps(sys.stdin.read()))" 2>/dev/null || echo '""'; }
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
    -H "X-Auth-Token: $AUTH_TOKEN" \
    -d "$result" \
    --max-time 10 2>/dev/null || echo "000")
  if [ "$http_code" = "200" ]; then
    log "Result sent (exit=$exit_code, ${duration}s)"
  else
    warn "Failed to send result (HTTP $http_code)"
  fi
}
poll_loop(){
  info "Polling ${RELAY_IP}:${RELAY_PORT} every ${POLL_INTERVAL}s"
  info "VPS IP: ${VPS_IP}"
  info "Auth: ${AUTH_TOKEN}"
  echo ""
  while true; do
    local response
    response=$(curl -s --max-time 5 \
      "http://${RELAY_IP}:${RELAY_PORT}/cmd" \
      -H "X-Auth-Token: $AUTH_TOKEN" 2>/dev/null || echo '{"error":"connection_failed"}')
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
echo ""
info "Testing relay connection..."
if curl -s --max-time 5 "http://${RELAY_IP}:${RELAY_PORT}/status" -H "X-Auth-Token: $AUTH_TOKEN" > /dev/null 2>&1; then
  log "Relay connection OK"
else
  warn "Cannot reach relay at ${RELAY_IP}:${RELAY_PORT}"
  warn "Agent will keep trying..."
fi
info "Registering agent..."
curl -s --max-time 5 -X POST "http://${RELAY_IP}:${RELAY_PORT}/cmd" \
  -H "Content-Type: application/json" \
  -H "X-Auth-Token: $AUTH_TOKEN" \
  -d '{"command":"echo '\''VPS Agent Connected'\''","description":"Agent registration"}' \
  > /dev/null 2>&1 || true
poll_loop
AGENT
chmod +x /opt/esggo/vps-agent.sh
echo "=== [4/4] Starting agent in screen ==="
screen -dmS vps-agent bash /opt/esggo/vps-agent.sh 100.108.241.29 9999 ${ESGGO_RELAY_TOKEN} || true
sleep 1
ps aux | grep -E 'vps-agent|screen.*vps-agent' | grep -v grep || true
echo "=== DEPLOY_DONE ==="
EOF
chmod +x /root/console-deploy.sh
bash /root/console-deploy.sh
EOF
