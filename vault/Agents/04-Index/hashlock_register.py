#!/usr/bin/env python3
"""Hash Lock 註冊腳本：新增 Hash Lock 到資料庫

用法:
    python3 hashlock_register.py --hash <hash_value> --record <record_id>
    python3 hashlock_register.py --hash <hash_value> --source <source> --trigger <trigger>
"""

import json
import sys
import os
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "5T-Canon-HashLock.json")

def load_db():
    with open(DB_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def save_db(db):
    with open(DB_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

def register(db, hash_value, record_id=None, source=None, trigger=None, artifact=None):
    # 檢查是否已存在
    for rec in db["records"]:
        if rec["hash_lock"] == hash_value:
            print(f"⚠ 該 Hash Lock 已存在: {hash_value}")
            return None
    
    rec = {
        "record_id": record_id or f"5T-Canon-{datetime.now(timezone.utc).strftime('%Y-%m-%d-%H%M%S')}",
        "hash_lock": hash_value,
        "short_hash": hash_value[:16] + "..." + hash_value[-4:],
        "source": source or "unknown",
        "trigger": trigger or "unknown",
        "artifact": artifact or "unknown",
        "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "status": "pending",
        "tags": ["5T", "hash-lock"]
    }
    db["records"].append(rec)
    save_db(db)
    print(f"✓ 已註冊 Hash Lock: {hash_value[:16]}...")
    print(f"  記錄 ID: {rec['record_id']}")
    return rec

def main():
    if len(sys.argv) < 3 or sys.argv[1] != "--hash":
        print("用法: python3 hashlock_register.py --hash <hash_value> [--record <record_id>] [--source <source>] [--trigger <trigger>]")
        sys.exit(1)
    
    hash_value = sys.argv[2]
    record_id = None
    source = None
    trigger = None
    artifact = None
    
    i = 3
    while i < len(sys.argv):
        if sys.argv[i] == "--record" and i + 1 < len(sys.argv):
            record_id = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--source" and i + 1 < len(sys.argv):
            source = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--trigger" and i + 1 < len(sys.argv):
            trigger = sys.argv[i + 1]
            i += 2
        elif sys.argv[i] == "--artifact" and i + 1 < len(sys.argv):
            artifact = sys.argv[i + 1]
            i += 2
        else:
            i += 1
    
    db = load_db()
    register(db, hash_value, record_id, source, trigger, artifact)

if __name__ == "__main__":
    main()
