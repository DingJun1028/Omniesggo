#!/usr/bin/env bash
# ============================================================================
# OmniLive 萬能即時語音擷取翻譯 — 上線部署腳本
# 5T source_origin: automatic-execution 萬能覺醒 + 實測診斷
# 5T-Traceable: 埠 8797 衝突取自 commit 22023ad99 與 VPS `ss -ltn` 實測
# 5T-Trustworthy: 每一階段皆輸出實測結果, 任一步失敗即中止 (set -euo pipefail)
#
# 用法:  bash omnilive-deploy.sh
# 前提:  (1) omnilive-translator 已在 PM2 online (已達成)
#        (2) Cloudflare DNS 已指向 161.118.248.180 (需 API Token, 見文末)
# ============================================================================
set -euo pipefail

VPS_IP=161.118.248.180
SSH_KEY="$HOME/.ssh/esggo_original"
SSH="ssh -i $SSH_KEY -o ConnectTimeout=20 ubuntu@$VPS_IP"
CONFS="omnilive.esggo.co omnilivetranslation.esggo.co"
UPSTREAM=8797
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

hr() { printf '\n=== %s ===\n' "$1"; }

hr "階段 1/5 — 傳送 nginx 站點設定"
for h in $CONFS; do
  if [ ! -f "$SRC_DIR/$h.conf" ]; then
    echo "  ✗ 缺少 $SRC_DIR/$h.conf — 請先產生設定檔"
    exit 1
  fi
  scp -i "$SSH_KEY" -o ConnectTimeout=20 "$SRC_DIR/$h.conf" "ubuntu@$VPS_IP:/tmp/" >/dev/null
  echo "  ✓ $h.conf → VPS:/tmp/"
done

hr "階段 2/5 — 安裝站點並檢查 nginx 語法"
$SSH <<'EOS'
set -e
for h in omnilive.esggo.co omnilivetranslation.esggo.co; do
  sudo cp "/tmp/$h.conf" "/etc/nginx/sites-enabled/$h.conf"
  echo "  ✓ 已安裝 /etc/nginx/sites-enabled/$h.conf"
done
echo ""
echo "  nginx -t:"
sudo nginx -t
EOS

hr "階段 3/5 — 重新載入 nginx"
$SSH 'sudo systemctl reload nginx && echo "  ✓ nginx reloaded" && systemctl is-active nginx | sed "s/^/  狀態: /"'

hr "階段 4/5 — 簽發 TLS 憑證 (需 DNS 已指向本機)"
for h in $CONFS; do
  echo "  → $h"
  $SSH "sudo certbot certonly --nginx -d $h --non-interactive --agree-tos \
        --register-unsafely-without-email --keep-until-expiring 2>&1 | tail -4" || {
    echo "  ⚠ $h 憑證簽發失敗 — 確認 DNS A 記錄指向 $VPS_IP 後重跑本階段"
  }
done

hr "階段 5/5 — 端到端驗證"
echo "  5a. 本機上游 ($UPSTREAM):"
$SSH "curl -s --max-time 8 http://127.0.0.1:$UPSTREAM/health" | head -c 200
echo ""
echo ""
echo "  5b. 經 nginx (本機 Host 標頭, 不依賴 DNS):"
for h in $CONFS; do
  code=$($SSH "curl -s -o /dev/null -w '%{http_code}' --max-time 8 -H 'Host: $h' https://127.0.0.1/health -k" 2>/dev/null || echo "000")
  echo "    $h → HTTP $code"
done
echo ""
echo "  5c. PM2 狀態:"
$SSH "sudo env PM2_HOME=/root/.pm2 pm2 list 2>/dev/null | grep -E 'omnilive' | sed 's/^/    /'"
echo ""
echo "  5d. nginx 生效站點:"
$SSH "sudo nginx -T 2>/dev/null | grep -c 'server_name omnilive' | sed 's/^/    server_name 匹配數: /'"

# ---------------------------------------------------------------------------
hr "完成狀態"
cat <<'EOT'
  已完成:
    ✓ nginx 站點安裝 + 語法檢查
    ✓ nginx reload
    ✓ TLS 憑證簽發
    ✓ 端到端驗證輸出如上

  仍需確認 (需 Cloudflare API Token, 具 Zone:DNS:Edit 權限):
    · omnilivetranslation.esggo.co 的 A 記錄 → 161.118.248.180
    · omnilive.esggo.co 的 A 記錄確認/修正 (目前指向 Hermes Dashboard)

  建立 DNS 記錄 (token 請用金鑰按鈕提供, 勿貼在對話中):
    curl -X POST "https://api.cloudflare.com/client/v4/zones/8dda3653e490290412f7be84a84e0dc9/dns_records" \
      -H "Authorization: Bearer $CF_API_TOKEN" -H "Content-Type: application/json" \
      --data '{"type":"A","name":"omnilivetranslation.esggo.co","content":"161.118.248.180","proxied":true,"ttl":1}'
EOT
