#!/bin/bash
# vps/setup-ssl-ftgtours.sh — Let's Encrypt 證書申請 for ftgtours.esggo.co
# 使用方式：ssh root@VPS "bash -s" < vps/setup-ssl-ftgtours.sh

set -euo pipefail

DOMAIN="ftgtours.esggo.co"
EMAIL="dingjunhong1028@gmail.com"
NGINX_CONF="/etc/nginx/sites-enabled/esggo"

echo "=== SSL 證書申請 for ${DOMAIN} ==="

# 1. 安裝 Certbot
echo "[1/5] 安裝 Certbot..."
apt-get update -qq
apt-get install -y -qq certbot python3-certbot-nginx

# 2. 確認 Nginx 有 ACME challenge 路徑
echo "[2/5] 檢查 Nginx ACME challenge 配置..."
if ! grep -q ".well-known/acme-challenge" "$NGINX_CONF" 2>/dev/null; then
    cat > /etc/nginx/snippets/acme-challenge.conf << 'ACME'
location /.well-known/acme-challenge/ {
    root /var/www/certbot;
    allow all;
}
ACME
    nginx -t && nginx -s reload
fi

# 3. 確保 ftgtours.conf 已經在 sites-enabled
echo "[3/5] 確保 nginx 配置已載入..."
if [ ! -f "/etc/nginx/sites-enabled/ftgtours" ]; then
    ln -sf /etc/nginx/sites-available/ftgtours.conf /etc/nginx/sites-enabled/ftgtours
    nginx -t && nginx -s reload
fi

# 4. 取得 SSL 證書
echo "[4/5] 取得 SSL 證書..."
certbot certonly --nginx \
    --agree-tos \
    --email "$EMAIL" \
    --no-eff-email \
    -d "$DOMAIN" \
    --non-interactive

# 5. 確認證書並重載 nginx
echo "[5/5] 確認證書並重載 nginx..."
nginx -t && nginx -s reload

echo ""
echo "=========================================="
echo "  SSL 設定完成！"
echo "  證書路徑: /etc/letsencrypt/live/$DOMAIN/"
echo "  網址: https://$DOMAIN"
echo "=========================================="
