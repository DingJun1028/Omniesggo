"""omni_master_key.py - Unified credential access.

Tries local secret-vault (all .env files in ~/secret-vault/) first,
falls back to Bitwarden vault.
NEVER echoes secret values. Always returns a dict with provenance.

Usage:
    from omni_master_key import omni_get_secret
    result = omni_get_secret("GITHUB_TOKEN")
    if result["found"]:
        os.environ["GITHUB_TOKEN"] = result["value"]  # unmasked only in-process
        print(f"Source: {result['source']}, File: {result.get('vault_file', 'N/A')}")
"""
from __future__ import annotations
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Optional

VAULT_DIR = Path(r"C:\Users\dingj\secret-vault")
VAULT_PRIMARY = VAULT_DIR / "ENV20230818.env"
_KEY_RE = re.compile(r"^([A-Z][A-Z0-9_]*)=(.*)$")
_BW_TIMEOUT = 15
_MASK = "***MASKED***"


def _read_vault() -> dict[str, tuple[str, str]]:
    """Parse all .env files in vault dir into {KEY: (value, filename)} dict.
    Never logs values. Primary vault is read first; other files follow
    in alphabetical order. Later files do NOT override earlier ones.
    """
    if not VAULT_DIR.exists():
        return {}

    # Build ordered file list: primary first, then others alphabetically
    files: list[Path] = []
    if VAULT_PRIMARY.exists():
        files.append(VAULT_PRIMARY)
    if VAULT_DIR.is_dir():
        for f in sorted(VAULT_DIR.glob("*.env")):
            if f != VAULT_PRIMARY:
                files.append(f)

    secrets: dict[str, tuple[str, str]] = {}
    for fpath in files:
        try:
            text = fpath.read_text(encoding="utf-8", errors="ignore")
        except OSError:
            continue
        for line in text.splitlines():
            stripped = line.strip()
            if not stripped or stripped.startswith("#"):
                continue
            m = _KEY_RE.match(stripped)
            if m:
                key = m.group(1)
                if key not in secrets:  # first file wins
                    secrets[key] = (m.group(2).strip(), fpath.name)
    return secrets


def get_secret_from_vault(name: str) -> Optional[tuple[str, str]]:
    """Read a single secret value from the local secret-vault.
    Returns (value, filename) tuple if found, None otherwise.
    NEVER prints or logs the value.
    """
    vault = _read_vault()
    return vault.get(name)


def get_secret_from_bitwarden(name: str) -> Optional[str]:
    """Read a secret from Bitwarden vault via bw CLI.
    Returns None if not logged in, item missing, or bw error.
    Requires BW_SESSION env var set; never prompts for master password.
    """
    if not os.environ.get("BW_SESSION"):
        return None

    bw = "bw.exe" if sys.platform == "win32" else "bw"
    try:
        r = subprocess.run(
            [bw, "get", "item", name],
            capture_output=True,
            timeout=_BW_TIMEOUT,
            encoding="utf-8",
            errors="replace",
        )
    except (subprocess.TimeoutExpired, FileNotFoundError, OSError):
        return None

    if r.returncode != 0 or not r.stdout.strip():
        return None

    try:
        item = json.loads(r.stdout)
    except json.JSONDecodeError:
        return None

    item_type = item.get("type")
    if item_type == 1:  # login
        return item.get("login", {}).get("password")
    if item_type == 2:  # secure note
        return item.get("notes")
    return None


def omni_get_secret(name: str, *, mask: bool = True) -> dict:
    """Unified credential access: vault -> Bitwarden cascade.

    Args:
        name: The secret key (e.g. "GITHUB_TOKEN", "BW_CLIENTSECRET").
        mask: If True, the returned "value" is replaced with "***MASKED***".
              Set mask=False only when the value is needed for in-process
              use (e.g., setting an env var or HTTP Authorization header).
              NEVER log or print a value with mask=False.

    Returns:
        dict with keys:
          - value: masked or actual value
          - source: "vault" | "bitwarden" | None
          - vault_file: filename where the key was found (vault source only)
          - found: True/False
    """
    vault_result = get_secret_from_vault(name)
    vault_file: Optional[str] = None

    if vault_result is not None:
        val, vault_file = vault_result
        source = "vault"
    else:
        val = get_secret_from_bitwarden(name)
        source = "bitwarden" if val is not None else None

    return {
        "value": _MASK if (mask and val is not None) else val,
        "source": source,
        "vault_file": vault_file,
        "found": val is not None,
    }


def omni_list_keys() -> dict[str, str]:
    """List which sources have which keys (NEVER values).
    Useful for audit: see which secrets live where.

    Returns:
        {"VAULT_ONLY": [...], "BITWARDEN_ONLY": [...], "BOTH": [...]}
    """
    vault_keys = set(_read_vault().keys())

    bw_keys: set[str] = set()
    if os.environ.get("BW_SESSION"):
        try:
            r = subprocess.run(
                ["bw", "list", "items"],
                capture_output=True, timeout=_BW_TIMEOUT,
                encoding="utf-8", errors="replace",
            )
            if r.returncode == 0:
                items = json.loads(r.stdout)
                bw_keys = {item.get("name", "") for item in items if item.get("name")}
        except Exception:
            pass

    return {
        "VAULT_ONLY": sorted(vault_keys - bw_keys),
        "BITWARDEN_ONLY": sorted(bw_keys - vault_keys),
        "BOTH": sorted(vault_keys & bw_keys),
    }


if __name__ == "__main__":
    # CLI demo: lookup one or more keys
    if len(sys.argv) < 2:
        print("Usage: python omni_master_key.py KEY [KEY ...]")
        print("       python omni_master_key.py --list")
        sys.exit(1)

    if sys.argv[1] == "--list":
        report = omni_list_keys()
        for src, keys in report.items():
            print(f"{src}: {len(keys)} keys")
            for k in keys[:10]:
                print(f"  - {k}")
            if len(keys) > 10:
                print(f"  ... and {len(keys) - 10} more")
        sys.exit(0)

    for key in sys.argv[1:]:
        result = omni_get_secret(key)
        status = "FOUND" if result["found"] else "MISSING"
        vault_file = result.get("vault_file", "")
        if vault_file:
            print(f"[{status}] {key} (source: {result['source']}, file: {vault_file})")
        else:
            print(f"[{status}] {key} (source: {result['source']})")
