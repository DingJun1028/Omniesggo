# source_origin: AI Station §12 - Incremental Output Optimization
"""RED tests for the Incremental Output Optimizer (§12.0).

Run with:  pytest apps/aistation/tests/test_optimizer.py
"""
import os
import sys

# Make the aistation project root importable regardless of CWD.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.incremental.optimizer import (
    CDN_CACHE_TTL,
    IncrementalOutputOptimizer,
    StreamBuffer,
)


def test_chunked_process_respects_batch_size_100():
    opt = IncrementalOutputOptimizer()
    items = list(range(250))
    batches = list(opt.chunked_process(items, batch_size=100))
    assert [len(b) for b in batches] == [100, 100, 50]
    assert sum(len(b) for b in batches) == 250


def test_stream_buffer_caps_at_1mb():
    buf = StreamBuffer(max_bytes=1_000_000)
    big = b"x" * 200_000
    for _ in range(10):
        buf.append(big)
    # Buffer must never grow unbounded; at most one overshoot chunk above cap.
    assert buf.size() <= 1_000_000 + 200_000


def test_compress_decompress_roundtrip_and_shrinks():
    opt = IncrementalOutputOptimizer()
    payload = b"AI Station incremental output " * 500  # repetitive -> compressible
    compressed = opt.compress(payload)
    assert len(compressed) < len(payload) * 0.5  # ~70% reduction target
    assert opt.decompress(compressed) == payload


def test_paginate_page_size_10():
    opt = IncrementalOutputOptimizer()
    items = list(range(25))
    page1, total_pages, total = opt.paginate(items, page_size=10, page=1)
    assert total == 25 and total_pages == 3
    assert page1 == list(range(10))
    page3, _, _ = opt.paginate(items, page_size=10, page=3)
    assert page3 == [20, 21, 22, 23, 24]


def test_delta_sync_returns_only_changes():
    opt = IncrementalOutputOptimizer()
    old = {"a": 1, "b": 2, "c": 3}
    new = {"a": 1, "b": 20, "c": 3, "d": 4}
    delta = opt.delta_sync(old, new)
    assert delta == {"b": 20, "d": 4}


def test_cdn_cache_ttl_is_300_seconds():
    assert CDN_CACHE_TTL == 300


def test_optimize_pipeline_chunk_then_compress_then_paginate():
    opt = IncrementalOutputOptimizer()
    items = [{"id": i, "text": f"item-{i}"} for i in range(95)]
    # End-to-end: chunk -> 5T seam (hash lock) -> paginate.
    pages = opt.optimize(items, chunk_size=100, page_size=10)
    assert len(pages) == 10  # 95 items / 10 per page
    flat = [doc for page in pages for doc in page["items"]]
    assert len(flat) == 95
    assert all("hash_lock" in doc for doc in flat)
