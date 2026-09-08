#!/bin/bash
# hermex-nginx-token-injection.sh
# Fixes nginx SPA token injection for Hermex PWA deployment
# 
# Root cause: `hermes serve` runs in headless mode and returns 404 for /index.html
# Solution: nginx serves static index.html + sub_filter injects session token
#
# Usage: sudo bash hermex-nginx-token-injection.sh

set -euo pipefail

NGINX_CONF="/etc/nginx/sites-enabled/hermex.conf"
WEB_DIST="/opt/hermes-venv/lib/python3.12/site-packages/hermes_cli/web_dist"
SERVICE_FILE="/etc/systemd/system/hermes-serve.service"
BACKUP_SUFFIX=".bak.$(date +%Y%m%d_%H%M%S)"

# Step 1: Extract session token from systemd service file
echo "[1/6] Extracting session token from $SERVICE_FILE..."
TOKEN=$(grep -oP 'HERMES_DASHBOARD_SESSION_TOKEN=\K[^ ]+' "$SERVICE_FILE" 2>/dev/null || true)

if [[ -z "$TOKEN" ]]; then
    # Fallback: try EnvironmentFile
    ENV_FILE=$(grep -oP 'EnvironmentFile=\K.*' "$SERVICE_FILE" 2>/dev/null || true)
    if [[ -n "$ENV_FILE" && -f "$ENV_FILE" ]]; then
        TOKEN=$(grep -oP 'HERMES_DASHBOARD_SESSION_TOKEN=\K.*' "$ENV_FILE" 2>/dev/null | tr -d '"' || true)
    fi
fi

if [[ -z "$TOKEN" ]]; then
    echo "ERROR: Could not extract session token from systemd service file"
    echo "Falling back to environment variable..."
    TOKEN="${HERMES_DASHBOARD_SESSION_TOKEN:-}"
fi

if [[ -z "$TOKEN" ]]; then
    echo "ERROR: No session token available. Set HERMES_DASHBOARD_SESSION_TOKEN env var."
    exit 1
fi

echo "  Token found: ${TOKEN:0:8}..."

# Step 2: Backup current nginx config
echo "[2/6] Backing up current nginx config..."
if [[ -f "$NGINX_CONF" ]]; then
    cp "$NGINX_CONF" "${NGINX_CONF}${BACKUP_SUFFIX}"
    echo "  Backup saved: ${NGINX_CONF}${BACKUP_SUFFIX}"
fi

# Step 3: Generate new nginx config with sub_filter
echo "[3/6] Writing new nginx config with sub_filter token injection..."
cat > "$NGINX_CONF" << 'NGINX_EOF'
server {
    listen 8795;
    server_name hermex.esggo.co localhost;

    # Web dist static root
    root /opt/hermes-venv/lib/python3.12/site-packages/hermes_cli/web_dist;
    index index.html;

    # SPA: serve static index.html from disk and inject session token via sub_filter
    # This bypasses the headless backend's 404 on /index.html
    location = / {
        try_files /index.html =404;
        sub_filter '</head>' '<script>window.__HERMES_SESSION_TOKEN__="TOKEN_PLACEHOLDER";</script></head>';
        sub_filter_types text/html;
        sub_filter_once on;
    }

    location = /index.html {
        try_files /index.html =404;
        sub_filter '</head>' '<script>window.__HERMES_SESSION_TOKEN__="TOKEN_PLACEHOLDER";</script></head>';
        sub_filter_types text/html;
        sub_filter_once on;
    }

    location /auth/password-login {
        proxy_pass http://127.0.0.1:9119;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:9119;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Authorization $http_authorization;
        proxy_read_timeout 3600s;
    }

    location /api/ws {
        proxy_pass http://127.0.0.1:9119;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Authorization $http_authorization;
        proxy_read_timeout 3600s;
    }

    # Default: serve static files, fallback to index.html for SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINX_EOF

# Step 4: Inject token into the config
echo "[4/6] Injecting session token into nginx config..."
sed -i "s/TOKEN_PLACEHOLDER/${TOKEN}/g" "$NGINX_CONF"

# Step 5: Test and reload nginx
echo "[5/6] Testing nginx config..."
if sudo nginx -t 2>&1; then
    echo "[6/6] Reloading nginx..."
    sudo systemctl reload nginx
    echo "  nginx reloaded successfully!"
else
    echo "ERROR: nginx config test failed. Restoring backup..."
    cp "${NGINX_CONF}${BACKUP_SUFFIX}" "$NGINX_CONF"
    sudo systemctl reload nginx
    exit 1
fi

# Step 6: Verify token injection
echo "[7/6] Verifying token injection..."
RESPONSE=$(curl -sf http://127.0.0.1:8795/index.html 2>&1 || true)
if echo "$RESPONSE" | grep -q "HERMES_SESSION_TOKEN"; then
    echo "  VERIFIED: Session token found in served HTML!"
else
    echo "  WARNING: Token not found in served HTML. Checking..."
    echo "  Response preview: $(echo "$RESPONSE" | head -c 200)..."
fi

echo ""
echo "=== Fix Complete ==="
echo "nginx now serves static index.html with sub_filter token injection"
echo "Access via: https://hermex.esggo.co"
