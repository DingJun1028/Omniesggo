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

# 3. Security headers for nginx
cat > /etc/nginx/conf.d/security-headers.conf << 'SECEOF'
add_header X-Frame-Options "DENY" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
SECEOF

# Include security headers in nginx.conf if not already present
grep -q 'include /etc/nginx/conf.d/security-headers.conf' /etc/nginx/nginx.conf || \
    echo 'include /etc/nginx/conf.d/security-headers.conf;' >> /etc/nginx/nginx.conf
echo "[OK] Security headers configured"

# 4. Verify nginx config
nginx -t && nginx -s reload
echo "[OK] Nginx reloaded"

echo "=== All optimizations deployed ==="
