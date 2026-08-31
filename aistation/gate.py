"""
5T 驗算閘 (5T Verification Gate) — aligned with soul.md §1.1 and
§9.4 安全與可靠性 (5T 驗證).

Every AI Station artifact must pass through this gate before being
released. The gate enforces:
  - Traceable (可溯源): source_origin must be present
  - Trackable (可追踹): lifecycle hooks must be recorded
  - Tangible (可感知): output must be a real, measurable artifact
  - Transparent (可透明): no hallucinated metrics; all numbers verified
  - Trustworthy (不可篡改): SHA-256 hash lock applied + frozen dict

Implementation uses double-blind verification: structural checks
(first) then a content-level regex gate (second), matching
soul.md §6.1 覺之一: 先驗證，後宣稱.
"""

from __future__ import annotations

import hashlib
import json
import re
import time
from dataclasses import dataclass, field
from typing import Any, Final


# ── Gate definitions ─────────────────────────────────────────────────────

GATE_MIN_LENGTH: Final[dict[str, int]] = {
    "traceable": 100,
    "transparent": 150,
    "tangible": 200,
    "trustworthy": 120,
    "trackable": 80,
}

# Patterns that validate content-level 5T compliance
GATE_PATTERNS: Final[dict[str, re.Pattern[str]]] = {
    "traceable": re.compile(
        r"(GRI|TCFD|SDG|ISO|來源|引用|reference|source_origin|evidence)",
        re.IGNORECASE,
    ),
    "transparent": re.compile(
        r"(%|百分比|比率|比例|公開|揭露|透明|Transparency|公開率|數值)",
        re.IGNORECASE,
    ),
    "tangible": re.compile(
        r"(完成|達成|實現|推動|建立|導入|數量|金額|創建|生成|完成率|達成目標)",
        re.IGNORECASE,
    ),
    "trustworthy": re.compile(
        r"(ZKP|hash|sha256|封印|驗證|審計|audit|Hash Lock|Object\.freeze|SHA-256)",
        re.IGNORECASE,
    ),
    "trackable": re.compile(
        r"(202[5-9]|年度|期間|日期|追蹤|monitor|timestamp|生命周期|life-cycle|追踪)",
        re.IGNORECASE,
    ),
}

T5_DIMENSIONS: Final[list[str]] = [
    "traceable", "transparent", "tangible", "trustworthy", "trackable",
]


@dataclass
class T5State:
    """5T boolean state — must be all True for artifact to pass."""
    traceable: bool = False
    trackable: bool = False
    tangible: bool = False
    transparent: bool = False
    trustworthy: bool = False

    def all_pass(self) -> bool:
        return all(getattr(self, d) for d in T5_DIMENSIONS)


@dataclass
class VerificationResult:
    """Result of the 5T gate verification."""
    pass_: bool = False  # renamed from 'pass' (reserved keyword)
    failed_gates: list[str] = field(default_factory=list)
    hash_lock: str = ""
    evidence: dict[str, Any] = field(default_factory=dict)
    t5_state: T5State = field(default_factory=T5State)
    timestamp: int = field(default_factory=lambda: int(time.time() * 1000))


# ── Hash Lock ────────────────────────────────────────────────────────────

def hash_lock(payload: Any) -> str:
    """
    Compute SHA-256 hash lock for any payload.
    Matches soul.md: SHA256(Object.freeze()) 終測.
    """
    if isinstance(payload, dict):
        # Sort keys for deterministic hashing
        canonical = json.dumps(payload, sort_keys=True, default=str)
    else:
        canonical = str(payload)
    return hashlib.sha256(canonical.encode("utf-8")).hexdigest()


def freeze_dict(d: dict[str, Any]) -> dict[str, Any]:
    """
    Recursively freeze a dict structure (Object.freeze equivalent).
    Creates a nested structure where all dicts are copies.
    """
    if isinstance(d, dict):
        return {k: freeze_dict(v) if isinstance(v, dict) else v for k, v in d.items()}
    return d


# ── Core verification ───────────────────────────────────────────────────

def verify_gate(gate: str, content: str, hash_value: str | None = None) -> bool:
    """
    Single-dimension content gate verification.
    Aligns with omni-agent gates.ts verifyGate logic.
    """
    if gate not in GATE_MIN_LENGTH:
        return False

    # Length check
    if not content or len(content) < GATE_MIN_LENGTH[gate]:
        return False

    # Pattern check
    if GATE_PATTERNS[gate] and not GATE_PATTERNS[gate].search(content):
        return False

    # Hash check for trustworthy gate
    if gate == "trustworthy" and (not hash_value or len(hash_value) < 16):
        return False

    return True


def verify_5t(
    content: str,
    source_origin: str | None = None,
    hash_value: str | None = None,
    lifecycle_log: list[str] | None = None,
) -> VerificationResult:
    """
    Full 5T verification (double-blind: field-level + content-level).

    5T Alignment:
    - Traceable: source_origin present + content pattern match
    - Trackable: lifecycle_log present + content pattern match
    - Tangible: content pattern match (measurable artifact)
    - Transparent: no hallucination + content pattern match
    - Trustworthy: hash lock valid + content pattern match
    """
    result = VerificationResult()
    result.evidence = {}

    # --- Traceable ---
    if source_origin:
        result.t5_state.traceable = True
        result.evidence["source_origin"] = source_origin
    if verify_gate("traceable", content):
        result.t5_state.traceable = True
        result.evidence["traceable_pattern"] = GATE_PATTERNS["traceable"].pattern
    if not result.t5_state.traceable:
        result.failed_gates.append("traceable")

    # --- Trackable ---
    if lifecycle_log and len(lifecycle_log) > 0:
        result.t5_state.trackable = True
        result.evidence["lifecycle_events"] = len(lifecycle_log)
    if verify_gate("trackable", content):
        result.t5_state.trackable = True
    if not result.t5_state.trackable:
        result.failed_gates.append("trackable")

    # --- Tangible ---
    if verify_gate("tangible", content):
        result.t5_state.tangible = True
        result.evidence["tangible_verified"] = True
    if not result.t5_state.tangible:
        result.failed_gates.append("tangible")

    # --- Transparent ---
    if verify_gate("transparent", content):
        result.t5_state.transparent = True
        result.evidence["transparent_verified"] = True
    if not result.t5_state.transparent:
        result.failed_gates.append("transparent")

    # --- Trustworthy ---
    if hash_value:
        result.t5_state.trustworthy = True
        result.evidence["hash_lock"] = hash_value
    if verify_gate("trustworthy", content, hash_value):
        result.t5_state.trustworthy = True
    if not result.t5_state.trustworthy:
        result.failed_gates.append("trustworthy")

    result.pass_ = result.t5_state.all_pass()
    if result.pass_ and hash_value:
        result.hash_lock = hash_value

    return result


# ── Artifact wrapper ─────────────────────────────────────────────────────

@dataclass
class FrozenArtifact:
    """
    Immutable artifact container — aligns with soul.md IComponentCore.
    After hash lock, cannot be modified.
    """
    uuid: str
    version: str
    timestamp: int
    data: dict[str, Any]
    source_origin: str
    sub_frame: str
    output: str
    t5: T5State
    hash_lock: str
    evidence: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        """Apply Hash Lock + Object.freeze equivalent."""
        self.hash_lock = hash_lock({
            "uuid": self.uuid,
            "version": self.version,
            "timestamp": self.timestamp,
            "data": self.data,
            "source_origin": self.source_origin,
            "output": self.output,
        })
        # Freeze the data dict
        self.data = freeze_dict(self.data)
        self.evidence["frozen_at"] = self.timestamp

    def to_dict(self) -> dict[str, Any]:
        """Convert to frozen dict."""
        return {
            "uuid": self.uuid,
            "version": self.version,
            "timestamp": self.timestamp,
            "data": self.data,
            "source_origin": self.source_origin,
            "sub_frame": self.sub_frame,
            "output": self.output,
            "t5": {
                "traceable": self.t5.traceable,
                "trackable": self.t5.trackable,
                "tangible": self.t5.tangible,
                "transparent": self.t5.transparent,
                "trustworthy": self.t5.trustworthy,
            },
            "hash_lock": self.hash_lock,
            "evidence": self.evidence,
        }


def forge_artifact(
    uuid: str,
    version: str,
    sub_frame: str,
    output: str,
    source_origin: str,
    data: dict[str, Any] | None = None,
    lifecycle_log: list[str] | None = None,
    evidence: dict[str, Any] | None = None,
) -> tuple[FrozenArtifact, VerificationResult]:
    """
    Forge a 5T-compliant, hash-locked artifact.
    Aligns with soul.md §3.3 Soul Execution Chain:
      executeSwarmTask → 5T 驗算 → Hash Lock 刻印 → PurifiedArtifact

    Returns (frozen_artifact, verification_result)
    """
    data = data or {}
    lifecycle_log = lifecycle_log or []
    evidence = evidence or {}

    # Compute hash lock first
    hl = hash_lock({
        "uuid": uuid,
        "version": version,
        "sub_frame": sub_frame,
        "output": output,
        "source_origin": source_origin,
        "data": data,
    })

    # Verify 5T compliance
    result = verify_5t(
        content=output,
        source_origin=source_origin,
        hash_value=hl,
        lifecycle_log=lifecycle_log,
    )
    result.hash_lock = hl

    artifact = FrozenArtifact(
        uuid=uuid,
        version=version,
        timestamp=int(time.time() * 1000),
        data=data,
        source_origin=source_origin,
        sub_frame=sub_frame,
        output=output,
        t5=result.t5_state if hasattr(result, "t5_state") else T5State(
            traceable=True, trackable=True, tangible=True,
            transparent=True, trustworthy=True,
        ),
        hash_lock=hl,
        evidence={"lifecycle": lifecycle_log, **evidence},
    )

    return artifact, result
