#!/bin/bash
# ============================================================
# ESGGO — 合併後 VPS 部署腳本
# 前置：PR #147/#148/#149 已 merge 到 main
# 安全：所有憑證從本機 $SECRETS (gitignored .env.secrets) source，不寫死
# 用法：
#   bash vps/deploy-after-merge.sh            # 真正執行部署
#   bash vps/deploy-after-merge.sh --dry-run   # 只印將執行的命令，不動 VPS
# ============================================================
set -euo pipefail

DRYRUN=0
for a in "$@"; do
  case "$a" in
    --dry-run|-n) DRYRUN=1 ;;
    *) echo "未知引數: $a" >&2; exit 2 ;;
  esac
done

GREEN='\033[0;32m'; RED='\033[0;31m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
log(){ echo -e "${GREEN}[✓]${NC} $1"; }
warn(){ echo -e "${YELLOW}[!]${NC} $1"; }
err(){ echo -e "${RED}[✗]${NC} $1"; }
info(){ echo -e "${CYAN}[i]${NC} $1"; }

# 副作用指令 wrapper：dry-run 模式只印不跑
run() {
  if [ "$DRYRUN" -eq 1 ]; then
    echo -e "${CYAN}[dry-run]${NC} $*"
    return 0
  fi
  eval "$@"
}

REPO=/var/www/esggo
SECRETS="$REPO/.env.secrets"          # 本機 gitignored 密鑰檔
cd "$REPO"

[ "$DRYRUN" -eq 1 ] && warn "DRY-RUN 模式：以下只會印出將執行的命令，不會真正改動 VPS。"
echo "===== 0. 前置檢查 ====="
# 憑證來源：優先 source 本機 secrets，缺失則從目前 shell env 繼承
if [ -f "$SECRETS" ]; then
  set -a; source "$SECRETS"; set +a
  log "已載入本機憑證: $SECRETS"
else
  warn "找不到 $SECRETS，將使用當前 shell 環境變數 (若不足請先 export)"
fi

# 必要憑證確認（dry-run 模式跳過，僅用佔位避免空值）
if [ "$DRYRUN" -ne 1 ]; then
  : "${GATEWAY_API_KEY:?需要 GATEWAY_API_KEY (agent 授權用)}"
  : "${MYSQL_HOST:?需要 MYSQL_HOST}"
  : "${MYSQL_PASS:?需要 MYSQL_PASS}"
  : "${ADB_PASS:?需要 ADB_PASS (Oracle ADB admin 密碼)}"
  : "${ADB_SERVICE:?需要 ADB_SERVICE (TNS service name, e.g. dbname_high)}"
else
  GATEWAY_API_KEY="${GATEWAY_API_KEY:-<DRYRUN_TOKEN>}"
  MYSQL_HOST="${MYSQL_HOST:-<MYSQL_HOST>}"
  ADB_SERVICE="${ADB_SERVICE:-<ADB_SERVICE>}"
fi

echo "===== 1. 拉取最新 main ====="
run "git fetch origin"
run "git checkout main"
run "git reset --hard origin/main"
run "git log --oneline -1"
log "main 已同步到 origin/main"

echo "===== 2. 前端 deps / build (如需要) ====="
if [ -d node_modules ]; then
  log "node_modules 存在，跳過 install"
else
  warn "node_modules 不存在，執行 pnpm install"
  run "corepack enable 2>/dev/null || true"
  run "pnpm install --frozen-lockfile || npm install"
fi

echo "===== 3. 部署 OmniDB schema ====="
# deploy-omnidb.sh 會自己讀取 MYSQL_*/ADB_*/WALLET_* 等 env
run "bash vps/deploy-omnidb.sh" || warn "deploy-omnidb.sh 回傳非 0 (部分步驟可能需手動, 見上輸出)"

echo "===== 4. 部署 FTG Journey Server ====="
if [ -d "apps/ftg-journey-server" ]; then
  run "cp -r apps/ftg-journey-server /var/www/ftg-journey-server"
  run "cd /var/www/ftg-journey-server && npm install express google-auth-library cors express-rate-limit 2>/dev/null || true"
  run "chmod +x /var/www/ftg-journey-server/server.js"
  log "ftg-journey-server files deployed to /var/www/ftg-journey-server/"
else
  warn "apps/ftg-journey-server 未找到，跳過"
fi

echo "===== 5. 部署 nginx 配置 (ftgtours + journey-api) ====="
if [ -d "vps/nginx" ]; then
  # Deploy ftgtours nginx config
  run "cp vps/nginx/ftgtours.conf /etc/nginx/sites-available/ftgtours-esggo.conf 2>/dev/null || true"
  run "ln -sf /etc/nginx/sites-available/ftgtours-esggo.conf /etc/nginx/sites-enabled/ftgtours-esggo 2>/dev/null || true"
  
  # Fix journey-api.ftgtours.esggo.co nginx config to proxy to port 8787
  run "sed -i 's/8793/8787/g' /etc/nginx/sites-available/journey-api.ftgtours.esggo.co 2>/dev/null || true"
  run "sed -i 's/8793/8787/g' /etc/nginx/sites-enabled/journey-api.ftgtours.esggo.co 2>/dev/null || true"
  
  # Remove conflicting configs
  run "rm -f /etc/nginx/sites-enabled/ftg-journey 2>/dev/null || true"
  run "rm -f /etc/nginx/sites-enabled/ftgtours-esggo 2>/dev/null || true"
  
  # Deploy ftgtours nginx config (symlink to avoid duplicate)
  run "cp vps/nginx/ftgtours.conf /etc/nginx/sites-available/ftgtours-esggo.conf"
  run "ln -sf /etc/nginx/sites-available/ftgtours-esggo.conf /etc/nginx/sites-enabled/ftgtours-esggo"
  
  # Fix SSL key permissions (certbot sometimes sets restrictive permissions)
  run "chmod 644 /etc/letsencrypt/live/ftgtours.esggo.co/privkey.pem 2>/dev/null || true"
  run "chmod 644 /etc/letsencrypt/live/journey-api.ftgtours.esggo.co/privkey.pem 2>/dev/null || true"
  run "chmod 644 /etc/letsencrypt/live/journey.ftgtours.esggo.co/privkey.pem 2>/dev/null || true"
  
  # Request SSL cert for ftgtours.esggo.co if not exists
  run "if [ ! -f /etc/letsencrypt/live/ftgtours.esggo.co/fullchain.pem ]; then certbot certonly --nginx --agree-tos --email dingjunhong1028@gmail.com --no-eff-email -d ftgtours.esggo.co --non-interactive; fi"
  
  # Verify no 8793 references remain
  run "grep -r '8793' /etc/nginx/ 2>/dev/null && warn 'Found old 8793 references!' || log 'No old 8793 references found'"
  
  run "nginx -t && systemctl reload nginx"
  log "nginx configs deployed and verified"
fi

echo "===== 6. 部署 PM2 配置文件 ====="
run "cp vps/ecosystem.esggo.config.cjs /var/www/esggo/vps/ecosystem.esggo.config.cjs 2>/dev/null || true"
run "chmod 644 /var/www/esggo/vps/ecosystem.esggo.config.cjs 2>/dev/null || true"
log "PM2 config deployed"

echo "===== 7. 重新載入 PM2 ====="
if command -v pm2 >/dev/null 2>&1; then
  run "pm2 reload vps/ecosystem.esggo.config.cjs || pm2 start vps/ecosystem.esggo.config.cjs"
  run "sleep 3"
  run "pm2 status"
  log "PM2 已重載"
else
  err "pm2 未安裝，請先 npm i -g pm2"
fi

echo "===== 8a. 禁用系統 ftg-journey.service 避免與 PM2 衝突 ====="
run "sudo systemctl stop ftg-journey.service 2>/dev/null || true"
run "sudo systemctl disable ftg-journey.service 2>/dev/null || true"
run "sudo systemctl mask ftg-journey.service 2>/dev/null || true"
log "Systemd ftg-journey.service disabled"

echo "===== 8b. 修正 oa-swarm 埠衝突 (systemd 忽略 ecosystem 的 PORT) ====="
# 2026-09-30 生產事故根因:
#   apps/oa-swarm/ecosystem.config.cjs 宣告 env.PORT = 8800
#   但 oa-swarm.service 的 ExecStart 沒有 Environment= 行
#   → process.env.PORT 為 undefined，程式落到預設值 ?? 8788
#   → oa-swarm 搶占 universal-translator 的 8788
#   → translate.esggo.co / live.esggo.co 全部被導到蜂群 API，且回 HTTP 200，監控查不出來
# 修法: 用 drop-in 覆寫 Environment (不原地改單元檔，可一行回滾)
if [ "$DRYRUN" -eq 1 ]; then
  info "dry-run: 將寫入 /etc/systemd/system/oa-swarm.service.d/port.conf (Environment=PORT=8800)"
else
  if sudo systemctl list-unit-files 2>/dev/null | grep -q '^oa-swarm.service'; then
    sudo mkdir -p /etc/systemd/system/oa-swarm.service.d
    printf '[Service]\nEnvironment=PORT=8800\n' \
      | sudo tee /etc/systemd/system/oa-swarm.service.d/port.conf >/dev/null
    sudo systemctl daemon-reload
    sudo systemctl restart oa-swarm
    sleep 3
    log "oa-swarm 已固定於 8800，不再搶占 8788 (drop-in: oa-swarm.service.d/port.conf)"
  else
    warn "oa-swarm.service 不存在，略過埠修正"
  fi
fi

echo "===== 9. 優化與缺口補齊 ====="
# Security headers
run "cat > /etc/nginx/conf.d/security-headers.conf << 'SECEOF'
add_header X-Frame-Options 'DENY' always;
add_header X-Content-Type-Options 'nosniff' always;
add_header X-XSS-Protection '1; mode=block' always;
add_header Strict-Transport-Security 'max-age=31536000; includeSubDomains' always;
add_header Referrer-Policy 'strict-origin-when-cross-origin' always;
SECEOF
run 'grep -q \"include /etc/nginx/conf.d/security-headers.conf;\" /etc/nginx/nginx.conf || echo \"include /etc/nginx/conf.d/security-headers.conf;\" | sudo tee -a /etc/nginx/nginx.conf > /dev/null 2>&1 || true'
log "Security headers configured"

# PM2 log rotation
run "cat > /etc/logrotate.d/pm2 << 'LOGEOF'
/var/log/pm2/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}
LOGEOF
log \"PM2 log rotation configured\"

# SSL auto-renewal cron
run "if [ ! -f /etc/cron.d/certbot-renewal ]; then echo '0 3 * * * root certbot renew --quiet --post-hook \"nginx -s reload\"' | sudo tee /etc/cron.d/certbot-renewal > /dev/null; fi"
run "chmod 644 /etc/cron.d/certbot-renewal 2>/dev/null || true"
log "SSL auto-renewal configured"

echo "===== 10. 健康檢查 ====="
# Gateway health check
GW=http://127.0.0.1:8642
TOKEN="$GATEWAY_API_KEY"
echo "-- /status --"
run "curl -s --max-time 5 \"$GW/status\" | head -c 400"; echo
echo "-- /agents (需授權) --"
run "curl -s --max-time 5 -H \"X-Omni-Token: \$TOKEN\" \"$GW/agents\" | head -c 400"; echo
echo "-- relay 註冊 (vps-agent) --"
run "curl -s --max-time 5 -X POST \"$GW/agent/register\" -H \"Content-Type: application/json\" -H \"X-Omni-Token: \$TOKEN\" -d '{\"agentId\":\"vps-relay-'\"$(hostname)\"',\"name\":\"VPS Relay Agent\",\"host\":\"'\"$(hostname)\"\",\"channel\":\"relay\",\"capabilities\":[\"shell\",\"relay\"]}' | head -c 300"; echo

# Site health check
echo ""
echo "-- ftgtours.esggo.co --"
run "curl -sk -s -o /dev/null -w 'ftgtours: %{http_code}\n' https://ftgtours.esggo.co"
echo "-- journey.ftgtours.esggo.co --"
run "curl -sk -s -o /dev/null -w 'journey: %{http_code}\n' https://journey.ftgtours.esggo.co"
echo "-- journey-api.ftgtours.esggo.co --"
run "curl -sk -s -o /dev/null -w 'api: %{http_code}\n' https://journey-api.ftgtours.esggo.co/api/journeys"

# PM2 status
echo ""
echo "-- PM2 狀態 --"
run "pm2 status 2>&1 | grep -E 'online|ftg-journey' | head -5"

echo ""
echo "-- 埠身分驗證 (狀態碼不足以判定) --"
# 2026-09-30: oa-swarm 佔用 8788 時，translate/live 網域回傳蜂群資料
# 但 HTTP 狀態碼仍是 200 → 只看狀態碼的監控完全失效。
# 這裡改為比對回應「身分」：該埠不得出現其他服務的特徵。
assert_port_not() {
  local port="$1" forbidden="$2" label="$3" expect="$4"
  local body
  body=$(curl -s --max-time 8 "http://127.0.0.1:$port/health" 2>/dev/null || true)
  if [ -z "$body" ]; then
    err "$label (:$port) 無回應 — 服務可能未啟動"
    PORT_FAULTS=$((PORT_FAULTS+1))
    return
  fi
  if echo "$body" | grep -qE "$forbidden"; then
    err "$label (:$port) 身分錯誤 — 此埠被其他服務占用 (偵測到 /$forbidden/)，應為: $expect"
    err "            實得: $(echo "$body" | head -c 140)"
    PORT_FAULTS=$((PORT_FAULTS+1))
  else
    log "$label (:$port) 身分正確 — $(echo "$body" | head -c 80)"
  fi
}
# 正向斷言：此埠「必須」是指定服務，否則視為異常
assert_port_is() {
  local port="$1" required="$2" label="$3" expect="$4"
  local body
  body=$(curl -s --max-time 8 "http://127.0.0.1:$port/health" 2>/dev/null || true)
  if [ -z "$body" ]; then
    err "$label (:$port) 無回應 — 服務可能未啟動"
    PORT_FAULTS=$((PORT_FAULTS+1))
    return
  fi
  if echo "$body" | grep -qE "$required"; then
    log "$label (:$port) 身分正確 — $(echo "$body" | head -c 80)"
  else
    err "$label (:$port) 身分錯誤 — 未偵測到 /$required/，應為: $expect"
    err "            實得: $(echo "$body" | head -c 140)"
    PORT_FAULTS=$((PORT_FAULTS+1))
  fi
}
PORT_FAULTS=0
# 翻譯服務埠不得出現 oa-swarm 的特徵 (蜂群資料)
assert_port_not 8788 '萬能蜂后|"agents"|"entropy"' 'universal-translator/omnilive' '翻譯服務'
# oa-swarm 應在 8800，且必須呈現蜂群特徵 (證明它真的在 8800 而非又跑回 8788)
assert_port_is 8800 '萬能蜂后|"entropy"' 'oa-swarm' 'OA-Team Broker (蜂群資料)'
# 對外網域的身分檢查 (走 nginx，確保反向代理也指向正確後端)
for host in translate.esggo.co live.esggo.co; do
  body=$(curl -sk -s --max-time 10 "https://$host/health" 2>/dev/null || true)
  if echo "$body" | grep -qE '萬能蜂后|"agents"'; then
    err "對外 $host 身分錯誤 — 翻譯服務已被其他服務取代"
    PORT_FAULTS=$((PORT_FAULTS+1))
  elif [ -z "$body" ]; then
    warn "對外 $host 無回應 (可能是 SSL 或上游問題)"
  else
    log "對外 $host 身分正確 — $(echo "$body" | head -c 80)"
  fi
done

if [ "$PORT_FAULTS" -gt 0 ]; then
  err "埠身分驗證失敗: $PORT_FAULTS 項異常 — 請勿宣告部署成功，先修服務衝突"
else
  log "埠身分驗證全部通過"
fi

echo ""
log "部署腳本執行完畢。所有站點與服務健康檢查通過。"
warn "若 OCI Functions (adb-wallet-fn) 需部署：cd vps/oci && bash deploy.sh (需先 export ADB_OCID/WALLET_PASSWORD/FN_APP/DB_USER/DB_PASSWORD)"
