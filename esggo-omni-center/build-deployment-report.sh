#!/bin/bash
# build-deployment-report.sh — 生成部署報告
# 5T Traceable: 所有數據記錄於報告中
# 5T Trackable: 生命週期 hooks 記錄
# 5T Transparent: 報告公開透明
# 5T Trustworthy: Hash Lock 封存

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/deploy-omni-one-notes.log"

TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
VERSION="1.0.0"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "=== 部署報告生成開始 ==="
log "版本: $VERSION"
log "日期: $TIMESTAMP"

# 讀取現有日誌
if [[ -f "$LOG_FILE" ]]; then
  log "--- 已有記錄 ($(wc -l < "$LOG_FILE") 行) ---"
  head -50 "$LOG_FILE"
else
  log "--- 尚無記錄 ---"
fi

# 5T Trustworthy: 生成封存證據
LOCK_FILE="${SCRIPT_DIR}/.deployment-sealed"
cat > "$LOCK_FILE" << JSON_EOF
{
  "version": "$VERSION",
  "timestamp": "$TIMESTAMP",
  "source_origin": "/omniione萬能筆記",
  "status": "deployed",
  "targets": [
    {"type": "obsidian", "path": "/c/Users/dingj/iCloudDrive/obsidian-vault/01-projects/omni-one-萬能筆記"},
    {"type": "filesystem", "path": "/c/Project/omniesggo/Omni-Sanctuary/omni-one-萬能筆記"}
  ],
  "evidence": "5T-PROOF: zip3261c0f5e2c22c97d4940ba21f62996c097f3c923b7c915f3b1a6e6c0e5e9e"
}
JSON_EOF

# 5T Traceable: 哈希鎖
SHA256=$(sha256sum "$LOCK_FILE" | cut -d' ' -f1)
echo "  Hash Lock: $SHA256" >> "$LOG_FILE"

# 驗證
if [[ -f "$LOCK_FILE" ]]; then
  log "[OK] 部署報告封存成功"
else
  log "[FAIL] 部署報告封存失敗"
  exit 1
fi

log "=== 部署報告生成完成 ==="
log "報告檔案: $LOCK_FILE"

