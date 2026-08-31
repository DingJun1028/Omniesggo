"""
tests/test_omnitag_registry.py — §20.6 Python OmniTag 持久化層測試

對齊 TS 雙軌同構（cli/oa-cli/src/omnitag.test.ts §20.6 用例）。
"""

import os
import sys
import tempfile

import pytest

# 確保 src/core 在 path（verification.py / omnitag_registry.py）
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src", "core"))

from omnitag_registry import (  # noqa: E402
    OmniTagRegistry,
    MemoryArtifactStore,
    FileArtifactStore,
    PersistedArtifact,
)


def test_persist_and_verify_integrity():
    reg = OmniTagRegistry(MemoryArtifactStore())
    rec = reg.persist_artifact(
        "art:01",
        {"agent": "agent:25", "lifecycle": "active", "priority": "p2", "squad": "5T驗算"},
        content='{"op":"seal"}',
    )
    assert len(rec.hash_lock) == 64
    assert rec.source_origin == "agent:agent:25"

    v = reg.verify_persisted("art:01")
    assert v["exists"] is True
    assert v["tampered"] is False


def test_get_artifact_returns_record():
    reg = OmniTagRegistry(MemoryArtifactStore())
    reg.persist_artifact(
        "art:02",
        {"agent": "agent:03", "lifecycle": "draft", "priority": "p1"},
    )
    got = reg.get_artifact("art:02")
    assert got.tag["agent"] == "agent:03"
    assert got.tag["lifecycle"] == "draft"


def test_frozen_restricted_rejects_repersist():
    reg = OmniTagRegistry(MemoryArtifactStore())
    reg.persist_artifact(
        "art:seal",
        {"agent": "agent:25", "lifecycle": "frozen", "security": "restricted", "priority": "p0"},
    )
    with pytest.raises(ValueError, match="immutable"):
        reg.persist_artifact(
            "art:seal",
            {"agent": "agent:25", "lifecycle": "frozen", "security": "restricted", "priority": "p0"},
        )


def test_verify_detects_tampering():
    reg = OmniTagRegistry(MemoryArtifactStore())
    reg.persist_artifact(
        "art:tamper",
        {"agent": "agent:09", "lifecycle": "active", "priority": "p2"},
        content="original",
    )
    # 篡改 store 內記錄
    stored = reg._store._map["art:tamper"]
    stored.hash_lock = "0" * 64

    v = reg.verify_persisted("art:tamper")
    assert v["exists"] is True
    assert v["tampered"] is True


def test_list_artifacts_enumerates():
    reg = OmniTagRegistry(MemoryArtifactStore())
    reg.persist_artifact("a", {"agent": "agent:01", "lifecycle": "active", "priority": "p2"})
    reg.persist_artifact("b", {"agent": "agent:02", "lifecycle": "active", "priority": "p2"})
    assert len(reg.list_artifacts()) == 2


def test_file_store_persist_and_verify(tmp_path):
    """檔案後端：寫入即凍結 + 篡改驗證（對齊 TS FileArtifactStore）。"""
    path = str(tmp_path / ".oa" / "omnitag-registry.jsonl")
    reg = OmniTagRegistry(FileArtifactStore(path))
    rec = reg.persist_artifact(
        "file:01",
        {"agent": "agent:15", "lifecycle": "active", "priority": "p2", "squad": "光之羽翼"},
        content='{"deploy":true}',
    )
    assert os.path.exists(path)
    assert len(rec.hash_lock) == 64

    v = reg.verify_persisted("file:01")
    assert v["exists"] is True
    assert v["tampered"] is False

    # 新實例讀同一檔案
    reg2 = OmniTagRegistry(FileArtifactStore(path))
    got = reg2.get_artifact("file:01")
    assert got.tag["agent"] == "agent:15"


def test_required_triad_violation():
    reg = OmniTagRegistry(MemoryArtifactStore())
    with pytest.raises(ValueError, match="agent"):
        reg.persist_artifact("bad", {"lifecycle": "active"})


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
