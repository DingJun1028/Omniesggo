#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""5T-Trackable: 透過 CDP 量測 dist 的實際渲染狀態（桌面 + 手機）。

為什麼需要（OMH 要求 served-surface 驗證）：先前所有結論都停在靜態層
（curl 抓檔、sha256 比對、dist 引用字串掃描）。這支腳本改為查**瀏覽器
真正渲染後**的狀態，回答三個靜態層回答不了的問題：
  1. 重新命名的 13 張圖片，在瀏覽器眼裡是否真的 naturalWidth > 0（成功解碼）
  2. 自架字型是否真的被套用（getComputedStyle + document.fonts 狀態）
  3. 版面是否溢出（scrollWidth > clientWidth = 水平捲軸）
"""
import json
import sys
import time
import urllib.request
from base64 import b64encode

CDP = "http://127.0.0.1:9333"
URL = "http://127.0.0.1:8791/"


def cdp(path, payload=None):
    req = urllib.request.Request(CDP + path, method="POST" if payload else "GET")
    data = json.dumps(payload).encode() if payload else None
    req.add_header("Content-Type", "application/json")
    with urllib.request.urlopen(req, data, timeout=90) as r:
        return json.loads(r.read())


def list_tab():
    """抓第一個可用的 page target（不新建，避免 /json/new 的 PUT 限制）。"""
    with urllib.request.urlopen(CDP + "/json/list", timeout=60) as r:
        tabs = json.loads(r.read())
    for t in tabs:
        if t.get("type") == "page" and t.get("webSocketDebuggerUrl"):
            return t["webSocketDebuggerUrl"], t["id"]
    raise RuntimeError("沒有可用的 page target")


class WS:
    """極簡 WebSocket 用戶端（stdlib，僅支援文字收發 + mask）。"""

    def __init__(self, url):
        from urllib.parse import urlparse
        import base64, os, socket, struct

        u = urlparse(url)
        self.s = socket.create_connection((u.hostname, u.port), timeout=90)
        key = b64encode(os.urandom(16)).decode()
        self.s.sendall(
            f"GET {u.path} HTTP/1.1\r\nHost: {u.hostname}:{u.port}\r\n"
            f"Upgrade: websocket\r\nConnection: Upgrade\r\n"
            f"Sec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n".encode()
        )
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.s.recv(4096)
        self.buf = buf.split(b"\r\n\r\n", 1)[1]
        self.i = 0

    def _recv(self, n):
        while len(self.buf) < n:
            chunk = self.s.recv(65536)
            if not chunk:
                raise EOFError
            self.buf += chunk
        out, self.buf = self.buf[:n], self.buf[n:]
        return out

    def send(self, obj):
        import struct
        p = json.dumps(obj).encode()
        mask = b64encode(__import__("os").urandom(4))
        n = len(p)
        hdr = b"\x81"
        if n < 126:
            hdr += bytes([0x80 | n])
        elif n < 65536:
            hdr += bytes([0x80 | 126]) + struct.pack(">H", n)
        else:
            hdr += bytes([0x80 | 127]) + struct.pack(">Q", n)
        masked = bytes(p[i] ^ mask[i % 4] for i in range(n))
        self.s.sendall(hdr + mask + masked)

    def recv(self):
        import struct
        while True:
            b0, b1 = self._recv(2)
            op = b0 & 0x0F
            ln = b1 & 0x7F
            if ln == 126:
                ln = struct.unpack(">H", self._recv(2))[0]
            elif ln == 127:
                ln = struct.unpack(">Q", self._recv(8))[0]
            pay = self._recv(ln) if ln else b""
            if op == 1:
                return json.loads(pay)
            if op == 8:
                raise EOFError


PROBE = r"""
(() => {
  const imgs = [...document.querySelectorAll('img')];
  const fonts = [...document.fonts].map(f => ({
    family: f.family, weight: f.weight, status: f.status }));
  const loaded = fonts.filter(f => f.status === 'loaded')
                      .map(f => f.family + ' ' + f.weight);
  // 取一個含中文的元素看實際算出的 font-family
  let sampleFF = null, sampleText = null;
  for (const el of document.querySelectorAll('h1,h2,h3,p,span,a')) {
    const t = (el.textContent || '').trim();
    if (/[\u4e00-\u9fff]/.test(t) && t.length > 1) {
      const cs = getComputedStyle(el);
      sampleFF = cs.fontFamily; sampleText = t.slice(0, 30);
      sampleColor = cs.color;
      break;
    }
  }
  return {
    imgs: imgs.map(i => ({
      src: i.currentSrc || i.src, nw: i.naturalWidth, nh: i.naturalHeight,
      complete: i.complete, alt: (i.alt||'').slice(0,20) })),
    broken: imgs.filter(i => i.complete && i.naturalWidth === 0)
               .map(i => i.currentSrc || i.src),
    fontsLoaded: loaded, fontCount: fonts.length,
    sampleFF, sampleText, sampleColor,
    scrollW: document.documentElement.scrollWidth,
    clientW: document.documentElement.clientWidth,
    innerW: window.innerWidth,
    hOverflow: document.documentElement.scrollWidth >
               document.documentElement.clientWidth + 1,
    bodyH: document.body.scrollHeight,
  };
})()
"""


def run(ws, mid, expr, timeout=60):
    ws.send({"id": mid, "method": "Runtime.evaluate",
             "params": {"expression": expr, "returnByValue": True,
                         "awaitPromise": True}})
    t0 = time.time()
    while time.time() - t0 < timeout:
        m = ws.recv()
        if m.get("id") == mid:
            if "error" in m:
                return {"_cdp_error": m["error"]}
            return m["result"]["result"].get("value")
    return {"_timeout": True}


def main():
    widths = [("desktop", 1440, 900), ("mobile", 390, 844)]
    all_out = {}
    for name, w, h in widths:
        ws_url, tab_id = list_tab()
        ws = WS(ws_url)
        mid = 100
        # 1) 啟用 Page
        mid += 1
        ws.send({"id": mid, "method": "Page.enable"})
        while ws.recv().get("id") != mid:
            pass
        # 2) 設定 viewport
        mid += 1
        ws.send({"id": mid, "method": "Emulation.setDeviceMetricsOverride",
                 "params": {"width": w, "height": h, "deviceScaleFactor": 1,
                            "mobile": name == "mobile"}})
        while ws.recv().get("id") != mid:
            pass
        # 3) 導頁
        mid += 1
        ws.send({"id": mid, "method": "Page.navigate", "params": {"url": URL}})
        t0 = time.time()
        while time.time() - t0 < 60:
            m = ws.recv()
            if m.get("id") == mid:
                break
        time.sleep(6)  # 讓 React + 字型 + 圖片都完成載入
        mid += 1
        data = run(ws, mid, PROBE)
        all_out[name] = data
        print(f"\n{'='*60}\n【{name}】 viewport {w}×{h}\n{'='*60}")
        if not data or "_cdp_error" in str(data) or "_timeout" in str(data):
            print("  探針失敗:", data)
            continue
        print(f"  視窗寬度 {data['innerW']}px  文件高 {data['bodyH']}px")
        print(f"  水平溢出: {'★有（★scrollW=%d > clientW=%d）' % (data['scrollW'], data['clientW']) if data['hOverflow'] else '無 ✓'}")
        print(f"  字型: 宣告 {data['fontCount']} 個, 已載入 {len(data['fontsLoaded'])} 個")
        for f in data["fontsLoaded"][:8]:
            print(f"     ✓ {f}")
        if data.get("sampleText"):
            print(f"  中文抽樣: 「{data['sampleText']}」")
            print(f"     font-family = {data['sampleFF']}")
            print(f"     color       = {data['sampleColor']}")
        print(f"  <img> 總數 {len(data['imgs'])}")
        ok = [i for i in data["imgs"] if i["nw"] > 0]
        print(f"     成功解碼 {len(ok)} / 損壞 {len(data['broken'])}")
        for i in data["imgs"]:
            mark = "✓" if i["nw"] > 0 else "★"
            print(f"     {mark} {i['nw']}x{i['nh']}  {i['src'].split('/')[-1][:52]}")
        if data["broken"]:
            print("  ★ 損壞清單:")
            for b in data["broken"]:
                print(f"     - {b}")
        ws.s.close()
    with open("C:/Users/dingj/AppData/Local/hermes/cache/scratch/render-probe.json",
              "w", encoding="utf-8") as f:
        json.dump(all_out, f, ensure_ascii=False, indent=2)
    return 0


if __name__ == "__main__":
    sys.exit(main())
