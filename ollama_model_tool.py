#!/usr/bin/env python3
"""
ollama_model_tool.py — 生產級 Ollama 模型管理與推論測試工具

特色：
- 非同步並行推論測試（asyncio + aiohttp）
- JSON/YAML 配置檔支援
- 結構化日誌 logging
- 進度條（tqdm）搭配非同步任務
- 多種輸出格式：JSON, JSONL, CSV, 表格
- 型別安全、輸入驗證、退出碼協定

用法：
    # 健康檢查
    python ollama_model_tool.py --health

    # 列出模型
    python ollama_model_tool.py --list

    # 單模型測試
    python ollama_model_tool.py --model gemma4:e4b

    # 批次並行測試所有模型（預設 concurrency=3）
    python ollama_model_tool.py --batch

    # 指定並行數 + 提示 + 輸出
    python ollama_model_tool.py --batch --concurrency 5 -p "列出 3 個優點" -o result.json

    # 使用配置檔
    python ollama_model_tool.py --config models.yaml

    # 僅輸出表格
    python ollama_model_tool.py --batch --table

配置檔範例 (models.yaml)：
    ollama:
      host: http://localhost:11434
    test:
      prompt: 輸出 JSON {"status":"ok"}，不要其他文字
      timeout: 90
      concurrency: 3
      retry: 1
    output:
      format: json
      path: ./result.json
"""

from __future__ import annotations

import argparse
import asyncio
import csv
import inspect
import json
import os
import re
import sqlite3
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional
from dataclasses import dataclass, field, asdict
from enum import Enum

import logging

# aiohttp 為延遲載入（lazy import）。
# 理由：aiohttp 連同其 C 擴充在 Windows 首次 import 需 3–25 秒（Defender 掃描），
# 佔啟動時間 >90%。延遲載入後 --help / --test-tools / 解析錯誤路徑皆不需付這筆成本。
# 型別參照用 TYPE_CHECKING 避免 runtime 匯入。
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    import aiohttp

_AIOHTTP: Any = None


def _aiohttp() -> Any:
    """取得 aiohttp 模組，首次呼叫時才真正載入。"""
    global _AIOHTTP
    if _AIOHTTP is None:
        import aiohttp as _mod
        _AIOHTTP = _mod
    return _AIOHTTP


# 程式識別名（凍結後 sys.argv[0] 為 .exe 檔名，此處固定以免版本資訊漂移）
APP_NAME = "esggo-agent-mesh"
APP_VERSION = "2.1.0"


def _setup_console() -> None:
    """統一主控台編碼為 UTF-8。

    必要性：Windows 主控台預設 cp950（Big5），emoji（🔍/✅/❌）與部分簡體
    觸發 UnicodeEncodeError，使凍結後的 exe 直接崩潰。PyInstaller 產物不帶
    UTF-8 環境時尤其明顯。此處雙管齊下：設定 console code page + 以
    errors="replace" 重配置串流，確保任何主控台下都不會因編碼中斷。
    """
    if sys.platform == "win32":
        try:
            import ctypes
            ctypes.windll.kernel32.SetConsoleOutputCP(65001)
            ctypes.windll.kernel32.SetConsoleCP(65001)
        except Exception:  # 非致命：無主控台（服務/重導向）時略過
            pass
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:  # 非致命：舊版/替換串流無 reconfigure
            pass


# ============================================================================
# 第二奧義：熵減煉金 · 動態語義圖譜（ SemanticGraph ）
# 內嵌自 semantic_graph.py — 將工具輸出提純為實體關係三元組，儲存於 SQLite。
# 對話 Context 僅注入提純後的 digest（約 50 token），阻斷 KV Cache 膨脹。
# ============================================================================

def _semantic_slug(value: Any) -> str:
    """將任意值轉為可作實體名稱的緊湊字串。"""
    if value is None:
        return "null"
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    s = str(value)
    return "".join(c if c.isalnum() or c == "_" else "_" for c in s)[:64]


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
        self._db_path = db_path
        self._conn: Optional[sqlite3.Connection] = None
        self._ensure_connection(create=create)

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

    def stats(self, limit: int = 10) -> dict[str, Any]:
        """回傳圖譜統計與最近實體（供 CLI --semantic-stats 使用）。

        補足「圖譜只能寫不能讀」的缺口：ingest_tool_result 產出的資料
        原本無任何讀取途徑，無法驗證提純結果是否合理。
        """
        self._ensure_connection(create=False)
        assert self._conn is not None
        entities = self._conn.execute("SELECT count(*) FROM entities").fetchone()[0]
        relations = self._conn.execute("SELECT count(*) FROM relations").fetchone()[0]
        rows = self._conn.execute(
            "SELECT name, type FROM entities ORDER BY id DESC LIMIT ?", (limit,)
        ).fetchall()
        return {
            "db_path": self._db_path,
            "entity_count": int(entities),
            "relation_count": int(relations),
            "recent_entities": [{"name": n, "type": t} for n, t in rows],
        }

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
                self._upsert_entity(entity_name, "result", {"raw": _semantic_truncate_json(result)}, now)
                self._add_relation(tool_name, "produces", entity_name, now)
                triplets.append((tool_name, "produces", entity_name))

        elif isinstance(result, str):
            entity_name = f"{tool_name}_output"
            self._upsert_entity(entity_name, "text", {"content": _semantic_truncate_json(result)}, now)
            self._add_relation(tool_name, "produces", entity_name, now)
            triplets.append((tool_name, "produces", entity_name))

        else:
            # 其他型別一律 JSON 序列化收納
            entity_name = f"{tool_name}_value"
            self._upsert_entity(entity_name, "value", {"data": _semantic_truncate_json(result)}, now)
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


def _semantic_truncate_json(value: Any, max_len: int = 300) -> str:
    """JSON 序列化並截斷過長字串。"""
    s = json.dumps(value, ensure_ascii=False)
    if len(s) > max_len:
        return s[:max_len] + "…"
    return s


# ============================================================================
# 第四奧義：三位一體 · 語義圖譜 × 裝飾器 × 多模型路由
# 內嵌自 test_tool_decorator.py — @tool 裝飾器從函數簽名自動生成 Ollama Tool Schema
# ============================================================================

from typing import get_type_hints as _get_type_hints, get_origin as _get_origin


def _python_type_to_json_schema(py_type: type) -> dict:
    """將 Python 型別映射為 JSON Schema 片段。"""
    origin = _get_origin(py_type)
    if py_type is str or origin is None and py_type == str:
        return {"type": "string"}
    if py_type is int or origin is None and py_type == int:
        return {"type": "integer"}
    if py_type is float or origin is None and py_type == float:
        return {"type": "number"}
    if py_type is bool or origin is None and py_type == bool:
        return {"type": "boolean"}
    if origin is list or py_type is list:
        return {"type": "array", "items": {"type": "string"}}
    if py_type is dict or origin is dict:
        return {"type": "object"}
    return {"type": "string"}


@dataclass
class ToolSchema:
    """Ollama Tool 定義（JSON Schema 格式）。"""
    name: str
    description: str
    parameters: dict  # JSON Schema 格式
    fn: Any = None  # 保留原始函數引用


def _tool_decorator(name: str = None, description: str = None):
    """
    裝飾器：將純 Python 函數轉化為 Ollama Tool 定義（JSON Schema）。

    用法：
        @tool("查詢節點健康狀態")
        def get_node_health(node_id: str, time_window: int = 5) -> dict:
            '''查詢指定節點的健康狀態與負載指標'''
            ...

        schema = get_node_health.tool_schema
        print(json.dumps(schema.parameters, indent=2))
    """

    def decorator(fn):
        sig = inspect.signature(fn)
        hints = _get_type_hints(fn)
        doc_first_line = (fn.__doc__ or "").strip().split("\n")[0] if fn.__doc__ else ""

        tool_name = name or fn.__name__
        tool_desc = description or doc_first_line or f"執行 {fn.__name__} 操作"

        properties: dict = {}
        required: list[str] = []

        for param_name, param in sig.parameters.items():
            if param_name == "self" or param_name == "kwargs":
                continue

            py_type = hints.get(param_name, param.annotation)
            if py_type is inspect.Parameter.empty:
                py_type = str  # 預設推斷為 string

            json_schema = _python_type_to_json_schema(py_type)
            param_def: dict = {"type": json_schema["type"]}
            param_def["description"] = param_name

            if param.default is not inspect.Parameter.empty:
                param_def["default"] = param.default
            else:
                required.append(param_name)

            properties[param_name] = param_def

        schema_dict: dict = {
            "type": "object",
            "properties": properties,
        }
        if required:
            schema_dict["required"] = required

        tool_schema_obj = ToolSchema(
            name=tool_name,
            description=tool_desc,
            parameters=schema_dict,
            fn=fn,
        )
        fn.tool_schema = tool_schema_obj  # type: ignore[attr-defined]
        return fn

    return decorator


# 測試用工具函數（內嵌自 test_tool_decorator.py）
@_tool_decorator("查詢叢集節點健康狀態")
def _test_get_node_health(
    node_id: str,
    time_window: int = 5,
    include_metrics: bool = True,
) -> dict:
    """查詢指定節點的健康狀態與即時負載指標"""
    return {"node": node_id, "status": "healthy"}


@_tool_decorator()
def _test_purge_zombie_process(
    pid: int,
    force: bool = False,
) -> dict:
    """終結指定 PID 的殭屍進程，釋放系統資源"""
    return {"terminated": pid, "status": "purified"}


@_tool_decorator(name="analyze_system_anomaly", description="深度分析系統異常根因")
def _test_analyze_anomaly(
    logs: list[str],
    threshold: float = 0.8,
) -> dict:
    """
    接收日誌列表與閾值，分析異常根因。

    這是 The Mind（大腦）角色的典型任務。
    """
    return {"analysis": "done"}


def _run_tool_schema_test() -> int:
    """執行 @tool 裝飾器驗證（對應 test_tool_decorator.py 之主要測試）。"""
    print("🔍 開始驗證 @tool 裝飾器產出的 Ollama Tool Schema 正確性\n")

    passed = 0
    failed = 0

    def assert_schema(tool_fn, expected_name: str, expected_params: list[str],
                      expected_required: list[str], test_label: str) -> bool:
        nonlocal passed, failed
        schema = tool_fn.tool_schema
        try:
            assert schema is not None, f"[{test_label}] 裝飾器未掛载 tool_schema"
            assert schema.name == expected_name, \
                f"[{test_label}] 名稱不符：{schema.name} != {expected_name}"
            assert list(schema.parameters["properties"].keys()) == expected_params, \
                f"[{test_label}] 參數列表不符"
            if expected_required:
                assert schema.parameters.get("required") == expected_required, \
                    f"[{test_label}] required 欄位不符"
            else:
                assert "required" not in schema.parameters or \
                    not schema.parameters["required"], \
                    f"[{test_label}] 不應有 required 欄位"
            for pname, pdef in schema.parameters["properties"].items():
                assert "type" in pdef, f"[{test_label}] {pname} 缺少 type 欄位"
                assert "description" in pdef, f"[{test_label}] {pname} 缺少 description 欄位"
            print(f"✅ [{test_label}] 通過")
            passed += 1
            return True
        except AssertionError as e:
            print(f"❌ [{test_label}] 失敗：{e}")
            failed += 1
            return False

    # 案例 1
    assert_schema(
        _test_get_node_health,
        expected_name="查詢叢集節點健康狀態",
        expected_params=["node_id", "time_window", "include_metrics"],
        expected_required=["node_id"],
        test_label="案例 1：參數與 required 欄位",
    )

    # 案例 2
    assert_schema(
        _test_purge_zombie_process,
        expected_name="_test_purge_zombie_process",
        expected_params=["pid", "force"],
        expected_required=["pid"],
        test_label="案例 2：force 有預設值不在 required",
    )

    # 案例 3
    assert_schema(
        _test_analyze_anomaly,
        expected_name="analyze_system_anomaly",
        expected_params=["logs", "threshold"],
        expected_required=["logs"],
        test_label="案例 3：自訂名稱與描述優先",
    )

    # 型別映射驗證
    print("\n🔍 驗證型別映射正確性")
    type_checks = [
        (_test_get_node_health, {"node_id": "string", "time_window": "integer", "include_metrics": "boolean"}),
        (_test_purge_zombie_process, {"pid": "integer", "force": "boolean"}),
        (_test_analyze_anomaly, {"logs": "array", "threshold": "number"}),
    ]
    for fn, expected_map in type_checks:
        schema = fn.tool_schema
        all_ok = True
        for pname, expected_type in expected_map.items():
            actual_type = schema.parameters["properties"][pname]["type"]
            if actual_type != expected_type:
                print(f"❌ {fn.tool_schema.name} · {pname}: 期望 {expected_type} 實際 {actual_type}")
                all_ok = False
        if all_ok:
            print(f"✅ {fn.tool_schema.name} 型別映射正確")
            passed += 1
        else:
            failed += 1

    # 產出可直接用於 Ollama Chat API 的 tools 定義
    print("\n" + "=" * 60)
    print("  可直接用於 Ollama Chat API 的 tools 定義")
    print("=" * 60)
    tools_for_ollama = [
        {
            "type": "function",
            "function": {
                "name": s.name,
                "description": s.description,
                "parameters": s.parameters,
            }
        }
        for s in [_test_get_node_health.tool_schema,
                  _test_purge_zombie_process.tool_schema,
                  _test_analyze_anomaly.tool_schema]
    ]
    print(json.dumps(tools_for_ollama, indent=2, ensure_ascii=False))

    print("\n" + "=" * 60)
    if failed == 0:
        print("  裝飾器驗證全部通過 — 寫函數 = 寫工具，零儀式感")
    else:
        print(f"  裝飾器驗證完成：{passed}  통과 / {failed}  실패")
    print("=" * 60)

    return 0 if failed == 0 else 1

# ============================================================================
# 型別定義
# ============================================================================

class OutputFormat(str, Enum):
    JSON = "json"
    JSONL = "jsonl"
    CSV = "csv"
    TABLE = "table"
    AUTO = "auto"  # 根據副檔名自動判斷


class Status(str, Enum):
    OK = "ok"
    ERROR = "error"
    TIMEOUT = "timeout"


@dataclass
class ModelInfo:
    """Ollama 模型基本資訊。"""
    name: str
    model: str
    size: int
    digest: str
    modified_at: str

    def size_human(self) -> str:
        """將位元組數轉為人類可讀格式。"""
        sz = float(self.size)
        for unit in ("B", "KB", "MB", "GB", "TB"):
            if sz < 1024:
                return f"{sz:.1f} {unit}"
            sz /= 1024
        return f"{sz:.1f} PB"


@dataclass
class TestResult:
    """單次推論測試結果（附含語義圖譜 digest）。"""
    model: str
    status: str
    response: str = ""
    error: str = ""
    elapsed_seconds: float = 0.0
    load_duration_ms: float = 0.0
    eval_duration_ms: float = 0.0
    prompt_eval_count: int = 0
    eval_count: int = 0
    cache_hit: bool = False
    retry: int = 0
    timestamp: str = ""
    digest: str = ""  # ← 語義圖譜熵減摘要

    def __post_init__(self) -> None:
        if not self.timestamp:
            self.timestamp = datetime.now(timezone.utc).isoformat()


@dataclass
class OllamaConfig:
    """Ollama 服務配置。"""
    host: str = "http://localhost:11434"
    timeout: float = 10.0  # API 請求超時

    def __post_init__(self) -> None:
        self.host = self.host.rstrip("/")


@dataclass
class TestConfig:
    """測試行為配置。"""
    prompt: str = "輸出 JSON {\"status\":\"ok\"}，不要其他文字"
    timeout: float = 90.0  # 單次推論超時
    concurrency: int = 3    # 並行數
    retry: int = 0          # 失敗重試次數
    temperature: float = 0.0
    num_predict: int = 32

    def __post_init__(self) -> None:
        if self.concurrency < 1:
            self.concurrency = 1
        if self.retry < 0:
            self.retry = 0
        if self.timeout < 1:
            self.timeout = 90.0


@dataclass
class OutputConfig:
    """輸出配置。"""
    format: OutputFormat = OutputFormat.JSON
    path: Optional[str] = None  # None = 僅印終端
    append: bool = False        # 追加模式（JSONL）


@dataclass
class RunConfig:
    """完整執行配置。"""
    ollama: OllamaConfig = field(default_factory=OllamaConfig)
    test: TestConfig = field(default_factory=TestConfig)
    output: OutputConfig = field(default_factory=OutputConfig)
    models: list[str] = field(default_factory=list)  # 空 = 所有模型
    semantic_db: str | None = None  # 語義圖譜 SQLite 路徑（None = 停用）


# ============================================================================
# 配置載入
# ============================================================================

def load_config_from_file(path: str) -> dict[str, Any]:
    """從 JSON/YAML 檔案載入配置。"""
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"配置檔案不存在：{path}")

    text = p.read_text(encoding="utf-8")

    if path.endswith((".yaml", ".yml")):
        try:
            import yaml
            return yaml.safe_load(text) or {}
        except ImportError:
            raise RuntimeError("YAML 配置需要安裝 pyyaml：pip install pyyaml") from None
    else:
        return json.loads(text)


def build_config_from_file(path: str) -> RunConfig:
    """從配置檔建構 RunConfig。"""
    raw = load_config_from_file(path)

    ollama_raw = raw.get("ollama", {})
    test_raw = raw.get("test", {})
    output_raw = raw.get("output", {})

    ollama = OllamaConfig(
        host=str(ollama_raw.get("host", "http://localhost:11434")),
        timeout=float(ollama_raw.get("timeout", 10.0)),
    )

    fmt = output_raw.get("format", "json")
    if isinstance(fmt, str):
        try:
            fmt = OutputFormat(fmt)
        except ValueError:
            fmt = OutputFormat.JSON

    output = OutputConfig(
        format=fmt,
        path=str(output_raw.get("path", None)) if output_raw.get("path") else None,
        append=bool(output_raw.get("append", False)),
    )

    models = raw.get("models", [])
    if not models:
        models = raw.get("model_list", [])

    return RunConfig(
        ollama=ollama,
        test=TestConfig(
            prompt=str(test_raw.get("prompt", RunConfig().test.prompt)),
            timeout=float(test_raw.get("timeout", 90.0)),
            concurrency=int(test_raw.get("concurrency", 3)),
            retry=int(test_raw.get("retry", 0)),
            temperature=float(test_raw.get("temperature", 0.0)),
            num_predict=int(test_raw.get("num_predict", 32)),
        ),
        output=output,
        models=models if models else [],
        semantic_db=(str(raw["semantic_db"]) if raw.get("semantic_db") else None),
    )


# ============================================================================
# Ollama API 客戶端（非同步）
# ============================================================================

class APIRequestError(Exception):
    """Ollama API 回應錯誤。"""

    def __init__(self, status: int, body: str) -> None:
        self.status = status
        self.body = body
        super().__init__(f"HTTP {status}: {body}")


class OllamaClient:
    """Ollama REST API 非同步客戶端。"""

    def __init__(self, host: str, timeout: float = 10.0,
                 semantic_graph: Optional["SemanticGraph"] = None) -> None:
        self.host = host.rstrip("/")
        self.timeout = timeout
        self._session: Optional[Any] = None
        self.semantic_graph = semantic_graph

    async def __aenter__(self) -> "OllamaClient":
        _ah = _aiohttp()
        # self.timeout 僅作為「連線」上限，不再設 total/sock_read 整體上限。
        # 理由：整體預算由 test_model 以 asyncio.wait_for(timeout=...)  enforce，
        # 對應使用者實際設定的 --timeout。若在此設 total，冷啟動逾 10 秒的
        # 模型會在 --timeout 生效前就被砍掉，使 --timeout 形同虛設。
        timeout = _ah.ClientTimeout(
            total=None, connect=self.timeout, sock_connect=self.timeout
        )
        self._session = _ah.ClientSession(timeout=timeout)
        return self

    async def __aexit__(self, *args: Any) -> None:
        if self._session:
            await self._session.close()

    async def _request(self, method: str, path: str, payload: Optional[dict] = None) -> dict:
        """發送 HTTP 請求，返回 JSON。"""
        url = f"{self.host}{path}"
        kwargs: dict[str, Any] = {"method": method, "url": url}
        if payload is not None:
            kwargs["json"] = payload

        try:
            async with self._session.request(**kwargs) as resp:
                if resp.status == 200:
                    return await resp.json()
                body = await resp.text()
                raise APIRequestError(resp.status, body[:500])
        except _aiohttp().ClientError as e:
            raise ConnectionError(f"無法連線 Ollama {self.host}: {e}") from e

    async def list_models(self) -> list[ModelInfo]:
        """列出本地模型。"""
        data = await self._request("GET", "/api/tags")
        result: list[ModelInfo] = []
        for m in data.get("models", []):
            result.append(ModelInfo(
                name=str(m.get("name", "")),
                model=str(m.get("model", "")),
                size=int(m.get("size", 0)),
                digest=str(m.get("digest", "")),
                modified_at=str(m.get("modified_at", "")),
            ))
        return result

    async def test_model(
        self,
        model_name: str,
        prompt: str,
        timeout: float,
        retry: int,
        temperature: float,
        num_predict: int,
    ) -> TestResult:
        """測試單個模型（帶重試）。"""
        ts = datetime.now(timezone.utc).isoformat()
        last_error = ""

        for attempt in range(1 + retry):
            start = time.monotonic()
            try:
                resp = await asyncio.wait_for(
                    self._request(
                        "POST", "/api/chat",
                        {
                            "model": model_name,
                            "messages": [{"role": "user", "content": prompt}],
                            "stream": False,
                            "options": {
                                "temperature": temperature,
                                "num_predict": num_predict,
                            },
                        },
                    ),
                    timeout=timeout,
                )
                elapsed = time.monotonic() - start

                content = ""
                load_dur = 0.0
                eval_dur = 0.0
                prompt_eval = 0
                eval_cnt = 0

                msg = resp.get("message", {})
                if isinstance(msg, dict):
                    c = msg.get("content")
                    if c is not None:
                        content = str(c)[:500]

                if "load_duration" in resp:
                    load_dur = float(resp["load_duration"]) / 1e6
                if "eval_duration" in resp:
                    eval_dur = float(resp["eval_duration"]) / 1e6
                if "prompt_eval_count" in resp:
                    prompt_eval = int(resp["prompt_eval_count"])
                if "eval_count" in resp:
                    eval_cnt = int(resp["eval_count"])

                # 快取偵測：載入時間 < 總時間 50% 則判定為快取命中。
                # load_dur 單位為毫秒、elapsed 為秒，必須先換算再比較，
                # 否則毫秒值恆遠大於秒值，cache_hit 將永遠為 False。
                cache_hit = (load_dur / 1000.0) < (elapsed * 0.5) if elapsed > 0 else True

                # 語義圖譜：將響應提純為 digest（熵減摘要）
                digest = ""
                if self.semantic_graph is not None:
                    digest = self.semantic_graph.ingest_tool_result(model_name, {"response": content})

                return TestResult(
                    model=model_name,
                    status=Status.OK,
                    response=content,
                    elapsed_seconds=round(elapsed, 2),
                    load_duration_ms=round(load_dur, 1),
                    eval_duration_ms=round(eval_dur, 1),
                    prompt_eval_count=prompt_eval,
                    eval_count=eval_cnt,
                    cache_hit=cache_hit,
                    retry=attempt,
                    timestamp=ts,
                    digest=digest,
                )

            except asyncio.TimeoutError:
                # 整體預算（--timeout）已確實耗盡；冷啟動載入常佔多數時間。
                last_error = (
                    f"超時（{timeout}s）— 模型載入可能佔多數時間，"
                    f"可提高 --timeout 或先預熱模型"
                )
            except APIRequestError as e:
                last_error = f"HTTP {e.status}: {e.body[:200]}"
            except Exception as e:
                last_error = str(e)[:500]

            if attempt < retry:
                await asyncio.sleep(2)  # 等待模型重新載入

        elapsed = time.monotonic() - start
        return TestResult(
            model=model_name,
            status=Status.ERROR,
            error=last_error,
            elapsed_seconds=round(elapsed, 2),
            retry=retry,
            timestamp=ts,
        )


# ============================================================================
# 執行器
# ============================================================================

class ModelTestRunner:
    """模型測試執行器（非同步、並行、帶進度）。"""

    def __init__(self, client: OllamaClient, config: TestConfig) -> None:
        self.client = client
        self.config = config

    async def run_single(self, model: str) -> TestResult:
        """測試單個模型。"""
        return await self.client.test_model(
            model_name=model,
            prompt=self.config.prompt,
            timeout=self.config.timeout,
            retry=self.config.retry,
            temperature=self.config.temperature,
            num_predict=self.config.num_predict,
        )

    async def run_batch(
        self,
        models: list[str],
        concurrency: int,
    ) -> list[TestResult]:
        """並行批次測試。"""
        semaphore = asyncio.Semaphore(concurrency)

        async def limited_test(model: str) -> TestResult:
            async with semaphore:
                return await self.run_single(model)

        tasks = [limited_test(m) for m in models]
        results = await asyncio.gather(*tasks)
        return list(results)


# ============================================================================
# 輸出格式化
# ============================================================================

class ResultWriter:
    """測試結果輸出器（多格式）。"""

    def __init__(self, config: OutputConfig) -> None:
        self.config = config

    def write(self, results: list[TestResult], summary: dict[str, Any]) -> None:
        """根據配置寫入結果。"""
        data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "results": [asdict(r) for r in results],
            "summary": summary,
        }

        fmt = self.config.format

        if self.config.path:
            path = Path(self.config.path)
            # 根據副檔名自動判斷格式
            if fmt == OutputFormat.AUTO:
                ext = path.suffix.lower().lstrip(".")
                try:
                    fmt = OutputFormat(ext)
                except ValueError:
                    fmt = OutputFormat.JSON

            if fmt == OutputFormat.JSON:
                path.write_text(
                    json.dumps(data, indent=2, ensure_ascii=False),
                    encoding="utf-8",
                )
                logging.info("JSON 結果已寫入：%s", path)
            elif fmt == OutputFormat.JSONL:
                mode = "a" if self.config.append else "w"
                with open(path, mode, encoding="utf-8") as f:
                    for r in results:
                        f.write(json.dumps(asdict(r), ensure_ascii=False) + "\n")
                logging.info("JSONL 結果已寫入：%s", path)
            elif fmt == OutputFormat.CSV:
                with open(path, "w", newline="", encoding="utf-8") as f:
                    writer = csv.writer(f)
                    writer.writerow([
                        "model", "status", "response", "elapsed_seconds",
                        "load_duration_ms", "eval_duration_ms", "cache_hit", "error",
                    ])
                    for r in results:
                        writer.writerow([
                            r.model,
                            r.status,
                            r.response[:100],
                            r.elapsed_seconds,
                            r.load_duration_ms,
                            r.eval_duration_ms,
                            r.cache_hit,
                            r.error[:200] if r.error else "",
                        ])
                logging.info("CSV 結果已寫入：%s", path)
            else:
                self._print_terminal(data)
        else:
            # 無路徑 = 僅印終端
            self._print_terminal(data)

    def _print_terminal(self, data: dict[str, Any]) -> None:
        """將結果印到終端（JSON 格式）。"""
        print(json.dumps(data, indent=2, ensure_ascii=False))


def print_summary_table(results: list[TestResult]) -> None:
    """將結果以表格格式印到終端。"""
    if not results:
        return

    headers = ["模型", "狀態", "時間(s)", "載入(ms)", "評估(ms)", "快取", "重試"]
    rows = []
    for r in results:
        status_icon = "✅" if r.status == Status.OK else "❌"
        cache_str = "✅" if r.cache_hit else "❄️"
        rows.append([
            r.model[:20],
            f"{status_icon} {r.status}",
            f"{r.elapsed_seconds:.1f}",
            f"{r.load_duration_ms:.0f}",
            f"{r.eval_duration_ms:.0f}",
            cache_str,
            str(r.retry),
        ])

    # 計算每列寬度
    col_widths = [len(h) for h in headers]
    for row in rows:
        for i, val in enumerate(row):
            col_widths[i] = max(col_widths[i], len(val))

    # 印表頭
    header_line = " | ".join(h.ljust(col_widths[i]) for i, h in enumerate(headers))
    sep_line = "-+-".join("-" * col_widths[i] for i in range(len(headers)))

    print(f"\n{'='*len(header_line)}")
    print(f"  測試結果 ({len(results)} 个模型)")
    print(f"{'='*len(header_line)}")
    print(header_line)
    print(sep_line)
    for row in rows:
        print(" | ".join(val.ljust(col_widths[i]) for i, val in enumerate(row)))
    print(f"{'='*len(header_line)}")


# ============================================================================
# 全域 logger
# ============================================================================

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("ollama_tool")


# ============================================================================
# CLI
# ============================================================================

def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    """解析命令列參數。"""
    parser = argparse.ArgumentParser(
        prog=APP_NAME,
        description="生產級 Ollama 模型管理與推論測試工具",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
範例：
  %(prog)s --health                      # 健康檢查
  %(prog)s --list                        # 列出模型
  %(prog)s --model gemma4:e4b           # 單模型測試
  %(prog)s --batch                       # 並行測試所有模型
  %(prog)s --batch --concurrency 5      # 5 個併行
  %(prog)s --config models.yaml          # 使用配置檔
  %(prog)s --batch -o result.json -c 5  # 批次 + 輸出 JSON
        """,
    )

    # 模式選擇
    mode = parser.add_argument_group("模式")
    mode.add_argument("--health", action="store_true",
                      help="輕量健康檢查：確認 Ollama 服務運行")
    mode.add_argument("--list", "-l", action="store_true",
                      help="僅列出模型，不測試")
    mode.add_argument("--batch", "-b", action="store_true",
                      help="並行測試所有模型")

    # 目標模型
    target = parser.add_argument_group("目標")
    target.add_argument("--model", "-m", action="append", default=[],
                        help="指定測試模型（可重覆：-m A -m B）")

    # 測試行為
    test = parser.add_argument_group("測試設定")
    test.add_argument("--prompt", "-p", default=RunConfig().test.prompt,
                      help="推論提示（預設：簡短 JSON 測試）")
    test.add_argument("--timeout", "-t", type=float, default=RunConfig().test.timeout,
                      help="單次推論超時（預設 90 秒）")
    test.add_argument("--concurrency", "-c", type=int, default=RunConfig().test.concurrency,
                      help="並行數（預設 3）")
    test.add_argument("--retry", "-r", type=int, default=RunConfig().test.retry,
                      help="失敗重試次數（預設 0）")
    test.add_argument("--temperature", type=float, default=RunConfig().test.temperature,
                      help="溫度參數（預設 0.0）")
    test.add_argument("--num-predict", type=int, default=RunConfig().test.num_predict,
                      help="最大產生 token 數（預設 32）")

    # 輸出
    output = parser.add_argument_group("輸出")
    output.add_argument("--output", "-o", metavar="PATH",
                        help="結果輸出路徑（JSON 預設）")
    output.add_argument("--csv", metavar="PATH",
                        help="額外輸出 CSV 檔案")
    output.add_argument("--jsonl", metavar="PATH",
                        help="額外輸出 JSONL 檔案")
    output.add_argument("--table", action="store_true",
                        help="以表格格式打印結果到終端")
    output.add_argument("--no-terminal-json", action="store_true",
                        help="關閉終端 JSON 輸出（僅檔案）")
    output.add_argument("--semantic-db", "-sd", metavar="PATH",
                        help="語義圖譜 SQLite 路徑（啟用熵減 Context 管理）")

    # 配置檔
    config_group = parser.add_argument_group("配置檔")
    config_group.add_argument("--config", "-cfg", metavar="PATH",
                              help="從 JSON/YAML 配置檔載入設定")

    # 工具
    util = parser.add_argument_group("工具")
    util.add_argument("--version", action="version", version=f"%(prog)s {APP_VERSION}")
    util.add_argument("--test-tools", action="store_true",
                      help="執行 @tool 裝飾器自測（驗證 Tool Schema 自動生成）")
    util.add_argument("--semantic-stats", action="store_true",
                      help="顯示語義圖譜統計後結束（需搭配 --semantic-db）")

    args = parser.parse_args(argv)

    # 驗證：--health 與其他模式互斥
    if args.health:
        if args.list or args.batch or args.model:
            parser.error("--health 不能與其他模式同時使用")

    return args


def build_run_config(args: argparse.Namespace) -> RunConfig:
    """從 CLI 參數建構 RunConfig。"""
    # 優先載入配置檔
    if args.config:
        cfg = build_config_from_file(args.config)
    else:
        cfg = RunConfig()

    # CLI 覆蓋配置檔
    if args.model:
        cfg.models = args.model

    cfg.test.prompt = args.prompt
    cfg.test.timeout = args.timeout
    cfg.test.concurrency = args.concurrency
    cfg.test.retry = args.retry
    cfg.test.temperature = args.temperature
    cfg.test.num_predict = args.num_predict

    cfg.output.path = args.output or cfg.output.path
    cfg.output.format = OutputFormat.AUTO  # 根據副檔名自動判斷

    # 語義圖譜（CLI 覆蓋配置檔；未指定則沿用配置檔設定 = 停用）
    if args.semantic_db:
        cfg.semantic_db = args.semantic_db

    return cfg


async def resolve_models_async(client: OllamaClient, cfg: RunConfig) -> list[str]:
    """解析最終模型清單（非同步）。"""
    if cfg.models:
        return list(cfg.models)

    # 空 = 取得所有模型
    all_models = await client.list_models()
    return [m.name for m in all_models]


def compute_summary(results: list[TestResult]) -> dict[str, Any]:
    """計算測試摘要。"""
    total = len(results)
    ok = sum(1 for r in results if r.status == Status.OK)
    failed_results = [r for r in results if r.status != Status.OK]

    avg_time = 0.0
    if ok > 0:
        avg_time = sum(
            r.elapsed_seconds for r in results if r.status == Status.OK
        ) / ok

    cache_hits = sum(1 for r in results if r.cache_hit)

    return {
        "total_models": total,
        "success": ok,
        "failed": total - ok,
        "avg_latency_seconds": round(avg_time, 2),
        "cache_hit_count": cache_hits,
        "failures": [
            {"model": r.model, "error": r.error[:200]}
            for r in failed_results
        ],
    }


async def run_batch_async(client: OllamaClient, cfg: RunConfig) -> list[TestResult]:
    """執行批次測試（非同步）。"""
    async with client:
        models = await resolve_models_async(client, cfg)
        if not models:
            logger.warning("沒有模型可測試")
            return []

        runner = ModelTestRunner(client, cfg.test)
        return await runner.run_batch(models, cfg.test.concurrency)


def main(argv: Optional[list[str]] = None) -> int:
    """主入口。返回退出碼。"""
    _setup_console()
    args = parse_args(argv)

    # 健康檢查模式
    if args.health:
        return _run_health_check()

    # 裝飾器自測模式（不需 Ollama 連線）
    if args.test_tools:
        return _run_tool_schema_test()

    # 語義圖譜統計模式（不需 Ollama 連線）
    if args.semantic_stats:
        return _run_semantic_stats(args.semantic_db)

    # 載入配置
    try:
        cfg = build_run_config(args)
    except Exception as e:
        logger.error("配置載入失敗：%s", e)
        return 2

    # 建立客戶端
    try:
        semantic_graph = SemanticGraph(cfg.semantic_db) if cfg.semantic_db else None
        client = OllamaClient(cfg.ollama.host, cfg.ollama.timeout, semantic_graph=semantic_graph)
    except Exception as e:
        logger.error("客戶端建立失敗：%s", e)
        return 3

    # 列出模型模式
    if args.list:
        return _run_list_mode(client, cfg)

    # 批次執行
    try:
        results = asyncio.run(run_batch_async(client, cfg))
    except KeyboardInterrupt:
        logger.warning("使用者中斷")
        return 130
    except Exception as e:
        logger.error("批次測試失敗：%s", e)
        return 6

    if not results:
        return 0

    # 摘要
    summary = compute_summary(results)

    # 終端表格
    if args.table:
        print_summary_table(results)

    # 寫入檔案
    if cfg.output.path:
        writer = ResultWriter(cfg.output)
        writer.write(results, summary)

    # 額外 CSV 輸出
    if args.csv:
        csv_cfg = OutputConfig(format=OutputFormat.CSV, path=args.csv)
        csv_writer = ResultWriter(csv_cfg)
        csv_writer.write(results, summary)

    # 額外 JSONL 輸出
    if args.jsonl:
        jsonl_cfg = OutputConfig(format=OutputFormat.JSONL, path=args.jsonl)
        jsonl_writer = ResultWriter(jsonl_cfg)
        jsonl_writer.write(results, summary)

    # 失敗時輸出錯誤模型
    if summary["failed"] > 0:
        failed_names = [r.model for r in results if r.status != Status.OK]
        logger.warning("失敗模型：%s", ", ".join(failed_names))

    logger.info(
        "完成：%d/%d 正常，平均 %.2fs",
        summary["success"], summary["total_models"], summary["avg_latency_seconds"],
    )

    return 0 if summary["failed"] == 0 else 7


def _run_health_check() -> int:
    """執行增強型健康檢查（含模型數量、最大模型、服務延遲）。"""
    try:
        async def _health() -> dict[str, Any]:
            async with OllamaClient("http://localhost:11434", timeout=5.0) as cli:
                t0 = time.monotonic()
                models = await cli.list_models()
                latency = round((time.monotonic() - t0) * 1000, 1)
                total_size = sum(m.size for m in models)
                largest = max(models, key=lambda m: m.size) if models else None
                return {
                    "ok": True,
                    "model_count": len(models),
                    "total_size_bytes": total_size,
                    "largest_model": largest.name if largest else None,
                    "largest_model_size": largest.size_human() if largest else None,
                    "service_latency_ms": latency,
                }

        result = asyncio.run(_health())
        if result["ok"]:
            print("✅ Ollama 服務運行正常")
            print(f"  模型數量：{result['model_count']} 个")
            print(f"  總佔用空間：{round(result['total_size_bytes'] / 1e9, 2)} GB")
            print(f"  最大模型：{result['largest_model']} ({result['largest_model_size']})")
            print(f"  服務延遲：{result['service_latency_ms']} 毫秒")
            return 0
        else:
            print("❌ Ollama 不可達")
            return 1
    except Exception as e:
        print(f"❌ 健康檢查失敗：{e}")
        return 1


def _run_semantic_stats(db_path: Optional[str]) -> int:
    """顯示語義圖譜統計（不需連線 Ollama）。"""
    if not db_path:
        print("❌ 請搭配 --semantic-db <路徑> 使用 --semantic-stats")
        return 1
    try:
        with SemanticGraph(db_path, create=False) as graph:
            st = graph.stats()
    except FileNotFoundError:
        print(f"❌ 語義圖譜資料庫不存在：{db_path}")
        return 1
    except Exception as e:
        print(f"❌ 讀取語義圖譜失敗：{e}")
        return 1

    print(f"\n{'='*55}")
    print("  語義圖譜統計（Semantic Graph）")
    print(f"{'='*55}")
    print(f"  資料庫　　：{st['db_path']}")
    print(f"  實體數量　：{st['entity_count']}")
    print(f"  關係數量　：{st['relation_count']}")
    if st["recent_entities"]:
        print(f"  最近實體（最新 {len(st['recent_entities'])} 筆）：")
        for e in st["recent_entities"]:
            t = e["type"] or "-"
            print(f"    · [{t}] {e['name']}")
    else:
        print("  （尚無實體記錄）")
    print()
    return 0


def _run_list_mode(client: OllamaClient, cfg: RunConfig) -> int:
    """執行列出模型模式。"""
    try:
        async def _list() -> list[ModelInfo]:
            async with client:
                return await client.list_models()

        models = asyncio.run(_list())
        if not models:
            logger.warning("沒有找到任何模型")
            return 0

        print(f"\n{'='*55}")
        print(f"  本地 Ollama 模型 ({len(models)} 个)")
        print(f"{'='*55}")
        for m in models:
            print(f"  • {m.name:25s} ({m.size_human()})")
        print(f"{'='*55}")
        return 0
    except Exception as e:
        logger.error("列出模型失敗：%s", e)
        return 4


if __name__ == "__main__":
    sys.exit(main())
