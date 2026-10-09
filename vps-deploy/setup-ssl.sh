#!/usr/bin/env bash
# vps-deploy/setup-ssl.sh — placeholder
# 此檔由 .github/workflows/deploy-deerflow.yml 觸發, 於 VPS 上執行。
# 當前為 no-op placeholder (此 repo 暫無 certbot / SSL 設定需求)。
# 待真實 deer-flow 上線需 HTTPS 時, 替換此檔為實際 certbot + renewal cron 邏輯。

set -euo pipefail

echo "[setup-ssl.sh] No-op placeholder. (此 repo 尚未提供 certbot 設定需求)"
echo "[setup-ssl.sh] done."

exit 0
