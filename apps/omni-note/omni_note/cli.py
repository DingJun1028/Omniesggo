"""OmniNote CLI — 萬能筆記三向同步命令列。

用法例：
  python -m omni_note.cli status  --hub ./hub
  python -m omni_note.cli sync    --endpoint desktop --hub ./hub --store ./desktop
  python -m omni_note.cli new     --title "議題" --body "內容" --endpoint desktop --hub ./hub
  python -m omni_note.cli ingest  --hub ./hub --file shared-memory.json
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from omni_note.note import ENDPOINTS
from omni_note.store import NoteStore
from omni_note.sync import SyncEngine
from omni_note.ingest import SharedMemoryIngest


def _cmd_status(a) -> int:
    hub = NoteStore(a.hub)
    notes = hub.list()
    conflicts = [n for n in notes if n.conflict]
    print(f"hub: {a.hub}  — {len(notes)} 筆")
    for n in notes:
        flag = " ⚠衝突" if n.conflict else ""
        print(f"  [{n.endpoint:7}] {n.id}  {n.title}{flag}")
    if conflicts:
        print(f"\n{len(conflicts)} 筆待人工合併。")
    return 0


def _cmd_sync(a) -> int:
    if a.endpoint not in ENDPOINTS:
        print(f"未知端點 {a.endpoint}，僅 {ENDPOINTS}", file=sys.stderr)
        return 2
    hub = NoteStore(a.hub)
    store = NoteStore(a.store)
    engine = SyncEngine(hub)
    results = engine.sync(a.endpoint, store)
    for r in results:
        print(f"  {r.action:9} {r.note_id}  {r.detail}")
    n_conf = sum(1 for r in results if r.conflict)
    print(f"同步完成：{len(results)} 筆，{n_conf} 衝突。")
    return 0


def _cmd_new(a) -> int:
    hub = NoteStore(a.hub)
    from omni_note.note import OmniNote
    n = OmniNote(title=a.title, body=a.body, endpoint=a.endpoint, tags=a.tag or [])
    hub.save(n); hub.set_base_hash(n.id, n.content_hash)
    print(f"已建立 {n.id}：{n.title}")
    return 0


def _cmd_ingest(a) -> int:
    hub = NoteStore(a.hub)
    entries = json.loads(Path(a.file).read_text(encoding="utf-8"))
    ing = SharedMemoryIngest(hub)
    written = ing.ingest(entries, run_id="cli")
    for n in written:
        print(f"  寫入 {n.title}")
    print(f"彙整 {len(written)} 筆。")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(prog="omni-note", description="萬能筆記三向同步")
    sub = p.add_subparsers(dest="cmd", required=True)

    s = sub.add_parser("status"); s.add_argument("--hub", required=True); s.set_defaults(func=_cmd_status)
    s = sub.add_parser("sync"); s.add_argument("--endpoint", required=True, choices=ENDPOINTS)
    s.add_argument("--hub", required=True); s.add_argument("--store", required=True); s.set_defaults(func=_cmd_sync)
    s = sub.add_parser("new"); s.add_argument("--title", required=True); s.add_argument("--body", default="")
    s.add_argument("--endpoint", default="desktop", choices=ENDPOINTS); s.add_argument("--hub", required=True)
    s.add_argument("--tag", action="append"); s.set_defaults(func=_cmd_new)
    s = sub.add_parser("ingest"); s.add_argument("--hub", required=True); s.add_argument("--file", required=True); s.set_defaults(func=_cmd_ingest)

    a = p.parse_args()
    return a.func(a)


if __name__ == "__main__":
    raise SystemExit(main())
