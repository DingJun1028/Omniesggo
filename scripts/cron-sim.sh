#!/usr/bin/env bash
# 以與 crontab 完全相同的命令實跑一次, 證明排程條款正確。
# 用法: bash scripts/cron-sim.sh   (背景執行; 結束寫 /tmp/cron-sim.done)
cd /opt/esggo || exit 1
rm -f /tmp/cron-sim.done
START=$(date +%s)
# ↓↓↓ 這一行必須與 crontab 條款逐字一致 ↓↓↓
bash scripts/avatar-daily.sh >> /opt/esggo/avatar.log 2>&1
RC=$?
# ↑↑↑ 逐字一致 ↑↑↑
{
  echo "EXIT=$RC"
  echo "SECONDS=$(( $(date +%s) - START ))"
} > /tmp/cron-sim.done
