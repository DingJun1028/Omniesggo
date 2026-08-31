#!/usr/bin/env bash
# OA-VPS keepalive probe — 防 Oracle 閒置收割 (7天 P95 CPU/網路/記憶體 <20% 即回收)
# 每 5 分鐘對 localhost 三端口探針，製造網路+CPU 活動（loopback，不耗出站流量）
set -u
LOG=/var/log/keepalive.log
TS=$(date '+%Y-%m-%d %H:%M:%S')
for port in 3000 8642 9999; do
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://127.0.0.1:${port}/" 2>/dev/null || echo 000)
  if [ "$code" = "000" ]; then
    code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 3 "http://127.0.0.1:${port}/status" 2>/dev/null || echo 000)
  fi
  echo "$TS probe :$port -> $code" >> "$LOG"
done
# 偶發 CPU 活動（每 5 分鐘藉由 2 核心高附載持續 30 秒，保證 OCI 監控 P95/Max 完美超越 20% 避免被回收）
timeout 30 bash -c 'for i in {1..2}; do while true; do :; done & done; wait' 2>/dev/null &
echo "$TS cpu-tick done" >> "$LOG"
# 日誌截斷（避免 /var 漲滿，200GB Block 內短期無虞）
if [ -f "$LOG" ] && [ "$(wc -l < "$LOG")" -gt 2000 ]; then
  tail -1000 "$LOG" > "$LOG.tmp" && mv "$LOG.tmp" "$LOG"
fi
