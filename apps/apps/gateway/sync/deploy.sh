#!/usr/bin/env bash
# apps/gateway/sync/deploy.sh — 部署 OmniAgent 雙向同步引擎到 VPS
# 慣例（SECURITY-CHECKLIST）：
#   - 預設 DRY-RUN：只印指令，不動 VPS
#   - 實際執行需 RUN=1
#   - 所有密鑰從 VPS 本機 .env.secrets / /root/gateway/.env 讀取，不落 git
#   - 同步引擎監聽 loopback :8650；外部流量經 nginx / relay 轉發
set -euo pipefail

RUN="${RUN:-0}"
PHASE="${PHASE:-all}"
DRY="echo"   # DRY-RUN：前置 echo
if [ "$RUN" = "1" ]; then DRY=""; fi

# —— VPS 連線參數（非密鑰，可安全出現）——
VIP="161.118.248.180"
CK="$HOME/.ssh/vps-console-key"
REMOTE_SYNC="/var/www/esggo/apps/gateway/sync"
SYNC_SVC="/etc/systemd/system/omni-sync.service"

echo "=================================================="
echo " OmniAgent 雙向同步引擎 — 部署 (RUN=$RUN PHASE=$PHASE)"
echo "=================================================="

step() { echo "### $1"; }

if [ "$PHASE" = "all" ] || [ "$PHASE" = "1" ]; then
  step "PHASE 1: 同步引擎 TS -> JS 編譯（本地）"
  $DRY "(cd apps/gateway/sync && npx tsc -p tsconfig.sync.json --noEmit false --outDir dist)"
  $DRY "(cd apps/gateway/sync && npx tsc -p tsconfig.sync.json --noEmit false --outDir dist && echo BUILD_OK)"
fi

if [ "$PHASE" = "all" ] || [ "$PHASE" = "2" ]; then
  step "PHASE 2: 傳送 dist + server 到 VPS"
  $DRY "scp -i $CK -o StrictHostKeyChecking=no apps/gateway/sync/dist/*.js root@$VIP:$REMOTE_SYNC/dist/ 2>/dev/null || echo 'NEED_DIST'"
  $DRY "scp -i $CK -o StrictHostKeyChecking=no apps/gateway/sync/package.json root@$VIP:$REMOTE_SYNC/package.json 2>/dev/null"
fi

if [ "$PHASE" = "all" ] || [ "$PHASE" = "3" ]; then
  step "PHASE 3: 遠端安裝依賴 + 註冊 systemd 常駐"
  $DRY "ssh -i $CK root@$VIP 'cd $REMOTE_SYNC && npm install --omit=dev --no-audit --no-fund 2>&1 | tail -3'"
  # 寫入 systemd service（loopback :8650, requireAuth）
  $DRY "ssh -i $CK root@$VIP 'cat > $SYNC_SVC <<EOF
[Unit]
Description=OmniAgent Bidirectional Sync Engine
After=network.target omnigateway.service

[Service]
Type=simple
User=root
WorkingDirectory=$REMOTE_SYNC
ExecStartPre=/bin/bash -c \"set -a; [ -f /var/www/esggo/vps/.env.secrets ] && source /var/www/esggo/vps/.env.secrets; [ -f /root/gateway/.env ] && source /root/gateway/.env; set +a\"
ExecStart=/usr/bin/bash -c \"set -a; [ -f /var/www/esggo/vps/.env.secrets ] && source /var/www/esggo/vps/.env.secrets; [ -f /root/gateway/.env ] && source /root/gateway/.env; set +a; exec /usr/bin/node $REMOTE_SYNC/dist/server.js\"
Restart=on-failure
RestartSec=5
StartLimitIntervalSec=120
StartLimitBurst=10
StandardOutput=append:/var/log/omni-sync.log
StandardError=append:/var/log/omni-sync.log

[Install]
WantedBy=multi-user.target
EOF'"
  $DRY "ssh -i $CK root@$VIP 'systemctl daemon-reload && systemctl enable --now omni-sync && sleep 3 && systemctl is-active omni-sync'"
fi

if [ "$PHASE" = "all" ] || [ "$PHASE" = "4" ]; then
  step "PHASE 4: 驗證（loopback 8650 + 與 gateway 8642 雙向）"
  $DRY "ssh -i $CK root@$VIP 'curl -s --max-time 5 http://127.0.0.1:8650/health'"
  $DRY "ssh -i $CK root@$VIP 'curl -s --max-time 5 -H \"X-Omni-Token: \$(grep -m1 ^OMNI_KEY= /var/www/esggo/vps/.env.secrets | cut -d\\\" -f2)\" http://127.0.0.1:8650/status | head -c 400'"
  $DRY "ssh -i $CK root@$VIP 'ss -ltnp 2>/dev/null | grep \":8650 \" || echo 8650_NOT_LISTEN'"
fi

echo "=================================================="
if [ "$RUN" = "1" ]; then echo " DEPLOY EXECUTED"; else echo " DRY-RUN only (set RUN=1 to apply)"; fi
echo "=================================================="
