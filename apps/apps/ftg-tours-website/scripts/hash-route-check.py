#!/usr/bin/env python
"""最小驗證：HashRouter 換頁是否真的生效（不經 rwd-parity 的迴圈）。"""
import json
import os
import time
import urllib.request

from websockets.sync.client import connect

PORT = os.environ.get("RWD_CDP_PORT", "9341")
BASE = os.environ.get("RWD_BASE", "http://127.0.0.1:8792")

with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list") as r:
    pages = [t for t in json.loads(r.read().decode()) if t["type"] == "page"]
tgt = pages[0]
tid = tgt["id"]
ws = connect(tgt["webSocketDebuggerUrl"], open_timeout=30, max_size=None)
mid = 0


def call(method, params=None, timeout=60):
    global mid
    mid += 1
    ws.send(json.dumps({"id": mid, "method": method, "params": params or {}}))
    t0 = time.time()
    while time.time() - t0 < timeout:
        m = json.loads(ws.recv(timeout=timeout))
        if m.get("id") == mid:
            return m.get("result", m.get("error"))
    raise TimeoutError(method)


def ev(expr):
    return call("Runtime.evaluate", {"expression": expr, "returnByValue": True})


call("Page.enable")
call("Runtime.enable")

for route in ["/", "/about", "/contact", "/family-day", "/journey-design"]:
    call("Page.navigate", {"url": BASE + "/#" + route})
    time.sleep(3.5)
    href = ev("location.hash")["result"].get("value")
    heads = ev(
        "JSON.stringify(Array.from(document.querySelectorAll('h1,h2'))"
        ".slice(0,3).map(e=>e.textContent.trim().slice(0,26)))"
    )["result"].get("value")
    h = ev("document.documentElement.scrollHeight")["result"].get("value")
    print(f"{route:<18} hash={href!s:<24} 高={h}  標題={heads}")

ws.close()
