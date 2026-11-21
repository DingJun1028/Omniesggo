#!/usr/bin/env bash
# ============================================================
# 本機啟動 wrapper
# 為何需要: Hermes terminal(background=true) 在 git-bash 下執行
#   `cd X && node Y` 會因 "no job control in this shell" 直接退出。
#   包成 wrapper 用 exec 取代行程即可正常常駐。
# 用法: bash run.sh            (讀同目錄 .env)
#       PORT=8799 bash run.sh  (真實 env 優先於 .env)
# ============================================================
cd "$(dirname "$0")" || exit 1
mkdir -p logs
exec node monitor-server.mjs
