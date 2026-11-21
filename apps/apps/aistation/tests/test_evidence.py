# source_origin: AI Station §9 - Module 7 Evidence DB TDD
"""RED test for Evidence DB (Module 7): record creation with Hash Lock.

Drives the contract defined in docs/brainstorming/ai-station-design.md
(Module 7) and docs/plans/tdd-plan.md (Task 5):

    RED:  EvidenceDB.create_record() returns a hash-locked record.
    GREEN: SQLite + freeze_artifact integration.
"""
import tempfile
from pathlib import Path

from src.evidence.hash_lock import freeze_artifact
from src.storage.evidence import EvidenceDB


def test_evidence_record_creation():
    """EvidenceDB.create_record() must persist a Hash-Locked record.

    Contracts asserted:
      1. A record dict is returned and carries the requested task_id.
      2. The record carries a valid SHA-256 `hash_lock` (64 hex chars).
      3. The `hash_lock` reproduces via freeze_artifact() over the payload
         (Trustworthy pillar of the 5T protocol).
      4. The record is actually persisted and retrievable round-trip.
    """
    with tempfile.TemporaryDirectory() as tmp:
        db = EvidenceDB(db_path=Path(tmp) / "evidence.db")

        script_input = "Dr. Source introduces the central conflict."
        evidence = {"scenes": 3, "brand": "sushi-doctor"}

        record = db.create_record(
            task_id="task-001",
            script_input=script_input,
            status="queued",
            evidence_json=evidence,
        )

        # 1. A record is returned with the requested identity
        assert isinstance(record, dict)
        assert record["task_id"] == "task-001"

        # 2. The record is Hash-Locked with a valid SHA-256
        assert "hash_lock" in record
        hash_lock = record["hash_lock"]
        assert isinstance(hash_lock, str)
        assert len(hash_lock) == 64
        int(hash_lock, 16)  # must be valid hex

        # 3. The hash lock reproduces via freeze_artifact over the payload
        payload = {k: v for k, v in record.items() if k != "hash_lock"}
        assert hash_lock == freeze_artifact(payload)["hash_lock"]

        # 4. The record is persisted and retrievable (round-trip)
        stored = db.get_record("task-001")
        assert stored is not None
        assert stored["hash_lock"] == hash_lock
        assert stored["script_input"] == script_input
