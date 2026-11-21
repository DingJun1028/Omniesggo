"""OmniNote 本機儲存 — 每筆筆記一檔 (.md) + 狀態索引 (state.json)。

Trackable：每次寫入更新狀態索引；Trustworthy：內容 hash 入狀態供核對。
"""
from __future__ import annotations

import json
from pathlib import Path
from .note import OmniNote


class NoteStore:
    """端點本機的筆記庫。notes_dir/*.md 為正體，state.json 為元資料索引。"""

    def __init__(self, root: str | Path):
        self.root = Path(root)
        self.notes_dir = self.root / "notes"
        self.state_file = self.root / "state.json"
        self.notes_dir.mkdir(parents=True, exist_ok=True)

    # ---- 讀寫 ----
    def _state(self) -> dict:
        if self.state_file.exists():
            return json.loads(self.state_file.read_text(encoding="utf-8"))
        return {}

    def _save_state(self, state: dict) -> None:
        self.state_file.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")

    def get_base_hash(self, note_id: str) -> str:
        return self._state().get(note_id, {}).get("content_hash", "")

    def set_base_hash(self, note_id: str, h: str) -> None:
        state = self._state()
        state[note_id] = {"content_hash": h}
        self._save_state(state)

    def load(self, note_id: str) -> OmniNote | None:
        p = self.notes_dir / f"{note_id}.md"
        if not p.exists():
            return None
        return OmniNote.from_markdown(p.read_text(encoding="utf-8"))

    def save(self, note: OmniNote) -> None:
        (self.notes_dir / f"{note.id}.md").write_text(note.to_markdown(), encoding="utf-8")

    def delete(self, note_id: str) -> bool:
        p = self.notes_dir / f"{note_id}.md"
        if p.exists():
            p.unlink()
            state = self._state(); state.pop(note_id, None); self._save_state(state)
            return True
        return False

    def list(self) -> list[OmniNote]:
        out = []
        for p in sorted(self.notes_dir.glob("*.md")):
            n = OmniNote.from_markdown(p.read_text(encoding="utf-8"))
            n.base_hash = self.get_base_hash(n.id)
            out.append(n)
        return out

    def ids(self) -> set[str]:
        return {p.stem for p in self.notes_dir.glob("*.md")}
