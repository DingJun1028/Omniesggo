#!/usr/bin/env python3
"""
Auto-Repair Engine for esggo
Matches error messages against patterns and executes fix actions.
"""

import re
import sys
import yaml
import subprocess
import json
from pathlib import Path
from datetime import datetime

PATTERNS_FILE = Path(__file__).parent / "error-patterns.yaml"
FIX_ACTIONS_FILE = Path(__file__).parent / "fix-actions.yaml"
LOG_FILE = Path(__file__).parent / "repair-log.jsonl"

def load_yaml(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)

def log_event(task_id: str, event: str, detail: str = ""):
    entry = {
        "task_id": task_id,
        "timestamp": datetime.now().isoformat(),
        "event": event,
        "detail": detail,
    }
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"[{event}] {detail}" if detail else f"[{event}]")

def match_error(error_output: str, patterns: dict) -> list:
    """Match error output against all patterns, return matched pattern IDs sorted by priority."""
    matches = []
    for pattern in patterns.get("patterns", []):
        pid = pattern["id"]
        match_type = pattern["match"]["type"]
        regex = pattern["match"]["regex"]

        if match_type == "ghsa" and re.search(regex, error_output):
            matches.append((pid, pattern.get("priority", 99)))
        elif match_type == "ssh_error" and re.search(regex, error_output):
            matches.append((pid, pattern.get("priority", 99)))
        elif match_type == "build_error" and re.search(regex, error_output):
            matches.append((pid, pattern.get("priority", 99)))
        elif match_type == "truncation" and re.search(regex, error_output):
            matches.append((pid, pattern.get("priority", 99)))
        elif match_type == "vps_command" and re.search(regex, error_output):
            matches.append((pid, pattern.get("priority", 99)))
        elif match_type == "pnpm_audit" and re.search(regex, error_output):
            matches.append((pid, pattern.get("priority", 99)))

    # Sort by priority (lower = higher priority)
    matches.sort(key=lambda x: x[1])
    return [m[0] for m in matches]

def execute_fix(pattern_id: str, fix_actions: dict, task_id: str) -> bool:
    """Execute fix commands for a matched pattern."""
    actions = fix_actions.get("fix_actions", {}).get(pattern_id)
    if not actions:
        log_event(task_id, "SKIP", f"No fix actions defined for {pattern_id}")
        return False

    commands = actions.get("commands", [])
    for cmd in commands:
        log_event(task_id, "EXEC", f"Running: {cmd}")
        try:
            result = subprocess.run(
                cmd, shell=True, capture_output=True, text=True, timeout=60,
                errors="replace"  # Handle non-UTF-8 bytes in output
            )
            if result.returncode != 0:
                log_event(task_id, "ERROR", f"Command failed: {cmd}\nstderr: {result.stderr[:200]}")
                # Don't immediately fail on ssh-add - it may just need an agent
                if "ssh-add" in cmd and "authentication agent" in (result.stderr or ""):
                    log_event(task_id, "WARN", "No SSH agent running, skipping ssh-add (SSH config will handle keys)")
                    continue
                return False
            log_event(task_id, "OK", f"Command succeeded: {cmd}")
        except subprocess.TimeoutExpired:
            log_event(task_id, "TIMEOUT", f"Command timed out: {cmd}")
            return False
        except Exception as e:
            log_event(task_id, "EXCEPTION", f"Exception running {cmd}: {e}")
            return False

    # Run verification commands
    verify_cmds = actions.get("verify", [])
    for vcmd in verify_cmds:
        log_event(task_id, "VERIFY", f"Running: {vcmd}")
        try:
            result = subprocess.run(
                vcmd, shell=True, capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                log_event(task_id, "VERIFY_OK", f"Verification passed: {vcmd}")
            else:
                log_event(task_id, "VERIFY_FAIL", f"Verification failed: {vcmd}\nstderr: {result.stderr[:200]}")
                return False
        except Exception as e:
            log_event(task_id, "VERIFY_ERROR", f"Exception verifying {vcmd}: {e}")
            return False

    return True

def run_repair(error_output: str, task_id: str = None) -> dict:
    """Main repair entry point."""
    if task_id is None:
        task_id = f"REPAIR-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    patterns = load_yaml(PATTERNS_FILE)
    fix_actions = load_yaml(FIX_ACTIONS_FILE)

    log_event(task_id, "START", f"Repair engine started for task {task_id}")

    # Step 1: Match error
    matched = match_error(error_output, patterns)
    if not matched:
        log_event(task_id, "NO_MATCH", "No matching error pattern found")
        return {"task_id": task_id, "status": "no_match", "matches": []}

    log_event(task_id, "MATCH", f"Matched patterns: {matched}")

    # Step 2: Execute fixes in priority order
    results = {}
    for pid in matched:
        log_event(task_id, "ATTEMPT", f"Attempting fix for {pid}")
        success = execute_fix(pid, fix_actions, task_id)
        results[pid] = "success" if success else "failed"
        if success:
            log_event(task_id, "FIXED", f"Pattern {pid} fixed successfully")
            break  # Stop after first successful fix
        else:
            log_event(task_id, "RETRY", f"Pattern {pid} fix failed, trying next")

    # Step 3: Report
    any_success = any(v == "success" for v in results.values())
    status = "fixed" if any_success else "failed"
    log_event(task_id, "END", f"Repair status: {status}")

    return {"task_id": task_id, "status": status, "results": results}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 repair-engine.py <error_output_or_file> [--task-id TASK_ID]")
        sys.exit(1)

    input_arg = sys.argv[1]
    task_id = "REPAIR-" + datetime.now().strftime("%Y%m%d%H%M%S")
    for i, arg in enumerate(sys.argv):
        if arg == "--task-id" and i + 1 < len(sys.argv):
            task_id = sys.argv[i + 1]
            break
    if Path(input_arg).exists():
        error_text = Path(input_arg).read_text(encoding="utf-8")
    else:
        error_text = input_arg

    result = run_repair(error_text)
    print(json.dumps(result, ensure_ascii=False, indent=2))
    sys.exit(0 if result["status"] == "fixed" else 1)
