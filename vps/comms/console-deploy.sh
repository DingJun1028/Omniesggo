#!/usr/bin/env bash
set -u
echo "=== [1/4] Writing repair script ==="
cat > /root/vps-console-repair.sh <<'REPAIR'
#!/usr/bin/env bash
set -u
echo "=== STEP 1 ==="; ip a || true; ip route || true; curl -s --max-time 5 http://checkip.amazonaws.com || echo "checkip: unavailable"; ping -c 3 1.1.1.1 || true
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
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
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
