# source_origin: AI Station §12 / OA-Team Relay - relay (aligned to Hermes peer)
"""Cross-machine Relay, aligned to the real Hermes bot-mode / `hermes peer`.

Operations mirror the documented surface (bot-mode docs):
  - peer_dm(name, body, profile=None) -> bot-initiated DM across machines
        (real: `hermes peer dm <name>[/<profile>] < /tmp/dm.txt`)
        The message body is delivered VERBATIM — Hermes reads it from a file
        or stdin so nothing is shell-interpreted. We keep that contract:
        the body string is passed through untouched.
  - broadcast(body)                   -> roster-driven multi-peer DM
        (real: "Bots across machines" — the Desktop relay lets cross-machine
         Bots message each other and sit in the same rooms; we model the
         explicit fan-out as a convenience over the relayed roster.)
  - turn_off() / turn_on()            -> "Turning it off"
        (real: Settings -> Plugins -> Bots. We model it as disabling the
         relay connection so no sends occur until re-enabled.)
  - status()                          -> CLI-parity introspection

Transport is injected (InMemoryTransport for tests; plug a real HTTP/WS
client for production). Failures are typed via ``DeliveryReason``.

5T alignment:
  Traceable  - every result carries a trace_id
  Trackable  - enabled flag + name-keyed roster + attempt counts
  Tangible   - DeliveryResult.retryable surfaces for UI / scheduler decisions
  Transparent- reasons are str-enum, serializable, no opaque errors
  Trustworthy- peers are frozen; OFFLINE reason is non-retryable
"""
from typing import Callable, Dict, Optional

from src.incremental.delivery import DeliveryReason, DeliveryResult, Dispatcher
from src.relay.peer import Peer, PeerRegistry


class Transport:
    """Pluggable transport boundary. Swap in-memory for real network at deploy."""

    def send(self, peer: Peer, message: str) -> bytes:
        """Deliver ``message`` to ``peer`` verbatim. Raise on transient failure."""
        raise NotImplementedError


class InMemoryTransport(Transport):
    """Deterministic in-process transport for tests and local relays."""

    def __init__(self) -> None:
        self.sent: Dict[str, list] = {}

    def send(self, peer: Peer, message: str) -> bytes:
        # Body delivered untouched (file/stdin contract).
        self.sent.setdefault(peer.name, []).append(message)
        return b"ack"


class Relay:
    def __init__(
        self,
        registry: PeerRegistry,
        transport: Optional[Transport] = None,
        max_retries: int = 3,
    ) -> None:
        self.registry = registry
        self.transport = transport or InMemoryTransport()
        self._enabled = True
        self._dispatcher = Dispatcher(max_retries=max_retries)

    @property
    def enabled(self) -> bool:
        return self._enabled

    def turn_off(self) -> None:
        """Turning it off: further sends return OFFLINE (non-retryable)."""
        self._enabled = False

    def turn_on(self) -> None:
        self._enabled = True

    def status(self) -> Dict[str, object]:
        return {
            "enabled": self._enabled,
            "peer_count": len(self.registry.list_names()),
            "peers": [p.name for p in self.registry.enabled_peers()],
        }

    def _deliver(self, peer: Optional[Peer], message: str, detail: str = "") -> DeliveryResult:
        if not self._enabled:
            return DeliveryResult.fail(DeliveryReason.OFFLINE, "", "relay off")
        if peer is None:
            return DeliveryResult.fail(
                DeliveryReason.NOT_FOUND, "", "peer not registered"
            )

        def _attempt() -> str:
            return str(self.transport.send(peer, message))

        res = self._dispatcher.deliver(_attempt)
        if detail:
            # Preserve multiplexed profile tag for transparency.
            return DeliveryResult(
                trace_id=res.trace_id,
                reason=res.reason,
                ok=res.ok,
                detail=detail,
                attempts=res.attempts,
            )
        return res

    def peer_dm(self, name: str, body: str, profile: Optional[str] = None) -> DeliveryResult:
        """Bot-initiated DM to a single peer (hermes peer dm).

        Args:
            name: peer name (the `hermes peer add <name>` handle)
            body: message text, delivered verbatim (file/stdin contract)
            profile: optional named profile on a multiplexed peer
                     (the `<peer>/<profile>` syntax)
        """
        peer = self.registry.get(name)
        detail = f"{name}/{profile}" if profile else ""
        return self._deliver(peer, body, detail)

    def broadcast(self, body: str) -> Dict[str, DeliveryResult]:
        """Roster-driven multi-peer DM (Bots across machines, via relay)."""
        return {
            p.name: self._deliver(p, body)
            for p in self.registry.enabled_peers()
        }


if __name__ == "__main__":
    from src.relay.peer import PeerRegistry

    reg = PeerRegistry()
    reg.add(Peer(name="spark", url="http://spark.lan:8377", key="k1"))
    reg.add(Peer(name="beta", url="http://beta.lan:8377", key="k2"))
    r = Relay(reg)
    assert r.peer_dm("spark", "hi\n").ok
    assert r.peer_dm("spark", "hi", profile="researcher").detail == "spark/researcher"
    assert len(r.broadcast("ping").keys()) == 2
    r.turn_off()
    assert r.peer_dm("spark", "x").reason == DeliveryReason.OFFLINE
    print("§12 relay (Hermes-aligned) self-check: PASS")
