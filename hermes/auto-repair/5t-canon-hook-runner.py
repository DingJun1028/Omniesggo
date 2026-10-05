#!/usr/bin/env python3
"""5t-canon-hook-runner.py — 5T-Canon 失敗時自動跑修復動作
從 5t-canon-hooks.yaml 讀觸發規則,根據 verify-5t-canon.py 的 JSON 輸出決定動作
"""
import json, os, sys, subprocess, yaml, urllib.request, urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
HOOKS = os.path.join(ROOT, "5t-canon-hooks.yaml")
TG_SCRIPT = os.path.join(ROOT, "5t-canon-telegram.py")
VAULT = os.path.join(os.path.expanduser("~"), "secret-vault", "ENV20230818.env")

def load_verify_result():
    """讀 stdin (verify-5t-canon.py --quiet 模式)"""
    if not sys.stdin.isatty():
        return json.loads(sys.stdin.read())
    # 或讀最新的 canon artifact
    canon_dir = os.path.join(ROOT, "..", "5t-canon")
    canon_dir = os.path.abspath(canon_dir)
    if not os.path.exists(canon_dir):
        return None
    files = sorted([f for f in os.listdir(canon_dir) if f.startswith("verify-")])
    if not files:
        return None
    with open(os.path.join(canon_dir, files[-1]), "r", encoding="utf-8") as f:
        return json.load(f)

def check_hook(hook, result):
    """評估單一 hook 觸發"""
    trig = hook.get("trigger", {})
    check_path = trig.get("check", "")
    expected = trig.get("expected")
    # 支援 nested key e.g. "cron_state.broken"
    parts = check_path.split(".")
    val = result
    for p in parts:
        if isinstance(val, dict):
            val = val.get(p)
        else:
            return False
    return val == expected

def run_hook(hook):
    """執行 hook 動作"""
    action = hook.get("action", "").strip()
    severity = hook.get("severity", "info")
    print(f"[hook:{severity}] {hook.get('name')} → {action[:80]}...")
    if action.startswith("echo "):
        # echo 開頭直接印
        print(action[5:].strip())
    elif action.startswith("python "):
        # python 開頭就跑子腳本
        try:
            subprocess.run(action, shell=True, check=False, timeout=30)
        except Exception as e:
            print(f"  [fail] {e}")
    if hook.get("notify") == "telegram":
        notify_tg(hook.get("name", "unknown"))

def notify_tg(name):
    if not os.path.exists(TG_SCRIPT):
        return
    try:
        subprocess.run(["python", TG_SCRIPT, f"5T-Canon hook: {name}"], timeout=15)
    except Exception as e:
        print(f"  [tg fail] {e}")

def main():
    result = load_verify_result()
    if not result:
        print("[skip] no verify result")
        return 0
    if not os.path.exists(HOOKS):
        print(f"[skip] {HOOKS} missing")
        return 0
    with open(HOOKS, "r", encoding="utf-8") as f:
        cfg = yaml.safe_load(f) or {}
    triggered = 0
    for hook in cfg.get("hooks", []):
        if check_hook(hook, result):
            run_hook(hook)
            triggered += 1
    print(f"\n[done] {triggered} hooks triggered")
    return 0 if triggered == 0 else 2

if __name__ == "__main__":
    sys.exit(main())
