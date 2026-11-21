# source_origin: AI Station §12.1 - Six 5T-compliant integration patterns
"""RED/GREEN tests for the six incremental integration patterns (§12.1).

Run with:  pytest apps/aistation/tests/test_patterns.py
"""
import os
import sys

# Make the aistation project root importable regardless of CWD.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.incremental.patterns import (
    APIGateway,
    CacheManager,
    ETLPipeline,
    ErrorHandler,
    EventBus,
    ServiceOrchestrator,
)


def test_event_bus_publish_traceable_and_delta():
    bus = EventBus()
    eid = bus.publish({"source": "agent:07", "payload": {"x": 1}})
    assert isinstance(eid, str) and len(eid) == 16
    evs = bus.get_events(since=0)
    assert len(evs) == 1
    assert evs[0]["source"] == "agent:07"


def test_service_orchestrator_paginated():
    orch = ServiceOrchestrator(page_size=10)
    wf = {"name": "w1", "services": ["a"], "items": list(range(25))}
    res = orch.execute_workflow(wf)
    assert len(res["pages"]) == 3
    assert res["pages"][0] == list(range(10))
    page2 = orch.get_page(res["execution_id"], 2)
    assert page2 == list(range(10, 20))


def test_etl_pipeline_delta_output():
    etl = ETLPipeline()
    out1 = etl.process({"a": 1, "b": 2})
    assert out1["delta"] == {"a": 1, "b": 2}  # first run = full snapshot
    out2 = etl.process({"a": 1, "b": 20})
    assert out2["delta"] == {"b": 20}  # only changed keys
    assert out2["locked"]["data"]["b"] == 20


def test_api_gateway_hmac_and_paginate():
    import hashlib
    import hmac

    import pytest

    gw = APIGateway(secret="s")
    body = "hello"
    sig = hmac.new(b"s", body.encode(), hashlib.sha256).hexdigest()
    res = gw.handle_request(
        {"body": body, "signature": sig, "client_id": "c1", "items": list(range(5))}
    )
    assert res["pages"] == [list(range(5))]
    with pytest.raises(PermissionError):
        gw.handle_request({"body": body, "signature": "bad", "client_id": "c1"})


def test_cache_manager_delta_fetch_and_stats():
    cm = CacheManager()
    assert cm.get("k", lambda: {"data": 1, "version": 1}) == {"data": 1, "version": 1}
    assert cm.get("k") == {"data": 1, "version": 1}  # cache hit
    assert cm.stats()["hit_rate"] == 0.5
    # version unchanged -> returns existing cached data (no refetch)
    assert cm.get_delta("k", lambda: 1) == 1


def test_error_handler_freeze_and_retry():
    eh = ErrorHandler()
    res = eh.handle(ValueError("boom"), {"task": "t1", "retry_count": 0})
    assert res["queued"] is True
    res2 = eh.handle(ValueError("boom2"), {"task": "t2", "retry_count": 3})
    assert res2["queued"] is False
    logs = eh.get_error_logs(page=1, page_size=10)
    assert len(logs) == 2
