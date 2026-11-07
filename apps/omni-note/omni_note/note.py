"""OmniNote 資料模型 — 萬能筆記核心實體。

正典對齊：OBSIDIAN-SHARED-BRAIN-SYNC（docs/vault-canon 共享大腦）+ soul.md §1.1 5T。
每筆 OmniNote 皆自描述、可溯源、Hash 鎖定（Trustworthy）。
"""
from __future__ import annotations

import hashlib
import json
import re
from dataclasses import dataclass, field, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
import uuid

# 三向端點（電腦 / 手機 / Hermes）
ENDPOINTS = ("desktop", "phone", "hermes")
Endpoint = str  # Literal 子集，運行期不強制

# 禁區：Hermes 不得改寫（來自 canon 第三節）
FORBIDDEN = {"soul.md", "OMN-PRD-001.md"}


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def content_hash(body: str) -> str:
    """Trustworthy：內容 SHA-256，供衝突偵測與防竄改。"""
    return hashlib.sha256(body.encode("utf-8")).hexdigest()


@dataclass
class OmniNote:
    """一筆萬能筆記。frontmatter 可序列化成 Obsidian 相容 .md。"""
    id: str = field(default_factory=lambda: uuid.uuid4().hex[:12])
    title: str = ""
    body: str = ""
    endpoint: Endpoint = "desktop"          # 來源端點
    source_origin: str = ""                 # 5T Traceable：溯源起點
    tags: list[str] = field(default_factory=list)
    content_hash: str = ""                  # body 的 hash（Trustworthy）
    base_hash: str = ""                     # 上次同步的 hash（3-way merge 基準）
    created_at: str = field(default_factory=_now)
    updated_at: str = field(default_factory=_now)
    conflict: bool = False                  # 偵測到分歧
    parent_id: str | None = None            # 版本鏈

    def __post_init__(self) -> None:
        if not self.content_hash:
            self.content_hash = content_hash(self.body)
        if not self.source_origin:
            self.source_origin = f"omninote://{self.endpoint}/{self.id}"

    # ---- 序列化 ----
    def to_markdown(self) -> str:
        lines = ["---"]
        for k, v in asdict(self).items():
            if k in ("body", "content_hash"):  # body 進正體；hash 進狀態檔不進 md
                continue
            lines.append(f"{k}: {json.dumps(v, ensure_ascii=False)}")
        lines += ["---", "", self.body.rstrip() + "\n"]
        return "\n".join(lines)

    @classmethod
    def from_markdown(cls, text: str, endpoint: Endpoint = "desktop") -> "OmniNote":
        body = text
        meta: dict[str, Any] = {}
        if text.startswith("---"):
            parts = text.split("---", 2)
            if len(parts) == 3:
                for line in parts[1].strip().splitlines():
                    if ":" in line:
                        k, _, v = line.partition(":")
                        v = v.strip()
                        try:
                            val: Any = json.loads(v)
                        except json.JSONDecodeError:
                            val = v
                        meta[k.strip()] = val
                body = parts[2]
        meta["body"] = body.strip("\n")
        meta["endpoint"] = endpoint
        meta.pop("content_hash", None)  # 重算
        return cls(**meta)  # type: ignore[arg-type]

    def changed_from(self, base_hash: str) -> bool:
        return self.content_hash != base_hash

    def to_state(self) -> dict[str, Any]:
        return asdict(self)

    @classmethod
    def from_state(cls, s: dict[str, Any]) -> "OmniNote":
        s = dict(s)
        s.pop("content_hash", None)
        return cls(**s)  # type: ignore[arg-type]
