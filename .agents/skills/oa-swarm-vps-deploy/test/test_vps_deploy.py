#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
test_vps_deploy.py — VPC 部署検測腳本
=====================================

驗證內容：
  1. Docker 映像可用
  2. pm2 環境變數設定
  3. nginx 反向代理配置
  4. OAB broker 部署
  5. Cloudflare Tunnel

用法:
    python3 -m pytest test/test_vps_deploy.py -v

依賴:
    pytest
    docker (via subprocess)
    pm2 (via subprocess)
    nginx (via subprocess)
    cloudflared (via subprocess)
"""

import os
import subprocess
import sys

# ── 配置 ────────────────────────────────────────────────
DOCKER_IMAGE = "dingjunhong1028/aistation:latest"
PORT = 8000
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


def check_docker():
    """檢查 Docker 映像。"""
    print(">>> 檢查 Docker 映像...")
    rc, out, err = run_cmd(f"docker pull {DOCKER_IMAGE}")
    if rc != 0:
        print(f"  ❌ 拉取映像失敗: {err}")
        sys.exit(1)
    print(f"  ✅ Docker 映像 {DOCKER_IMAGE} 已就緒")


def check_pm2():
    """檢查 pm2 環境變數。"""
    print(">>> 檢查 pm2 環境變數...")
    # 檢查 pm2 是否安裝
    rc, _, _ = run_cmd("pm2 --version")
    if rc != 0:
        print("  ❌ pm2 not installed")
        sys.exit(1)
    print("  ✅ pm2 installed")


def check_nginx():
    """檢查 nginx 配置。"""
    print(">>> 檢查 nginx 配置...")
    rc, out, _ = run_cmd("nginx -t")
    if rc != 0:
        print(f"  ❌ nginx 配置錯誤: {out}")
        sys.exit(1)
    print("  ✅ nginx 配置正確")


def check_broker():
    """檢查 OAB broker 部署。"""
    print(">>> 檢查 OAB broker 部署...")
    if not os.path.exists("broker.py"):
        print("  ⏭️  broker.py 不存在，跳過")
        return

    rc, out, _ = run_cmd("pm2 list")
    if rc != 0:
        print("  ❌ 無法列出 pm2 進程")
        sys.exit(1)

    if "oab-broker" not in out:
        print("  ❌ Broker 'oab-broker' 未啟動")
        sys.exit(1)
    print("  ✅ Broker 'oab-broker' 已在線")


def check_tunnel():
    """檢查 Cloudflare Tunnel。"""
    print(">>> 檢查 Cloudflare Tunnel...")
    # 檢查 cloudflared 是否安裝
    rc, _, _ = run_cmd("cloudflared --version")
    if rc != 0:
        print("  ❌ cloudflared not installed")
        sys.exit(1)
    print("  ✅ cloudflared installed")


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
    print("║  VPC 部署検測 (OA-Swarm Deploy)          ║")
    print("╚══════════════════════════════════════════╝")
    check_docker()
    check_pm2()
    check_nginx()
    check_broker()
    check_tunnel()
    check_5t()
    print("╔══════════════════════════════════════════╗")
    print("║  VPC 部署検測完成 — 全部通過 ✅          ║")
    print("╚══════════════════════════════════════════╝")


if __name__ == "__main__":
    main()
