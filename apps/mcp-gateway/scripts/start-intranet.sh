#!/usr/bin/env bash
# ============================================================
# mcp-gateway 內網啟動腳本 — issue #91 第 5 項
# 僅供私有網路（VPC / 內網）使用；對外暴露前必須先過防火牆 +
# MCP_GATEWAY_TOKEN 認證（本倉庫安全決議：預設拒絕、fail-closed）。
# ============================================================
set -euo pipefail

# 憑證：fail-fast，不硬編碼（對齊 vps/SECURITY-CHECKLIST.md §2）
if [ -f "${PWD}/.env.secrets" ]; then
  set -a; source "${PWD}/.env.secrets"; set +a
fi
: "${MCP_GATEWAY_TOKEN:?MCP_GATEWAY_TOKEN not set — fail-closed. Generate: openssl rand -hex 32}"

cd "$(dirname "$0")/.."

echo "[mcp-gateway] intranet-only start"
echo "[mcp-gateway] PORT=${PORT:-8787}  auth=default-deny (public: /health only)"
echo "[mcp-gateway] 注意：listen() 綁定所有介面；務必以防火牆（ufw/NSG）限制僅內網可達。"
exec pnpm exec tsx src/index.ts
