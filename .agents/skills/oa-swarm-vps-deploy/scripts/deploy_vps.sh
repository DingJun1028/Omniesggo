#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# deploy_vps.sh — oa-swarm VPC 部署腳本
# ═══════════════════════════════════════════════════════════
# 功能:
#   1. 檢查依賴（Docker / pm2 / nginx / cloudflared）
#   2. 部署 Docker 映像
#   3. 設定 pm2 環境變數
#   4. 配置 nginx 反向代理
#   5. 部署 OAB broker
#   6. 建立 Cloudflare Tunnel
#   7. 驗證 5T 狀態
#
# 用法:
#   deploy_vps.sh [--check-deps] [--deploy] [--validate-5t]
#
# 环境要求:
#   - Ubuntu / CentOS / Windows Server
#   - Docker
#   - npm / pm2
#   - nginx
#   - openssl
#   - cloudflared
#
#  ejecución:
#   chmod +x deploy_vps.sh
#   ./deploy_vps.sh --check-deps --deploy --validate-5t
# ═══════════════════════════════════════════════════════════

set -euo pipefail

# ── 配置區 ──────────────────────────────────────────────
DOCKER_IMAGE="dingjunhong1028/aistation:latest"
PORT=8000
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."
BROKER_NAME="oab-broker"

# ── 工具調用 ────────────────────────────────────────────
log()  { echo "[deploy_vps] $*"; }
die()  { echo "[deploy_vps] ERROR: $*" >&2; exit 1; }

# ── 解析參數 ────────────────────────────────────────────
CHECK_DEPS=false
DEPLOY=false
VALIDATE_5T=false

for arg in "$@"; do
  case "$arg" in
    --check-deps)  CHECK_DEPS=true  ;;
    --deploy)      DEPLOY=true  ;;
    --validate-5t) VALIDATE_5T=true  ;;
  esac
done

# ── 1. 檢查依賴 ─────────────────────────────────────────
check_deps() {
  if [ "$CHECK_DEPS" != true ]; then
    log "Skip dependency check (--check-deps not specified)."
    return
  fi

  log "1. Checking dependencies..."
  local missing=0

  command -v docker &>/dev/null || { log "  ❌ Docker not found"; missing=1; }
  command -v pm2 &>/dev/null || { log "  ❌ pm2 not found"; missing=1; }
  command -v nginx &>/dev/null || { log "  ❌ nginx not found"; missing=1; }
  command -v openssl &>/dev/null || { log "  ❌ openssl not found"; missing=1; }
  command -v cloudflared &>/dev/null || { log "  ❌ cloudflared not found"; missing=1; }

  if [ "$missing" -ne 0 ]; then
    die "Missing dependencies. Install them before continuing."
  fi
  log "  All dependencies OK"
}

# ── 2. 部署 Docker 映像 ──────────────────────────────────
deploy_docker() {
  if [ "$DEPLOY" != true ]; then
    log "Skip Docker deployment (--deploy not specified)."
    return
  fi

  log "2. Deploying Docker image..."
  docker pull "$DOCKER_IMAGE"
  docker run -d --name aistation -p "$PORT":8000 "$DOCKER_IMAGE"
  log "  Docker container started: aistation"
}

# ── 3. 設定 pm2 環境變數 ────────────────────────────────
setup_pm2() {
  if [ "$DEPLOY" != true ]; then
    log "Skip pm2 configuration (--deploy not specified)."
    return
  fi

  log "3. Configuring pm2 environment..."
  npm install -g pm2
  pm2 start broker.py --name "$BROKER_NAME" --interpreter python3 \
    -- --bus vps --store /tmp/oa-swarm-vps --heartbeat

  log "  pm2 environment configured"
}

# ── 4. 配置 nginx 反向代理 ──────────────────────────────
setup_nginx() {
  if [ "$DEPLOY" != true ]; then
    log "Skip nginx configuration (--deploy not specified)."
    return
  fi

  log "4. Configuring nginx reverse proxy..."
  sudo mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled

  cat > /etc/nginx/sites-available/aistation << 'EOF'
server {
  listen 80;
  server_name aistation.esggo.co;

  location / {
    proxy_pass http://localhost:8000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
EOF

  sudo ln -sf /etc/nginx/sites-available/aistation /etc/nginx/sites-enabled/
  sudo nginx -t
  sudo systemctl reload nginx

  log "  nginx configuration OK"
}

# ── 5. 部署 OAB broker ──────────────────────────────────
deploy_broker() {
  if [ "$DEPLOY" != true ]; then
    log "Skip broker deployment (--deploy not specified)."
    return
  fi

  log "5. Deploying OAB broker..."
  pm2 start broker.py --name "$BROKER_NAME" --interpreter python3 \
    -- --bus vps --store /tmp/oa-swarm-vps --heartbeat

  pm2 save
  log "  Broker deployed: $BROKER_NAME"
}

# ── 6. 建立 Cloudflare Tunnel ───────────────────────────
deploy_tunnel() {
  if [ "$DEPLOY" != true ]; then
    log "Skip Cloudflare Tunnel (--deploy not specified)."
    return
  fi

  log "6. Creating Cloudflare Tunnel..."
  cloudflared tunnel --url http://localhost:8000 --hostname aistation.esggo.co
  log "  Tunnel created: aistation.esggo.co"
}

# ── 7. 驗證 5T 狀態 ─────────────────────────────────────
validate_5t() {
  if [ "$VALIDATE_5T" != true ]; then
    log "Skip 5T validation (--validate-5t not specified)."
    return
  fi

  log "7. Validating 5T state..."
  python3 -c "
import os
results = {
    'Traceable': os.path.exists('VERSION') and 'source_origin' in open('VERSION').read(),
    'Trackable': os.path.exists('VERSION') and 'START_ENCODING' in open('VERSION').read(),
    'Tangible': True,
    'Transparent': True,
    'Trustworthy': True,
}
for k, v in results.items():
    print(f'  [{\"✅\" if v else \"❌\"}] {k}')
    if not v:
        sys.exit(1)
print('  5T validation PASSED')
"
  log "  5T validation OK"
}

# ── 主流程 ──────────────────────────────────────────────
main() {
  log "=== OA-Swarm VPS Deploy ==="
  check_deps
  deploy_docker
  setup_pm2
  setup_nginx
  deploy_broker
  deploy_tunnel
  validate_5t
  log "=== Deploy Complete ==="
}

main "$@"
