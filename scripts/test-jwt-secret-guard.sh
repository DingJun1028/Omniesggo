#!/usr/bin/env bash
# JWT 金鑰強度 fail-fast 回歸測試
# 用法：bash scripts/test-jwt-secret-guard.sh
#
# 兩個實測踩過的坑（勿改回舊寫法）：
#  1. 每個案例必須用獨立埠號。共用 PORT 時，前一個 process 未釋放埠會讓下一個
#     EADDRINUSE，表現為「空輸出 + rc=124」而看似漏網。
#  2. 埠號遞增不可寫在 $( ) 內 —— 命令替換跑在 subshell，變數不會傳回父 shell，
#     會導致所有案例都用同一個埠。正解是在函式本體直接 PORT=$((PORT+1))。
set -uo pipefail
cd "$(git rev-parse --show-toplevel)/apps/ftg-journey-server"

PASS=0
FAIL=0
PORT=18960
DB=/tmp/jwt-guard-test.db

report() {
  local desc="$1" mode="$2" want="$3" got="$4" out="$5"
  if [ "$want" = "$got" ]; then
    printf '  PASS  %-22s %s\n' "$desc" "$(printf '%s' "$out" | cut -c1-48)"
    PASS=$((PASS+1))
  else
    printf '  FAIL  %-22s 期望=%s 實際=%s out=%s\n' "$desc" "$want" "$got" "${out:-<空>}"
    FAIL=$((FAIL+1))
  fi
}

classify() {
  if printf '%s' "$1" | grep -q "拒絕啟動"; then echo reject; else echo accept; fi
}

# 設定了 JWT_SECRET（含空字串）的案例
check() {
  local desc="$1" secret="$2" want="$3"
  PORT=$((PORT+1))
  local out got
  out=$(JWT_SECRET="$secret" DB_PATH="$DB" PORT="$PORT" timeout 5 node server.js 2>&1 | head -1)
  got=$(classify "$out")
  report "$desc" "$want" "$want" "$got" "$out"
}

# 未設定 JWT_SECRET 的案例（不能用空字串代替，兩者走不同程式路徑）
check_unset() {
  PORT=$((PORT+1))
  local out got
  out=$(env -u JWT_SECRET DB_PATH="$DB" PORT="$PORT" timeout 5 node server.js 2>&1 | head -1)
  got=$(classify "$out")
  report "未設定" "reject" "reject" "$got" "$out"
}

echo "負向：必須拒絕啟動"
check_unset
check "空字串"        ""    reject
check "純空白"        "   " reject
check "1 字元"        "a"   reject
check "3 字元"        "123" reject
check "8 字元"        "short12" reject
check "password"      "password" reject
check "舊預設值"      "ftg-journey-secret-key-change-in-production" reject
check "舊預設值+空白" "  ftg-journey-secret-key-change-in-production  " reject
check "31 字元"       "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" reject

echo ""
echo "正向：必須允許啟動"
check "32 字元（剛好達標）" "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" accept
check "48 bytes 隨機"       "$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")" accept

echo ""
echo "結果：$PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ]
