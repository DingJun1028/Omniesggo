#!/usr/bin/env bash
# scripts/deploy-hermex-pwa.sh — 在 VPS 上確保 Hermex PWA 三檔案存在
# hermes-agent pip install / rebuild 會覆寫 web_dist，導致 PWA 檔案丟失
# 用法: bash scripts/deploy-hermex-pwa.sh
set -euo pipefail

VPS_HOST="${VPS_HOST:-ubuntu@161.118.248.180}"
SSH_KEY="${SSH_KEY:-C:/Users/dingj/.ssh/esggo_vps_fix}"
LOCAL_PWA_DIR="$(cd "$(dirname "$0")/../deploy/hermex-pwa" && pwd)"

SSH="ssh -i ${SSH_KEY} -o BatchMode=yes -o ConnectTimeout=10 ${VPS_HOST}"

echo "==> 偵測 web_dist 路徑..."
WEB_DIST=$(${SSH} "python3 -c 'import hermes_cli, os; print(os.path.join(os.path.dirname(hermes_cli.__file__), \"web_dist\"))'")
echo "  web_dist = ${WEB_DIST}"

echo "==> 確保 nginx mime.types 含 manifest+json..."
${SSH} "grep -q 'application/manifest+json.*webmanifest' /etc/nginx/mime.types || sudo sed -i '/application\\/javascript   js;/a\\    application/manifest+json             webmanifest;' /etc/nginx/mime.types"

echo "==> 注入 PWA 檔案..."
for f in manifest.webmanifest icon-512.png sw.js; do
  if [ -f "${LOCAL_PWA_DIR}/${f}" ]; then
    cat "${LOCAL_PWA_DIR}/${f}" | ${SSH} "sudo tee ${WEB_DIST}/${f} > /dev/null && sudo chmod 644 ${WEB_DIST}/${f}"
    echo "  ✓ ${f}"
  else
    echo "  ✗ ${f} 不存在於 ${LOCAL_PWA_DIR}"
  fi
done

echo "==> 驗證..."
${SSH} bash -c "'for f in manifest.webmanifest icon-512.png sw.js; do echo -n \"  \"; curl -sf -m 5 http://127.0.0.1:8795/\$f -o /dev/null -w \"\$f HTTP %{http_code} %{content_type}\n\"; done'"

echo "==> 檢查 Content-Type..."
${SSH} "curl -sfI -m 5 http://127.0.0.1:8795/manifest.webmanifest | grep -qi 'manifest+json' && echo '  ✓ manifest Content-Type OK' || echo '  ✗ manifest Content-Type 錯誤 — 執行 nginx reload 試試'"
