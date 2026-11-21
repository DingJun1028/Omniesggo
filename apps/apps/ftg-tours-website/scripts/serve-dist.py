#!/usr/bin/env python
"""SPA-fallback 靜態伺服器（供 RWD 量測使用）。

5T-Transparent pitfall（實測 2026-09-30）：`python -m http.server` 沒有
history fallback，深連結 /corporate-travel 等一律回 404 錯誤頁。
用該伺服器量測 RWD 時，10 個路由有 9 個量到同一張 404 頁
（「桌機可見 1 項 / 高度 144」），會讓整份對等報告失真。

本檔提供 fallback：找不到實體檔案時回 index.html，符合 Vite SPA 行為。
"""

import functools
import http.server
import os
import socketserver
import sys

ROOT = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else "dist")
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8791


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):  # noqa: N802
        path = self.translate_path(self.path)
        if not os.path.exists(path) or os.path.isdir(path):
            if "." not in os.path.basename(self.path):
                self.path = "/index.html"
        return super().do_GET()

    def log_message(self, fmt, *args):  # 靜音
        pass


if __name__ == "__main__":
    socketserver.TCPServer.allow_reuse_address = True
    handler = functools.partial(SPAHandler, directory=ROOT)
    with socketserver.TCPServer(("127.0.0.1", PORT), handler) as httpd:
        print(f"SPA-fallback serving {ROOT} on http://127.0.0.1:{PORT}", flush=True)
        httpd.serve_forever()
