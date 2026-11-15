#!/usr/bin/env python3
"""
verify-agents-yaml.py — Verify the OA-Team 30-Swarm framework file.

Checks /opt/esggo/agents.yaml against the OA-Team spec:
  1. YAML parses; 30 agents present, unique ids 01-30.
  2. Five squads, exactly 6 agents per squad (MECE).
  3. Every agent carries the full 6-dimension OmniTag set with valid values.
  4. Required-tag rule: every agent has agent:* + lifecycle:* + p*.
  5. Forbidden combinations are not present.
  6. best-practice-awakening 結界 inheritance integrity:
       - inheritance_sources list matches agents tagged best-practice:結界
       - no inheritance-source agent is lifecycle:draft
  7. Canonical `tags` string is consistent with the structured omnitag map.

Usage:  python3 scripts/verify-agents-yaml.py [path-to-agents.yaml]
Exit:   0 on success, 1 on failure.
"""
from __future__ import annotations

import sys
from pathlib import Path

try:
    import yaml
except ImportError:  # pragma: no cover
    print("ERROR: PyYAML is required: python3 -m pip install pyyaml", file=sys.stderr)
    sys.exit(1)

DEFAULT_PATH = Path(__file__).resolve().parent.parent / "agents.yaml"

SQUAD_NAMES = ["智庫聖所", "符文契約", "光之羽翼", "煉金熵減", "5T驗算"]

DIMENSION_VALUES = {
    "security": {"public", "internal", "confidential", "restricted"},
    "lifecycle": {"draft", "active", "frozen", "archived"},
    "priority": {"p0", "p1", "p2", "p3"},
    "platform": {"esggo", "omni", "vps", "firebase", "vercel", "github"},
    "best-practice": {"awakened", "結界", "draft"},
}

REQUIRED_TAG_DIMS = ["agent", "lifecycle", "priority"]

FORBIDDEN_PAIRS = [
    (("lifecycle", "frozen"), ("lifecycle", "active"), "lifecycle:frozen + lifecycle:active"),
    (("security", "public"), ("security", "restricted"), "security:public + security:restricted"),
    (("priority", "p0"), ("priority", "p3"), "p0 + p3"),
    (("best-practice", "awakened"), ("lifecycle", "draft"), "best-practice:awakened + lifecycle:draft"),
    (("best-practice", "結界"), ("lifecycle", "draft"), "best-practice:結界 + lifecycle:draft"),
]

CORE_DIM_ORDER = ["security", "agent", "squad", "lifecycle", "priority", "platform", "best-practice"]


def _failures() -> list[str]:
    path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PATH
    if not path.exists():
        return [f"agents.yaml not found at {path}"]

    try:
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    except yaml.YAMLError as exc:
        return [f"YAML parse error: {exc}"]

    errors: list[str] = []
    agents = doc.get("agents", [])
    squads = doc.get("squads", [])

    # --- 1. 30 agents, unique ids 01-30 -------------------------------
    ids = [a.get("id") for a in agents]
    if len(agents) != 30:
        errors.append(f"expected 30 agents, found {len(agents)}")
    if len(set(ids)) != len(ids):
        errors.append("duplicate agent ids found")
    expected_ids = [f"{i:02d}" for i in range(1, 31)]
    if sorted(ids) != sorted(expected_ids):
        errors.append(f"agent ids must be 01..30, got {sorted(ids)}")

    # --- 2. five squads, 6 agents per squad ----------------------------
    if len(squads) != 5:
        errors.append(f"expected 5 squads, found {len(squads)}")
    squad_counts: dict[str, int] = {}
    for a in agents:
        squad = a.get("squad", "<missing>")
        squad_counts[squad] = squad_counts.get(squad, 0) + 1
    for name in SQUAD_NAMES:
        if squad_counts.get(name) != 6:
            errors.append(f"squad {name} must have exactly 6 agents, found {squad_counts.get(name)}")

    # --- 3. full OmniTag dimension set with valid values ---------------
    for a in agents:
        tag = a.get("omnitag", {})
        for dim in CORE_DIM_ORDER:
            if dim not in tag:
                errors.append(f"agent {a.get('id')}: missing omnitag.{dim}")
                continue
            value = tag[dim]
            if dim in DIMENSION_VALUES and value not in DIMENSION_VALUES[dim]:
                errors.append(f"agent {a.get('id')}: invalid omnitag.{dim} value {value!r}")
        if tag.get("squad") not in SQUAD_NAMES:
            errors.append(f"agent {a.get('id')}: invalid squad {tag.get('squad')!r}")

    # --- 4. required-tag rule: agent:* + lifecycle:* + p* ---------------
    for a in agents:
        tag = a.get("omnitag", {})
        for dim in REQUIRED_TAG_DIMS:
            if not tag.get(dim):
                errors.append(f"agent {a.get('id')}: required OmniTag dimension missing: {dim}")

    # --- 5. forbidden combinations --------------------------------------
    for a in agents:
        tag = a.get("omnitag", {})
        got = {(dim, tag.get(dim)) for dim in DIMENSION_VALUES}
        for pair_a, pair_b, label in FORBIDDEN_PAIRS:
            if pair_a in got and pair_b in got:
                errors.append(f"agent {a.get('id')}: forbidden combination {label}")

    # --- 6. 結界 inheritance integrity ----------------------------------
    bpa = doc.get("best_practice_awakening", {})
    inheritance_block = bpa.get("inheritance", {})
    inheritance_sources = set(
        bpa.get("inheritance_sources", inheritance_block.get("inheritance_sources", []))
    )
    tagged_sources = {a.get("id") for a in agents if a.get("omnitag", {}).get("best-practice") == "結界"}
    if inheritance_sources != tagged_sources:
        errors.append(
            f"inheritance_sources {sorted(inheritance_sources)} do not match agents "
            f"tagged best-practice:結界 {sorted(tagged_sources)}"
        )
    for agent_id in inheritance_sources:
        agent = next((a for a in agents if a.get("id") == agent_id), None)
        if agent is None:
            errors.append(f"inheritance source agent {agent_id} not defined")
            continue
        if agent.get("omnitag", {}).get("lifecycle") == "draft":
            errors.append(f"inheritance source agent {agent_id} must not be lifecycle:draft")

    # --- 7. canonical tags string consistency ----------------------------
    for a in agents:
        t = a.get("omnitag", {})
        if any(dim not in t for dim in CORE_DIM_ORDER):
            continue  # missing dims already reported in checks 3/4
        expected_core = "".join(
            f"[{dim}:{t[dim]}]" if dim in ("security", "agent", "squad", "lifecycle", "platform", "best-practice")
            else f"[{t[dim]}]"
            for dim in CORE_DIM_ORDER
        )
        actual = a.get("tags", "")
        if not actual.startswith(expected_core):
            errors.append(
                f"agent {a.get('id')}: canonical tags string mismatch\n"
                f"  expected prefix: {expected_core}\n"
                f"  actual:          {actual}"
            )

    return errors


def main() -> int:
    errors = _failures()
    if not errors:
        path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PATH
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
        bpa = doc.get("best_practice_awakening", {})
        sources = bpa.get("inheritance_sources", bpa.get("inheritance", {}).get("inheritance_sources", []))
        print("OK: agents.yaml conforms to OA-Team 30-Swarm + OmniTag + 結界 inheritance")
        print(f"    file: {path}")
        print(f"    agents: 30 | squads: 5 | inheritance sources: {len(sources)} ({', '.join(sources)})")
        return 0
    print("FAIL: agents.yaml verification errors:", file=sys.stderr)
    for err in errors:
        print(f"  - {err}", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
