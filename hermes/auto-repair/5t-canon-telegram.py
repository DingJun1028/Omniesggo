#!/usr/bin/env python3
"""5t-canon-telegram.py — 失敗時 Telegram 通知
從 vault 讀 TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID
"""
import os, json, sys, subprocess, urllib.request, urllib.parse

VAULT = os.path.join(os.path.expanduser("~"), "secret-vault", "ENV20230818.env")

def load_vault():
    env = {}
    with open(VAULT, "r", encoding="utf-8") as f:
        for line in f:
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

def send(msg):
    env = load_vault()
    token = env.get("TELEGRAM_BOT_TOKEN")
    chat = env.get("TELEGRAM_CHAT_ID")
    if not token or not chat:
        print("[skip] telegram creds missing in vault")
        return False
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    data = urllib.parse.urlencode({"chat_id": chat, "text": msg, "parse_mode": "HTML"}).encode()
    try:
        req = urllib.request.Request(url, data=data)
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.status == 200
    except Exception as e:
        print(f"[fail] {e}")
        return False

if __name__ == "__main__":
    msg = sys.argv[1] if len(sys.argv) > 1 else "5T-Canon verify alert"
    ok = send(f"🚨 <b>5T-Canon</b>\n{msg}")
    sys.exit(0 if ok else 1)
