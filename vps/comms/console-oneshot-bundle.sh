#!/usr/bin/env bash
# Paste this into the Oracle Serial Console when ready.
# It fixes root fs, network, sudoers, and starts the agent.
set -u
cat > /tmp/console-bundle.sh <<'BUNDLE'
#!/usr/bin/env bash
set -euo pipefail
echo "=== [1/9] disk ==="
lsblk
blkid
mount -o remount,rw / || true
fsck -y -A || true
echo "=== [2/9] fstab ==="
cat /etc/fstab | grep -vE '^\s*(#|$)' || echo "no active fstab lines"
echo "=== [3/9] network ==="
ip a || true
ip route || true
hostname -I || true
ucarp_status="$(systemctl status ucarper 2>/dev/null || true)"
systemd-networkd_status="$(systemctl status systemd-networkd 2>/dev/null || true)"
echo "ucarp: ${ucarp_status:0:120}"
echo "systemd-networkd: ${systemd-networkd_status:0:120}"
echo "=== [4/9] firewall ==="
ufw allow 22/tcp || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
ufw allow 8642/tcp || true
ufw allow 9999/tcp || true
ufw reload || true
ufw status || true
echo "=== [5/9] sshd ==="
systemctl restart sshd || true
ss -ltnp | grep ':22' || true
journalctl -u sshd -n 50 --no-pager || true
echo "=== [6/9] sudoers ==="
mkdir -p /etc/sudoers.d
cat > /etc/sudoers.d/101-oracle-cloud-agent-run-command <<'SUDO'
ocarun ALL=(ALL) NOPASSWD:ALL
SUDO
visudo -cf /etc/sudoers.d/101-oracle-cloud-agent-run-command || true
systemctl restart oracle-cloud-agent || true
echo "=== [7/9] local services ==="
(curl -s --max-time 3 http://127.0.0.1:8642/health || echo "gateway: unavailable") | sed 's/^/[gateway] /'
(ss -ltnp | grep ':3000' >/dev/null 2>&1 && echo "app: listening :3000" || echo "app: not listening :3000") | sed 's/^/[app] /'
echo "=== [8/9] write agent ==="
mkdir -p /opt/esggo
cat > /opt/esggo/vps-agent.sh <<'AGENT'
#!/usr/bin/env bash
set -euo pipefail
RELAY_IP="${1:-100.108.241.29}"
RELAY_PORT="${2:-9999}"
AUTH_TOKEN="${3:-$ESGGO_RELAY_TOKEN}"
POLL_INTERVAL="${POLL_INTERVAL:-3}"
RETRY_INTERVAL="${RETRY_INTERVAL:-10}"
VPS_IP="$(curl -s --max-time 5 http://checkip.amazonaws.com 2>/dev/null || echo unknown)"
info(){ printf '[INFO] %s\n' "$*"; }
log(){ printf '[AGENT] %s\n' "$*"; }
warn(){ printf '[WARN] %s\n' "$*"; }
json_escape(){ python3 -c 'import sys,json;print(json.dumps(sys.stdin.read()))' 2>/dev/null || echo '""'; }
exec_command(){
  local cmd_id="$1"; local command="$2"; local start_time=$(date +%s)
  log "executing: $command"
  local stdout=" local stderr="" local exit_code=0
  stdout="$(eval "$command" 2> >(stderr=$(cat); typeset -p stderr >&2))" || exit_code=$?
  local end_time=$(date +%s); local duration=$((end_time-start_time))
  local result
  result="$(cat <<EOF
{"commandId":"$cmd_id","vpsIp":"$VPS_IP","stdout":$(printf %s "$stdout" | head -c 50000 | json_escape),"stderr":$(printf %s "$stderr" | head -c 10000 | json_escape),"exitCode":$duration,"hostname":"$(hostname)","ts":"$(date -Iseconds)"}
EOF
)"
  local http_code
  http_code="$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://${RELAY_IP}:${RELAY_PORT}/result" -H 'Content-Type: application/json' -H "X-Auth-Token: ${AUTH_TOKEN}" -d "$result" --max-time 10 2>/dev/null || echo 000)"
  if [ "$http_code" = 200 ]; then log "sent exit=$exit_code ${duration}s"; else warn "send failed http=$http_code"; fi
}
poll_loop(){
  info "polling ${RELAY_IP}:${RELAY_PORT}"
  while true; do
    local response; response="$(curl -s --max-time 5 -H "X-Auth-Token: ${AUTH_TOKEN}" "http://${RELAY_IP}:${RELAY_PORT}/cmd" 2>/dev/null || echo '{"error":"connection_failed"}')"
    if printf '%s' "$response" | grep -q '"idle":true'; then sleep "$POLL_INTERVAL"; continue; fi
    if printf '%s' "$response" | grep -q '"error"'; then warn "connection error"; sleep "$RETRY_INTERVAL"; continue; fi
    local cmd_id command
    cmd_id="$(printf '%s' "$response" | python3 -c 'import sys,json;print(json.loads(sys.stdin.read()).get("id",""))')"
    command="$(printf '%s' "$response" | python3 -c 'import sys,json;print(json.loads(sys.stdin.read()).get("command",""))')"
    if [ -n "$cmd_id" ] && [ -n "$command" ]; then exec_command "$cmd_id" "$command"; fi
    sleep "$POLL_INTERVAL"
  done
}
log "starting vps-agent"
(curl -s --max-time 3 "http://${RELAY_IP}:${RELAY_PORT}/status" -H "X-Auth-Token: ${AUTH_TOKEN}" >/dev/null && log "relay ok") || warn "relay unavailable"
pkill -f "bash /opt/esggo/vps-agent.sh" >/dev/null 2>&1 || true
nohup bash /opt/esggo/vps-agent.sh "$RELAY_IP" "$RELAY_PORT" "$AUTH_TOKEN" >/var/log/vps-agent.log 2>&1 &
echo "agent_pid=$!"
AGENT
chmod +x /opt/esggo/vps-agent.sh
echo "=== [9/9] start agent ==="
pkill -f "bash /opt/esggo/vps-agent.sh" >/dev/null 2>&1 || true
nohup bash /opt/esggo/vps-agent.sh 100.108.241.29 9999 ${ESGGO_RELAY_TOKEN} >/var/log/vps-agent.log 2>&1 &
echo "agent_pid=$!"
sleep 1
ps aux | grep -E 'vps-agent|screen.*vps-agent' | grep -v grep || true
echo "=== BUNDLE_DONE ==="
BUNDLE
chmod +x /tmp/console-bundle.sh
bash /tmp/console-bundle.sh | tee /tmp/console-bundle.log
echo "=== LOG /tmp/console-bundle.log ==="
tail -n 40 /tmp/console-bundle.log || true
