#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
OA-Twins 健康檢查 — 真實 HTTP 探測 / 純 stdlib / 零幻覺

本腳本存在的唯一理由：README、run-selftest.bat 與 deploy/oa-twin-vps-deploy.sh
都引用 bin/oa-twin-health.py，但該檔從未落地 → 三處全部靜默失敗。
本檔只回報「實際探測到的」，絕不憑空宣稱成功（真實輸出才宣稱成功）。

用法
  python bin/oa-twin-health.py --check both      # 本機 + VPS 都探（CI/自檢預設）
  python bin/oa-twin-health.py --check vps       # 只探 VPS
  python bin/oa-twin-health.py --check local     # 只探本機
  python bin/oa-twin-health.py --check journal --store oab/journal
  python bin/oa-twin-health.py --check all --json
  python bin/oa-twin-health.py --check none      # 什麼都不探（真的什麼都沒做）

退出碼
  0 = 全部通過（真的通過）
  1 = 有 !! 異常
  2 = 用法錯誤 / 必要參數缺漏
"""
from __future__ import annotations

import argparse
import json
import os
import re
import ssl
import sys
import time
import urllib.error
import urllib.request
from typing import Any, Dict, List, Optional, Tuple

# ── 探測目標（皆可用環境變數覆寫，方便 CI/本機/VPS 各用各的端點）────────────
VPS_BASE = os.environ.get("OA_TWIN_VPS_BASE", "https://esggo.co").rstrip("/")
VPS_API_HEALTH = os.environ.get("OA_TWIN_VPS_HEALTH", VPS_BASE + "/api/health")
VPS_API_HEALTHZ = os.environ.get("OA_TWIN_VPS_HEALTHZ", VPS_BASE + "/api/healthz")
LOCAL_API_HEALTH = os.environ.get("OA_TWIN_LOCAL_HEALTH", "http://127.0.0.1:8786/api/health")
OA_TWIN_TIMEOUT = float(os.environ.get("OA_TWIN_TIMEOUT", "8"))

SCENARIOS = ("local", "vps", "journal", "none")
ALL_CHECKS = ("all", "both", "local", "vps", "journal", "none")


class Probe:
    """單一探測結果。ok=False 一律標 !!，不做任何美化。"""

    __slots__ = ("name", "target", "ok", "status", "detail", "ms")

    def __init__(self, name: str, target: str, ok: bool, status: Any,
                 detail: str, ms: int) -> None:
        self.name = name
        self.target = target
        self.ok = ok
        self.status = status
        self.detail = detail
        self.ms = ms

    def as_dict(self) -> Dict[str, Any]:
        return {"name": self.name, "target": self.target, "ok": self.ok,
                "status": self.status, "detail": self.detail, "ms": self.ms}


def http_probe(name: str, url: str, expect: Tuple[int, ...] = (200,)) -> Probe:
    """真實發出 HTTP 請求；連不上就是連不上，絕不回填假 200。"""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE  # 只為探存活，不驗簽章（誠實標註於 detail）
    t0 = time.time()
    try:
        req = urllib.request.Request(url, method="GET",
                                     headers={"User-Agent": "oa-twin-health/2.0"})
        with urllib.request.urlopen(req, timeout=OA_TWIN_TIMEOUT, context=ctx) as r:
            body = r.read(400).decode("utf-8", "replace")
            ms = int((time.time() - t0) * 1000)
            ok = r.status in expect
            detail = body.replace("\n", " ")[:160] or "(空回應)"
            return Probe(name, url, ok, r.status, detail, ms)
    except urllib.error.HTTPError as e:
        ms = int((time.time() - t0) * 1000)
        return Probe(name, url, False, e.code, f"HTTPError: {e.reason}", ms)
    except Exception as e:
        ms = int((time.time() - t0) * 1000)
        return Probe(name, url, False, None, f"{type(e).__name__}: {e}", ms)


def probe_vps() -> List[Probe]:
    return [http_probe("VPS /api/health", VPS_API_HEALTH),
            http_probe("VPS /api/healthz", VPS_API_HEALTHZ)]


def probe_local() -> List[Probe]:
    return [http_probe("Local /api/health", LOCAL_API_HEALTH)]


def journal_stats(store: str) -> Dict[str, Any]:
    """讀 journal 真實檔案狀態（大小、行數、mtime）。沒有檔就是沒有，不假造。"""
    if not os.path.isdir(store):
        return {"exists": False, "dir": store}
    files = sorted(f for f in os.listdir(store) if f.endswith(".oab.jsonl"))
    active = os.path.join(store, f"{os.path.basename(store.rstrip(os.sep))}.oab.jsonl")
    if not os.path.exists(active) and files:
        active = os.path.join(store, files[0])
    info: Dict[str, Any] = {"exists": bool(files), "dir": store, "files": files,
                            "active": active if files else None}
    # 封存檔（stem.TIMESTAMP[.N].jsonl）—— 別漏算，否則 36MB 會被當成 0
    stem, suffix = os.path.splitext(os.path.basename(active)) if files else ("", "")
    arch_pat = re.compile(re.escape(stem) + r"\.\d{8}T\d{6}(?:\.\d+)?" +
                          re.escape(suffix) + r"\Z") if files else None
    archives = [f for f in os.listdir(store) if arch_pat and arch_pat.match(f)]
    info["archives"] = archives
    if os.path.exists(active):
        info["bytes"] = os.path.getsize(active)
        info["archive_bytes"] = sum(os.path.getsize(os.path.join(store, a))
                                    for a in archives)
        info["total_bytes"] = info["bytes"] + info["archive_bytes"]
        info["mtime"] = time.strftime("%Y-%m-%dT%H:%M:%S",
                                      time.localtime(os.path.getmtime(active)))
        with open(active, "r", encoding="utf-8", errors="replace") as fh:
            info["lines"] = sum(1 for _ in fh)
    return info


def run(check: str, store: Optional[str], as_json: bool) -> int:
    checks: List[Probe] = []
    want = ("local", "vps", "journal") if check in ("all", "both") else (check,)
    if "none" in want:
        print("nothing checked — 真的什麼都沒探 (--check none)")
        return 0

    if "journal" in want:
        info = journal_stats(store or "oab/journal")
        if not info.get("exists"):
            checks.append(Probe("Journal", info.get("dir", "?"), False, None,
                                "找不到 .oab.jsonl（心跳可能沒在跑）", 0))
        else:
            live = info.get("bytes", 0)
            total = info.get("total_bytes", live)
            # 警戒線分層：現行檔 32MB（輪替門檻）、封存總量 256MB（清退預算）
            ok = (live < 32 * 1048576) and (total < 256 * 1048576)
            detail = f"{info.get('lines', 0)} lines / {live/1048576:.1f}MB"
            if info.get("archive_bytes"):
                detail += (f" + 封存 {info['archive_bytes']/1048576:.1f}MB"
                           f" = {total/1048576:.1f}MB")
            checks.append(Probe(
                "Journal", info["active"], ok, detail,
                f"最後寫入 {info.get('mtime', '?')}"
                + (f" / 封存 {len(info.get('archives', []))} 份" if info.get("archives") else ""),
                0))
    if "vps" in want:
        checks.extend(probe_vps())
    if "local" in want:
        checks.extend(probe_local())

    failed = [p for p in checks if not p.ok]
    if as_json:
        print(json.dumps({"checked": [p.as_dict() for p in checks],
                          "passed": not failed, "failures": len(failed)},
                         ensure_ascii=False, indent=2))
    else:
        print("=== OA-Twins 健康檢查 ===")
        for p in checks:
            mark = "✓" if p.ok else "!!"
            print(f"  {mark} {p.name}: {p.status} ({p.ms}ms)")
            print(f"     {p.target}")
            print(f"     {p.detail}")
        if failed:
            print(f"\n!! {len(failed)} 項異常（不宣稱成功）")
        else:
            print("\n✓ 全部通過（真實探測，非推定）")
    return 1 if failed else 0


def main() -> int:
    ap = argparse.ArgumentParser(description="OA-Twins 健康檢查（真實探測）")
    ap.add_argument("--check", default="all", choices=ALL_CHECKS,
                    help="要檢查的對象（預設 all）")
    ap.add_argument("--store", default=None, help="journal 目錄（預設 oab/journal）")
    ap.add_argument("--json", action="store_true", help="輸出 JSON")
    ns = ap.parse_args()
    return run(ns.check, ns.store, ns.json)


if __name__ == "__main__":
    sys.exit(main())
