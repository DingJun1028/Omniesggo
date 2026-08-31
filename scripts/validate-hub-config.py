#!/usr/bin/env python3
"""Validate esggo-hub config.yaml structure and file references."""
from __future__ import annotations

import os
import sys
from pathlib import Path

try:
    import yaml
except ImportError:
    print("ERROR: PyYAML is required. Install with: pip install pyyaml")
    sys.exit(1)


def main() -> int:
    repo_root = Path(__file__).resolve().parent.parent
    config_path = Path(os.environ.get("ESGGO_HUB_CONFIG", repo_root / "docs/hub/config.example.yaml"))

    if not config_path.exists():
        print(f"ERROR: config not found: {config_path}")
        return 1

    with open(config_path, "r", encoding="utf-8") as f:
        data = yaml.safe_load(f)

    errors: list[str] = []
    warnings: list[str] = []

    # Hub metadata
    hub = data.get("hub")
    if not isinstance(hub, dict):
        errors.append("Missing hub metadata")
    else:
        if not hub.get("name"):
            errors.append("hub.name is required")
        if not hub.get("version"):
            errors.append("hub.version is required")

    # Workspaces
    workspaces = data.get("workspaces")
    if not isinstance(workspaces, list) or not workspaces:
        warnings.append("No workspaces defined")

    for idx, ws in enumerate(workspaces or []):
        ws_path = ws.get("path")
        if ws_path:
            p = Path(ws_path)
            if not p.exists():
                warnings.append(f"workspace[{idx}] path does not exist: {ws_path}")

    # Plugins
    plugins = data.get("plugins")
    if not isinstance(plugins, list) or not plugins:
        warnings.append("No plugins defined")
    else:
        enabled = [p.get("name") for p in plugins if p.get("enabled")]
        if not enabled:
            warnings.append("No enabled plugins")

    # Integrations -> file references
    integrations = data.get("integrations")
    if isinstance(integrations, dict):
        manual = integrations.get("manual")
        if isinstance(manual, dict):
            manual48 = manual.get("manual48")
            if isinstance(manual48, dict):
                for key in ("md", "html", "viewer"):
                    path_str = manual48.get(key)
                    if path_str and not Path(path_str).exists():
                        warnings.append(f"manual48.{key} missing: {path_str}")

    # Targets
    targets = data.get("targets")
    if not isinstance(targets, dict):
        warnings.append("No targets defined")
    else:
        vps = targets.get("vps")
        if isinstance(vps, dict):
            if not vps.get("host"):
                errors.append("targets.vps.host is required")
            deploy = vps.get("deploy")
            if isinstance(deploy, dict):
                if not deploy.get("path"):
                    errors.append("targets.vps.deploy.path is required")

    if errors:
        print("VALIDATION FAILED")
        for err in errors:
            print(f"- {err}")
        return 1

    print("VALIDATION PASSED")
    for w in warnings:
        print(f"WARN: {w}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
