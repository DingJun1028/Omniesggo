#!/usr/bin/env bash
# vps-deploy/deploy-deerflow.sh — placeholder
# 此檔由 .github/workflows/deploy-deerflow.yml 觸發, 於 VPS 上執行。
# 當前為 no-op placeholder (此 repo 暫無 deer-flow 部署產物)。
# 待真實 deer-flow 部署產物就位後, 替換此檔為實際 docker compose / ufw 邏輯。

set -euo pipefail

echo "[deploy-deerflow.sh] No-op placeholder. (此 repo 尚未提供 deer-flow 部署產物)"
echo "[deploy-deerflow.sh] OPENROUTER_API_KEY present: $([ -n "${OPENROUTER_API_KEY:-}" ] && echo yes || echo no)"
echo "[deploy-deerflow.sh] VPS_SSH_USER=${VPS_SSH_USER:-<unset>} VPS_HOST=${VPS_HOST:-<unset>}"
echo "[deploy-deerflow.sh] done."

exit 0
