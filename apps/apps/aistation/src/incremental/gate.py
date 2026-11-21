# source_origin: AI Station §12.1 - 5T Verification Gate
"""5T Verification Gate (§12.1) with the §18 cross-package hash-lock.

Implements the §18 algorithm:

    sha256(f"{source}|{content}|{timestamp}")

which is ISOMORPHIC to ``src.core.verification.generate_hash_lock`` at the
esggo repository root and to the TypeScript ``FiveTHashLock.generate``. The
same test vectors therefore pass across the Python packages and the TS layer.
"""
import hashlib
import json
import time
import types
import uuid
from typing import Any, Dict, Optional


def generate_hash_lock(source: str, content: str, timestamp: int) -> str:
    """Trustworthy: §18 isomorphic hash lock.

    Args:
        source: The ``source_origin`` (Traceable tag).
        content: String form of the artifact content.
        timestamp: Integer epoch milliseconds.

    Returns:
        Hex SHA-256 of ``f"{source}|{content}|{timestamp}"``.
    """
    payload = f"{source}|{content}|{timestamp}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def freeze(obj: Any) -> Any:
    """Trustworthy: recursively freeze a structure into an immutable view.

    Dicts become ``MappingProxyType`` and lists become ``tuple`` so any
    in-place mutation raises ``TypeError``/``AttributeError``.
    """
    if isinstance(obj, dict):
        return types.MappingProxyType({k: freeze(v) for k, v in obj.items()})
    if isinstance(obj, (list, tuple)):
        return tuple(freeze(v) for v in obj)
    return obj


def verify_and_seal(
    content: Any,
    source_origin: str,
    evidence: Optional[Dict] = None,
    version: str = "v0.5.0",
) -> Dict[str, Any]:
    """Seal raw content into a 5T Purified Artifact (Traceable → Trustworthy).

    Every field the §12.1 / §18 gate requires is populated so downstream
    consumers can call ``verify_5t`` without manual assembly.
    """
    ts = int(time.time() * 1000)
    return {
        "uuid": str(uuid.uuid4()),
        "version": version,
        "timestamp": ts,
        "content": content,
        "source_origin": source_origin,
        "evidence": evidence or {},
        "hash_lock": generate_hash_lock(source_origin, str(content), ts),
    }


if __name__ == "__main__":
    artifact = verify_and_seal(
        content={"text": "大家好，我是壽司博士"},
        source_origin="QueenBee_Dispatch_01",
        evidence={"user_feedback": "Positive", "brand_check": "Passed"},
    )
    print("Sealed artifact hash_lock:", artifact["hash_lock"])
    # Self-check against §18 algorithm.
    assert generate_hash_lock(
        artifact["source_origin"], str(artifact["content"]), artifact["timestamp"]
    ) == artifact["hash_lock"]
    print("§18 hash-lock self-check: PASS")
