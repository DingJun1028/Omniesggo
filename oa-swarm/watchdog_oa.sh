#!/usr/bin/env bash
# 雙蜂戰隊 60 看門狗 — 每 5min 探活 oa-swarm/s2s/OAB，崩潰自動重啟 + Telegram 告警
# 安裝: cp watchdog_oa.sh /opt/esggo/scripts/ && chmod +x && (crontab -l; echo '*/5 * * * * /opt/esggo/scripts/watchdog_oa.sh') | crontab -
set -u

OA_PORT=8800
S2S_PORT=8765
OAB_PORT=8420
APP_DIR=/var/www/esggo/apps/oa-swarm
TG=/opt/esggo/scripts/_gen_telegram.py

notify() { python3 "$TG" "$1" 2>/dev/null || echo "[TG_FAIL] $1"; }

check_port() {
  local p=$1
  ss -ltn 2>/dev/null | awk '{print $4}' | grep -qE ":$p\$"
}

restart_oa() {
  cd "$APP_DIR" || return 1
  pm2 delete oa-swarm 2>/dev/null
  pm2 start ecosystem.config.cjs
  sleep 4
  if check_port $OA_PORT; then notify "✅ oa-swarm 已自動重啟 ($(date +%H:%M))"; else notify "❌ oa-swarm 重啟失敗，需人工介入"; fi
}

restart_s2s() {
  pm2 delete s2s-voice 2>/dev/null
  pm2 start /opt/s2s_venv/start-s2s.sh
  sleep 4
  if check_port $S2S_PORT; then notify "✅ s2s-voice 已自動重啟"; else notify "❌ s2s-voice 重啟失敗"; fi
}

# OA-Swarm
if ! check_port $OA_PORT; then
  notify "⚠️ oa-swarm ($OA_PORT) 無回應，嘗試重啟"
  restart_oa
fi

# s2s-voice
if ! check_port $S2S_PORT; then
  notify "⚠️ s2s-voice ($S2S_PORT) 無回應，嘗試重啟"
  restart_s2s
fi

# OAB (health endpoint)
if ! curl -s -m5 http://localhost:$OAB_PORT/health >/dev/null 2>&1; then
  notify "⚠️ OAB ($OAB_PORT) 健康檢查失敗"
fi

# 熵值監控 (超過 0.5 告警)
ENTROPY=$(curl -s -m5 http://localhost:$OA_PORT/health 2>/dev/null | grep -oE '"entropy":[0-9.]+' | cut -d: -f2)
if [ -n "${ENTROPY:-}" ] && awk "BEGIN{exit !($ENTROPY > 0.5)}"; then
  notify "⚠️ 蜂群熵值偏高: $ENTROPY"
fi
