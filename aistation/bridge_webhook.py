#!/usr/bin/env python3
"""Memory Bridge Webhook Receiver - listens on port 8421."""
import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler


class MemoryWebhookHandler(BaseHTTPRequestHandler):
    def do_POST(self):
        if self.path == "/webhook/memory":
            content_length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body)
                action = data.get("action", "unknown")
                print(f"[{time.time()}] Memory sync: {action}", flush=True)
            except Exception:
                pass
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({
                "status": "ok",
                "timestamp": time.time()
            }).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Suppress default logging
        pass


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", 8421), MemoryWebhookHandler)
    print(f"[{time.time()}] Memory webhook listening on :8421", flush=True)
    server.serve_forever()
