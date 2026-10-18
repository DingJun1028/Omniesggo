"""esggo.knowledge.db — 共享知識庫與永恆記憶資料庫（SQLite）。

OA-Team 30 萬能蜂群的「主要資料庫流程」：收到代碼、文字、任何格式的資料，
作為所有代理共同使用的共享資料庫。每筆資料隨資料進入即完成 5T 封印。

5T 對映:
  Traceable — 每筆資料帶 content_origin + sha256 + 代理錨點 (anchor)
  Trackable — 生命週期事件 (ingest/link/annotate/seal/consume) 進 events 表
  Tangible  — CLI 即時回傳 URIs / 摘要 / 鎖資訊 / 事件流
  Transparent — 模式、治理區塊、版本號公開；內容可解壓 / 讀回
  Trustworthy — Hash Lock + 版本鎖；鎖定後不可覆寫

Schema:
  - meta            : 資料庫版本與治理區塊
  - doc             : 知識文件（行內容可解壓 / 需只輸出）
  - anchor          : 代理錚點（01-30 umbra / 31-60 lumen）
  - event           : 生命週期事件流
  - seal            : 每筆資料的 Hash Lock（SHA-256 鎖 + 版本鎖）
  - link            : 跨文件關聯（升級版測試）
  - version         : 文件版本歷史

所有寫入前必須走 5T 驗證門檻；鎖定（sealed）後任何改寫皆拋出 PermissionError。
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import time
from pathlib import Path

from . import SOURCE_ORIGIN_CANON, MODEL_VERSION
from .registry import by_id

# ── 路徑 ────────────────────────────────────────────────────
ENV_FILE = os.environ.get("ESGGO_KNOWLEDGE_DB")
SCHEMA_FILE = os.path.join(os.path.dirname(__file__), "schema.sql")
DEFAULT_DB = ENV_FILE or os.path.join(
    os.path.expanduser("~"), "AppData", "Local", "esggo", "knowledge.db"
)


def _now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def _sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# ── 5T 驗證門檻 ──────────────────────────────────────────────
def verify_5t(
    *,
    content: str,
    source_origin: str,
    anchor: str,
    visibility: str,
    page_alias: str | None = None,
) -> dict:
    """5T 驗證。通過返回校驗物件；失敗拋出 ValueError。"""
    if not source_origin or source_origin != SOURCE_ORIGIN_CANON:
        raise ValueError(f"source_origin 必須是 {SOURCE_ORIGIN_CANON!r}，收到 {source_origin!r}")
    if not anchor or len(anchor) > 64:
        raise ValueError("anchor 必須為非空且 <= 64 字")
    if visibility not in {"public", "team", "restricted", "agent", "sealed"}:
        raise ValueError(f"visibility 無效: {visibility!r}")
    # Traceable: 計算內容雜湊
    content_sha256 = _sha256(content.encode("utf-8"))
    return {
        "content_sha256": content_sha256,
        "source_origin": source_origin,
        "anchor": anchor,
        "visibility": visibility,
        "page_alias": page_alias or "unknown",
        "verified_at": _now(),
    }


def _fetch_meta(conn: sqlite3.Connection) -> dict:
    row = conn.execute("SELECT value FROM meta WHERE key='governance'").fetchone()
    return json.loads(row[0]) if row else {"schema": "1.0.0", "model_version": MODEL_VERSION}


def _init_shared_index(conn: sqlite3.Connection) -> None:
    """初始化共享知識庫第 1 版索引（全代理可免認證查詢，唯讀）。"""
    agent = conn.execute(
        "SELECT value FROM meta WHERE key='governance'"
    ).fetchone()
    if agent:
        row = json.loads(agent[0])
        if row.get("shared_index_version") == "1":
            return
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS shared_index (
            doc_id   TEXT PRIMARY KEY,
            title    TEXT NOT NULL,
            alias    TEXT NOT NULL,
            visibility TEXT NOT NULL DEFAULT 'public',
            shape    TEXT NOT NULL DEFAULT 'compact',
            updated  INTEGER NOT NULL,
            seq      INTEGER PRIMARY KEY AUTOINCREMENT
        );
        """
    )
    conn.execute(
        "INSERT OR IGNORE INTO shared_index (doc_id, title, alias, visibility, shape, updated, seq) "
        "VALUES ('gov:index', '共享索引', 'shared-index', 'public', 'compact', ? , 1)",
        (_now(),),
    )
    conn.execute(
        "UPDATE meta SET value=? WHERE key='governance'",
        (json.dumps({"shared_index_version": "1", "schema": "1.0.0"}, ensure_ascii=False),),
    )


class KnowledgeDB:
    """共享知識庫實例。"""

    def __init__(self, path: str | None = None) -> None:
        self.path = path or DEFAULT_DB
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.path)
        self.conn.row_factory = sqlite3.Row
        self._load_schema()
        _init_shared_index(self.conn)

    # ── 生命週期 ────────────────────────────────────────────
    def ingest(
        self,
        *,
        content: str,
        source_origin: str,
        anchor: str,
        visibility: str,
        title: str | None = None,
        page_alias: str | None = None,
        tags: list[str] | None = None,
        path_alias: str | None = None,
    ) -> str:
        """接收代碼/文字資料，完成 5T 封印並寫入資料庫。"""
        v = verify_5t(
            content=content,
            source_origin=source_origin,
            anchor=anchor,
            visibility=visibility,
            page_alias=page_alias,
        )
        cur = self.conn.execute(
            "INSERT INTO doc (content_origin, sha256, anchor, visibility, title, page_alias, tags, path_alias, created, updated) "
            "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                v["source_origin"],
                v["content_sha256"],
                anchor,
                v["visibility"],
                title or f"doc:{anchor}",
                page_alias,
                json.dumps(tags or [], ensure_ascii=False),
                path_alias,
                _now(),
                _now(),
            ),
        )
        doc_id = cur.lastrowid
        self.conn.execute(
            "INSERT INTO seal (doc_id, sha256, version, locked, locked_at) VALUES (?, ?, 1, 1, ?)",
            (doc_id, v["content_sha256"], _now()),
        )
        self.conn.execute(
            "INSERT INTO event (doc_id, event, entity, detail, timestamp) VALUES (?, 'ingest', 'system', ?, ?)",
            (doc_id, json.dumps(v, ensure_ascii=False), _now()),
        )
        self.conn.execute(
            "INSERT INTO link (doc_id, linked_doc_id, rel, created) VALUES (?, ?, 'ingest_self', ?)",
            (doc_id, doc_id, _now()),
        )
        self.conn.commit()
        return f"kb://{self.path} doc://{doc_id}"

    def seal(self, doc_id: int, increment: bool = False) -> dict:
        """Hash Lock 與版本鎖。sealed 之後任何改寫拋出 PermissionError。"""
        cur = self.conn.execute(
            "SELECT sha256, locked FROM seal WHERE doc_id=?", (doc_id,)
        )
        row = cur.fetchone()
        if not row:
            raise ValueError(f"找不到 doc_id={doc_id}")
        if row["locked"]:
            raise PermissionError(f"doc_id={doc_id} 已鎖定，禁止鎖定覆寫")
        self.conn.execute(
            "UPDATE seal SET version=version+1, locked=1, locked_at=? WHERE doc_id=?",
            (_now(), doc_id),
        )
        self.conn.commit()
        return {"doc_id": doc_id, "version": 2, "locked": True, "sealed_at": _now()}

    def read(self, doc_id: int, if_sealed_only: bool = True) -> dict:
        """讀回文件。"""
        doc = self.conn.execute(
            "SELECT * FROM doc WHERE doc_id=?", (doc_id,)
        ).fetchone()
        if not doc:
            raise ValueError(f"找不到 doc_id={doc_id}")
        seal = self.conn.execute(
            "SELECT * FROM seal WHERE doc_id=?", (doc_id,)
        ).fetchone()
        return {"doc": dict(doc), "seal": dict(seal)}

    # ── 追蹤 ────────────────────────────────────────────────
    def events(self, doc_id: int) -> list[dict]:
        """生命週期事件流。"""
        rows = self.conn.execute(
            "SELECT * FROM event WHERE doc_id=? ORDER BY timestamp", (doc_id,)
        ).fetchall()
        return [dict(r) for r in rows]

    def links(self, doc_id: int) -> list[dict]:
        """跨文件關聯。"""
        rows = self.conn.execute(
            "SELECT * FROM link WHERE doc_id=? OR linked_doc_id=?", (doc_id, doc_id)
        ).fetchall()
        return [dict(r) for r in rows]

    # ── 可見性 ──────────────────────────────────────────────
    def query(self, *, visibility: str | None = None, text: str | None = None) -> list[dict]:
        """共享索引：全代理可免認證查詢。"""
        sql = "SELECT doc_id, title, alias, visibility, shape, updated FROM shared_index"
        params: list = []
        if visibility:
            sql += " WHERE visibility=?"
            params.append(visibility)
        sql += " ORDER BY updated DESC"
        rows = self.conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]

    def close(self) -> None:
        self.conn.close()


# ── 單例入口 ──────────────────────────────────────────────────
_db: KnowledgeDB | None = None


def get_db(path: str | None = None) -> KnowledgeDB:
    global _db
    if _db is None:
        _db = KnowledgeDB(path)
    return _db
