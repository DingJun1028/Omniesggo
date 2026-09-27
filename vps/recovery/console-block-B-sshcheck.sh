#!/usr/bin/env bash
# ============================================================
# ESGGO VPS Recovery — Console Block B
# ============================================================
set -u

echo "=== SSH ==="
(ss -ltnp || true) | grep -E ':22|LISTEN' || true
(cat /etc/ssh/sshd_config 2>/dev/null | grep -E '^(Port|PasswordAuthentication|PubkeyAuthentication|PermitRootLogin)') || true

echo "=== FIREWALL ==="
(command -v ufw >/dev/null 2>&1 && ufw status verbose || true)

echo "=== SERVICES ==="
(systemctl list-units --type=service --state=running || true) | head -60

echo "=== PM2 ==="
(command -v pm2 >/dev/null && pm2 list || true)

echo "=== CONNECTIVITY ==="
curl -sS http://127.0.0.1:9999/status -H "X-Auth-Token: ${ESGGO_RELAY_TOKEN}" || true

echo "=== block B done ==="
