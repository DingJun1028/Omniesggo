"""
web_streamer.py — WebSocket 字幕串流伺服器
讓其他人用瀏覽器即時觀看字幕
"""
import json
import asyncio
import threading
from typing import Optional
from urllib.parse import urlparse
from http.server import HTTPServer, SimpleHTTPRequestHandler
import socketserver

try:
    import websockets
    HAS_WEBSOCKETS = True
except ImportError:
    HAS_WEBSOCKETS = False

# 全域連線集合
_clients = set()
_clients_lock = threading.Lock()


class ThreadedHTTPServer(socketserver.ThreadingMixIn, HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class ViewerHTTPHandler(SimpleHTTPRequestHandler):
    """提供 viewer.html"""

    def do_GET(self):
        if self.path in ('/', '/viewer.html'):
            self.send_response(200)
            self.send_header('Content-Type', 'text/html; charset=utf-8')
            self.end_headers()
            # 動態注入 WS port 和 host
            html = VIEWER_HTML.replace('__WS_PORT__', str(self.server.ws_port))
            html = html.replace('__WS_HOST__', getattr(self.server, 'ws_host', '') or '')
            self.wfile.write(html.encode('utf-8'))
        else:
            self.send_error(404)

    def log_message(self, format, *args):
        pass  # 關閉 HTTP 日誌


async def ws_handler(websocket, path=None):
    """WebSocket 連線處理"""
    with _clients_lock:
        _clients.add(websocket)
    print(f"[Web] 新檢視者加入 (共 {len(_clients)} 人)", flush=True)
    try:
        await websocket.wait_closed()
    finally:
        with _clients_lock:
            _clients.discard(websocket)
        print(f"[Web] 檢視者離開 (剩餘 {len(_clients)} 人)", flush=True)


async def broadcast_caption(source: str, translated: str, direction: str):
    """廣播字幕到所有連線檢視者"""
    if not _clients:
        return

    msg = json.dumps({
        'source': source,
        'translated': translated,
        'direction': direction,
        'timestamp': asyncio.get_event_loop().time()
    }, ensure_ascii=False)

    disconnected = set()
    with _clients_lock:
        clients = _clients.copy()

    for ws in clients:
        try:
            await ws.send(msg)
        except Exception:
            disconnected.add(ws)

    if disconnected:
        with _clients_lock:
            _clients.difference_update(disconnected)


class WebStreamer:
    """字幕 Web 串流伺服器"""

    def __init__(self, http_port: int = 8080, ws_port: int = 8081,
                 host: str = "0.0.0.0", static_dir: str = ".", ws_host: str = ""):
        self.http_port = http_port
        self.ws_port = ws_port
        self.host = host
        self.static_dir = static_dir
        self.ws_host = ws_host
        self._running = False
        self._thread: Optional[threading.Thread] = None

    def start(self):
        """啟動 HTTP + WebSocket 伺服器"""
        if not HAS_WEBSOCKETS:
            print("[Web] websockets 套件未安裝，跳過 Web 串流", flush=True)
            return

        self._running = True
        self._thread = threading.Thread(target=self._run, daemon=True)
        self._thread.start()
        print(f"[Web] 檢視網址: http://localhost:{self.http_port}/viewer.html", flush=True)
        print(f"[Web] 內網分享: http://<你的IP>:{self.http_port}/viewer.html", flush=True)

    def _run(self):
        """在背景執行事件迴圈"""
        import os
        os.chdir(self.static_dir)

        asyncio.set_event_loop(asyncio.new_event_loop())
        loop = asyncio.get_event_loop()

        async def _serve():
            # HTTP 伺服器 (在另一個 thread)
            httpd = ThreadedHTTPServer(('0.0.0.0', self.http_port), ViewerHTTPHandler)
            httpd.ws_port = self.ws_port
            http_thread = threading.Thread(target=httpd.serve_forever, daemon=True)
            http_thread.start()

            # WebSocket 伺服器
            ws_server = await websockets.serve(
                ws_handler,
                '0.0.0.0',
                self.ws_port,
                ping_interval=20,
                ping_timeout=10,
            )
            await ws_server.wait_closed()

        loop.run_until_complete(_serve())

    def stop(self):
        """停止伺服器"""
        self._running = False

    def push_caption(self, source: str, translated: str, direction: str):
        """推送字幕到所有檢視者"""
        if not _clients or not HAS_WEBSOCKETS:
            return
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            return
        asyncio.run_coroutine_threadsafe(
            broadcast_caption(source, translated, direction),
            loop
        )


# 網頁檢視器 HTML
VIEWER_HTML = """<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>即時字幕翻譯</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body {
  font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', sans-serif;
  background: linear-gradient(135deg, #10243f 0%, #1a3554 50%, #0d1f36 100%);
  color: #f3ede1;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 900px;
  margin-bottom: 20px;
  padding: 10px 20px;
  background: rgba(201, 162, 75, 0.1);
  border-radius: 12px;
  border: 1px solid rgba(201, 162, 75, 0.3);
}
.header h1 {
  font-size: 18px;
  color: #c9a24b;
  font-weight: 600;
}
.status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #a0b4c8;
}
.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3c6e47;
  animation: pulse 2s infinite;
}
.status-dot.disconnected { background: #ff4444; animation: none; }
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
.caption-container {
  width: 100%;
  max-width: 900px;
  background: rgba(0, 0, 0, 0.4);
  border-radius: 16px;
  padding: 24px;
  min-height: 200px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
.source-text {
  font-size: 28px;
  font-weight: bold;
  color: #ffffff;
  margin-bottom: 16px;
  line-height: 1.4;
  text-align: center;
  min-height: 40px;
}
.translated-text {
  font-size: 24px;
  color: #c9a24b;
  line-height: 1.4;
  text-align: center;
  min-height: 34px;
}
.direction {
  text-align: center;
  margin-top: 16px;
  font-size: 13px;
  color: #8899aa;
}
.divider {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, transparent, #c9a24b, transparent);
  margin: 16px auto;
}
.history {
  width: 100%;
  max-width: 900px;
  margin-top: 24px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}
.history h2 {
  font-size: 14px;
  color: #8899aa;
  margin-bottom: 12px;
  text-transform: uppercase;
  letter-spacing: 1px;
}
.history-item {
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}
.history-item:last-child { border-bottom: none; }
.history-source { font-size: 16px; color: #ddd; margin-bottom: 4px; }
.history-translated { font-size: 15px; color: #c9a24b; }
.history-meta { font-size: 11px; color: #667788; margin-top: 4px; }
.empty-state {
  text-align: center;
  color: #556677;
  font-size: 16px;
  padding: 40px 20px;
}
@media (max-width: 600px) {
  .source-text { font-size: 22px; }
  .translated-text { font-size: 18px; }
  .caption-container { padding: 16px; }
}
</style>
</head>
<body>
<div class="header">
  <h1>即時字幕翻譯 — Zoom Live Caption</h1>
  <div class="status">
    <span class="status-dot" id="statusDot"></span>
    <span id="statusText">連線中...</span>
  </div>
</div>
<div class="caption-container">
  <div class="source-text" id="sourceText">等待語音...</div>
  <div class="divider"></div>
  <div class="translated-text" id="translatedText"></div>
  <div class="direction" id="direction"></div>
</div>
<div class="history" id="historySection" style="display:none;">
  <h2>歷史紀錄</h2>
  <div id="historyList"></div>
</div>

<script>
const wsPort = __WS_PORT__;
const wsHost = '__WS_HOST__';
const wsProtocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsUrl = wsHost ? `${wsProtocol}//${wsHost}:${wsPort}` : `${wsProtocol}//${location.hostname}:${wsPort}`;
const ws = new WebSocket(wsUrl);

const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const sourceText = document.getElementById('sourceText');
const translatedText = document.getElementById('translatedText');
const directionText = document.getElementById('direction');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
let history = [];

ws.onopen = () => {
  statusDot.classList.remove('disconnected');
  statusText.textContent = '已連線';
};

ws.onclose = () => {
  statusDot.classList.add('disconnected');
  statusText.textContent = '已中斷，重新連線中...';
  setTimeout(() => location.reload(), 3000);
};

ws.onerror = () => {
  statusDot.classList.add('disconnected');
  statusText.textContent = '連線錯誤';
};

ws.onmessage = (event) => {
  try {
    const data = JSON.parse(event.data);
    sourceText.textContent = data.source;
    translatedText.textContent = data.translated;
    const dirLabel = data.direction === 'mic' ? '演講者' : '對方';
    directionText.textContent = `${dirLabel} · ${new Date().toLocaleTimeString()}`;
    addToHistory(data);
  } catch(e) {}
};

function addToHistory(data) {
  history.unshift({
    source: data.source,
    translated: data.translated,
    direction: data.direction,
    time: new Date().toLocaleTimeString()
  });
  if (history.length > 20) history.pop();
  renderHistory();
}

function renderHistory() {
  if (history.length === 0) {
    historySection.style.display = 'none';
    return;
  }
  historySection.style.display = 'block';
  historyList.innerHTML = history.map(item => `
    <div class="history-item">
      <div class="history-source">${escapeHtml(item.source)}</div>
      <div class="history-translated">${escapeHtml(item.translated)}</div>
      <div class="history-meta">${item.direction === 'mic' ? '演講者' : '對方'} · ${item.time}</div>
    </div>
  `).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
</script>
</body>
</html>
"""
