#!/usr/bin/env bash
set -euo pipefail
RELAY_IP="${1:-127.0.0.1}"
RELAY_PORT="${2:-9999}"
AUTH_TOKEN="${3:-$ESGGO_RELAY_TOKEN}"
POLL_INTERVAL=${POLL_INTERVAL:-3}
RETRY_INTERVAL=${RETRY_INTERVAL:-10}
AUTH_HEADER="X-Auth-Token: ${AUTH_TOKEN}"

send_result(){
  local cmd_id="$1" command="$2" stdout="$3" stderr="$4" exit_code="$5" start="$6"
  local end duration vps_ip result http_code
  end=$(date +%s); duration=$((end-start)); vps_ip=$(curl -s --max-time 5 http://checkip.amazonaws.com 2>/dev/null || echo unknown)
  result=$(cat <<EOF
{"commandId":"$cmd_id","vpsIp":"$vps_ip","stdout":$(printf '%s' "$stdout" | json_escape),"stderr":$(printf '%s' "$stderr" | json_escape),"exitCode":$exit_code,"duration":$duration,"hostname":"$(hostname)","ts":"$(date -Iseconds)"}
EOF
)
  http_code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "http://${RELAY_IP}:${RELAY_PORT}/result" \
    -H "Content-Type: application/json" -H "${AUTH_HEADER}" -d "$result" --max-time 10 2>/dev/null || echo 000)
  if [ "$http_code" = "200" ]; then echo "[OK] result sent"; else echo "[WARN] result failed: $http_code"; fi
}

json_escape(){
  local s="$1"; s="${s//\\/\\\\}"; s="${s//\"/\\\"}"
  s="$(printf '%s' "$s" | awk '{gsub(/\t/,"\\t"); gsub(/\n/,"\\n"); gsub(/\r/,"\\r"); print}' )"
  printf '"%s"' "$s"
}

wait_for_relay(){
  curl -s --max-time 5 "http://${RELAY_IP}:${RELAY_PORT}/status" -H "${AUTH_HEADER}" > /dev/null 2>&1
}

echo "[AGENT] ESGGO VPS Agent v2"
echo "[AGENT] relay=${RELAY_IP}:${RELAY_PORT} token=${AUTH_TOKEN}"

if ! wait_for_relay; then
  echo "[WARN] relay unreachable at startup, retrying..."
fi

echo "[AGENT] registering..."
curl -s --max-time 5 -X POST "http://${RELAY_IP}:${RELAY_PORT}/cmd" \
  -H "Content-Type: application/json" -H "${AUTH_HEADER}" \
  -d "{\"command\":\"echo VPS-Agent-Connected\",\"description\":\"Agent registration\"}" > /dev/null 2>&1 || true

echo "[AGENT] polling..."
while true; do
  resp="$(curl -s --max-time 5 "http://${RELAY_IP}:${RELAY_PORT}/cmd" -H "${AUTH_HEADER}" 2>/dev/null || echo '{"error":"connection_failed"}')"
  cmd_id="$(printf '%s' "$resp" | sed -n 's#.*"id":"\\([^"]*\\)".*#\\1#p')"
  command="$(printf '%s' "$resp" | sed -n 's#.*"command":"\\([^"]*\\)".*#\\1#p')"
  if [ -n "$cmd_id" ] && [ -n "$command" ]; then
    echo "[AGENT] cmd=$cmd_id command=$command"
    start=$(date +%s)
    tmpout="$(mktemp)"; tmperr="$(mktemp)"; exit_code=0
    eval "$command" >"$tmpout" 2>"$tmperr" || exit_code=$?
    stdout="$(cat "$tmpout")"; stderr="$(cat "$tmperr")"
    rm -f "$tmpout" "$tmperr"
    send_result "$cmd_id" "$command" "$stdout" "$stderr" "$exit_code" "$start"
  fi
  sleep "$POLL_INTERVAL"
done
