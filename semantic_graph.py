#!/usr/bin/env python3
"""
semantic_graph.py — 第二奧義：熵減煉金·動態語義圖譜

將工具調用的原始輸出（可能高達數百乃至數千 token）提純為
實體關係三元組（Entity-Relation Triplet），儲存於 SQLite。
對話 Context 僅注入提純後的 state delta（約 50 token），
徹底阻斷 KV Cache 膨脹導致的推論斷崖。

設計原則：
- 短暫記憶（Scratchpad）與永久記憶（Context）分離
- 原始大封包不回填對話歷史，僅回填 digest
- 背景可選：小模型將過去幾輪壓縮為一句事實（預留接口）
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


# ============================================================================
# 輔助：Python 值 → 標記化字串（用於 triplet 實體名稱）
# ============================================================================

def _slug(value: Any) -> str:
    """將任意值轉為可作實體名稱的緊湊字串。"""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value)
    # 把空格與特殊字元替換為底線，避免 SQLite 問題
    return "".join(c if c.isalnum() or c == "_" else "_" for c in s)[:64]


# ============================================================================
# 主要類別：SemanticGraph
# ============================================================================

class SemanticGraph:
    """
    輕量語義圖譜：位於應用層的熵減裝置。

    用法：
        graph = SemanticGraph("/tmp/semantic_graph.db")
        digest = graph.ingest_tool_result("get_node_health", {"cpu": 95, "mem": 87})
        # digest ≈ "get_node_health_cpu: 95 | get_node_health_mem: 87"
        state = graph.query_state("%")  # 查詢當前所有實體（用於注入 Context）
    """

    def __init__(self, db_path: str = ":memory:", *, create: bool = True) -> None:
        """
        初始化語義圖譜。

        參數：
            db_path: SQLite 檔案路徑。預設 `:memory:`（純記憶體，不登陸磁碟）。
            create: 若為 True 且路徑不存在，則建立新資料庫；若為 False 且不存在則報錯。
        """
        self._db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None
        self._ensure_connection(create=create)

    # ------------------------------------------------------------------
    # 連線管理
    # ------------------------------------------------------------------

    def _ensure_connection(self, *, create: bool = True) -> None:
        path = Path(self._db_path)
        if self._db_path == ":memory:":
            self._conn = sqlite3.connect(":memory:", check_same_thread=False)
            self._init_schema()
            return

        if not path.exists():
            if create:
                self._conn = sqlite3.connect(str(path), check_same_thread=False)
                self._init_schema()
                return
            raise FileNotFoundError(f"語義圖譜資料庫不存在：{self._db_path}")

        self._conn = sqlite3.connect(str(path), check_same_thread=False)

    def __enter__(self) -> "SemanticGraph":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    def close(self) -> None:
        """釋放 SQLite 連線。"""
        if self._conn:
            self._conn.close()
            self._conn = None

    # ------------------------------------------------------------------
    # 架構初始化
    # ------------------------------------------------------------------

    def _init_schema(self) -> None:
        """建立 entities 與 relations 表格（含索引）。"""
        if self._conn is None:
            return
        self._conn.executescript("""
            CREATE TABLE IF NOT EXISTS entities (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                name        TEXT    NOT NULL UNIQUE,
                type        TEXT,
                attributes  TEXT,   -- JSON 字串
                created_at  TEXT    NOT NULL
            );
            CREATE TABLE IF NOT EXISTS relations (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                source      TEXT    NOT NULL,
                predicate   TEXT    NOT NULL,
                target      TEXT    NOT NULL,
                weight      REAL    DEFAULT 1.0,
                created_at  TEXT    NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_entities_type     ON entities(type);
            CREATE INDEX IF NOT EXISTS idx_entities_name     ON entities(name);
            CREATE INDEX IF NOT EXISTS idx_relations_source  ON relations(source);
            CREATE INDEX IF NOT EXISTS idx_relations_predicate ON relations(predicate);
        """)
        self._conn.commit()

    # ------------------------------------------------------------------
    # 核心操作：攝取工具結果 → 產生 digest
    # ------------------------------------------------------------------

    def ingest_tool_result(self, tool_name: str, result: Any) -> str:
        """
        將工具返回值提純為實體關係三元組，寫入 SQLite，並返回緊湊 digest。

        行為：
        - 若 result 是 dict：每個 key-value 若為數值即成為一個 metric 實體，
          與 tool_name 建立 `reports_{key}` 關係。
        - 若 result 是字串或其他：整體作為一個實體儲存，關係為 `produces`。
        - 最終返回的 digest 格式範例：
            "get_node_health_cpu: 95 | get_node_health_mem: 87"
        """
        if self._conn is None:
            return ""

        now = datetime.now(timezone.utc).isoformat()
        triplets: list[tuple[str, str, str]] = []  # (source, predicate, target)

        if isinstance(result, dict) and result:
            for key, value in result.items():
                if isinstance(value, (int, float, str, bool)):
                    entity_name = f"{tool_name}_{key}"
                    attr: dict[str, Any] = {key: value}
                    self._upsert_entity(entity_name, "metric", attr, now)
                    pred = f"reports_{key}"
                    self._add_relation(tool_name, pred, entity_name, now)
                    triplets.append((tool_name, pred, entity_name))
                # 嵌套 dict 可選：扁平化一層
                elif isinstance(value, dict):
                    for sub_key, sub_val in value.items():
                        if isinstance(sub_val, (int, float, str, bool)):
                            entity_name = f"{tool_name}_{key}_{sub_key}"
                            attr = {sub_key: sub_val}
                            self._upsert_entity(entity_name, "metric", attr, now)
                            pred = f"reports_{key}_{sub_key}"
                            self._add_relation(tool_name, pred, entity_name, now)
                            triplets.append((tool_name, pred, entity_name))

            # 若 dict 完全空的或不含純值，做整體收納
            if not triplets:
                entity_name = f"{tool_name}_result"
                self._upsert_entity(entity_name, "result", {"raw": _truncate_json(result)}, now)
                self._add_relation(tool_name, "produces", entity_name, now)
                triplets.append((tool_name, "produces", entity_name))

        elif isinstance(result, str):
            entity_name = f"{tool_name}_output"
            self._upsert_entity(entity_name, "text", {"content": _truncate_json(result)}, now)
            self._add_relation(tool_name, "produces", entity_name, now)
            triplets.append((tool_name, "produces", entity_name))

        else:
            # 其他型別一律 JSON 序列化收納
            entity_name = f"{tool_name}_value"
            self._upsert_entity(entity_name, "value", {"data": _truncate_json(result)}, now)
            self._add_relation(tool_name, "produces", entity_name, now)
            triplets.append((tool_name, "produces", entity_name))

        # 拼成 digest 字串
        parts = []
        for src, pred, tgt in triplets[:8]:  # 最多 8 個 triplet，防止 digest 過長
            entity_row = self._conn.execute(
                "SELECT attributes FROM entities WHERE name = ?", (tgt,)
            ).fetchone()
            if entity_row:
                attr = json.loads(entity_row[0])
                # 只顯示最關鍵的一兩個字段
                for k, v in list(attr.items())[:2]:
                    parts.append(f"{tgt}:{v}")
        return " | ".join(parts)

    # ------------------------------------------------------------------
    # 查詢：狀態 delta（用於注入 Context）
    # ------------------------------------------------------------------

    def query_state(self, pattern: str = "%", limit: int = 50) -> list[dict[str, Any]]:
        """
        查詢符合名稱模式的實體列表（用於組裝 state delta 注入 Context）。

        返回格式範例：
            [
                {"name": "get_node_health_cpu", "type": "metric", "attributes": {"cpu": 95}},
                {"name": "get_node_health_mem", "type": "metric", "attributes": {"mem": 87}},
            ]

        預設上限 50 實體，防止一次回傳過大。
        """
        if self._conn is None:
            return []
        rows = self._conn.execute(
            "SELECT name, type, attributes FROM entities WHERE name LIKE ? LIMIT ?",
            (pattern, limit),
        ).fetchall()
        return [
            {"name": r[0], "type": r[1], "attributes": json.loads(r[2])}
            for r in rows
        ]

    def get_digest(self, tool_name: str) -> Optional[str]:
        """
        取出指定工具最近一次 ingest 的 digest（最新關係的 target 實體摘要）。
        """
        if self._conn is None:
            return None
        row = self._conn.execute(
            """
            SELECT target FROM relations
            WHERE source = ?
            ORDER BY created_at DESC
            LIMIT 1
            """,
            (tool_name,),
        ).fetchone()
        if not row:
            return None
        entity_row = self._conn.execute(
            "SELECT name, attributes FROM entities WHERE name = ?", (row[0],)
        ).fetchone()
        if not entity_row:
            return None
        attr = json.loads(entity_row[1])
        flat = ", ".join(f"{k}={v}" for k, v in list(attr.items())[:3])
        return f"{entity_row[0]}: {flat}"

    # ------------------------------------------------------------------
    # 內部輔助
    # ------------------------------------------------------------------

    def _upsert_entity(self, name: str, type_: str, attributes: dict[str, Any],
                       created_at: str) -> None:
        if self._conn is None:
            return
        existing = self._conn.execute(
            "SELECT id FROM entities WHERE name = ?", (name,)
        ).fetchone()
        if existing:
            self._conn.execute(
                "UPDATE entities SET attributes = ?, created_at = ? WHERE name = ?",
                (json.dumps(attributes, ensure_ascii=False), created_at, name),
            )
        else:
            self._conn.execute(
                "INSERT INTO entities (name, type, attributes, created_at) VALUES (?, ?, ?, ?)",
                (name, type_, json.dumps(attributes, ensure_ascii=False), created_at),
            )
        self._conn.commit()

    def _add_relation(self, source: str, predicate: str, target: str,
                      created_at: str) -> None:
        if self._conn is None:
            return
        self._conn.execute(
            "INSERT INTO relations (source, predicate, target, created_at) VALUES (?, ?, ?, ?)",
            (source, predicate, target, created_at),
        )
        self._conn.commit()

    # ------------------------------------------------------------------
    # 除錯 / 展示
    # ------------------------------------------------------------------

    def dump(self) -> dict[str, list[dict[str, Any]]]:
        """回傳完整圖譜快照（供除錯）。"""
        if self._conn is None:
            return {"entities": [], "relations": []}
        entities = [
            {"name": r[0], "type": r[1], "attributes": json.loads(r[2])}
            for r in self._conn.execute("SELECT name, type, attributes FROM entities").fetchall()
        ]
        relations = self._conn.execute(
            "SELECT source, predicate, target, weight FROM relations"
        ).fetchall()
        return {
            "entities": entities,
            "relations": [
                {"source": r[0], "predicate": r[1], "target": r[2], "weight": r[3]}
                for r in relations
            ],
        }

    def entity_count(self) -> int:
        if self._conn is None:
            return 0
        row = self._conn.execute("SELECT COUNT(*) FROM entities").fetchone()
        return row[0] if row else 0

    def relation_count(self) -> int:
        if self._conn is None:
            return 0
        row = self._conn.execute("SELECT COUNT(*) FROM relations").fetchone()
        return row[0] if row else 0


# ============================================================================
# 輔助函式
# ============================================================================

def _truncate_json(value: Any, max_len: int = 300) -> str:
    """JSON 序列化並截斷過長字串。"""
    s = json.dumps(value, ensure_ascii=False)
    if len(s) > max_len:
        return s[:max_len] + "…"
    return s


# ============================================================================
# 快速自測（python semantic_graph.py 執行）
# ============================================================================

if __name__ == "__main__":
    import tempfile

    with tempfile.TemporaryDirectory() as tmpdir:
        db = f"{tmpdir}/test_graph.db"

        # 1. 確立圖譜與模擬工具結果
        graph = SemanticGraph(db)
        result1 = {"cpu_usage": 95, "memory_usage": 87, "status": "degraded"}
        digest1 = graph.ingest_tool_result("get_node_health", result1)
        print(f"digest1 = {digest1!r}")
        assert "get_node_health_cpu_usage:95" in digest1 or "cpu_usage:95" in digest1

        result2 = {"error_count": 3, "response_time_ms": 1200}
        digest2 = graph.ingest_tool_result("query_logs", result2)
        print(f"digest2 = {digest2!r}")

        # 2. 查詢 state delta
        state = graph.query_state("%")
        print(f"\nstate delta ({len(state)} 實體):")
        for e in state:
            print(f"  {e['name']} [{e['type']}] = {e['attributes']}")

        # 3. 取得個別工具 digest
        print(f"\nget_digest('get_node_health') = {graph.get_digest('get_node_health')!r}")
        print(f"get_digest('query_logs')      = {graph.get_digest('query_logs')!r}")

        # 4. 完整 dump
        print(f"\n完整 dump：{json.dumps(graph.dump(), indent=2, ensure_ascii=False)}")

        print(f"\n實體數：{graph.entity_count()}, 關係數：{graph.relation_count()}")
        assert graph.entity_count() >= 4
        assert graph.relation_count() >= 4

        graph.close()
        print("\n✅ SemanticGraph 自測全部通過")
