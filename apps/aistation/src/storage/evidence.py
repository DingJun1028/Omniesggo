# source_origin: AI Station §9 - Module 7 Evidence DB
"""Evidence database for the AI Station production line.

Implements Module 7 of docs/brainstorming/ai-station-design.md:

    Engine : SQLite
    Schema : tasks(task_id, script_input, created_at, completed_at,
                   status, hash_lock, evidence_json)
    Logic  : After each module completes -> freeze_artifact() -> insert evidence

The `hash_lock` column is produced by `freeze_artifact()` from
`src/evidence/hash_lock.py` (Trustworthy pillar of the 5T protocol):
a SHA-256 over the canonical, JSON-serialised artifact payload.
"""
import json
import sqlite3
from contextlib import contextmanager
from datetime import datetime
from pathlib import Path

from src.evidence.hash_lock import freeze_artifact

# Default on-disk location (overridable for tests / alternate storage).
DEFAULT_DB = Path(__file__).resolve().parent.parent.parent / "storage" / "evidence.db"

_SCHEMA = """
CREATE TABLE IF NOT EXISTS tasks (
    task_id      TEXT PRIMARY KEY,
    script_input TEXT,
    created_at   TEXT,
    completed_at TEXT,
    status       TEXT,
    hash_lock    TEXT,
    evidence_json TEXT
);
"""


class EvidenceDB:
    """SQLite-backed evidence store with Hash Lock integration."""

    def __init__(self, db_path: Path | None = None):
        self.db_path = Path(db_path) if db_path else DEFAULT_DB
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_db()

    def _init_db(self) -> None:
        """Create the tasks table if it does not yet exist."""
        with self._connect() as conn:
            conn.execute(_SCHEMA)

    @contextmanager
    def _connect(self):
        """Yield a SQLite connection and guarantee it is closed.

        sqlite3.Connection's own context manager commits/rolls back but does
        NOT close, which leaves the file handle open and breaks cleanup on
        Windows. We close explicitly in `finally`.
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
            conn.commit()
        finally:
            conn.close()

    def create_record(
        self,
        task_id: str,
        script_input: str,
        status: str = "queued",
        evidence_json: dict | None = None,
        completed_at: str | None = None,
    ) -> dict:
        """Persist a module-output record, Hash-Locked via freeze_artifact().

        Returns the frozen record dict (including its `hash_lock`). The
        returned dict is the canonical payload that the hash was computed
        over, so it round-trips through get_record() unchanged.
        """
        created_at = datetime.now().isoformat()
        evidence_json = evidence_json or {}

        # Build the canonical artifact payload and freeze it (adds hash_lock).
        artifact = {
            "task_id": task_id,
            "script_input": script_input,
            "created_at": created_at,
            "completed_at": completed_at,
            "status": status,
            "evidence_json": evidence_json,
        }
        frozen = freeze_artifact(artifact)
        hash_lock = frozen["hash_lock"]

        with self._connect() as conn:
            conn.execute(
                """
                INSERT INTO tasks
                    (task_id, script_input, created_at, completed_at,
                     status, hash_lock, evidence_json)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    task_id,
                    script_input,
                    created_at,
                    completed_at,
                    status,
                    hash_lock,
                    json.dumps(evidence_json, sort_keys=True),
                ),
            )

        # Return the frozen record (the exact payload the hash covers).
        return frozen

    def get_record(self, task_id: str) -> dict | None:
        """Retrieve a previously stored record by task_id, or None."""
        with self._connect() as conn:
            row = conn.execute(
                """
                SELECT task_id, script_input, created_at, completed_at,
                       status, hash_lock, evidence_json
                FROM tasks WHERE task_id = ?
                """,
                (task_id,),
            ).fetchone()

        if row is None:
            return None

        return {
            "task_id": row["task_id"],
            "script_input": row["script_input"],
            "created_at": row["created_at"],
            "completed_at": row["completed_at"],
            "status": row["status"],
            "hash_lock": row["hash_lock"],
            "evidence_json": json.loads(row["evidence_json"]) if row["evidence_json"] else {},
        }
