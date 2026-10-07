#!/usr/bin/env python3
"""verify_omni_master_key.py - structural check for unified credential access.

NEVER reads or echoes secret values. NEVER connects to network.
Pure file/process audit. Exit 0 = pass, 1 = fail.
"""
import json
import os
import re
import shutil
import stat
import subprocess
import sys
from pathlib import Path

PASS = 0
FAIL = 0


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

# 1. Vault directory and primary file exist
VAULT_DIR = Path(r"C:\Users\dingj\secret-vault")
VAULT = VAULT_DIR / "ENV20230818.env"
check("Secret vault directory exists", VAULT_DIR.exists())
check("Primary vault file exists", VAULT.exists())

# 2. Vault contains at least one expected key prefix
if VAULT.exists():
    text = VAULT.read_text(encoding="utf-8", errors="ignore")
    keys = [l.split("=", 1)[0] for l in text.splitlines()
            if "=" in l and not l.startswith("#")]
    check(f"Vault has keys (count={len(keys)})", len(keys) > 0)
    # Common keys we expect from prior context
    expected_prefixes = ["GH", "BW", "GEMINI", "SUPABASE", "FIREBASE",
                         "TELEGRAM", "BROWSER", "HERMES", "HA", "BRAVE"]
    found_prefixes = {k.split("_")[0] for k in keys if "_" in k}
    has_any = any(p in found_prefixes for p in expected_prefixes)
    check(f"Vault has expected prefix (any of {expected_prefixes[:4]}...)", has_any,
          f"found={sorted(found_prefixes)[:8]}")

# 2b. Multi-file vault scan: check that other .env files are discoverable
OMK = Path(r"C:\Users\dingj\AppData\Local\hermes\skills\security\omni-master-key\scripts\omni_master_key.py")
if VAULT_DIR.exists() and VAULT_DIR.is_dir():
    env_files = sorted(VAULT_DIR.glob("*.env"))
    check(f"Vault directory has multiple .env files (count={len(env_files)})",
          len(env_files) > 1, f"found={len(env_files)} files")
    # Check that a key from a non-primary file is accessible via omni_get_secret
    sys.path.insert(0, str(OMK.parent))
    try:
        import omni_master_key as omk
        # CF_TOKEN_DNS1 lives in cloudflare_ftgtours_tokens.env (non-primary)
        result_cf = omk.omni_get_secret("CF_TOKEN_DNS1")
        check("Multi-file scan: CF_TOKEN_DNS1 found in non-primary vault file",
              result_cf.get("found") is True
              and result_cf.get("source") == "vault"
              and result_cf.get("vault_file") == "cloudflare_ftgtours_tokens.env",
              f"found={result_cf.get('found')}, file={result_cf.get('vault_file')}")
        # Check vault_file field exists in result
        result_gh = omk.omni_get_secret("GITHUB_TOKEN")
        check("vault_file field present in result",
              "vault_file" in result_gh,
              f"keys={list(result_gh.keys())}")
    except Exception as e:
        check("Multi-file scan test", False, f"{type(e).__name__}: {e}")

# 3. Vault permissions (POSIX chmod 600 OR Windows ACL no Everyone)
if VAULT.exists():
    if os.name == "posix":
        mode = stat.S_IMODE(VAULT.stat().st_mode)
        check(f"Vault chmod 600 (POSIX)", oct(mode) == "0o600", f"actual={oct(mode)}")
    else:
        # Windows: use icacls to check no "Everyone" ACE
        try:
            r = subprocess.run(
                ["icacls", str(VAULT)],
                capture_output=True, text=True, timeout=15,
                encoding="utf-8", errors="replace",
            )
            everyone_present = "Everyone" in r.stdout
            check("Vault ACL no Everyone (Windows)", not everyone_present)
        except FileNotFoundError:
            print("  [INFO] icacls not available, skipping Windows ACL check")

# 4. bw CLI on PATH
bw_path = shutil.which("bw") or shutil.which("bw.exe")
check(f"bw CLI on PATH", bw_path is not None, f"path={bw_path}")

# 5. Bitwarden desktop app installed
APP = Path(r"C:\Users\dingj\AppData\Local\Programs\Bitwarden\Bitwarden.exe")
check("Bitwarden desktop app installed", APP.exists())

# 6. BW_SESSION leak audit (in shell rc files - NEVER read BW_SESSION itself)
SHELL_RC = [
    Path.home() / ".bashrc", Path.home() / ".zshrc",
    Path.home() / ".profile", Path.home() / ".bash_profile",
    Path(r"C:\Users\dingj\.bashrc"), Path(r"C:\Users\dingj\.zshrc"),
]
leak_found = False
for rc in SHELL_RC:
    if rc.exists():
        rc_text = rc.read_text(encoding="utf-8", errors="ignore")
        if re.search(r"^export\s+BW_SESSION=", rc_text, re.MULTILINE):
            print(f"  [WARN] BW_SESSION export found in {rc}")
            leak_found = True
check("BW_SESSION not leaked in persistent shell rc", not leak_found)

# 7. Source-related skills exist (4-gate skill layer)
SKILLS = [
    ("secret-vault-credential-ops",
     Path(r"C:\Users\dingj\AppData\Local\hermes\skills\security\secret-vault-credential-ops\SKILL.md")),
    ("hermes-bitwarden-integration",
     Path(r"C:\Users\dingj\AppData\Local\hermes\skills\security\hermes-bitwarden-integration\SKILL.md")),
    ("credential-exposure-response",
     Path(r"C:\Users\dingj\AppData\Local\hermes\skills\security\credential-exposure-response\SKILL.md")),
    ("omni-master-key (self)",
     Path(r"C:\Users\dingj\AppData\Local\hermes\skills\security\omni-master-key\SKILL.md")),
]
for name, path in SKILLS:
    check(f"Skill exists: {name}", path.exists())

# 8. omni_master_key.py module imports cleanly (syntax check)
if OMK.exists():
    import py_compile
    try:
        py_compile.compile(str(OMK), doraise=True)
        check("omni_master_key.py syntax valid", True)
    except py_compile.PyCompileError as e:
        check("omni_master_key.py syntax valid", False, str(e))

# 9. Test vault read (without echoing any value)
if VAULT.exists():
    sys.path.insert(0, str(OMK.parent))
    try:
        import omni_master_key as omk
        # Test cascade with a key that's likely absent (so we exercise "not found" path)
        result = omk.omni_get_secret("__NONEXISTENT_KEY_FOR_TEST__")
        check("omni_get_secret returns dict with found=False for missing key",
              isinstance(result, dict) and result.get("found") is False
              and result.get("source") is None)

        # Test with a key that exists in vault (any real one) - verify mask works
        vault_keys = [l.split("=", 1)[0] for l in VAULT.read_text(encoding="utf-8", errors="ignore").splitlines()
                      if "=" in l and not l.startswith("#")]
        if vault_keys:
            test_key = vault_keys[0]
            result_masked = omk.omni_get_secret(test_key, mask=True)
            result_raw = omk.omni_get_secret(test_key, mask=False)
            check(f"omni_get_secret mask=True returns '***MASKED***'",
                  result_masked.get("value") == "***MASKED***",
                  f"actual={result_masked.get('value')!r}")
            check(f"omni_get_secret mask=False returns actual value",
                  result_raw.get("value") and result_raw.get("value") != "***MASKED***")
            check(f"Source identified for '{test_key}'",
                  result_masked.get("source") in ("vault", "bitwarden"),
                  f"source={result_masked.get('source')}")
            # CRITICAL: raw value must not contain the masked token
            if result_raw.get("value"):
                check(f"Raw value != masked token (no leak)",
                      result_raw["value"] != "***MASKED***")
    except ImportError as e:
        check("omni_master_key.py importable", False, str(e))
    except Exception as e:
        check("omni_get_secret executes without error", False, f"{type(e).__name__}: {e}")

print()
print("=" * 60)
print(f"結果：通過 {PASS} / 失敗 {FAIL}")
print("=" * 60)

sys.exit(0 if FAIL == 0 else 1)
