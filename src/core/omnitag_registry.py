"""
src/core/omnitag_registry.py — §20.6 OmniTag 契約持久化層 (Python 端)

對齊 TypeScript 雙軌同構：
- src/lib/five-t-protocol.ts (FiveTOmniTagGate + ArtifactStore + MemoryArtifactStore + FileArtifactStore)
- cli/oa-cli/src/omnitag.ts (OmniTagRegistry)

Hash Lock 使用 src/core/verification.py 的 generate_hash_lock (§18 跨語言同構):
    sha256(f"{source}|{content}|{timestamp}")

零外部依賴（僅標準庫 json / os / hashlib 經 verification）。

[agent:25][squad:5T驗算][lifecycle:active][p2][platform:esggo][best-practice:结界]
"""

import json
import os
from typing import Dict, List, Optional, Any

# 跨語言 Hash Lock（§18 同構，對齊 TS FiveTHashLock.generate）
from verification import generate_hash_lock

# ── §20.2 六大維度型別（對齊 TS OmniTagSet）──
AGENT_ID_RE = r"^agent:(0?[1-9]|[12][0-9]|30)$"
SQUAD_SET = {"智庫聖所", "符文契約", "光之羽翼", "煉金熵減", "5T驗算"}


class PersistedArtifact:
    """對齊 TS PersistedArtifact dataclass。"""

    def __init__(
        self,
        entity_id: str,
        tag: Dict[str, str],
        hash_lock: str,
        sealed_at: int,
        source_origin: str,
        content: Optional[str] = None,
    ):
        self.entity_id = entity_id
        self.tag = tag
        self.content = content
        self.hash_lock = hash_lock
        self.sealed_at = sealed_at
        self.source_origin = source_origin

    def to_dict(self) -> Dict[str, Any]:
        return {
            "entityId": self.entity_id,
            "tag": self.tag,
            "content": self.content,
            "hashLock": self.hash_lock,
            "sealedAt": self.sealed_at,
            "sourceOrigin": self.source_origin,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "PersistedArtifact":
        return cls(
            entity_id=d["entityId"],
            tag=d["tag"],
            content=d.get("content"),
            hash_lock=d["hashLock"],
            sealed_at=d["sealedAt"],
            source_origin=d["sourceOrigin"],
        )


class ArtifactStore:
    """抽象儲存介面（對齊 TS ArtifactStore）。"""

    def write(self, record: PersistedArtifact) -> None:
        raise NotImplementedError

    def read(self, entity_id: str) -> Optional[PersistedArtifact]:
        raise NotImplementedError

    def list(self) -> List[PersistedArtifact]:
        raise NotImplementedError


class MemoryArtifactStore(ArtifactStore):
    """預設記憶體儲存（零依賴，對齊 TS MemoryArtifactStore）。"""

    def __init__(self):
        self._map: Dict[str, PersistedArtifact] = {}

    def write(self, record: PersistedArtifact) -> None:
        self._map[record.entity_id] = record

    def read(self, entity_id: str) -> Optional[PersistedArtifact]:
        return self._map.get(entity_id)

    def list(self) -> List[PersistedArtifact]:
        return list(self._map.values())


class FileArtifactStore(ArtifactStore):
    """檔案持久化後端：append-only JSONL（對齊 TS FileArtifactStore）。"""

    def __init__(self, path: str = ".oa/omnitag-registry.jsonl"):
        self._path = path
        os.makedirs(os.path.dirname(path) or ".", exist_ok=True)

    def _read_lines(self) -> List[str]:
        if not os.path.exists(self._path):
            return []
        with open(self._path, "r", encoding="utf-8") as f:
            return [l for l in f.read().split("\n") if l.strip()]

    def write(self, record: PersistedArtifact) -> None:
        with open(self._path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record.to_dict(), ensure_ascii=False) + "\n")

    def read(self, entity_id: str) -> Optional[PersistedArtifact]:
        for line in self._read_lines():
            try:
                rec = PersistedArtifact.from_dict(json.loads(line))
                if rec.entity_id == entity_id:
                    return rec
            except (json.JSONDecodeError, KeyError):
                continue
        return None

    def list(self) -> List[PersistedArtifact]:
        out: List[PersistedArtifact] = []
        for line in self._read_lines():
            try:
                out.append(PersistedArtifact.from_dict(json.loads(line)))
            except (json.JSONDecodeError, KeyError):
                continue
        return out


class OmniTagRegistry:
    """
    §20.6 契約持久化層（寫入即凍結）。
    對齊 TS OmniTagRegistry / FiveTOmniTagGate.persistArtifact。
    """

    def __init__(self, store: Optional[ArtifactStore] = None):
        self._store = store or MemoryArtifactStore()

    @staticmethod
    def _validate_required_triad(tag: Dict[str, str]) -> List[str]:
        """§20.5 規則 1：必備三枚。"""
        import re

        violations: List[str] = []
        if not tag.get("agent") or not re.match(AGENT_ID_RE, tag.get("agent", "")):
            violations.append("Missing required [agent:*] (agent:01~agent:30)")
        if not tag.get("lifecycle"):
            violations.append("Missing required [lifecycle:*] (draft/active/frozen/archived)")
        if not tag.get("priority"):
            violations.append("Missing required [p*] (p0/p1/p2/p3)")
        return violations

    def persist_artifact(
        self,
        entity_id: str,
        tag: Dict[str, str],
        content: Optional[str] = None,
    ) -> PersistedArtifact:
        # 1. 過閘（§20.5 規則 1）
        violations = self._validate_required_triad(tag)
        if violations:
            raise ValueError(f"§20.5 OmniTag 契約違規: {'; '.join(violations)}")

        # 2. 凍結不可改（§20.5 規則 2 / H4）
        existing = self._store.read(entity_id)
        if existing:
            is_sealed = (
                existing.tag.get("lifecycle") == "frozen"
                and existing.tag.get("security") == "restricted"
            )
            if is_sealed:
                raise ValueError(
                    f"H4 frozen: entity {entity_id} is sealed (frozen+restricted) — immutable"
                )

        # 3. 寫入即凍結（含 Hash Lock，對齊 §18 同構）
        import time

        sealed_at = int(time.time() * 1000)
        hash_lock = generate_hash_lock(
            tag.get("agent", "unknown"),
            content if content is not None else json.dumps(tag, sort_keys=True, ensure_ascii=False),
            sealed_at,
        )
        record = PersistedArtifact(
            entity_id=entity_id,
            tag=tag,
            content=content,
            hash_lock=hash_lock,
            sealed_at=sealed_at,
            source_origin=f"agent:{tag.get('agent', 'unknown')}",
        )
        self._store.write(record)
        return record

    def get_artifact(self, entity_id: str) -> Optional[PersistedArtifact]:
        return self._store.read(entity_id)

    def verify_persisted(self, entity_id: str) -> Dict[str, Any]:
        """§5 Trustworthy 篡改驗證。"""
        rec = self._store.read(entity_id)
        if not rec:
            return {"exists": False, "tampered": False, "record": None}
        expected = generate_hash_lock(
            rec.tag.get("agent", "unknown"),
            rec.content if rec.content is not None else json.dumps(rec.tag, sort_keys=True, ensure_ascii=False),
            rec.sealed_at,
        )
        return {
            "exists": True,
            "tampered": expected != rec.hash_lock,
            "record": rec.to_dict(),
        }

    def list_artifacts(self) -> List[PersistedArtifact]:
        return self._store.list()


if __name__ == "__main__":
    reg = OmniTagRegistry()
    rec = reg.persist_artifact(
        "art:01",
        {"agent": "agent:25", "lifecycle": "active", "priority": "p2", "squad": "5T驗算"},
        content='{"op":"seal"}',
    )
    print(f"Sealed: {rec.entity_id} hash={rec.hash_lock[:16]}...")
    v = reg.verify_persisted("art:01")
    print(f"Verify: exists={v['exists']} tampered={v['tampered']}")
