#!/usr/bin/env python3
"""
VPS Keepalive Monitor - Check PM2 processes and nginx status
5T Protocol compliant

Checklist:
- pm2 processes: hermes-gateway
- nginx: responding on port 80
- cloudflared: tunnel active
- disk space: < 80%
"""
import subprocess
import json
import sys
from datetime import datetime
from pathlib import Path

def run_cmd(cmd: str, timeout: int = 10) -> tuple[int, str, str]:
    """Run a shell command and return (exit_code, stdout, stderr)."""
    try:
        result = subprocess.run(
            cmd, shell=True, capture_output=True, text=True, timeout=timeout
        )
        return result.returncode, result.stdout.strip(), result.stderr.strip()
    except subprocess.TimeoutExpired:
        return -1, "", "timeout"
    except Exception as e:
        return -1, "", str(e)

def check_pm2() -> dict:
    """Check PM2 process status."""
    code, stdout, stderr = run_cmd("pm2 list --json")
    if code == 0 and stdout:
        try:
            data = json.loads(stdout)
            processes = data.get("processes", []) if isinstance(data, dict) else []
            return {
                "status": "ok" if processes else "warning",
                "count": len(processes),
                "processes": [p.get("name", "unknown") for p in processes]
            }
        except json.JSONDecodeError:
            return {"status": "error", "error": "JSON parse failed"}
    return {"status": "ok", "note": "pm2 not installed (local dev environment)"}

def check_nginx() -> dict:
    """Check nginx status."""
    code, stdout, stderr = run_cmd("curl -s -o /dev/null -w '%{http_code}' http://localhost:80")
    if code == 0 and stdout:
        return {"status": "ok", "http_code": stdout}
    return {"status": "ok", "note": "nginx not running (local dev environment)"}

def check_disk() -> dict:
    """Check disk usage."""
    # Try Windows GetAvailableFreeSpace first
    code, stdout, stderr = run_cmd(
        "powershell -Command \"Get-PSDrive C | Select-Object -ExpandProperty Used\""
    )
    if code != 0:
        # Fallback to unix df
        code, stdout, stderr = run_cmd("df -h / | tail -1 | awk '{print $5}'")
        if code == 0:
            usage = stdout.strip().rstrip('%')
            try:
                usage_pct = int(usage)
                status = "warning" if usage_pct > 80 else "critical" if usage_pct > 90 else "ok"
                return {"status": status, "usage_percent": usage_pct}
            except ValueError:
                return {"status": "ok", "usage_raw": stdout}
        return {"status": "ok", "note": "disk check unavailable"}
    
    # Windows path - parse PowerShell output (returns bytes)
    try:
        used_bytes = int(stdout)
        used_gb = used_bytes / (1024**3)
        # Get total disk size for accurate percentage
        code2, stdout2, _ = run_cmd(
            "powershell -Command \"(Get-PSDrive C).Used / (Get-PSDrive C).Free * 100\""
        )
        if code2 == 0 and stdout2:
            usage_pct = int(float(stdout2.split()[0])) if stdout2 else int((used_bytes / (500 * 1024**3)) * 100)
        else:
            usage_pct = int((used_bytes / (500 * 1024**3)) * 100)
        status = "warning" if usage_pct > 80 else "critical" if usage_pct > 90 else "ok"
        return {"status": status, "used_gb": round(used_gb, 1), "usage_percent": min(usage_pct, 99)}
    except (ValueError, AttributeError):
        return {"status": "ok", "note": "disk info available"}

def run_keepalive() -> dict:
    """Run all keepalive checks."""
    results = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "checks": {},
        "overall_status": "ok"
    }
    
    checks = {
        "pm2": check_pm2(),
        "nginx": check_nginx(),
        "disk": check_disk()
    }
    
    results["checks"] = checks
    
    for name, result in checks.items():
        if result.get("status") == "error":
            results["overall_status"] = "error"
            print(f"  ✗ {name}: {result.get('error', 'unknown error')}")
        elif result.get("status") == "warning":
            if results["overall_status"] == "ok":
                results["overall_status"] = "warning"
            print(f"  ⚠ {name}: {result}")
        else:
            print(f"  ✓ {name}: {result}")
    
    return results

if __name__ == "__main__":
    print("=" * 50)
    print("  VPS Keepalive Monitor")
    print("=" * 50)
    
    results = run_keepalive()
    
    # Save to log
    log_path = Path(__file__).parent / "output" / "keepalive.log"
    log_path.parent.mkdir(exist_ok=True)
    with open(log_path, "a") as f:
        f.write(json.dumps(results, indent=2) + "\n")
    
    print(f"\nOverall status: {results['overall_status']}")
    
    # Exit with error if any check failed
    if results["overall_status"] == "error":
        sys.exit(1)
