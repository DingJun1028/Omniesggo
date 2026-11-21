"""ESGGO Hub backend — project-health status endpoint.

Mounted by Hermes at  GET /api/plugins/esggo-hub/status  (see manifest.json).
Exposes ONLY project metadata (git branch / commit / build flags / file counts).
It never reads secrets, .env contents, or credential files — by design.
"""
from __future__ import annotations

import os
from pathlib import Path

import subprocess
from fastapi import APIRouter

router = APIRouter()

# Project to inspect. Override at runtime with env ESGGO_HUB_PROJECT if needed.
PROJECT = Path(os.environ.get("ESGGO_HUB_PROJECT", r"C:\Project\esggo"))


def _git(args: list[str]) -> str | None:
    try:
        out = subprocess.run(
            ["git", "-C", str(PROJECT), *args],
            capture_output=True,
            text=True,
            timeout=5,
        )
        return out.stdout.strip() or None
    except Exception:
        return None


@router.get("/status")
async def status():
    try:
        branch = _git(["rev-parse", "--abbrev-ref", "HEAD"]) or "—"
        last_commit = _git(["rev-parse", "--short", "HEAD"]) or "—"
        dirty = bool(_git(["status", "--porcelain"]))
    except Exception:
        branch, last_commit, dirty = "—", "—", False

    exists = PROJECT.exists()
    dist_built = (PROJECT / "dist").is_dir() if exists else False
    try:
        jsx = len(list(PROJECT.rglob("*.jsx"))) + len(list(PROJECT.rglob("*.tsx")))
    except Exception:
        jsx = 0
    firestore_rules = (PROJECT / "firestore.rules").is_file() if exists else False

    return {
        "path": str(PROJECT),
        "branch": branch,
        "last_commit": last_commit,
        "dirty": dirty,
        "dist_built": dist_built,
        "src_files": jsx,
        "firestore_rules": firestore_rules,
    }
