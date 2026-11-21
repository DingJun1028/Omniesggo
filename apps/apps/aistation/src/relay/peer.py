# source_origin: AI Station §12 / OA-Team Relay - peer (aligned to `hermes peer`)
"""Peer and peer registry, aligned to the real `hermes peer` CLI.

A ``Peer`` is a connected machine reachable via the Desktop relay. In the
real Hermes model peers are addressed by NAME (not a generated id) and carry
a ``url`` plus an ``API_SERVER_KEY`` for authentication — mirroring:

    hermes peer add spark --url http://spark.lan:8377 --key <API_SERVER_KEY>

The registry is keyed by name (5T: Trackable roster).
"""
from dataclasses import dataclass, field
from typing import Dict, List, Optional


@dataclass(frozen=True)
class Peer:
    """Immutable descriptor of a connected machine (5T: Trustworthy)."""

    name: str
    url: str
    key: str
    enabled: bool = True
    meta: Dict[str, str] = field(default_factory=dict)

    # In the real CLI, lookup is by name; expose peer_id == name for parity.
    @property
    def peer_id(self) -> str:
        return self.name


class PeerRegistry:
    """Local roster of peers, keyed by name (5T: Trackable)."""

    def __init__(self) -> None:
        self._peers: Dict[str, Peer] = {}

    def add(self, peer: Peer) -> None:
        self._peers[peer.name] = peer

    def remove(self, name: str) -> None:
        self._peers.pop(name, None)

    def get(self, name: str) -> Optional[Peer]:
        return self._peers.get(name)

    def list_names(self) -> List[str]:
        return list(self._peers.keys())

    def enabled_peers(self) -> List[Peer]:
        return [p for p in self._peers.values() if p.enabled]
