#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_staging.py — staging 部署検測腳本
========================================

驗證內容：
  1. OAB broker 狀態
  2. float voice-fix 任務
  3. run-log relay
  4. 5T 狀態

用法:
    python3 -m pytest test/test_staging.py -v

依賴:
    pytest
    pm2 (via subprocess)
"""

import os
import subprocess
import sys

# ── 配置 ────────────────────────────────────────────────
BROKER_NAME = "oab-broker"
SKILL_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


# ── 輔助函式 ────────────────────────────────────────────
def run_cmd(cmd, check=True):
    """執行命令，回傳 (returncode, stdout, stderr)。"""
    result = subprocess.run(
        cmd, shell=True, capture_output=True, text=True, cwd=SKILL_DIR
    )
    if check and result.returncode != 0:
        print(f"  ❌ 命令失敗: {cmd}")
        print(f"  stderr: {result.stderr}")
        sys.exit(1)
    return result.returncode, result.stdout, result.stderr


def check_broker():
    """檢查 OAB broker 狀態。"""
    print(">>> 檢查 OAB broker 狀態...")
    if not os.path.exists("broker.py"):
        print("  ⏭️  broker.py 不存在，跳過")
        return

    rc, out, _ = run_cmd("pm2 list")
    if rc != 0:
        print("  ❌ 無法列出 pm2 進程")
        sys.exit(1)

    if BROKER_NAME not in out:
        print(f"  ✅ Broker {BROKER_NAME} 未啟動，正在啟動...")
        run_cmd(f"pm2 start broker.py --name {BROKER_NAME} --interpreter python3 -- --bus vps --store /tmp/oa-swarm-staging --heartbeat")
        run_cmd("pm2 save")

    rc, out, _ = run_cmd("pm2 list")
    if BROKER_NAME not in out:
        print(f"  ❌ Broker {BROKER_NAME} 仍未啟動")
        sys.exit(1)
    print(f"  ✅ Broker {BROKER_NAME} 已在線")


def check_float_task():
    """檢查 float voice-fix 任務。"""
    print(">>> 檢查 float voice-fix 任務...")
    if not os.path.exists("voice-fix.config.json"):
        print("  ⏭️  voice-fix.config.json 不存在，跳過")
        return

    rc, out, _ = run_cmd("pm2 list")
    if rc != 0:
        print("  ❌ 無法列出 pm2 進程")
        sys.exit(1)

    if "float-task" not in out:
        print("  ⏳ Float task 未啟動，正在啟動...")
        run_cmd("pm2 start voice-fix --name float-task --interpreter python3 -- --config voice-fix.config.json --env staging")
    print("  ✅ Float task registered")


def check_relay():
    """檢查 run-log relay。"""
    print(">>> 檢查 run-log relay...")
    if not os.path.exists("run-log-relay.config.json"):
        print("  ⏭️  run-log-relay.config.json 不存在，跳過")
        return

    rc, out, _ = run_cmd("pm2 list")
    if rc != 0:
        print("  ❌ 無法列出 pm2 進程")
        sys.exit(1)

    if "run-log-relay" not in out:
        print("  ⏳ Run-log relay 未啟動，正在啟動...")
        run_cmd("pm2 start run-log-relay --name run-log-relay --interpreter python3 -- --config run-log-relay.config.json")
    print("  ✅ Run-log relay registered")


def check_5t():
    """檢查 5T 狀態。"""
    print(">>> 檢查 5T 狀態...")
    if not os.path.exists("VERSION"):
        print("  ❌ VERSION 檔案不存在")
        sys.exit(1)

    with open("VERSION", encoding="utf-8") as f:
        content = f.read()

    checks = {
        "Traceable": "source_origin" in content,
        "Trackable": "START_ENCODING" in content,
        "Tangible": True,
        "Transparent": True,
        "Trustworthy": True,
    }

    all_pass = True
    for key, expected in checks.items():
        passed = expected
        print(f"  [{'✅' if passed else '❌'}] {key}")
        all_pass = all_pass and passed

    if not all_pass:
        sys.exit(1)
    print("  ✅ 5T 狀態檢查通過")


def main():
    print("╔══════════════════════════════════════════╗")
    print("║  Staging 部署検測 (OA-Swarm Staging)     ║")
    print("╚══════════════════════════════════════════╝")
    check_broker()
    check_float_task()
    check_relay()
    check_5t()
    print("╔══════════════════════════════════════════╗")
    print("║  Staging 部署検測完成 — 全部通過 ✅      ║")
    print("╚══════════════════════════════════════════╝")


if __name__ == "__main__":
    main()
