#!/usr/bin/env bash
# ============================================================
# ESGGO VPS Recovery — Console Block A
# 使用時機：在 OCI Console Browser-based SSH / Serial Console
# ============================================================
set -u

echo "[1/4] create dirs"
sudo mkdir -p /opt/esggo/{relay,recovery,bin,logs}/.cache
sudo chown -R ubuntu:ubuntu /opt/esggo || true

echo "[2/4] deploy relay-server.py"
cat > /opt/esggo/relay/relay-server.py <<PYEOF
#!/usr/bin/env python3
import json, os, sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from datetime import datetime, timezone

TOKEN=os.environ.get("ESGGO_RELAY_TOKEN")
HOST=os.environ.get("ESGGO_RELAY_HOST","0.0.0.0")
PORT=int(os.environ.get("ESGGO_RELAY_PORT","9999"))
cmds={}

class Handler(BaseHTTPRequestHandler):
  def _auth_fail(self):
    self.send_response(403)
    self.end_headers()
    self.wfile.write(b'{"error":"forbidden"}')
  def _json(self,obj,code=200):
    self.send_response(code)
    self.send_header("Content-Type","application/json")
    self.end_headers()
    self.wfile.write(json.dumps(obj, ensure_ascii=False).encode("utf-8"))
  def do_GET(self):
    if self.headers.get("X-Auth-Token")!=TOKEN:
      return self._auth_fail()
    if self.path=="/status":
      return self._json({"status":"ok","ts":datetime.now(timezone.utc).isoformat()})
    if self.path=="/cmds":
      # 僅 owner/127.0.0.1 可視；外部須走 token
      return self._json({"queued":len(cmds)})
    return self._json({"error":"not_found"},404)
  def do_POST(self):
    if self.headers.get("X-Auth-Token")!=TOKEN:
      return self._auth_fail()
    length=int(self.headers.get("Content-Length","0"))
    body=self.rfile.read(length).decode("utf-8","replace") if length else ""
    try:
      data=json.loads(body) if body else {}
    except Exception:
      data={}
    if self.path=="/cmd":
      cmd_id=data.get("id") or ("cmd_"+str(id(body))[-12:])
      cmds[cmd_id]=data
      return self._json({"status":"queued","id":cmd_id,"command":data.get("command")})
    if self.path=="/result":
      print("RESULT", json.dumps(data, ensure_ascii=False)[:2000], flush=True)
      return self._json({"status":"ok"})
    return self._json({"error":"not_found"},404)
  def log_message(self,fmt,*args):
    sys.stderr.write(f"{datetime.now(timezone.utc).isoformat()} {fmt%args}\n")

def main():
  server=HTTPServer((HOST,PORT),Handler)
  print("ESGGO VPS Relay Server\nPort: "+str(PORT)+"\nAuth: "+TOKEN+"\nListening on "+HOST+":"+str(PORT)+"\nEndpoints: /status /cmds /cmd /result",flush=True)
  try:
    server.serve_forever()
  except KeyboardInterrupt:
    pass
  finally:
    server.server_close()

if __name__=="__main__":
  main()
PYEOF

echo "[3/4] deploy recovery scripts"
cp -f /var/www/esggo/vps/recovery/recovery-diagnostics.sh /opt/esggo/recovery/ || true
cp -f /var/www/esggo/vps/recovery/recovery-repair.sh /opt/esggo/recovery/ || true

echo "[4/4] start relay headless"
nohup python3 /opt/esggo/relay/relay-server.py > /opt/esggo/logs/relay.log 2>&1 &
sleep 2
curl -sS -D - http://127.0.0.1:9999/status -H "X-Auth-Token: ${ESGGO_RELAY_TOKEN}" || true

echo "=== block A done ==="
