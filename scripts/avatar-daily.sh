#!/usr/bin/env bash
set -euo pipefail

# 萬能知識代理分身每日七相 (avatar-daily.sh)
# Inherit → Hatch → Write → Guard → Clean → Metrics → MOC
# VPS crontab 建議: 0 5 * * * cd /opt/esggo/esggo && bash scripts/avatar-daily.sh >> /var/log/avatar-daily.log 2>&1

cd "$(dirname "$0")/.."

log() { echo "[avatar-daily] $(date -u +%Y-%m-%dT%H:%M:%SZ) $*"; }

log "=== Inherit: 讀回前日知識分身記憶 ==="
node scripts/oa-memory-recall.mjs "avatar" || true

log "=== Hatch: 孵化知識結點 ==="
node scripts/knowledge-avatar.mjs

log "=== Write: 同步蜂寫層 (優雅降級) ==="
node scripts/tdai-memory-sync.mjs || true

log "=== Guard: 公開前安全閘 ==="
node scripts/vault-access-guard.mjs || true

log "=== Clean: 防回歸清理測試型別 ==="
node scripts/avatar-cleanup.mjs || true

log "=== Metrics: 萃取健康度指標 ==="
node scripts/avatar-metrics.mjs || true

log "=== MOC: 知識分身日報回流 ==="
node scripts/avatar-moc-sync.mjs || true

log "avatar-daily done"
