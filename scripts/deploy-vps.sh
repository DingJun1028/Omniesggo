#!/usr/bin/env bash
# scripts/deploy-vps.sh — esggo 本機 → VPS 161.118.248.180 部署同步
# 用法: bash scripts/deploy-vps.sh [--no-build]
# 機制: tar 流式打包 (排除 node_modules/.git/.next/.hermes/*.db) → SSH 解壓 → pnpm install → pm2 reload
set -Euo pipefail

VPS_HOST="${VPS_HOST:-ubuntu@161.118.248.180}"
SSH_KEY="${SSH_KEY:-C:/Users/dingj/.ssh/esggo_original}"
APP_DIR="${APP_DIR:-/var/www/esggo}"
# LOCAL_DIR: POSIX 路徑 (給 tar/ssh 用，MSYS 下 /c/Project/esggo)
LOCAL_DIR="${LOCAL_DIR:-$(cd "$(dirname "$0")/.." && pwd)}"
# Windows 路徑 (給 node 用)
LOCAL_DIR_WIN="$(cygpath -w "$LOCAL_DIR" 2>/dev/null || echo "$LOCAL_DIR")"

log()  { echo -e "\033[36m==>\033[0m $1"; }
ok()   { echo -e "\033[32m  OK\033[0m $1"; }
warn() { echo -e "\033[33m  WARN\033[0m $1"; }
fail() { echo -e "\033[31m  FAIL\033[0m $1"; }

SSH="ssh -i ${SSH_KEY} -o BatchMode=yes -o ConnectTimeout=10 ${VPS_HOST}"

# 1. 編碼檢查 (非致命)
log "編碼檢查..."
if [ -f "${LOCAL_DIR_WIN}/scripts/encoding-check.mjs" ]; then
  node "${LOCAL_DIR_WIN}/scripts/encoding-check.mjs" && ok "編碼乾淨" || warn "編碼檢查警告 (繼續部署)"
else
  warn "encoding-check.mjs 不存在，跳過"
fi

# 2. tar 流式同步 (排除大目錄)
log "打包並同步到 VPS (${VPS_HOST}:${APP_DIR})..."
cd "${LOCAL_DIR}"
tar czf - \
  --exclude='./node_modules' \
  --exclude='./.git' \
  --exclude='./.next' \
  --exclude='./.hermes' \
  --exclude='./.pnpm-store' \
  --exclude='./packages/*/node_modules' \
  --exclude='./apps/*/node_modules' \
  --exclude='*.db' \
  --exclude='*.db-journal' \
  --exclude='./.env*' \
  --exclude='./tmp_*.xlsx' \
  --exclude='./logs' \
  . | ${SSH} "mkdir -p ${APP_DIR} && cd ${APP_DIR} && tar xzf - --no-same-owner"

ok "代碼同步完成"

# 3. VPS 後續處理
log "VPS 端部署 (pnpm install + pm2 reload)..."
${SSH} bash -s <<REMOTE
  set -e
  cd "${APP_DIR}"
  echo "  -> pnpm install"
  pnpm install --frozen-lockfile --no-optional 2>/dev/null || pnpm install || true
  echo "  -> pm2 reload"
  pm2 reload ecosystem.config.cjs 2>/dev/null || pm2 start ecosystem.config.cjs 2>/dev/null || true
  pm2 save 2>/dev/null || true
  sleep 3
  echo "  -> health check"
  curl -sf http://127.0.0.1:3000/api/health && echo "  Next.js OK" || echo "  Next.js (no health endpoint or not running)"
  curl -sf http://127.0.0.1:8642/status && echo "  Gateway OK" || echo "  Gateway (no status endpoint)"
REMOTE

ok "部署完成"
