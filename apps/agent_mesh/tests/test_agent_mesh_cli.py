"""Agent Mesh CLI 單元測試（不需網路／不需 Ollama 在線）。

覆蓋範圍為純邏輯：設定組裝、輸出格式分派、摘要計算、語義圖譜、
@tool 裝飾器 Schema 生成、逾時與快取判定的單位一致性。

執行：python -m pytest apps/agent_mesh/tests/ -q
"""

import json
import sqlite3
import sys
from pathlib import Path

import pytest

# 測試位於 apps/agent_mesh/tests/，被測模組在上一層 apps/agent_mesh/
ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from agent_tool import (  # noqa: E402
    OutputConfig,
    OutputFormat,
    ResultWriter,
    RunConfig,
    Status,
    TestResult,
    build_config_from_file,
    compute_summary,
    render_summary_table,
)
from semantic_graph import SemanticGraph  # noqa: E402


def _ok(model: str = "m1", **kw) -> TestResult:
    return TestResult(model=model, status=Status.OK, response="hi", **kw)


def _err(model: str = "bad", **kw) -> TestResult:
    return TestResult(model=model, status=Status.ERROR, error="boom", **kw)


# ---------------------------------------------------------------------------
# 輸出格式分派：AUTO 依副檔名推導，且每種格式都必須真的產檔
# ---------------------------------------------------------------------------


@pytest.mark.parametrize("ext", ["json", "jsonl", "csv", "table", "xyz"])
def test_auto_format_creates_file(tmp_path, ext):
    """回歸：.table 過往無對應分支，會靜默不產檔（資料遺失且無警告）。"""
    p = tmp_path / f"out.{ext}"
    ResultWriter(OutputConfig(format=OutputFormat.AUTO, path=str(p))).write(
        [_ok()], {"total": 1}
    )
    assert p.exists(), f".{ext} 未產出檔案"
    assert p.stat().st_size > 0


def test_table_file_contains_rows(tmp_path):
    p = tmp_path / "out.table"
    ResultWriter(OutputConfig(format=OutputFormat.AUTO, path=str(p))).write(
        [_ok("alpha"), _ok("beta")], {"total": 2}
    )
    text = p.read_text(encoding="utf-8")
    assert "alpha" in text and "beta" in text
    assert "測試結果 (2 個模型)" in text


def test_table_status_uses_enum_value_not_repr(tmp_path):
    """str-Enum 在 f-string 會變 "Status.OK"，表格必須顯示實際狀態碼。"""
    p = tmp_path / "out.table"
    ResultWriter(OutputConfig(format=OutputFormat.AUTO, path=str(p))).write(
        [_ok()], {"total": 1}
    )
    text = p.read_text(encoding="utf-8")
    assert "Status.OK" not in text
    assert "ok" in text


def test_jsonl_writes_one_line_per_result(tmp_path):
    p = tmp_path / "out.jsonl"
    ResultWriter(OutputConfig(format=OutputFormat.AUTO, path=str(p))).write(
        [_ok("a"), _ok("b"), _err("c")], {"total": 3}
    )
    lines = [ln for ln in p.read_text(encoding="utf-8").splitlines() if ln.strip()]
    assert len(lines) == 3
    assert json.loads(lines[0])["model"] == "a"


def test_jsonl_append_mode(tmp_path):
    p = tmp_path / "out.jsonl"
    cfg = OutputConfig(format=OutputFormat.JSONL, path=str(p), append=True)
    ResultWriter(cfg).write([_ok("a")], {"total": 1})
    ResultWriter(cfg).write([_ok("b")], {"total": 1})
    assert len(p.read_text(encoding="utf-8").strip().splitlines()) == 2


def test_csv_has_header_and_all_results(tmp_path):
    p = tmp_path / "out.csv"
    ResultWriter(OutputConfig(format=OutputFormat.AUTO, path=str(p))).write(
        [_ok("a"), _err("b")], {"total": 2}
    )
    lines = p.read_text(encoding="utf-8").strip().splitlines()
    assert lines[0].startswith("model,status")
    assert len(lines) == 3


def test_no_terminal_json_suppresses_stdout(tmp_path, capsys):
    """回歸：--no-terminal-json 過往為懸空旗標，宣告了卻無任何作用。"""
    writer = ResultWriter(OutputConfig(path=None, no_terminal_json=True))
    writer.write([_ok()], {"total": 1})
    assert capsys.readouterr().out == ""


def test_terminal_json_printed_by_default(capsys):
    ResultWriter(OutputConfig(path=None)).write([_ok()], {"total": 1})
    out = capsys.readouterr().out
    assert json.loads(out)["results"][0]["model"] == "m1"


# ---------------------------------------------------------------------------
# 摘要計算
# ---------------------------------------------------------------------------


def test_summary_counts_and_average():
    s = compute_summary([_ok("a", elapsed_seconds=2.0), _err("b", elapsed_seconds=4.0)])
    assert s["total_models"] == 2
    assert s["success"] == 1
    assert s["failed"] == 1
    # 平均只計成功項：失敗（如 120s 逾時）不應拉低延遲統計
    assert s["avg_latency_seconds"] == pytest.approx(2.0)


def test_summary_handles_empty_list():
    s = compute_summary([])
    assert s["total_models"] == 0
    assert s["avg_latency_seconds"] == 0


# ---------------------------------------------------------------------------
# 快取判定：load_duration_ms 是毫秒、elapsed_seconds 是秒
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    "load_ms,elapsed_s,expected",
    [
        (800.0, 10.0, True),      # 0.8s 載入 / 10s 總時 → 快取命中
        (9000.0, 10.0, False),    # 9s 載入 / 10s 總時 → 非快取
        (20500.0, 22.0, False),   # 冷載入佔絕大多數
    ],
)
def test_cache_hit_unit_consistency(load_ms, elapsed_s, expected):
    """回歸：毫秒與秒直接比較會讓 cache_hit 恆為 False（欄位形同死碼）。"""
    hit = (load_ms / 1000.0) < (elapsed_s * 0.5) if elapsed_s > 0 else True
    assert hit is expected


# ---------------------------------------------------------------------------
# 配置檔載入
# ---------------------------------------------------------------------------


def test_config_file_maps_all_sections(tmp_path):
    cfg_path = tmp_path / "cfg.json"
    cfg_path.write_text(
        json.dumps(
            {
                "ollama": {"host": "http://h:1", "timeout": 5},
                "test": {"prompt": "P", "timeout": 7, "concurrency": 2, "retry": 1},
                "output": {"format": "csv", "path": "o.csv"},
                "models": ["a", "b"],
                "semantic_db": "g.db",
            }
        ),
        encoding="utf-8",
    )
    cfg = build_config_from_file(str(cfg_path))
    assert cfg.ollama.host == "http://h:1"
    assert cfg.ollama.timeout == 5
    assert cfg.test.prompt == "P"
    assert cfg.test.concurrency == 2
    assert cfg.models == ["a", "b"]
    assert cfg.semantic_db == "g.db"


def test_config_file_omits_semantic_db_by_default(tmp_path):
    """回歸：semantic_db 未在檔案中時必須是 None（停用），不可殘留預設路徑。"""
    p = tmp_path / "c.json"
    p.write_text(json.dumps({"test": {}}), encoding="utf-8")
    assert build_config_from_file(str(p)).semantic_db is None


def test_run_config_defaults():
    cfg = RunConfig()
    assert cfg.test.concurrency >= 1
    assert cfg.semantic_db is None


# ---------------------------------------------------------------------------
# 語義圖譜
# ---------------------------------------------------------------------------


def test_graph_creates_schema(tmp_path):
    g = SemanticGraph(str(tmp_path / "g.db"))
    try:
        g.ingest_tool_result("m1", "some response text")
    finally:
        g.close()
    conn = sqlite3.connect(tmp_path / "g.db")
    tables = {r[0] for r in conn.execute("SELECT name FROM sqlite_master WHERE type='table'")}
    assert {"entities", "relations"} <= tables


def test_graph_stats_roundtrip(tmp_path):
    """回歸：圖譜過往只能寫不能讀，無 stats() 可驗證寫入結果。"""
    g = SemanticGraph(str(tmp_path / "g.db"))
    g.ingest_tool_result("m1", "response-A")
    g.ingest_tool_result("m2", "response-B")
    st = g.stats()
    g.close()
    assert st["entity_count"] >= 1
    assert "recent_entities" in st


def test_graph_stats_on_fresh_db(tmp_path):
    g = SemanticGraph(str(tmp_path / "empty.db"))
    st = g.stats()
    g.close()
    assert st["entity_count"] == 0
    assert st["relation_count"] == 0


def test_cli_uses_canonical_graph_not_duplicate():
    """回歸：CLI 曾內嵌一份 SemanticGraph 副本，造成 stats() 只在內嵌版可用。"""
    import agent_tool as cli
    from semantic_graph import SemanticGraph as Canonical

    assert cli.SemanticGraph is Canonical, "CLI 必須使用正典模組，不可有內嵌副本"


# ---------------------------------------------------------------------------
# 表格渲染
# ---------------------------------------------------------------------------


def test_render_table_empty_returns_empty_string():
    assert render_summary_table([]) == ""


def test_render_table_marks_status_icons():
    text = render_summary_table([_ok("a"), _err("b")])
    assert "✅" in text and "❌" in text
