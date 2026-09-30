#!/usr/bin/env bash
# 以與 crontab 完全相同的命令實跑一次, 證明排程條款正確。
# 用法: bash scripts/cron-sim.sh   (背景執行; 結束寫 /tmp/cron-sim.done)
set -u
cd /opt/esggo || exit 1
# 不得以 rm -f + 直接重導向 /tmp/cron-sim.done —— rm 只移除目錄項, 本機使用者
# 可在 avatar-daily.sh 執行期間把它重建為符號連結, 導向便會寫入任意可寫檔
# (CWE-377)。改為: 私有暫存目錄寫檔 → 原子 mv 覆蓋 → exit 清理暫存目錄。
DONE_DIR=$(mktemp -d "${TMPDIR:-/tmp}/cron-sim.XXXXXX") || exit 1
DONE_FILE="$DONE_DIR/cron-sim.done"
trap 'rm -rf -- "$DONE_DIR"' EXIT
START=$(date +%s)
# ↓↓↓ 這一行必須與 crontab 條款逐字一致 ↓↓↓
bash scripts/avatar-daily.sh >> /opt/esggo/avatar.log 2>&1
RC=$?
# ↑↑↑ 逐字一致 ↑↑↑
{
  echo "EXIT=$RC"
  echo "SECONDS=$(( $(date +%s) - START ))"
} > "$DONE_FILE"
# -T 確保目標非目錄; mv 為同檔系統上的原子置換
mv -fT -- "$DONE_FILE" /tmp/cron-sim.done
exit $RC
