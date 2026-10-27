#!/usr/bin/env python3
"""Hash Lock 列表腳本：列出所有記錄

用法:
    python3 hashlock_list.py
"""

import json
import sys
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "5T-Canon-HashLock.json")

def load_db():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def main():
    db = load_db()
    records = db["records"]
    
    print(f"Hash Lock 資料庫 (version: {db['version']})")
    print(f"建立時間: {db['created_at']}")
    print(f"記錄數: {len(records)}")
    print()
    
    for rec in records:
        print(f"記錄 ID: {rec['record_id']}")
        print(f"  Hash Lock: {rec['hash_lock']}")
        print(f"  短 Hash: {rec['short_hash']}")
        print(f"  來源: {rec['source']}")
        print(f"  觸發器: {rec['trigger']}")
        print(f"  時間戳: {rec['timestamp']}")
        print(f"  狀態: {rec['status']}")
        print(f"  標籤: {', '.join(rec['tags'])}")
        print()

if __name__ == "__main__":
    main()
