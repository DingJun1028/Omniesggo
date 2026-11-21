#!/usr/bin/env bash
# ============================================================
# 萬能即時翻譯 — 一鍵部署 (本機 → VPS, pm2 常駐)
# 流程: 語法檢查 → 同步繁中英碼矩陣 → rsync → npm install → pm2 重啟 → 健康檢查
# 用法: bash deploy.sh [--skip-sync]
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

HOST="${DEPLOY_HOST:-ubuntu@161.118.248.180}"
RPATH="${DEPLOY_PATH:-/opt/esggo/apps/universal-translator}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/id_rsa_esggo}"
SSH="ssh -o ConnectTimeout=15 -i $KEY"
SCP="scp -o ConnectTimeout=15 -i $KEY"
PORT="${PORT:-8788}"

FILES="server.mjs translate.mjs package.json .env.example types/generated/lang-matrix.mjs public/*.html"

echo "◆ [1/4] 語法檢查"
node --check server.mjs && node --check translate.mjs && node --check types/generated/lang-matrix.mjs && echo "  ✓ 通過"

echo "◆ [1.5/4] 同步繁中英碼終始矩陣 (shared/lang-matrix.mjs → types/generated/)"
node ../../scripts/sync-lang-matrix.mjs

if [ "${1:-}" != "--skip-sync" ]; then
  echo "◆ [2/4] 同步至 $HOST:$RPATH"
  $SSH "$HOST" "mkdir -p $RPATH/types/generated $RPATH/public"
  # 扁平檔逐個 scp (排除已含子目錄的項)
  # shellcheck disable=SC2086
  $SCP server.mjs translate.mjs package.json .env.example "$HOST:$RPATH/"
  # 巢狀檔保持相對路徑 (scp 會攤平, 故顯式指定遠端子目錄)
  $SCP types/generated/lang-matrix.mjs "$HOST:$RPATH/types/generated/"
  $SCP public/*.html "$HOST:$RPATH/public/"
  $SSH "$HOST" "cd $RPATH && [ -d node_modules/ws ] || npm install --omit=dev --legacy-peer-deps >/dev/null 2>&1; echo '  ✓ deps ready'"
fi

echo "◆ [3/4] pm2 重啟"
$SSH "$HOST" "cd $RPATH && pm2 describe universal-translator >/dev/null 2>&1 && pm2 restart universal-translator --update-env || pm2 start server.mjs --name universal-translator && pm2 save >/dev/null"
sleep 3

echo "◆ [4/4] 健康檢查 (localhost:$PORT)"
$SSH "$HOST" "curl -sf http://localhost:$PORT/health | head -c 200; echo"
echo ""
echo "══════════════════════════════════════════"
echo "✅ 萬能即時翻譯部署完成"
echo "   本地: http://localhost:$PORT/health"
echo "   公網: 經 Cloudflare Tunnel (translate.esggo.co) — 見 README"
echo "════════════════════════════════════════"
