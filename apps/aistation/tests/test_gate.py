# source_origin: AI Station §12.1 - 5T Verification Gate tests
"""RED/GREEN tests for the 5T gate (§12.1, §18 cross-package hash-lock).

Run with:  pytest apps/aistation/tests/test_gate.py
"""
import importlib.util
import os
import sys

# Make the aistation project root importable regardless of CWD.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.incremental.gate import freeze, generate_hash_lock, verify_and_seal


def _load_root_verification():
    """Load esggo-root src.core.verification under a UNIQUE module name.

    Avoids the `src` package-name collision between apps/aistation/src and
    the esggo repository root src (both are importable as `src`).
    """
    path = os.path.join(
        os.path.dirname(os.path.dirname(ROOT)), "src", "core", "verification.py"
    )
    if not os.path.isfile(path):
        return None
    spec = importlib.util.spec_from_file_location("esggo_core_verification_x", path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_root_ver = _load_root_verification()


def test_generate_hash_lock_algorithm():
    # §18: sha256(f"{source}|{content}|{ts}")
    import hashlib

    h = generate_hash_lock("agent:25", "大家好，我是壽司博士", 1760000000000)
    expected = hashlib.sha256(
        "agent:25|大家好，我是壽司博士|1760000000000".encode("utf-8")
    ).hexdigest()
    assert h == expected


def test_generate_hash_lock_matches_root_verification():
    if _root_ver is None:
        import pytest

        pytest.skip("esggo root src.core.verification not found")
    for src, content, ts in [
        ("agent:25", "大家好，我是壽司博士", 1760000000000),
        ("agent:09", '{"op":"replace","line":2}', 1760000001000),
        ("QueenBee", "entropy-forge-artifact", 1760000002000),
    ]:
        assert generate_hash_lock(src, content, ts) == _root_ver.generate_hash_lock(
            src, content, ts
        )


def test_freeze_returns_immutable():
    import pytest

    frozen = freeze({"a": 1, "b": [1, 2, {"c": 3}]})
    with pytest.raises((TypeError, AttributeError)):
        frozen["a"] = 99
    with pytest.raises((TypeError, AttributeError)):
        frozen["b"][2]["c"] = 99


def test_verify_and_seal_carries_5t_fields():
    art = verify_and_seal(
        {"text": "x"}, source_origin="agent:07", evidence={"t": 1}
    )
    assert art["source_origin"] == "agent:07"
    assert art["hash_lock"]
    assert (
        generate_hash_lock("agent:07", str({"text": "x"}), art["timestamp"])
        == art["hash_lock"]
    )
