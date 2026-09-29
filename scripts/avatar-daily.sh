#!/usr/bin/env bash
set -euo pipefail

# 萬能知識代理分身每日七相 (avatar-daily.sh)
# Inherit → Hatch → Write → Guard → Clean → Metrics → MOC
# VPS crontab 必須把輸出寫回 /opt/esggo/avatar.log, 與 avatar-metrics.mjs 的
#   LOG = path.resolve('avatar.log') (相對 CWD) 對齊。舊註解建議寫 /var/log/
#   avatar-daily.log, 會讓 metrics 讀到永不更新的舊檔 → 健康度永久失明
#   (實測: 同步 220/220 成功, metrics 仍報 198/22 降級)。
# 正確條款:
#   0 5 * * * cd /opt/esggo && bash scripts/avatar-daily.sh >> /opt/esggo/avatar.log 2>&1

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
# 唯一會對排程層「說實話」的一相: metrics 在降級時 exit 1。舊版 `|| true`
# 把退出碼吞掉, 導致 22 次真實寫入失敗時整條 cron 仍回報成功 (假 PASS)。
# 其餘相維持 `|| true` 優雅降級不變, 這裡只把 metrics 的結果傳導出去。
METRICS_RC=0
node scripts/avatar-metrics.mjs || METRICS_RC=$?

log "=== MOC: 知識分身日報回流 ==="
node scripts/avatar-moc-sync.mjs || true

if [ "$METRICS_RC" -ne 0 ]; then
  log "avatar-daily done (降級: 健康度未達標, 退出碼 $METRICS_RC)"
else
  log "avatar-daily done"
fi
exit "$METRICS_RC"
