#!/usr/bin/env python
"""
scripts/sync_oa_swarm_memory.py — OA-Team 蜂王↔蜂后 記憶狀態雙向同步

對齊 oa-dual-agent-obsidian SKILL.md 雙生拓撲：
  蜂王 (本機 Hermes) ⇄ 蜂后 (VPS 161.118.248.180) ⇄ 60 代理 (異步同步)

同步範圍（輕量狀態，不含 state.db 主庫）：
  - Hermes skills/    (喚醒技能，含 oa-dual-agent-obsidian)
  - Hermes sessions/  (對話上下文，排除 request_dump 噪音)
  - .oa/omnitag-registry.jsonl (OmniTag 契約閘記錄，§20.6 寫入即凍結)
  - VPS ~/hermes-oa-sync/oa-state/ (蜂后端 5T 閘日誌 / 蜂后決策)

頻率：可異步（--cron N 每 N 秒 loop，或 once 單次）
機制：scp + mtime 比較（只傳較新檔，不互相覆蓋，天然雙向收斂）

[agent:01][squad:智庫聖所][lifecycle:active][p0][platform:vps][best-practice:结界]
"""

import os
import time
import argparse
import subprocess
from pathlib import Path
from datetime import datetime
import fnmatch

# ─── 設定 ───
VPS_HOST = os.environ.get("VPS_HOST", "ubuntu@161.118.248.180")
SSH_KEY = os.environ.get("SSH_KEY", r"C:/Users/dingj/.ssh/esggo_original")
LOCAL_HERMES = os.environ.get("LOCAL_HERMES", r"C:/Users/dingj/AppData/Local/hermes")
VPS_SYNC_DIR = os.environ.get("VPS_SYNC_DIR", "/home/ubuntu/hermes-oa-sync")
LOCAL_OA = Path(__file__).resolve().parent.parent  # scripts/.. = esggo root

SSH_OPTS = ["-i", SSH_KEY, "-o", "BatchMode=yes", "-o", "ConnectTimeout=10"]


def log(msg: str):
    print(f"\033[36m[{datetime.now():%H:%M:%S}] ==>\033[0m {msg}", flush=True)


def ok(msg: str):
    print(f"\033[32m  OK\033[0m {msg}", flush=True)


def warn(msg: str):
    print(f"\033[33m  WARN\033[0m {msg}", flush=True)


def run(cmd: list) -> tuple:
    try:
        r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        return r.returncode, r.stdout + r.stderr
    except Exception as e:
        return 1, str(e)


def ssh_ls_mtime(remote_path: str) -> dict:
    cmd = ["ssh", *SSH_OPTS, VPS_HOST, f"ls -la --time-style=+%s {remote_path} 2>/dev/null"]
    code, out = run(cmd)
    if code != 0:
        return {}
    files = {}
    for line in out.strip().split("\n")[1:]:
        parts = line.split()
        if len(parts) < 9:
            continue
        name = parts[-1]
        mtime = parts[5]
        if name not in (".", ".."):
            try:
                files[name] = int(mtime)
            except ValueError:
                pass
    return files


def local_mtime(path: Path) -> float:
    return path.stat().st_mtime if path.exists() else 0


def scp_to(local_file: Path, remote_dir: str) -> bool:
    cmd = ["scp", *SSH_OPTS, str(local_file), f"{VPS_HOST}:{remote_dir}/"]
    return run(cmd)[0] == 0


def scp_from(remote_file: str, local_dir: Path) -> bool:
    local_dir.mkdir(parents=True, exist_ok=True)
    cmd = ["scp", *SSH_OPTS, f"{VPS_HOST}:{remote_file}", str(local_dir / Path(remote_file).name)]
    return run(cmd)[0] == 0


def sync_dir_bidirectional(local_dir: Path, remote_dir: str, excludes: list = None):
    if not local_dir.exists():
        local_dir.mkdir(parents=True, exist_ok=True)

    local_files = {f.name: f for f in local_dir.iterdir() if f.is_file()}
    remote_mtimes = ssh_ls_mtime(remote_dir)

    pushed = 0
    for name, f in local_files.items():
        if excludes and any(fnmatch.fnmatch(name, p) for p in excludes):
            continue
        if local_mtime(f) > remote_mtimes.get(name, 0):
            if scp_to(f, remote_dir):
                pushed += 1

    remote_files = ssh_ls_mtime(remote_dir)
    pulled = 0
    for name, rm in remote_files.items():
        lf = local_dir / name
        if local_mtime(lf) < rm:
            if scp_from(f"{remote_dir}/{name}", local_dir):
                pulled += 1

    return pushed, pulled


def sync_once():
    log("OA-Team 蜂王↔蜂后 記憶狀態雙向同步")

    p, pl = sync_dir_bidirectional(Path(LOCAL_HERMES) / "skills", f"{VPS_SYNC_DIR}/skills")
    ok(f"skills 雙向 (本機→VPS:{p}, VPS→本機:{pl})") if (p or pl) else warn("skills 無變更")

    p, pl = sync_dir_bidirectional(
        Path(LOCAL_HERMES) / "sessions", f"{VPS_SYNC_DIR}/sessions",
        excludes=["request_dump_*.json"]
    )
    ok(f"sessions 雙向 (本機→VPS:{p}, VPS→本機:{pl})") if (p or pl) else warn("sessions 無變更")

    reg_local = LOCAL_OA / ".oa" / "omnitag-registry.jsonl"
    reg_remote = f"{VPS_SYNC_DIR}/oa-state/omnitag-registry.jsonl"
    remote_mtimes = ssh_ls_mtime(f"{VPS_SYNC_DIR}/oa-state")
    if reg_local.exists():
        if local_mtime(reg_local) > remote_mtimes.get("omnitag-registry.jsonl", 0):
            scp_to(reg_local, f"{VPS_SYNC_DIR}/oa-state") and ok("OmniTag Registry → VPS")
    if "omnitag-registry.jsonl" in remote_mtimes:
        if local_mtime(reg_local) < remote_mtimes["omnitag-registry.jsonl"]:
            scp_from(reg_remote, LOCAL_OA / ".oa") and ok("OmniTag Registry → 本機")

    p, pl = sync_dir_bidirectional(LOCAL_OA / ".oa" / "vps-oa-state", f"{VPS_SYNC_DIR}/oa-state")
    ok(f"VPS oa-state 雙向 (本機→VPS:{p}, VPS→本機:{pl})") if (p or pl) else warn("oa-state 無變更")

    ok("雙向同步完成 (異步收斂)")


def sync_cron(interval: int):
    log(f"Cron 模式：每 {interval}s 雙向同步 (Ctrl+C 停止)")
    while True:
        try:
            sync_once()
        except Exception as e:
            warn(f"sync iteration failed: {e}")
        time.sleep(interval)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="OA-Team 蜂王↔蜂后 記憶狀態雙向同步")
    parser.add_argument("mode", nargs="?", default="once", choices=["once", "cron"])
    parser.add_argument("interval", nargs="?", type=int, default=60)
    args = parser.parse_args()
    if args.mode == "cron":
        sync_cron(args.interval)
    else:
        sync_once()
