#!/usr/bin/env bash
set -euo pipefail

# 遠端 Ubuntu 服務健康診斷腳本（三次改版）
# 預先確認本機 ssh 工具存在、ssh 若失敗則顯示明确訊息
KEY="/c/Users/dingj/.ssh/id_rsa_esggo"
HOST="161.118.252.147"
USER="ubuntu"

if ! command -v ssh >/dev/null 2>&1; then
  echo "ERROR: ssh not found in PATH"
  exit 1
fi

echo "===== host reachability ====="
if ping -4 -c 1 -W 2 "$HOST" >/dev/null 2>&1; then
  echo "PING_OK: $HOST is reachable (IPv4)"
else
  echo "PING_FAIL: $HOST not reachable via IPv4 ping"
fi

echo ""
echo "===== SSH-based checks ====="
SSHCmd=(ssh -o ConnectTimeout=8 -o StrictHostKeyChecking=accept-new -i "$KEY" "$USER@$HOST")

run_remote() {
  local cmd="$1"
  echo ""
  echo ">>> $cmd"
  if "${SSHCmd[@]}" "$cmd" 2>/dev/null; then
    :
  else
    echo "[remote command failed or unreachable]"
  fi
}

run_remote 'hostname && whoami && uname -a'
run_remote 'pm2 list || true'
run_remote 'pm2 logs telegram-webui-keepalive --lines 50 --nostream || true'
run_remote 'curl -fsS --max-time 5 http://127.0.0.1:3000/health || true'
run_remote 'curl -fsS --max-time 5 http://127.0.0.1:8787/health || true'
run_remote 'timeout 8 tailscale ip -4 2>/dev/null || true'
run_remote 'systemctl is-active nginx 2>/dev/null || true'
run_remote 'timeout 12 journalctl -u cloudflared --no-pager | tail -30 2>/dev/null || true'

echo ""
echo "===== done ====="
