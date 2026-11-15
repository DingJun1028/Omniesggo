"""Hermes 橋接 — OmniAgent 在同步中的角色（依 canon 第三節權限）。

- 讀：docs/vault-canon 人工筆記（唯讀）。
- 寫：僅新增獨立報告檔（檔名含日期 + source_origin=hermes）；禁區（soul.md / OMN-PRD-001）不得寫。
- 所有寫入走 NoteStore（git 提交由上層管線負責，本層不繞過版本控制）。
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from .note import OmniNote, FORBIDDEN
from .store import NoteStore


class HermesBridge:
    def __init__(self, hub: NoteStore, vault_canon: str | Path | None = None):
        self.hub = hub
        self.vault_canon = Path(vault_canon) if vault_canon else None

    # ---- 讀（唯讀）----
    def read_canon_notes(self) -> list[OmniNote]:
        """讀 docs/vault-canon 人工筆記為唯讀 OmniNote 列表。"""
        if not self.vault_canon or not self.vault_canon.exists():
            return []
        out = []
        for p in sorted(self.vault_canon.glob("*.md")):
            if p.stem in FORBIDDEN:
                continue
            out.append(OmniNote.from_markdown(p.read_text(encoding="utf-8"), endpoint="desktop"))
        return out

    # ---- 寫（僅報告檔）----
    def write_report(self, title: str, body: str, tags: list[str] | None = None) -> OmniNote:
        date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        safe_title = "".join(c for c in title if c.isalnum() or c in "-_ ").strip() or "report"
        nid = f"{date}-{safe_title}"
        if nid in FORBIDDEN or title in FORBIDDEN:
            raise PermissionError(f"禁區：Hermes 不得寫入 {nid}")
        note = OmniNote(
            id=nid, title=title, body=body, endpoint="hermes",
            source_origin="hermes://omniagent", tags=tags or [],
        )
        self.hub.save(note)
        self.hub.set_base_hash(nid, note.content_hash)
        return note

    # ---- 作為同步端點 ----
    def as_endpoint_store(self, root: str | Path) -> NoteStore:
        return NoteStore(root)
