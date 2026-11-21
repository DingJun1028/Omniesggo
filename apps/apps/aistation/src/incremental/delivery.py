# source_origin: AI Station §12.1.6 / §10.9 - Delivery with typed reasons
"""Typed delivery-failure reasons (§12.1.6, §10.9).

When an outbound delivery (newsletter, webhook, n8n, social post) fails, the
failure is classified into a ``DeliveryReason`` enum member rather than a raw
exception string. Each reason carries a ``retryable`` flag so the dispatcher
can apply exponential-backoff retries ONLY to transient failures.

5T alignment:
  Traceable   - every result carries a ``trace_id`` (UUID)
  Trackable   - reason + retry count are recorded on the result
  Tangible    - ``retryable`` is surfaced for UI / scheduler decisions
  Transparent - reasons are ``str`` enum members, cleanly serializable
  Trustworthy - ``DeliveryResult`` is a frozen dataclass (immutable)
"""
import uuid
from dataclasses import dataclass
from enum import Enum
from typing import Callable, Optional


class DeliveryReason(str, Enum):
    """Typed delivery outcome. Members serialize as their string value."""

    SUCCESS = "success"
    NETWORK_ERROR = "network_error"
    TIMEOUT = "timeout"
    RATE_LIMITED = "rate_limited"
    UNKNOWN = "unknown"
    AUTH_FAILED = "auth_failed"
    NOT_FOUND = "not_found"
    VALIDATION_ERROR = "validation_error"
    OFFLINE = "offline"  # relay explicitly turned off (§12 relay: "turning it off")

    @property
    def retryable(self) -> bool:
        """True only for transient failures; permanent failures are not retried."""
        return self in _RETRYABLE_REASONS


_RETRYABLE_REASONS = frozenset(
    {
        DeliveryReason.NETWORK_ERROR,
        DeliveryReason.TIMEOUT,
        DeliveryReason.RATE_LIMITED,
        DeliveryReason.UNKNOWN,
        # OFFLINE is intentionally NOT retryable: the relay was explicitly
        # turned off, so retries would be wasted work until it is re-enabled.
    }
)


@dataclass(frozen=True)
class DeliveryResult:
    """Immutable outcome of a single delivery attempt sequence."""

    trace_id: str
    reason: DeliveryReason
    ok: bool
    detail: Optional[str] = None
    attempts: int = 1

    @property
    def retryable(self) -> bool:
        return self.reason.retryable

    @classmethod
    def ok(cls, trace_id: str, detail: Optional[str] = None) -> "DeliveryResult":
        return cls(
            trace_id=trace_id, reason=DeliveryReason.SUCCESS, ok=True, detail=detail
        )

    @classmethod
    def fail(
        cls, reason: DeliveryReason, trace_id: str, detail: Optional[str] = None
    ) -> "DeliveryResult":
        return cls(trace_id=trace_id, reason=reason, ok=False, detail=detail)


def _classify(exc: Exception) -> DeliveryReason:
    """Map a raw exception to a typed ``DeliveryReason``."""
    if isinstance(exc, TimeoutError):
        return DeliveryReason.TIMEOUT
    if isinstance(exc, (ConnectionError, ConnectionResetError, BrokenPipeError)):
        return DeliveryReason.NETWORK_ERROR
    if isinstance(exc, PermissionError):
        return DeliveryReason.AUTH_FAILED
    if isinstance(exc, (FileNotFoundError, KeyError)):
        return DeliveryReason.NOT_FOUND
    if isinstance(exc, ValueError):
        return DeliveryReason.VALIDATION_ERROR
    return DeliveryReason.UNKNOWN


class Dispatcher:
    """Delivers a callable, classifying failures and retrying only retryable ones."""

    def __init__(self, max_retries: int = 3, base_backoff_s: float = 0.0):
        self.max_retries = max_retries
        self.base_backoff_s = base_backoff_s

    def deliver(self, fn: Callable, *args, **kwargs) -> DeliveryResult:
        trace_id = str(uuid.uuid4())
        attempts = 0
        last_exc: Optional[Exception] = None

        # initial attempt + max_retries retries
        for attempts in range(1, self.max_retries + 2):
            try:
                result = fn(*args, **kwargs)
                return DeliveryResult.ok(
                    trace_id=trace_id, detail=str(result) if result is not None else None
                )
            except Exception as exc:  # noqa: BLE001 - intentional broad catch
                last_exc = exc
                reason = _classify(exc)
                # Stop early on permanent (non-retryable) failures.
                if not reason.retryable:
                    return DeliveryResult.fail(
                        reason, trace_id, detail=str(exc)
                    )._with_attempts(attempts)
                # Else: loop continues (retry) unless attempts exhausted.
                if attempts > self.max_retries:
                    return DeliveryResult.fail(
                        reason, trace_id, detail=str(exc)
                    )._with_attempts(attempts)

        # Should not reach here, but guard anyway.
        return DeliveryResult.fail(
            _classify(last_exc) if last_exc else DeliveryReason.UNKNOWN,
            trace_id,
            detail=str(last_exc),
        )._with_attempts(attempts)


# Helper: non-frozen override of attempts after construction. Because
# DeliveryResult is frozen, we add a small patching method used ONLY by the
# dispatcher to stamp the attempt count.
def _with_attempts(self: DeliveryResult, attempts: int) -> DeliveryResult:
    return DeliveryResult(
        trace_id=self.trace_id,
        reason=self.reason,
        ok=self.ok,
        detail=self.detail,
        attempts=attempts,
    )


DeliveryResult._with_attempts = _with_attempts  # type: ignore[attr-defined]


if __name__ == "__main__":
    d = Dispatcher(max_retries=2)

    def ok_fn():
        return "sent"

    r = d.deliver(ok_fn)
    assert r.ok and r.reason == DeliveryReason.SUCCESS

    def net_err():
        raise ConnectionError("boom")

    r2 = d.deliver(net_err)
    assert not r2.ok and r2.reason == DeliveryReason.NETWORK_ERROR
    assert r2.attempts == 3  # initial + 2 retries

    def bad():
        raise ValueError("bad payload")

    r3 = d.deliver(bad)
    assert r3.reason == DeliveryReason.VALIDATION_ERROR and r3.attempts == 1
    print("§12.1.6 / §10.9 typed delivery self-check: PASS")
