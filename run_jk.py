import subprocess, sys

ROUTER = "C:/Users/dingj/AppData/Local/hermes/skills/autonomous-ai-agents/oa-junaikey-growth/scripts/junaikey_router.py"
PY = "C:/Users/dingj/AppData/Local/hermes/installs/93fbaa5b78fa38f7/environments/136f5592a39c4904ad576fabc8506e79/venv/Scripts/python.exe"

cmd = [PY, ROUTER] + sys.argv[1:]
r = subprocess.run(cmd, capture_output=True, text=True)
print("=== STDOUT ===")
print(r.stdout)
print("=== STDERR ===")
print(r.stderr)
print("EXIT=", r.returncode)
