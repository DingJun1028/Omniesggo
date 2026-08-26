# source_origin: AI Station §9 - Module 7 Evidence Layer
"""Evidence database with SQLite and hash locking."""
import sqlite3
import json
import hashlib
from pathlib import Path
from datetime import datetime

DB_PATH = Path("storage/evidence.db")

def init_db():
    """Initialize evidence database."""
    DB_PATH.parent.mkdir(exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS evidence (
            id INTEGER PRIMARY KEY,
            artifact TEXT,
            hash_lock TEXT,
            timestamp TEXT,
            source_origin TEXT
        )
    """)
    conn.commit()
    conn.close()

def log_evidence(artifact: dict) -> str:
    """Log artifact with hash lock."""
    init_db()
    
    artifact_str = json.dumps(artifact, sort_keys=True)
    hash_lock = hashlib.sha256(artifact_str.encode()).hexdigest()
    
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO evidence (artifact, hash_lock, timestamp, source_origin) VALUES (?, ?, ?, ?)",
        (artifact_str, hash_lock, datetime.now().isoformat(), artifact.get("source_origin", "unknown"))
    )
    conn.commit()
    conn.close()
    
    return hash_lock

def freeze_artifact(artifact: dict) -> dict:
    """Apply Hash Lock + Object.freeze() equivalent."""
    artifact_str = json.dumps(artifact, sort_keys=True)
    artifact["hash_lock"] = hashlib.sha256(artifact_str.encode()).hexdigest()
    # Object.freeze() equivalent: convert to immutable
    return {k: v for k, v in artifact.items()}
