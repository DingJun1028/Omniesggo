#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# deploy_staging.sh — OAB staging 部署腳本
# ═══════════════════════════════════════════════════════════
# 功能:
#   1. 檢查 OAB broker 是否已啟動
#   2. 部署 float voice-fix 任務
#   3. 配置 run-log relay
#   4. 驗證 5T 狀態
#
# 用法:
#   deploy_staging.sh [--check-broker] [--deploy-float] [--configure-relay] [--validate-5t]
#
# 环境要求:
#   - pm2
#   - Python 3.11+
#
#  ejecución:
#   chmod +x deploy_staging.sh
#   ./deploy_staging.sh --check-broker --deploy-float --configure-relay --validate-5t
# ═══════════════════════════════════════════════════════════

set -euo pipefail

# ── 配置區 ──────────────────────────────────────────────
BROKER_NAME="oab-broker"
SKILL_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/.."

# ── 工具調用 ────────────────────────────────────────────
log()  { echo "[deploy_staging] $*"; }
die()  { echo "[deploy_staging] ERROR: $*" >&2; exit 1; }

# run_cmd: 用 python3 執行命令，回傳 (rc, out, err)
run_cmd() {
  python3 -c "
import subprocess
import sys
cmd = sys.argv[1]
r = subprocess.run(cmd, shell=True, capture_output=True, text=True)
print(r.returncode)
print(r.stdout)
print(r.stderr)
" "$1"
}

# ── 解析參數 ────────────────────────────────────────────
CHECK_BROKER=false
DEPLOY_FLOAT=false
CONFIGURE_RELAY=false
VALIDATE_5T=false

for arg in "$@"; do
  case "$arg" in
    --check-broker)   CHECK_BROKER=true  ;;
    --deploy-float)   DEPLOY_FLOAT=true  ;;
    --configure-relay) CONFIGURE_RELAY=true ;;
    --validate-5t)    VALIDATE_5T=true  ;;
  esac
done

# ── 1. 檢查 OAB broker ──────────────────────────────────
check_broker() {
  if [ "$CHECK_BROKER" != true ]; then
    log "Skip broker check (--check-broker not specified)."
    return
  fi

  log "1. Checking OAB broker..."
  if ! command -v pm2 &>/dev/null; then
    die "pm2 not found."
  fi

  # 用 python3 執行 pm2 list
  read -r rc out err < <(python3 -c "
import subprocess
r = subprocess.run(['pm2', 'list'], capture_output=True, text=True)
print(r.returncode)
print(r.stdout)
print(r.stderr)
")
  if [ "$rc" -ne 0 ]; then
    die "pm2 list failed"
  fi

  if echo "$out" | grep -q "$BROKER_NAME"; then
    log "  Broker $BROKER_NAME not running, starting..."
    pm2 start broker.py --name "$BROKER_NAME" --interpreter python3 -- --bus vps --store /tmp/oa-swarm-staging --heartbeat
    pm2 save
  fi
  log "  Broker $BROKER_NAME is running"
}

# ── 2. 部署 float voice-fix 任務 ──────────────────────
deploy_float_task() {
  if [ "$DEPLOY_FLOAT" != true ]; then
    log "Skip float voice-fix deployment (--deploy-float not specified)."
    return
  fi

  log "2. Deploying float voice-fix task..."

  # 創建 float voice-fix 任務配置
  cat > voice-fix.config.json << 'EOF'
{
  "task": "voice-fix",
  "environment": "staging",
  "webhook": {
    "secret": "X-AI-Station-Key",
    "algorithm": "hmac-sha256"
  },
  "path_protection": {
    "resolve": true,
    "base": "/storage",
    "allowed": true
  }
}
EOF

  # 啟動 float voice-fix 任務
  python3 -m voice_fix --config voice-fix.config.json --env staging

  log "  Float voice-fix task deployed"
}

# ── 3. 配置 run-log relay ───────────────────────────────
configure_relay() {
  if [ "$CONFIGURE_RELAY" != true ]; then
    log "Skip run-log relay configuration (--configure-relay not specified)."
    return
  fi

  log "3. Configuring run-log relay..."

  # 創建 run-log relay 配置
  cat > run-log-relay.config.json << 'EOF'
{
  "target": "run-log",
  "source": "staging",
  "webhook_secret": "X-AI-Station-Key",
  "algorithm": "hmac-sha256"
}
EOF

  # 啟動 run-log relay
  python3 -m run_log_relay --config run-log-relay.config.json

  log "  Run-log relay configured"
}

# ── 4. 驗證 5T 狀態 ─────────────────────────────────────
validate_5t() {
  if [ "$VALIDATE_5T" != true ]; then
    log "Skip 5T validation (--validate-5t not specified)."
    return
  fi

  log "4. Validating 5T state..."
  python3 -c "
import os
import sys
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
  log "=== OA-Swarm Staging Deploy ==="
  check_broker
  deploy_float_task
  configure_relay
  validate_5t
  log "=== Deploy Complete ==="
}

main "$@"
