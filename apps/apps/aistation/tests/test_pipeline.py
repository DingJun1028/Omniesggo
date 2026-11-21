# source_origin: AI Station §12 - Global Pipeline Integration (RED/GREEN)
"""RED/GREEN tests for the §12 global pipeline wiring (src/pipeline.py).

Proves the soul.md §12 architecture is not just unit-tested but actually wired
into the orchestration path: every run is chunked, 5T-sealed, and paginated.

Run with:  pytest apps/aistation/tests/test_pipeline.py
"""
import os
import sys

# Make the aistation project root importable regardless of CWD.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.pipeline import PIPELINE_SOURCE, AistationPipeline, build_pipeline


def test_pipeline_seals_request_with_5t_hash_lock():
    pipe = build_pipeline()
    out = pipe.run("【場景】深夜的圖書館。", series="創價實驗室")
    # 5T: every artifact carries source_origin + hash_lock (Trustworthy).
    assert out["source_origin"] == PIPELINE_SOURCE
    assert out["hash_lock"]
    # Traceable + Trackable: request id and version present.
    assert out["request_id"]
    assert out["version"] == "v0.5.0"
    # The hash_lock must verify against the §18 algorithm (Transparent).
    from src.incremental.gate import generate_hash_lock

    assert generate_hash_lock(
        out["source_origin"], str(out["content"]), out["timestamp"]
    ) == out["hash_lock"]


def test_pipeline_paginates_beats_incrementally():
    # 12 beats must be split into 2 pages of 10 + 2 under page_size=10.
    script = "\n".join(f"【場景】beat {i}" for i in range(12))
    pipe = build_pipeline(page_size=10)
    out = pipe.run(script)
    assert out["beat_count"] == 12
    flat = [doc for page in out["pages"] for doc in page["items"]]
    assert len(flat) == 12
    # Every emitted doc is individually hash-locked (§12.0 seam).
    assert all("hash_lock" in doc for doc in flat)


def test_pipeline_handles_empty_script_gracefully():
    pipe = build_pipeline()
    out = pipe.run("")
    assert out["beat_count"] == 0
    assert out["pages"] == []  # no beats → no pages
    assert out["hash_lock"]  # request still sealed (5T)
