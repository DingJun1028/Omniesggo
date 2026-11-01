"""OmniNote 三向同步引擎 — 電腦 / 手機 / Hermes 三方 + 共享 hub 的 3-way merge。

設計（對應 OBSIDIAN-SHARED-BRAIN-SYNC canon + VaultSyncAgent 的 hash-lock 思路）：
  - hub = 共享正典（即 git repo / docs/vault-canon 之對應的 notes 同步區）。
  - 每個端點（desktop/phone/hermes）各有本機 NoteStore。
  - 同步 = 以 hub 上每筆筆記的 base_hash（上次同步 hash）為基準做 3-way merge：
      local 變 / hub 不變 → push；hub 變 / local 不變 → pull；
      兩者皆變且不同 → conflict（保留兩版 + 標記，待人工）。
  - Trackable：每次同步事件寫 events.jsonl。Trustworthy：內容 hash 決定期權。
"""
from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path

from .note import ENDPOINTS, Endpoint, FORBIDDEN, OmniNote
from .store import NoteStore


@dataclass
class SyncResult:
    note_id: str
    action: str            # pushed | pulled | added | removed | unchanged | conflict
    conflict: bool
    detail: str

    def to_dict(self) -> dict:
        return asdict(self)


class SyncEngine:
    def __init__(self, hub: NoteStore, events_log: str | Path | None = None):
        self.hub = hub
        self.events = Path(events_log) if events_log else hub.root / "events.jsonl"
        self.events.parent.mkdir(parents=True, exist_ok=True)

    def _log(self, endpoint: Endpoint, results: list[SyncResult]) -> None:
        with open(self.events, "a", encoding="utf-8") as f:
            f.write(json.dumps({
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "endpoint": endpoint,
                "results": [r.to_dict() for r in results],
            }, ensure_ascii=False) + "\n")

    def sync(self, endpoint: Endpoint, store: NoteStore) -> list[SyncResult]:
        """對單一端點做雙向 3-way merge。返回每筆筆記的同步結果。"""
        if endpoint not in ENDPOINTS:
            raise ValueError(f"未知端點 {endpoint}，僅 {ENDPOINTS}")
        results: list[SyncResult] = []
        hub_ids = self.hub.ids()
        local_ids = store.ids()
        for nid in sorted(hub_ids | local_ids):
            results.append(self._sync_note(endpoint, store, nid))
        self._log(endpoint, results)
        return results

    def _sync_note(self, endpoint: Endpoint, store: NoteStore, nid: str) -> SyncResult:
        local = store.load(nid)
        hub = self.hub.load(nid)
        base = store.get_base_hash(nid)   # 合併基準 = 端點上次同步 hash（非 hub，hub 會隨 push 變）

        # 兩端皆無 → 清理
        if local is None and hub is None:
            store.delete(nid)
            return SyncResult(nid, "removed", False, "both absent")

        # 本機新增（hub 無）→ push
        if local is not None and hub is None:
            if self._forbidden(endpoint, local.title, nid):
                return SyncResult(nid, "conflict", True, f"禁區：Hermes 不得寫入 {nid}")
            self.hub.save(local)
            self.hub.set_base_hash(nid, local.content_hash)
            store.set_base_hash(nid, local.content_hash)
            return SyncResult(nid, "pushed", False, "local new → hub")

        # hub 有、本機無 → pull
        if local is None and hub is not None:
            store.save(hub)
            store.set_base_hash(nid, hub.content_hash)
            return SyncResult(nid, "pulled", False, "hub new → local")

        assert local is not None and hub is not None

        local_changed = local.content_hash != base
        hub_changed = hub.content_hash != base

        if not local_changed and not hub_changed:
            return SyncResult(nid, "unchanged", False, "in sync")

        # 只有一端變 → 單向同步
        if local_changed and not hub_changed:
            if self._forbidden(endpoint, local.title, nid):
                return SyncResult(nid, "conflict", True, f"禁區：Hermes 不得寫入 {nid}")
            self.hub.save(local)
            self.hub.set_base_hash(nid, local.content_hash)
            store.set_base_hash(nid, local.content_hash)
            return SyncResult(nid, "pushed", False, "local edited")

        if hub_changed and not local_changed:
            store.save(hub)
            store.set_base_hash(nid, hub.content_hash)
            return SyncResult(nid, "pulled", False, "hub edited")

        # 兩者皆變且不同 → 衝突（保留兩版，標記待人工）
        local.conflict = True
        hub.conflict = True
        store.save(local)
        self.hub.save(hub)
        return SyncResult(nid, "conflict", True,
                          f"雙方皆修改：local={local.content_hash[:8]} hub={hub.content_hash[:8]}")

    @staticmethod
    def _forbidden(endpoint: Endpoint, title: str, nid: str) -> bool:
        # Hermes 端點：禁區文件名不得寫入（canon 第三節）
        if endpoint == "hermes" and (nid in FORBIDDEN or title in FORBIDDEN):
            return True
        return False

    def sync_all(self, stores: dict[Endpoint, NoteStore]) -> dict[Endpoint, list[SyncResult]]:
        return {ep: self.sync(ep, st) for ep, st in stores.items()}

    def conflicts(self, endpoint: Endpoint, store: NoteStore) -> list[OmniNote]:
        return [n for n in store.list() if n.conflict]
