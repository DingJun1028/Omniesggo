# source_origin: AI Station §12 / OA-Team Relay - CLI parity (aligned)
"""CLI parity for the Relay, aligned to the real `hermes` bot-mode surface.

Subcommands mirror the documented CLI:
  peer add <name> --url <url> --key <API_SERVER_KEY>
  peer list
  peer dm <name> [/<profile>] --body <text>
  broadcast --body <text>        (Bots across machines convenience)
  off                            (Turning it off)
  status

Returns a ``DeliveryResult`` for send/broadcast, or None for introspection
commands (which print). Library and CLI share the same dispatch logic.
"""
import argparse
from typing import List, Optional

from src.relay.peer import Peer, PeerRegistry
from src.relay.relay import InMemoryTransport, Relay
from src.incremental.delivery import DeliveryReason, DeliveryResult


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(prog="aistation-relay", description="OA-Team cross-machine relay (hermes peer aligned)")
    sub = parser.add_subparsers(dest="command", required=True)

    p_peer = sub.add_parser("peer", help="Manage peers (hermes peer)")
    peer_sub = p_peer.add_subparsers(dest="peer_cmd", required=True)

    p_add = peer_sub.add_parser("add", help="Register a peer")
    p_add.add_argument("name", help="peer handle (e.g. spark)")
    p_add.add_argument("--url", required=True, help="peer URL (e.g. http://spark.lan:8377)")
    p_add.add_argument("--key", required=True, help="API_SERVER_KEY for the peer")

    peer_sub.add_parser("list", help="List registered peers")

    p_dm = peer_sub.add_parser("dm", help="DM a peer (hermes peer dm)")
    p_dm.add_argument("name", help="peer name, optionally name/profile")
    p_dm.add_argument("--body", required=True, help="message body (verbatim)")

    p_bcast = sub.add_parser("broadcast", help="DM all peers (Bots across machines)")
    p_bcast.add_argument("--body", required=True, help="message body")

    sub.add_parser("off", help="Turn the relay off (Turning it off)")
    sub.add_parser("status", help="Show relay status")

    return parser


def dispatch(args, relay: Optional[Relay] = None) -> Optional[DeliveryResult]:
    """Execute a parsed CLI command against ``relay``.

    When ``relay`` is None a throwaway in-memory relay is created (CLI parity:
    same surface, isolated state). Returns a ``DeliveryResult`` for send/bcast,
    or None for introspection commands (which print instead).
    """
    r = relay or Relay(PeerRegistry(), InMemoryTransport())

    if args.command == "peer":
        if args.peer_cmd == "add":
            r.registry.add(Peer(name=args.name, url=args.url, key=args.key))
            print(f"peer added: {args.name} ({args.url})")
            return None
        if args.peer_cmd == "list":
            print("peers:", r.registry.list_names())
            return None
        if args.peer_cmd == "dm":
            name = args.name.split("/")[0]
            profile = args.name.split("/")[1] if "/" in args.name else None
            return r.peer_dm(name, args.body, profile=profile)

    if args.command == "broadcast":
        return r.broadcast(args.body).get(
            r.status()["peers"][0]
        ) if r.status()["peers"] else DeliveryResult.fail(
            DeliveryReason.NOT_FOUND, "", "no peers"
        )

    if args.command == "off":
        r.turn_off()
        print("relay turned OFF")
        return None

    if args.command == "status":
        print(r.status())
        return None

    return None


def main(argv: Optional[List[str]] = None) -> None:
    parser = build_parser()
    args = parser.parse_args(argv)
    res = dispatch(args)
    if res is not None:
        print(f"delivery ok={res.ok} reason={res.reason.value} retryable={res.retryable}")


if __name__ == "__main__":
    main(["off"])
    main(["status"])
