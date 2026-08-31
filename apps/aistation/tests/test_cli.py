# source_origin: AI Station §9 - Orchestration Layer
"""RED tests for AI Station CLI / FastAPI entrypoint.

Run with:
    pytest apps/aistation/tests/test_cli.py -v
"""
from __future__ import annotations

import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from fastapi.testclient import TestClient
from src.cli import create_app


def _client() -> TestClient:
    return TestClient(create_app())


def test_health_returns_ok():
    resp = _client().get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("status") == "ok"


def test_v1_generate_returns_visual_and_beats():
    script = (
        "【場景】夜裡的圖書館一片寂靜。\n"
        "【衝突】唯一的出口被封死了。\n"
        "【洞察】安靜是線索，不是空白。"
    )
    resp = _client().post("/v1/generate", json={"script": script, "series": "創價實驗室"})
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert "beat_count" in data
    assert "visual_path" in data
    assert data["beat_count"] == 3


def test_v1_generate_single_beat():
    script = "【場景】深夜的圖書館。"
    resp = _client().post("/v1/generate", json={"script": script})
    assert resp.status_code == 200
    data = resp.json()
    assert data["beat_count"] == 1
    assert os.path.isfile(data["visual_path"])


def test_v1_generate_missing_script_is_rejected():
    resp = _client().post("/v1/generate", params={})
    assert resp.status_code == 422


def test_v1_brand_returns_preset():
    resp = _client().get("/v1/brand")
    assert resp.status_code == 200
    data = resp.json()
    assert data["preset"] == "sushi_dr"
    assert "host" in data
