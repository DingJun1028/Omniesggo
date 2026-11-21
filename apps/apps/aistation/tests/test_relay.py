# source_origin: AI Station §12 / OA-Team Relay - aligned to Hermes `hermes peer`
"""RED/GREEN tests for the cross-machine Relay, aligned to Hermes `hermes peer`.

Mirrors the real Hermes bot-mode surface:
  - peer add <name> --url <url> --key <API_SERVER_KEY>
  - peer list
  - peer dm <peer> [/<profile>] < message (stdin / file, never shell-evaluated)
  - broadcast -> roster-driven multi-peer DM (Bots across machines, via relay)
  - turn_off -> disable the relay connection (Settings -> Plugins -> Bots)

Run with:  pytest apps/aistation/tests/test_relay.py
"""
import os
import sys

# Make the aistation project root importable regardless of CWD.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.relay.peer import Peer, PeerRegistry
from src.relay.relay import Relay
from src.relay.cli import build_parser, dispatch
from src.incremental.delivery import DeliveryReason


def _make_relay():
    reg = PeerRegistry()
    reg.add(Peer(name="spark", url="http://spark.lan:8377", key="k1"))
    reg.add(Peer(name="beta", url="http://beta.lan:8377", key="k2"))
    return Relay(registry=reg)


def test_peer_constructed_with_name_url_key():
    p = Peer(name="spark", url="http://spark.lan:8377", key="abc")
    assert p.name == "spark"
    assert p.url == "http://spark.lan:8377"
    assert p.key == "abc"
    # No bare peer_id in the real CLI model; lookup is by name.
    assert p.peer_id == "spark"


def test_peer_registry_add_list_by_name():
    reg = PeerRegistry()
    reg.add(Peer(name="spark", url="http://x", key="k"))
    assert reg.get("spark").url == "http://x"
    assert reg.list_names() == ["spark"]
    reg.remove("spark")
    assert reg.get("spark") is None


def test_peer_dm_sends_message_body_unmodified():
    relay = _make_relay()
    res = relay.peer_dm("spark", "hello across machines\n")
    assert res.ok is True
    assert res.reason == DeliveryReason.SUCCESS
    assert res.trace_id  # Traceable
    # Body is delivered verbatim (Hermes: file/stdin, nothing shell-interpreted)
    assert relay.transport.sent["spark"] == ["hello across machines\n"]


def test_peer_dm_named_profile_multiplexed():
    relay = _make_relay()
    res = relay.peer_dm("spark", "hi", profile="researcher")
    assert res.ok is True
    assert res.detail == "spark/researcher"


def test_broadcast_sends_to_all_peers():
    relay = _make_relay()
    results = relay.broadcast("ping all bots")
    assert set(results.keys()) == {"spark", "beta"}
    assert all(r.ok for r in results.values())


def test_turn_off_makes_sends_return_offline():
    relay = _make_relay()
    relay.turn_off()
    assert relay.enabled is False
    res = relay.peer_dm("spark", "should fail")
    assert res.ok is False
    assert res.reason == DeliveryReason.OFFLINE
    assert res.retryable is False


def test_send_retries_transient_failure_via_dispatcher():
    relay = _make_relay()
    calls = {"n": 0}

    def flaky_transport(peer, message):
        calls["n"] += 1
        if calls["n"] < 2:
            raise ConnectionError("blip")
        return b"ack"

    relay.transport.send = flaky_transport
    res = relay.peer_dm("spark", "retry me")
    assert res.ok is True
    assert calls["n"] == 2  # one failure + one success (retryable)


def test_cli_parity_peer_dm_dispatches_to_relay():
    relay = _make_relay()
    parser = build_parser()
    args = parser.parse_args(["peer", "dm", "spark", "--body", "hi"])
    out = dispatch(args, relay=relay)
    assert out.ok is True
    assert out.reason == DeliveryReason.SUCCESS


def test_cli_parity_peer_add_registers_peer():
    relay = Relay(PeerRegistry())
    parser = build_parser()
    args = parser.parse_args(
        ["peer", "add", "spark", "--url", "http://spark.lan:8377", "--key", "k1"]
    )
    dispatch(args, relay=relay)
    assert relay.registry.get("spark").url == "http://spark.lan:8377"


def test_cli_parity_off_then_send_offline():
    relay = _make_relay()
    parser = build_parser()
    dispatch(parser.parse_args(["off"]), relay=relay)
    assert relay.enabled is False
    res = dispatch(parser.parse_args(["peer", "dm", "spark", "--body", "x"]), relay=relay)
    assert res.reason == DeliveryReason.OFFLINE
