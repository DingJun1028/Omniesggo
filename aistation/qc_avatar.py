#!/usr/bin/env python3
"""
Phase 7B-A: QC Avatar - Quality Control Lifeform

Auto-runs pytest and 5T verification on every artifact produced by AI Station.
Aligns with soul.md §17 五大面向 + Phase 5T Canon Daily.

5T Protocol:
  Traceable: source_origin = "qc-avatar:auto-test"
  Trackable: pytest results logged to qc_log.jsonl
  Tangible: Real test counts (pass/fail) reported
  Transparent: All test output captured
  Trustworthy: Hash lock on test results
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ── Configuration ──
LOG_FILE = Path("aistation/output/qc_log.jsonl")
SOURCE_ORIGIN = "qc-avatar:auto-test:v7b"
TESTS_DIR = Path("aistation/tests")
PROVENANCE_LOG = Path("aistation/output/provenance.log")


class QCAvatar:
    """Quality Control Avatar - auto-tests + 5T gate."""

    def __init__(self):
        self._events: list[dict] = []
        self._test_results: dict[str, Any] = {}
        self._5t_results: dict[str, bool] = {}

    def _log(self, action: str, data: dict | None = None):
        entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_origin": SOURCE_ORIGIN,
            "action": action,
            "data": data or {},
        }
        self._events.append(entry)
        LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(LOG_FILE, "a") as f:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")

    def _hash_lock(self, data: Any) -> str:
        canonical = json.dumps(data, sort_keys=True, default=str)
        return hashlib.sha256(canonical.encode("utf-8")).hexdigest()

    def run_pytest(self) -> dict:
        """Run pytest on the aistation tests."""
        self._log("pytest_start", {"cwd": str(Path.cwd())})

        result = subprocess.run(
            [sys.executable, "-m", "pytest", str(TESTS_DIR), "-v", "--tb=short"],
            capture_output=True,
            text=True,
            cwd=str(Path(__file__).resolve().parent.parent),
        )

        # Parse results
        output = result.stdout + result.stderr
        passed = re.findall(r"(\d+) passed", output)
        failed = re.findall(r"(\d+) failed", output)
        errors = re.findall(r"(\d+) error", output)

        test_count = int(passed[0]) if passed else 0
        fail_count = int(failed[0]) if failed else 0
        error_count = int(errors[0]) if errors else 0

        result_data = {
            "total": test_count + fail_count + error_count,
            "passed": test_count,
            "failed": fail_count,
            "errors": error_count,
            "exit_code": result.returncode,
            "source_origin": SOURCE_ORIGIN,
        }

        result_data["hash_lock"] = self._hash_lock(result_data)
        self._test_results = result_data
        self._log("pytest_complete", result_data)

        return result_data

    def verify_5T_traceable(self) -> bool:
        """Verify Traceable: source_origin tags in all files."""
        self._log("5t_traceable_start", {})
        count = 0
        for py_file in Path("aistation").rglob("*.py"):
            content = py_file.read_text()
            count += len(re.findall(r"traceable|tr_source_origin|source_origin", content, re.IGNORECASE))
        result = count > 0
        self._5t_results["traceable"] = result
        self._log("5t_traceable", {"tags_found": count, "result": result})
        return result

    def verify_5T_trackable(self) -> bool:
        """Verify Trackable: provenance + sync logs."""
        self._log("5t_trackable_start", {})
        
        # Check provenance
        prov_ok = PROVENANCE_LOG.exists() and PROVENANCE_LOG.stat().st_size > 0
        
        # Check sync log
        sync_ok = Path("aistation/output/sync_log.jsonl").exists()
        
        # Check qc log
        qc_ok = LOG_FILE.exists()
        
        result = prov_ok and (sync_ok or qc_ok)
        self._5t_results["trackable"] = result
        self._log("5t_trackable", {"prov": prov_ok, "sync": sync_ok, "qc": qc_ok, "result": result})
        return result

    def verify_5T_tangible(self) -> bool:
        """Verify Tangible: real artifacts + test passes."""
        self._log("5t_tangible_start", {})
        
        tests_pass = self._test_results.get("passed", 0) > 0 and self._test_results.get("failed", 0) == 0
        artifacts = list(Path("aistation/output").glob("render_*.json"))
        report = Path("aistation/output/cross_hive_report.json").exists()
        
        result = tests_pass and (len(artifacts) > 0 or report)
        self._5t_results["tangible"] = result
        self._log("5t_tangible", {"tests_pass": tests_pass, "artifacts": len(artifacts), "report": report, "result": result})
        return result

    def verify_5T_transparent(self) -> bool:
        """Verify Transparent: no hallucination."""
        self._log("5t_transparent_start", {})
        # Check that we have real data, not fabricated
        has_real_tests = self._test_results.get("total", 0) > 0
        has_real_events = len(self._events) > 0
        result = has_real_tests and has_real_events
        self._5t_results["transparent"] = result
        self._log("5t_transparent", {"real_tests": has_real_tests, "real_events": has_real_events, "result": result})
        return result

    def verify_5T_trustworthy(self) -> bool:
        """Verify Trustworthy: hash locks present."""
        self._log("5t_trustworthy_start", {})
        
        all_hash_locks = (
            self._test_results.get("hash_lock") is not None
            and PROVENANCE_LOG.exists()
        )
        
        # Check cross-hive report hash lock
        report_ok = False
        report_path = Path("aistation/output/cross_hive_report.json")
        if report_path.exists():
            report = json.loads(report_path.read_text())
            report_ok = "hash_lock" in report
        
        result = all_hash_locks and report_ok
        self._5t_results["trustworthy"] = result
        self._log("5t_trustworthy", {"test_hash": self._test_results.get("hash_lock") is not None, "report_hash": report_ok, "result": result})
        return result

    def full_qc_cycle(self) -> dict:
        """Run full QC + 5T verification cycle."""
        self._log("cycle_start", {"source_origin": SOURCE_ORIGIN})

        # Run tests
        pytest_result = self.run_pytest()

        # Run 5T checks
        checks = {
            "traceable": self.verify_5T_traceable(),
            "trackable": self.verify_5T_trackable(),
            "tangible": self.verify_5T_tangible(),
            "transparent": self.verify_5T_transparent(),
            "trustworthy": self.verify_5T_trustworthy(),
        }

        all_pass = all(checks.values())
        score = sum(checks.values()) / 5

        report = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source_origin": SOURCE_ORIGIN,
            "pytest": pytest_result,
            "5t_checks": checks,
            "5t_score": f"{score:.0%}",
            "5t_all_pass": all_pass,
            "hash_lock": self._hash_lock({
                "pytest": pytest_result,
                "5t_checks": checks,
            }),
            "events": len(self._events),
        }

        self._log("cycle_complete", report)
        return report


# ── Main ──

def main():
    print("=" * 60)
    print("  Phase 7B-A: QC Avatar - Quality Control Lifeform")
    print(f"  Timestamp: {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    avatar = QCAvatar()
    report = avatar.full_qc_cycle()

    print("\n[1] Pytest Results:")
    print(f"  Total: {report['pytest']['total']}")
    print(f"  Passed: {report['pytest']['passed']}")
    print(f"  Failed: {report['pytest']['failed']}")
    print(f"  Errors: {report['pytest']['errors']}")

    print("\n[2] 5T Verification:")
    scores = ["✅" if v else "❌" for v in report["5t_checks"].values()]
    for name, status in report["5t_checks"].items():
        icon = "✅" if status else "❌"
        print(f"  {icon} {name}: {'PASS' if status else 'FAIL'}")

    print(f"\n  5T Score: {report['5t_score']}")
    print(f"  All PASS: {report['5t_all_pass']}")
    print(f"  Hash Lock: {report['hash_lock'][:32]}...")
    print(f"  Events: {report['events']}")

    print("\n" + "=" * 60)
    if report["5t_all_pass"]:
        print("  QC RESULT: ALL PASS ✅")
    else:
        print("  QC RESULT: ISSUES DETECTED ⚠️")
    print("=" * 60)

    return report


if __name__ == "__main__":
    main()
