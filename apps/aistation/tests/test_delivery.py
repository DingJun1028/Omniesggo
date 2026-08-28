# source_origin: AI Station §12.1.6 / §10.9 - Delivery with typed reasons
"""RED/GREEN tests for typed delivery-failure reasons (§12.1.6, §10.9).

Run with:  pytest apps/aistation/tests/test_delivery.py
"""
import os
import sys

# Make the aistation project root importable regardless of CWD.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.incremental.delivery import (
    DeliveryReason,
    DeliveryResult,
    Dispatcher,
)


def test_delivery_reason_is_string_enum_with_retry_flags():
    # Every reason must be a str enum so it serializes cleanly (Transparent).
    assert DeliveryReason.NETWORK_ERROR == "network_error"
    assert DeliveryReason.AUTH_FAILED == "auth_failed"
    # Retryable reasons: transient failures only.
    assert DeliveryReason.NETWORK_ERROR.retryable is True
    assert DeliveryReason.RATE_LIMITED.retryable is True
    assert DeliveryReason.TIMEOUT.retryable is True
    assert DeliveryReason.UNKNOWN.retryable is True
    # Non-retryable: caller error / permanent failure.
    assert DeliveryReason.AUTH_FAILED.retryable is False
    assert DeliveryReason.NOT_FOUND.retryable is False
    assert DeliveryReason.VALIDATION_ERROR.retryable is False


def test_success_result_carries_reason_success():
    res = DeliveryResult.ok(trace_id="t1")
    assert res.ok is True
    assert res.reason == DeliveryReason.SUCCESS
    assert res.trace_id == "t1"


def test_dispatcher_maps_exception_to_typed_reason():
    d = Dispatcher()

    def boom_network():
        raise ConnectionError("down")

    res = d.deliver(boom_network)
    assert res.ok is False
    assert res.reason == DeliveryReason.NETWORK_ERROR
    assert res.retryable is True
    assert res.trace_id  # Traceable

    def boom_auth():
        raise PermissionError("401")

    res2 = d.deliver(boom_auth)
    assert res2.reason == DeliveryReason.AUTH_FAILED
    assert res2.retryable is False


def test_dispatcher_retries_only_retryable_reasons():
    d = Dispatcher(max_retries=3)
    calls = {"n": 0}

    def flaky():
        calls["n"] += 1
        if calls["n"] < 3:
            raise TimeoutError("slow")
        return "sent"

    res = d.deliver(flaky)
    assert res.ok is True
    assert calls["n"] == 3  # retried twice then succeeded

    calls2 = {"n": 0}

    def permanent():
        calls2["n"] += 1
        raise ValueError("bad payload")

    res2 = d.deliver(permanent)
    assert res2.ok is False
    assert res2.reason == DeliveryReason.VALIDATION_ERROR
    assert calls2["n"] == 1  # NOT retried (non-retryable)


def test_dispatcher_exhausts_retries_then_reports_reason():
    d = Dispatcher(max_retries=2)
    calls = {"n": 0}

    def always_down():
        calls["n"] += 1
        raise ConnectionError("boom")

    res = d.deliver(always_down)
    assert res.ok is False
    assert res.reason == DeliveryReason.NETWORK_ERROR
    assert calls["n"] == 3  # initial + 2 retries
