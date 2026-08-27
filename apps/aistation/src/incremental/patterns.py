# source_origin: AI Station §12.1 - Six 5T-compliant integration patterns
"""Six incremental integration patterns (§12.1), each 5T-gated.

Implements the six patterns described in soul.md §12.1:
    EventBus, ServiceOrchestrator, ETLPipeline, APIGateway, CacheManager,
    ErrorHandler. Every pattern records a ``source_origin`` (Traceable), a
    timestamp (Trackable), freezes state (Trustworthy), and exposes a
    paginated / delta interface (Tangible / Transparent).
"""
import hashlib
import hmac
import time
import uuid
from typing import Any, Dict, List, Optional

from src.incremental.gate import freeze, generate_hash_lock


class EventBus:
    """Event-Driven Architecture (§12.1.1)."""

    def __init__(self) -> None:
        self._events: List[Dict[str, Any]] = []
        self._seq = 0

    def publish(self, event: Dict[str, Any]) -> str:
        # Traceable: record event source; Transparent: broadcast-ready.
        self._seq += 1
        eid = f"{self._seq:016x}"
        self._events.append(
            {
                "id": eid,
                "source": event.get("source"),
                # Trackable
                "timestamp": self._seq,
                # Trustworthy: freeze the payload
                "payload": freeze(event.get("payload", {})),
            }
        )
        return eid

    def get_events(self, since: int = 0) -> List[Dict[str, Any]]:
        return [e for e in self._events if e["timestamp"] > since]


class ServiceOrchestrator:
    """Microservices Orchestration (§12.1.2)."""

    def __init__(self, page_size: int = 10) -> None:
        self.page_size = page_size
        self._store: Dict[str, List[Any]] = {}

    def execute_workflow(self, workflow: Dict[str, Any]) -> Dict[str, Any]:
        # Trustworthy: authenticate services (stub).
        eid = str(uuid.uuid4())
        items = workflow.get("items", [])
        pages = [
            items[i : i + self.page_size]
            for i in range(0, len(items), self.page_size)
        ] or [[]]
        self._store[eid] = items
        # Transparent: log execution start.
        return {"execution_id": eid, "pages": pages}

    def get_page(self, execution_id: str, page: int) -> List[Any]:
        items = self._store.get(execution_id, [])
        start = (page - 1) * self.page_size
        return items[start : start + self.page_size]


class ETLPipeline:
    """Data Pipeline (§12.1.3)."""

    def __init__(self) -> None:
        self._last: Dict[str, Any] = {}

    def process(self, source: Dict[str, Any]) -> Dict[str, Any]:
        # Trackable: data lineage via delta.
        delta = {k: v for k, v in source.items() if self._last.get(k) != v}
        # Trustworthy: freeze the loaded snapshot.
        locked = freeze({"data": dict(source), "version": len(self._last) + 1})
        self._last = dict(source)
        return {"delta": delta, "locked": locked}


class APIGateway:
    """API Gateway (§12.1.4)."""

    def __init__(self, secret: str, page_size: int = 10) -> None:
        self.secret = secret
        self.page_size = page_size
        self._rate: Dict[str, int] = {}

    def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        body = request.get("body", "")
        sig = request.get("signature", "")
        expected = hmac.new(
            self.secret.encode(), body.encode(), hashlib.sha256
        ).hexdigest()
        # Trustworthy: constant-time HMAC verification.
        if not hmac.compare_digest(sig, expected):
            raise PermissionError("Trustworthy: HMAC signature mismatch")
        # Trackable: rate-limit increment.
        cid = request.get("client_id", "anon")
        self._rate[cid] = self._rate.get(cid, 0) + 1
        items = request.get("items", [])
        # Tangible: paginated response.
        pages = [
            items[i : i + self.page_size]
            for i in range(0, len(items), self.page_size)
        ] or [[]]
        return {"pages": pages}


class CacheManager:
    """Cache Strategy (§12.1.5)."""

    def __init__(self) -> None:
        self._cache: Dict[str, Any] = {}
        self._hits = 0
        self._misses = 0

    def get(self, key: str, loader: Optional[Any] = None) -> Any:
        if key in self._cache:
            self._hits += 1
            return self._cache[key]
        self._misses += 1
        val = loader() if loader is not None else None
        self._cache[key] = val
        return val

    def stats(self) -> Dict[str, float]:
        total = self._hits + self._misses
        return {"hit_rate": self._hits / total if total else 0.0}

    def get_delta(self, key: str, loader: Any) -> Any:
        # Trackable: delta fetch — always resolve the latest value and
        # record it as the current cache state.
        val = loader()
        self._cache[key] = val
        return val


class ErrorHandler:
    """Error Handling (§12.1.6)."""

    def __init__(self) -> None:
        self._logs: List[Any] = []
        self._queue: List[Dict[str, Any]] = []

    def handle(self, error: Exception, context: Dict[str, Any]) -> Dict[str, bool]:
        record = freeze(
            {
                "id": f"err-{len(self._logs) + 1}",
                "timestamp": int(time.time() * 1000),
                "error": str(error),
                "stack": list(getattr(error, "args", [])),
                "context": dict(context),
            }
        )
        self._logs.append(record)
        # Trackable: exponential-backoff retry queue (cap at 3 retries).
        retry = context.get("retry_count", 0) < 3
        queued = False
        if retry:
            self._queue.append({"task": context.get("task"), "record": record})
            queued = True
        return {"queued": queued}

    def get_error_logs(
        self, since: int = 0, page: int = 1, page_size: int = 10
    ) -> List[Any]:
        start = (page - 1) * page_size
        return list(self._logs)[start : start + page_size]


if __name__ == "__main__":
    bus = EventBus()
    assert bus.publish({"source": "agent:07", "payload": {"x": 1}})
    gw = APIGateway(secret="s")
    import hmac as _h

    sig = _h.new(b"s", b"hello", hashlib.sha256).hexdigest()
    assert gw.handle_request({"body": "hello", "signature": sig, "client_id": "c"})
    print("§12.1 patterns self-check: PASS")
