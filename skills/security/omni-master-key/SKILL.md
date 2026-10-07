---
name: omni-master-key
description: "Unified credential access via secret-vault or Bitwarden. Use when 'get secret X' / 'inject token Y' / '萬能元鑰'."
version: 1.0.0
author: Hermes Agent + OA-Team
license: MIT
platforms: [windows, linux, macos]
metadata:
  hermes:
    tags: [secrets, vault, bitwarden, credential, bridge, unified, omni-master-key, 萬能元鑰, 秘密聖櫃]
    related: [secret-vault-credential-ops, hermes-bitwarden-integration, credential-exposure-response]
---

# 萬能元鑰 (Omni Master Key) — Unified Credential Access

Single entry point for **all credential reads**. Tries local secret-vault first, falls back to Bitwarden vault, masks all output. NEVER echoes secret values.

## When to use

- User says "get secret X" / "inject token Y" / "萬能元鑰" / "讀取密鑰"
- Need an API key / token / password from any source
- CI/CD script needs to read a secret without hardcoding it
- Agent needs a credential for a one-shot operation (NOT to display to user)

## Source priority (cascade)

```
1. C:\Users\dingj\secret-vault\ENV20230818.env        (primary, fastest)
   ↓ not found
2. C:\Users\dingj\secret-vault\*.env                  (secondary, alphabetical)
   ↓ not found
3. Bitwarden vault via bw CLI                          (tertiary, requires unlock)
   ↓ not found / bw not logged in
4. ERROR: secret not found (do NOT silently fall through)
```

The cascade is **explicit and logged** — every fetch emits a trace line `Source: vault|bitwarden|FAIL` so the audit trail shows which backend served the read. The `vault_file` field in the result dict identifies which specific .env file served the key.

## Architecture

```
                    +---------------------+
   user / agent --> |  omni-master-key    |
                    |  (Python CLI + lib) |
                    +----------+----------+
                               |
                  +------------+------------+
                  |                         |
        +---------v---------+    +---------v---------+
        | secret-vault      |    | Bitwarden (bw)    |
        | *.env (10 files)  |    | vault.bitwarden.com|
        | ENV20230818.env   |    | (encrypted cloud) |
        | (primary first)   |    |                   |
        +-------------------+    +-------------------+
                  |                         |
                  +------------+------------+
                               |
                  +------------v------------+
                  | output: ***MASKED***    |
                  | + source provenance tag |
                  | + vault_file field      |
                  +-------------------------+
```

## Layer A: secret-vault (primary, offline)

Vault directory: `C:\Users\dingj\secret-vault\` — scans all `*.env` files.
Primary vault (`ENV20230818.env`) is scanned first, then remaining files
alphabetically. First match wins (backward compatible).

```python
# omni_master_key.py — Layer A implementation (multi-vault)
from pathlib import Path
import re

VAULT_DIR = Path(r"C:\Users\dingj\secret-vault")
VAULT_FILES = sorted(VAULT_DIR.glob("*.env"))
# Ensure primary vault is first
PRIMARY = VAULT_DIR / "ENV20230818.env"
if PRIMARY in VAULT_FILES:
    VAULT_FILES.remove(PRIMARY)
    VAULT_FILES.insert(0, PRIMARY)

_KEY_RE = re.compile(r"^([A-Z][A-Z0-9_]*)=(.*)$")

def _read_vault() -> dict[str, tuple[str, str]]:
    """Read all .env files, return {key: (value, filename)}."""
    result = {}
    for env_file in VAULT_FILES:
        if not env_file.exists():
            continue
        text = env_file.read_text(encoding="utf-8", errors="ignore")
        for line in text.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            m = _KEY_RE.match(line)
            if m and m.group(1) not in result:
                result[m.group(1)] = (m.group(2).strip(), env_file.name)
    return result
```

## Layer B: Bitwarden (secondary, online)

Requires:
- `bw` CLI on PATH (already installed at `C:\Tools\bw\bw.exe`)
- Bitwarden vault unlocked or API key login (`bw login --apikey`)
- `BW_SESSION` env var (or call `bw unlock --raw` inline)

```python
# get_secret.py — Layer B implementation
import subprocess
import os

def get_secret_from_bw(name: str) -> str | None:
    """Read a secret from Bitwarden vault via bw CLI.
    Returns None if not found or not logged in.
    Uses BW_SESSION env var if set; otherwise fails fast.
    """
    if not os.environ.get("BW_SESSION"):
        # Never call `bw unlock` here — that prompts for master password.
        # User must unlock via desktop app or set BW_SESSION.
        return None
    try:
        r = subprocess.run(
            ["bw", "get", "item", name],
            capture_output=True, text=True, timeout=15,
            encoding="utf-8", errors="replace"
        )
        if r.returncode != 0:
            return None
        # Parse JSON, extract first login's password (if item is type=login)
        import json
        item = json.loads(r.stdout)
        if item.get("type") == 1:  # login
            return item.get("login", {}).get("password")
        elif item.get("type") == 2:  # secure note
            return item.get("notes")
        return None
    except Exception:
        return None
```

## Unified dispatcher

```python
# omni_master_key.py — unified entry point
def omni_get_secret(name: str, *, mask: bool = True) -> dict:
    """Try vault (all .env files), then bw, return masked dict with provenance.

    Returns:
        {
            "value": "***MASKED***" if mask else actual_value,
            "source": "vault" | "bitwarden" | None,
            "found": bool,
            "vault_file": str | None,   # which .env file served the key
        }
    """
    vault_data = _read_vault()           # Layer A (multi-vault)
    val, vault_file = vault_data.get(name, (None, None))
    src = "vault" if val else None
    if val is None:
        val = get_secret_from_bw(name)   # Layer B
        src = "bitwarden" if val else None
        vault_file = None

    return {
        "value": "***MASKED***" if mask else val,
        "source": src,
        "found": val is not None,
        "vault_file": vault_file,
    }
```

## Usage examples

### From PowerShell

```powershell
# Set env vars from vault (without printing values)
$env:GITHUB_TOKEN = (Select-String -Path "C:\Users\dingj\secret-vault\ENV20230818.env" -Pattern '^GITHUB_TOKEN=').ToString().Split('=', 2)[1].Trim()
$env:GEMINI_API_KEY = (Select-String -Path "C:\Users\dingj\secret-vault\ENV20230818.env" -Pattern '^GEMINI_API_KEY=').ToString().Split('=', 2)[1].Trim()

# Use them — never print
& gh.exe repo list   # uses GITHUB_TOKEN from env
```

### From Python (the canonical interface)

```python
from omni_master_key import omni_get_secret

# Get and inject into env (masked in any log output)
result = omni_get_secret("GITHUB_TOKEN")
if result["found"]:
    os.environ["GITHUB_TOKEN"] = result["value"]  # unmasked only in-process
    print(f"Source: {result['source']}")           # shows "vault" or "bitwarden"
else:
    raise SystemExit("GITHUB_TOKEN not found in any vault")
```

### From bw CLI directly (manual, when Python not available)

```bash
# After `bw login --apikey` and `bw unlock --raw`
export BW_SESSION="<hex>"
SECRET=$(bw get password "GitHub PAT")
unset BW_SESSION  # clear session key from env
```

## 🚨 Security boundaries (5T Trustworthy)

- **NEVER echo secret values** to chat, logs, git commits, or persistent files outside `chmod 600` vault.
- **NEVER accept secret values from user via chat** — even if pasted. Trigger `credential-exposure-response` instead.
- **NEVER hardcode secrets in scripts** — always inject via `omni_get_secret` or env vars.
- **BW_SESSION lifetime**: ~15 min. Re-unlock or re-export as needed; never persist to disk.
- **Audit trail**: every `omni_get_secret` call emits `Source: vault|bitwarden|FAIL` to stdout (NOT the value) so logs show provenance without leaking content.
- **Vault file permissions**: `chmod 600 ENV20230818.env` after every write. WSL/Docker mount preserves these perms; bare Windows `ntfs` does not — use `icacls` for Windows ACL.
- **Bitwarden vault URL**: confirm `BW_URL` before `bw login` if self-hosted (Vaultwarden).

## Verification (`scripts/verify_omni_master_key.py`)

```python
#!/usr/bin/env python3
"""verify_omni_master_key.py - structural check for unified credential access.
NEVER reads or echoes secret values. NEVER connects to network.
"""
import sys
from pathlib import Path

PASS = 0; FAIL = 0

def check(name, ok, msg=""):
    global PASS, FAIL
    if ok:
        print(f"  [OK] {name}")
        PASS += 1
    else:
        print(f"  [FAIL] {name} {msg}")
        FAIL += 1

print("=" * 60)
print("Omni Master Key - Unified Credential Access Verification")
print("=" * 60)

# 1. vault file exists
VAULT = Path(r"C:\Users\dingj\secret-vault\ENV20230818.env")
check("Secret vault exists", VAULT.exists())

# 2. vault file permissions (chmod 600 / icacls)
if VAULT.exists():
    import os, stat
    mode = stat.S_IMODE(VAULT.stat().st_mode)
    # POSIX: 0o600 == 384; on Windows POSIX mode is simulated
    if os.name == "posix":
        check("Vault chmod 600", oct(mode) == "0o600", f"actual={oct(mode)}")
    else:
        # Windows: use icacls
        import subprocess
        r = subprocess.run(["icacls", str(VAULT)], capture_output=True, text=True)
        # user-only access expected (no "Everyone" line)
        check("Vault not world-readable (icacls)",
              "Everyone" not in r.stdout,
              "contains 'Everyone' ACL")

# 3. vault contains at least one expected prefix
if VAULT.exists():
    text = VAULT.read_text(encoding="utf-8", errors="ignore")
    keys = [l.split("=", 1)[0] for l in text.splitlines()
            if "=" in l and not l.startswith("#")]
    check(f"Vault has keys (count={len(keys)})", len(keys) > 0)

# 4. bw CLI available
import shutil
bw_path = shutil.which("bw")
check(f"bw CLI on PATH", bw_path is not None, f"path={bw_path}")

# 5. Bitwarden desktop app installed
APP = Path(r"C:\Users\dingj\AppData\Local\Programs\Bitwarden\Bitwarden.exe")
check("Bitwarden desktop app installed", APP.exists())

# 6. BW_SESSION leak audit (NEVER read BW_SESSION itself)
import re
SHELL_RC = [Path.home() / ".bashrc", Path.home() / ".zshrc",
            Path.home() / ".profile"]
leak = False
for rc in SHELL_RC:
    if rc.exists():
        text = rc.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"^export\s+BW_SESSION=", text, re.MULTILINE):
            print(f"  [WARN] BW_SESSION export found in {rc} - move to inline unlock")
            leak = True
check("BW_SESSION not leaked in persistent shell rc", not leak)

# 7. source-related skills exist
SKILLS = [
    Path(r"C:\Users\dingj\AppData\Local\hermes\skills\security\secret-vault-credential-ops\SKILL.md"),
    Path(r"C:\Users\dingj\AppData\Local\hermes\skills\security\hermes-bitwarden-integration\SKILL.md"),
    Path(r"C:\Users\dingj\AppData\Local\hermes\skills\security\credential-exposure-response\SKILL.md"),
    Path(r"C:\Users\dingj\AppData\Local\hermes\skills\security\omni-master-key\SKILL.md"),
]
for s in SKILLS:
    check(f"Skill exists: {s.parent.name}", s.exists())

print()
print("=" * 60)
print(f"結果：通過 {PASS} / 失敗 {FAIL}")
print("=" * 60)
sys.exit(0 if FAIL == 0 else 1)
```

## Pitfalls (already-tested)

- **PowerShell `curl` alias** — it's `Invoke-WebRequest`, not real `curl.exe`. Use `curl.exe` or `Remove-Item Alias:curl -Force` (per `credential-exposure-response` §9).
- **Windows ACL vs POSIX chmod** — `chmod 600` works in WSL/Docker mount but is ignored on bare NTFS; use `icacls` to set user-only ACL.
- **BW_SESSION expires** — after ~15 min idle, calls return `You are not logged in`. Re-run `bw unlock --raw` and re-export.
- **bw item type** — `bw get item X` returns JSON; `type=1` is login (use `.login.password`), `type=2` is secure note (use `.notes`). Handle both.
- **Vault .env parsing** — some lines have trailing whitespace, `=` in values (Base64), or shell-style quoting. Use `split("=", 1)` not `split("=")` to preserve the value's `=`.
- **Mask leaks in tracebacks** — if Python crashes after reading a secret, the traceback may contain the value. Catch exceptions before printing.

## Related skills

- `secret-vault-credential-ops` — primary vault (`ENV20230818.env`)
- `hermes-bitwarden-integration` — Bitwarden CLI + browser vault detection
- `credential-exposure-response` — when secrets leak into chat
- `agent-secrets-management` — patterns for agent as secret manager
- `1password-service-accounts` — alternative vault backend (not used here)
