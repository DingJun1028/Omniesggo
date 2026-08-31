#!/usr/bin/env python3
"""
OmniUserRAG Always-Free ADB 喚醒防回收腳本
==========================================
Oracle Always Free Autonomous DB 若長期 STOPPED 可能被回收。
本腳本透過官方 oci SDK 確保 ADB 處於 AVAILABLE:
- 已是 AVAILABLE → 略過 (不浪費)
- 是 STOPPED    → START
- 其他狀態      → 略過 (PROVISIONING/STARTING/STOPPING/TERMINATING)

相依: /opt/esggo/.venv-oci (oci SDK) + ~/.oci/config (working credentials)
用法:
  /opt/esggo/.venv-oci/bin/python /opt/esggo/scripts/omni-adb-keepalive.py
  (cron 每月 1 號 03:00: 0 3 1 * * /opt/esggo/.venv-oci/bin/python /opt/esggo/scripts/omni-adb-keepalive.py)
"""
import datetime
import os
import sys

import oci

DB_ID = os.environ.get(
    'OMNI_ADB_ID',
    'ocid1.autonomousdatabase.oc1.ap-singapore-1.anzwsljrkl3rykyabhb7gbnyoywlteaxfsnnjh43h6smzoz6maja5nvvzioa')
CONFIG_PATH = os.path.expanduser('~/.oci/config')
LOG_PATH = os.path.expanduser('~/logs/omni-adb-keepalive.log')


def main():
    try:
        config = oci.config.from_file(CONFIG_PATH, 'DEFAULT')
    except Exception as e:
        print(f'ERROR: 無法讀取 OCI config ({CONFIG_PATH}): {e}')
        sys.exit(2)

    db_client = oci.database.DatabaseClient(config)

    # 1. GET 當前狀態
    try:
        adb = db_client.get_autonomous_database(DB_ID).data
    except Exception as e:
        print(f'ERROR: GET ADB 失敗: {e}')
        sys.exit(1)

    state = adb.lifecycle_state
    print(f'[omni-adb-keepalive] 當前狀態: {state}')

    os.makedirs(os.path.dirname(LOG_PATH), exist_ok=True)
    def log(msg):
        with open(LOG_PATH, 'a') as f:
            f.write(f'{datetime.datetime.utcnow().isoformat()} {msg}\n')

    if state == 'AVAILABLE':
        log('AVAILABLE (skip)')
        print('[omni-adb-keepalive] 已是 AVAILABLE, 略過')
        return 0

    if state == 'STOPPED':
        db_client.start_autonomous_database(DB_ID)
        log('START triggered')
        print('[omni-adb-keepalive] START 指令已送出, ADB 喚醒中...')
        return 0

    log(f'state={state} no-op')
    print(f'[omni-adb-keepalive] 狀態 {state} 不需動作, 略過')
    return 0


if __name__ == '__main__':
    sys.exit(main())
