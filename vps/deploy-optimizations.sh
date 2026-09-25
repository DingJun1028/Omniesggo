#!/bin/bash
set -e

echo "=== Deploying VPS optimizations ==="

# 1. PM2 log rotation
cat > /etc/logrotate.d/pm2 << 'LOGEOF'
/var/log/pm2/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
LOGEOF
echo "[OK] PM2 log rotation configured"

# 2. SSL auto-renewal cron
echo '0 3 * * * root certbot renew --quiet --post-hook "nginx -s reload"' > /etc/cron.d/certbot-renewal
chmod 644 /etc/cron.d/certbot-renewal
echo "[OK] SSL auto-renewal configured"

# 3. Security headers - add directly to ftgtours nginx config
# (add_header directive must be in server block, not conf.d/)
echo '[OK] Security headers configured (see ftgtours-esggo.conf)'

# 4. Disable systemd ftg-journey.service to prevent PM2 conflict
sudo systemctl stop ftg-journey.service 2>/dev/null || true
sudo systemctl disable ftg-journey.service 2>/dev/null || true
sudo systemctl mask ftg-journey.service 2>/dev/null || true
echo "[OK] Systemd ftg-journey.service disabled"

# 5. Verify nginx config
nginx -t && nginx -s reload
echo "[OK] Nginx reloaded"

echo "=== All optimizations deployed ==="
