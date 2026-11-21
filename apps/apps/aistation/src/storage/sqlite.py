# source_origin: AI Station §9 - Module 6 Storage Layer
import os
import json
import sqlite3
from pathlib import Path
from datetime import datetime

# Graceful fallback: local storage (default) / S3 (optional)
STORAGE_DIR = Path(__file__).parent.parent / "storage"
STORAGE_DIR.mkdir(exist_ok=True)
DB_PATH = STORAGE_DIR / "evidence.db"

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

def save_artifact(artifact: dict, filename: str) -> str:
    """Save artifact with fallback handling"""
    try:
        # Try S3 if configured
        if os.getenv("S3_BUCKET"):
            return save_to_s3(artifact, filename)
        else:
            # Local fallback
            file_path = STORAGE_DIR / filename
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(artifact, f, indent=2)
            return str(file_path)
    except Exception as e:
        # Graceful degradation
        local_path = STORAGE_DIR / f"fallback_{filename}"
        with open(local_path, "w") as f:
            f.write(str(artifact))
        return str(local_path)

def save_to_s3(artifact: dict, filename: str) -> str:
    """Save to S3 (placeholder)"""
    return f"s3://{os.getenv('S3_BUCKET')}/{filename}"

import json
