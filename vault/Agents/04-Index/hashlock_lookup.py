#!/usr/bin/env python3
"""Hash Lock 反查腳本：Hash Lock 值反查記錄

用法:
    python3 hashlock_lookup.py <hash_value>
    
範例:
    python3 hashlock_lookup.py 252518a50ff04816d20d8a24ae1f75f96062c3e921b0cbaac7127005b2a4fe0c
"""

import json
import sys
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "5T-Canon-HashLock.json")

def load_db():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def reverse_lookup(db, hash_value):
    hash_value = hash_value.lower().strip()
    for rec in db["records"]:
        if rec["hash_lock"].lower() == hash_value:
            return rec
    for rec in db["records"]:
        if rec["hash_lock"].lower().startswith(hash_value[:16]):
            return rec
    return None

def main():
    if len(sys.argv) < 2:
        print("用法: python3 hashlock_lookup.py <hash_value>")
        sys.exit(1)
    
    hash_value = sys.argv[1]
    db = load_db()
    result = reverse_lookup(db, hash_value)
    
    if result:
        print(f"✓ 查詢成功")
        print(f"  記錄 ID: {result['record_id']}")
        print(f"  來源: {result['source']}")
        print(f"  觸發器: {result['trigger']}")
        print(f"  時間戳: {result['timestamp']}")
        print(f"  工件: {result['artifact']}")
        print(f"  Hash Lock: {result['hash_lock']}")
        print(f"  狀態: {result['status']}")
    else:
        print(f"✗ 查無此 Hash Lock: {hash_value}")
        sys.exit(1)

if __name__ == "__main__":
    main()
