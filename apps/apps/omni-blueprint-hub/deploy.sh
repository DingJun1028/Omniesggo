#!/usr/bin/env bash
# ============================================================
# 萬能藍圖中心 — 一鍵部署 (本機 → VPS)
# 流程: 語法檢查 → 本機煙霧測試 → rsync 同步 → pm2 重啟 → 公網端對端驗證
# 任一步失敗即中止 (set -e)，絕不在未驗證下宣稱成功
# 用法: bash deploy.sh  [--skip-local-test]
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

# 載入 .env (若存在) 取得部署參數
if [ -f .env ]; then set -a; . ./.env; set +a; fi

HOST="${DEPLOY_HOST:-ubuntu@161.118.248.180}"
RPATH="${DEPLOY_PATH:-/opt/esggo/apps/omni-blueprint-hub}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/esggo_original}"
PM2NAME="${DEPLOY_PM2_NAME:-omni-blueprint-hub}"
BASE_PUB="${DEPLOY_PUBLIC_BASE:-https://live.esggo.co}"
SSH="ssh -o ConnectTimeout=10 -i $KEY"

FILES="monitor-server.mjs translate.mjs captions-scraper.mjs env.mjs env-boot.mjs _smoke-test.mjs ecosystem.config.cjs package.json index.html stream.html studio.html live-sync.html styles.css app.js data.js sync.js"

echo "◆ [1/5] 語法檢查"
for f in monitor-server.mjs translate.mjs captions-scraper.mjs env.mjs env-boot.mjs _smoke-test.mjs; do
  node --check "$f"
done
node -e "JSON.parse(require('fs').readFileSync('package.json','utf8'))"
echo "  ✓ 全部通過"

if [ "${1:-}" != "--skip-local-test" ]; then
  echo "◆ [2/5] 本機煙霧測試 (port 8799)"
  # 埠佔用守衛：舊版殘留行程會讓測試打到錯誤目標並回報假失敗
  if curl -sf -m 2 http://localhost:8799/healthz > /dev/null 2>&1; then
    echo "  ✗ port 8799 已被佔用（可能是舊版殘留行程）"
    echo "    Windows: powershell -NoProfile -Command \"Get-NetTCPConnection -LocalPort 8799 -State Listen | %{Stop-Process -Id \\\$_.OwningProcess -Force}\""
    echo "    Linux:   fuser -k 8799/tcp"
    exit 1
  fi
  PORT=8799 node monitor-server.mjs > /tmp/obh-deploy.log 2>&1 &
  LOCAL_PID=$!
  trap 'kill $LOCAL_PID 2>/dev/null || true' EXIT
  for i in $(seq 1 20); do
    curl -sf -m 2 http://localhost:8799/healthz > /dev/null && break
    sleep 1
  done
  # 確認起來的是本次啟動的行程 (version 必須存在)
  if ! curl -sf -m 3 http://localhost:8799/healthz | grep -q '"version"'; then
    echo "  ✗ 本機服務未正常啟動，log:"; tail -20 /tmp/obh-deploy.log; exit 1
  fi
  BASE=http://localhost:8799 node _smoke-test.mjs
  kill $LOCAL_PID 2>/dev/null || true
  trap - EXIT
  echo "  ✓ 本機測試通過"
else
  echo "◆ [2/5] 本機煙霧測試 — 已跳過"
fi

echo "◆ [3/5] 同步至 $HOST:$RPATH"
# shellcheck disable=SC2086
scp -i "$KEY" $FILES "$HOST:$RPATH/"
echo "  ✓ 同步完成"

echo "◆ [4/5] VPS 語法檢查 + pm2 重啟"
$SSH "$HOST" "cd $RPATH && \
  node --check monitor-server.mjs && node --check translate.mjs && node --check env-boot.mjs && \
  mkdir -p logs && \
  (pm2 describe $PM2NAME >/dev/null 2>&1 && pm2 restart $PM2NAME --update-env || pm2 start ecosystem.config.cjs) >/dev/null && \
  pm2 save >/dev/null && sleep 4 && curl -sf localhost:8787/healthz | head -4"
echo "  ✓ 服務已重啟"

echo "◆ [5/5] 公網端對端驗證 ($BASE_PUB)"
$SSH "$HOST" "cd $RPATH && BASE=$BASE_PUB node _smoke-test.mjs"

echo ""
echo "════════════════════════════════════════"
echo "✅ 部署完成並通過端對端驗證"
echo "   講者端: $BASE_PUB/studio.html"
echo "   觀眾端: $BASE_PUB/stream?src=studio"
echo "   健康檢查: $BASE_PUB/healthz"
echo "════════════════════════════════════════"
