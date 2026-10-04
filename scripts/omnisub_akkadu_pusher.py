#!/usr/bin/env python3
"""
ESG GO OmniSub Akkadu Subtitle Stream Auto-Pusher (萬能即時字幕推播器)
5T Protocol Verified · source_origin: scripts/omnisub_akkadu_pusher.py

Usage:
  # 1. Interactive input mode:
  python scripts/omnisub_akkadu_pusher.py --room GIHC --speaker "Akkadu Live"

  # 2. Pipe file or STT output:
  cat live_subtitles.txt | python scripts/omnisub_akkadu_pusher.py --room GIHC

  # 3. Automated simulation mode:
  python scripts/omnisub_akkadu_pusher.py --room GIHC --simulate
"""

import sys
import time
import json
import argparse
import hashlib
import urllib.request
import urllib.parse
from datetime import datetime

DEFAULT_API_URL = "https://omnisub.esggo.co/api/omnisub/akkadu"

def generate_hash_lock(speaker: str, text: str, timestamp: int) -> str:
    raw = f"{speaker}:{text}:{timestamp}:ESGGO_5T_PROOF"
    return hashlib.sha256(raw.encode('utf-8')).hexdigest()

def push_subtitle(api_url: str, room: str, speaker: str, original_text: str, translated_text: str = "", src_lang: str = "zh-Hant", target_lang: str = "en") -> bool:
    if not translated_text:
        translated_text = f"[5T Auto-Stream] {original_text}"

    ts = int(time.time() * 1000)
    hash_lock = generate_hash_lock(speaker, original_text, ts)

    payload = {
        "room": room,
        "speaker": speaker,
        "originalText": original_text,
        "translatedText": translated_text,
        "srcLang": src_lang,
        "targetLang": target_lang,
        "timestamp": ts,
        "hashLock": hash_lock,
    }

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "OmniSub-Akkadu-Pusher/1.0 (5T Verified)"
    }

    try:
        data_bytes = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(api_url, data=data_bytes, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as resp:
            if resp.status in (200, 201):
                res_data = json.loads(resp.read().decode('utf-8'))
                print(f"[{datetime.now().strftime('%H:%M:%S')}] ✓ Pushed: [{speaker}] {original_text[:30]}... (5T Lock: {hash_lock[:10]}...)")
                return True
            else:
                print(f"[ERR] Server returned status {resp.status}")
                return False
    except Exception as e:
        print(f"[ERR] Failed to push subtitle to {api_url}: {e}")
        return False

def run_simulation(api_url: str, room: str, speaker: str):
    print(f"🚀 Initializing Akkadu Stream Simulation for Room [{room}] -> {api_url}")
    sample_dialogues = [
        ("Welcome everyone to ESG GO 2026 Sustainability Summit.", "歡迎各位蒞臨 ESG GO 2026 全球永續峰會。"),
        ("Today we discuss Scope 1, 2, and 3 carbon emission reductions.", "今天我們將討論範疇一、二與範疇三的碳排放減量目標。"),
        ("Akkadu real-time interpreter is synced with 5T cryptographic proof.", "Akkadu 即時口譯員已與 5T 密碼學證明完成同步刻印。"),
        ("Data integrity and traceability is guaranteed across all streams.", "所有串流資料之完整性與可追溯性皆獲得磐石級保障。"),
        ("Thank you for using OmniSub broadcast wall.", "感謝您使用 OmniSub 即時字幕轉播牆。")
    ]

    for orig, trans in sample_dialogues:
        push_subtitle(api_url, room, speaker, orig, trans)
        time.sleep(3)

def main():
    parser = argparse.ArgumentParser(description="ESG GO OmniSub Akkadu Subtitle Stream Auto-Pusher")
    parser.add_argument("--url", default=DEFAULT_API_URL, help="OmniSub Akkadu API endpoint")
    parser.add_argument("--room", default="GIHC", help="Akkadu room code (e.g. GIHC)")
    parser.add_argument("--speaker", default="Akkadu AI Interpreter", help="Speaker name")
    parser.add_argument("--simulate", action="store_true", help="Run simulation with sample subtitles")

    args = parser.parse_args()

    print(f"==================================================")
    print(f"  ESG GO OmniSub Akkadu Stream Auto-Pusher v1.0")
    print(f"  Room: {args.room} | Speaker: {args.speaker}")
    print(f"  Target: {args.url}")
    print(f"==================================================")

    if args.simulate:
        run_simulation(args.url, args.room, args.speaker)
        return

    print("🎙️ Ready for input. Type subtitle and press Enter (Ctrl+C to quit):")
    try:
        for line in sys.stdin:
            line = line.strip()
            if line:
                push_subtitle(args.url, args.room, args.speaker, line)
    except KeyboardInterrupt:
        print("\n👋 Auto-pusher stopped.")

if __name__ == "__main__":
    main()
