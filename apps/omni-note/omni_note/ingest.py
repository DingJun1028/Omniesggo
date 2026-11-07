"""多代理共享記憶層 → OmniNote 彙整摘要橋接。

把 smart-ai-router 的 SharedMemoryLayer（TS）snapshot 出的 MemoryEntry
（{topic, content, tags, traceId, agentId, timestamp}）彙整成 OmniNote：
  - 每 topic 一筆「彙整筆記」（多 agent 內容合併）；
  - 每 topic 一筆「摘要筆記」（結構化摘要，可注入 LLM summary_fn）。
source_origin = shared-memory://...，可溯源、可被三向同步分發到電腦/手機/Hermes。

對應 soul.md §六永憶聖所（OmniMemory 95% 召回）+ §七多代理共同記憶。
"""
from __future__ import annotations

import hashlib
from datetime import datetime, timezone
from typing import Callable, Optional

from .note import OmniNote
from .store import NoteStore

SummaryFn = Callable[[str, list[dict]], str]  # (topic, entries) -> 摘要


def _default_summary(topic: str, entries: list[dict]) -> str:
    """結構化摘要（無 LLM 時的預設）：agent 數 / 筆數 / 各 agent 貢獻一行。"""
    agents = sorted({e.get("agentId", "?") for e in entries})
    lines = [f"# 彙整摘要：{topic}", "",
             f"- 參與 agent：{len(agents)}（{', '.join(agents)}）",
             f"- 記憶條目：{len(entries)}", ""]
    for i, e in enumerate(entries, 1):
        snippet = (e.get("content", "") or "").strip().splitlines()
        head = snippet[0][:120] if snippet else ""
        lines.append(f"{i}. [{e.get('agentId','?')}] {head}")
    return "\n".join(lines)


class SharedMemoryIngest:
    def __init__(self, hub: NoteStore, summary_fn: Optional[SummaryFn] = None):
        self.hub = hub
        self.summary_fn = summary_fn or _default_summary

    def _entries_by_topic(self, entries: list[dict]) -> dict[str, list[dict]]:
        out: dict[str, list[dict]] = {}
        for e in entries:
            out.setdefault(e.get("topic", "general"), []).append(e)
        return out

    def ingest(self, entries: list[dict], run_id: str = "") -> list[OmniNote]:
        """吃 shared-memory entries，回傳寫入 hub 的 OmniNote（彙整 + 摘要）。"""
        if not entries:
            return []
        now = datetime.now(timezone.utc).isoformat()
        written: list[OmniNote] = []
        topics = self._entries_by_topic(entries)

        for topic, eps in topics.items():
            # 彙整筆記：合併所有 agent 內容
            body = "\n\n".join(
                f"## [{e.get('agentId','?')}] {datetime.fromisoformat(e.get('timestamp','')).date() if e.get('timestamp') else ''}\n{e.get('content','')}"
                for e in eps
            )
            agg = OmniNote(
                id=f"sm-{topic}-{run_id or hashlib.sha256(body.encode()).hexdigest()[:8]}",
                title=f"🧠 共享記憶彙整：{topic}", body=body, endpoint="hermes",
                source_origin="shared-memory://aggregate",
                tags=["shared-memory", topic, *(t for e in eps for t in (e.get('tags') or []))],
                created_at=now, updated_at=now,
            )
            # 摘要筆記
            summary = self.summary_fn(topic, eps)
            summ = OmniNote(
                id=f"sm-{topic}-summary-{run_id or agg.id[-8:]}",
                title=f"📋 共享記憶摘要：{topic}", body=summary, endpoint="hermes",
                source_origin="shared-memory://summary",
                tags=["shared-memory", "summary", topic],
                created_at=now, updated_at=now, parent_id=agg.id,
            )
            self.hub.save(agg); self.hub.set_base_hash(agg.id, agg.content_hash)
            self.hub.save(summ); self.hub.set_base_hash(summ.id, summ.content_hash)
            written += [agg, summ]
        return written
