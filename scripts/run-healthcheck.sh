#!/usr/bin/env bash
# OA-Team 蜂群記憶健康檢查 (排程用，Telegram 告警版)
# 靜默成功：只輸出一行 [ts] HEALTHY: ok；異常才輸出詳細 FAIL
set -u

ADMIN_KEY_FILE="/c/Project/esggo/apps/tencentdb-memory/.admin-key"
HEALTHCHECK="$HOME/Project/esggo/scripts/oa-memory-healthcheck.mjs"
# 若 HOME 未設定，使用 override
if [ -z "$HOME" ]; then
  HEALTHCHECK="/c/Project/esggo/scripts/oa-memory-healthcheck.mjs"
fi

export TDAI_GATEWAY_URL="http://127.0.0.1:8420"
export TDAI_SERVICE_ID="oa-team-swarm"
export HEALTHCHECK_QUIET="1"
# 把 admin key 放進 env（不輸出，僅供給腳本讀取）
export TDAI_GATEWAY_API_KEY="$(cat "$ADMIN_KEY_FILE")"

cd /c/Project/esggo || exit 1
node "$HEALTHCHECK"
);
