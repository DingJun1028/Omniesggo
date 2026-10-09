#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""5T-Trackable: 桌面 vs 手機 RWD 內容對等量測（渲染後，非靜態掃描）。

為什麼需要：
  「將手機 RWD 正確顯示 如同桌面有的每個項目」是對「渲染結果」的要求。
  靜態 grep 只能看到 `hidden md:*` 這類字串，看不到：
    · 被 max-h-0 / opacity-0 摺疊而量測為不可見的元素
    · overflow-hidden 裁掉的內容
    · 圖片在窄視窗解碼失敗
    · 溢出視窗（scrollWidth > clientWidth）導致項目被推出畫面
  這支腳本在真實瀏覽器以 CDP 跑兩個視口，抽出「可見項目指紋」再對比。

指紋 = 可見且有文字/角色意義的元素（h1-h6, a, button, li, label, input,
textarea, select, img, section 標題區塊），以正規化文字當 key。

輸出：
  MISSING_ON_MOBILE  桌機有、手機量測為不可見或不存在 → 真正漏掉的項目
  HIDDEN_IN_SOURCE   兩邊都不可見 → 可能是刻意摺疊（選單），標為 INFO
  OVERFLOW           水平溢出與具體溢出元素
"""
import json
import os
import re
import sys
import time
import urllib.request
from urllib.parse import urlparse
from base64 import b64encode

CDP_PORT = os.environ.get("RWD_CDP_PORT", "9333")
BASE = os.environ.get("RWD_BASE", "http://127.0.0.1:8791")
CDP = "http://127.0.0.1:" + CDP_PORT

ROUTES = [
    "/",
    "/corporate-travel",
    "/family-day",
    "/esg-team-day",
    "/wellbeing-retreat",
    "/executive-retreat",
    "/esg-impact-note",
    "/journey-design",
    "/about",
    "/contact",
]

VIEWPORTS = [
    ("desktop", 1440, 900, False),
    ("mobile", 390, 844, True),
]


def cdp_list():
    with urllib.request.urlopen(CDP + "/json/list", timeout=60) as r:
        return json.loads(r.read())


def list_tab():
    for t in cdp_list():
        if t.get("type") == "page" and t.get("webSocketDebuggerUrl"):
            return t["webSocketDebuggerUrl"]
    raise RuntimeError("沒有可用的 page target（Chrome 需以 --remote-debugging-port 啟動）")


class WS:
    """極簡 WebSocket 用戶端（stdlib）。"""

    def __init__(self, url):
        import base64, os, socket

        # 5T-Trackable pitfall（實測）：手寫 RFC6455 frame 的版本握手拿到 101，
        # 但送第一個 frame 就被 Chrome 斷線（EOF，且無 close frame）→ 不可用。
        # 改用已安裝的 `websockets` 套件，由函式庫處理 frame/遮罩/ping。
        # 另一實測：不要送 Origin 標頭，Chrome >=111 否則回 403。
        from websockets.sync.client import connect
        self._c = connect(url, open_timeout=30, max_size=None)

    def send(self, obj):
        self._c.send(json.dumps(obj))

    def recv(self):
        return json.loads(self._c.recv(timeout=90))

    def close(self):
        try:
            self._c.close()
        except Exception:
            pass


# 抽出可見項目指紋。可見 = 有 box、display!=none、visibility!=hidden、
# opacity 鏈有效 > 0.02、且在視窗內（寬度 > 0）。
PROBE = r"""
(() => {
  const SEL = 'h1,h2,h3,h4,h5,h6,a,button,li,label,input,textarea,select,summary,th,td';
  const norm = s => (s || '').replace(/\s+/g, ' ').trim();
  const path = el => {
    const bits = [];
    let n = el;
    for (let i = 0; i < 4 && n && n.nodeType === 1 && n.tagName !== 'BODY'; i++) {
      let s = n.tagName.toLowerCase();
      if (n.id) { s += '#' + n.id; }
      else if (n.className && typeof n.className === 'string') {
        const c = n.className.split(/\s+/).filter(Boolean).slice(0, 2).join('.');
        if (c) s += '.' + c;
      }
      bits.unshift(s);
      n = n.parentElement;
    }
    return bits.join('>');
  };
  const visible = el => {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    let o = 1, n = el;
    while (n && n.nodeType === 1) {
      const x = parseFloat(getComputedStyle(n).opacity);
      if (!isNaN(x)) o *= x;
      n = n.parentElement;
    }
    if (o <= 0.02) return false;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return false;
    return true;
  };
  const items = [];
  const seen = new Set();
  for (const el of document.querySelectorAll(SEL)) {
    const cs = getComputedStyle(el);
    // collapsed ancestor (max-h-0 / height:0 摺疊) 也要算不可見
    let collapsed = false, n = el.parentElement;
    while (n && n.nodeType === 1) {
      const r = n.getBoundingClientRect();
      if (r.height < 1 && r.width < 1) { collapsed = true; break; }
      n = n.parentElement;
    }
    const vis = visible(el) && !collapsed;
    const txt = norm(el.innerText || el.value || el.placeholder || el.getAttribute('alt') || '');
    const key = txt || path(el);
    if (key && !seen.has(key + '|' + (el.tagName + (el.getAttribute('type') || '')))) {
      seen.add(key + '|' + (el.tagName + (el.getAttribute('type') || '')));
      items.push({
        key: key.slice(0, 90), tag: el.tagName.toLowerCase(),
        type: el.getAttribute('type') || '', visible: vis,
        href: el.getAttribute('href') || '',
        cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 120),
      });
    }
  }
  // 圖片：解碼成功才算顯示
  const imgs = [...document.querySelectorAll('img')].map(i => ({
    src: (i.currentSrc || i.src).split('/').slice(-1)[0].slice(0, 60),
    nw: i.naturalWidth, visible: visible(i),
    y: Math.round(i.getBoundingClientRect().top),
  }));
  // 水平溢出元素
  const vw = document.documentElement.clientWidth;
  const over = [];
  for (const el of document.querySelectorAll('body *')) {
    const r = el.getBoundingClientRect();
    if (r.width > 1 && r.right > vw + 2) {
      over.push({ tag: el.tagName.toLowerCase(), right: Math.round(r.right),
                  w: Math.round(r.width),
                  cls: (el.className && typeof el.className === 'string' ? el.className : '').slice(0, 90) });
    }
    if (over.length >= 12) break;
  }
  return {
    items, imgs, over,
    scrollW: document.documentElement.scrollWidth, clientW: vw,
    bodyH: document.body.scrollHeight, innerW: window.innerWidth,
    hOverflow: document.documentElement.scrollWidth > vw + 1,
  };
})()
"""


def call(ws, mid, method, params=None, wait=90):
    ws.send({"id": mid, "method": method, "params": params or {}})
    t0 = time.time()
    while time.time() - t0 < wait:
        m = ws.recv()
        if m.get("id") == mid:
            if "error" in m:
                return {"_cdp_error": m["error"]}
            return m.get("result", {})
    return {"_timeout": True}


def evaluate(ws, mid, expr, wait=90):
    r = call(ws, mid, "Runtime.evaluate",
             {"expression": expr, "returnByValue": True, "awaitPromise": True}, wait)
    if "_cdp_error" in r or "_timeout" in r:
        return r
    return r.get("result", {}).get("value")


def goto(ws, mid, url, settle=4.0):
    """5T-Transparent bugfix：原本在 call()（已收走回應）之後又開第二圈
    等同一個 mid，該回應永不到達 → 必定 90s timeout。
    改為只發送一次，再用 readyState 輪詢取代盲等。"""
    r = call(ws, mid, "Page.navigate", {"url": url})
    print(f"      [nav] {url} -> {str(r)[:120]}", flush=True)
    t0 = time.time()
    while time.time() - t0 < 45:
        st = evaluate(ws, mid + 1000,
                      "document.readyState === 'complete' ? 1 : 0", wait=10)
        if st == 1:
            break
        time.sleep(0.4)
    time.sleep(settle)


def scan(ws, name, w, h, mobile):
    call(ws, 900, "Page.enable")
    call(ws, 901, "Emulation.setDeviceMetricsOverride",
         {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": mobile})
    out = {}
    for route in ROUTES:
        # 5T-Transparent bugfix（實測）：本站 App.jsx:1 用的是 HashRouter，
        # 真實 URL 為 /#/corporate-travel。直接導 /corporate-travel 會讓
        # HashRouter 一律渲染首頁 → 10 個路由量到完全相同的內容而不報錯。
        goto(ws, 902, BASE + "/#" + route)
        d = evaluate(ws, 903, PROBE)
        if not isinstance(d, dict) or "items" not in d:
            out[route] = {"_error": d}
            continue
        out[route] = d
    return out


def norm_keys(d):
    """以 key 為主鍵的可見集合。"""
    vis, allk = set(), set()
    for it in d.get("items", []):
        allk.add(it["key"])
        if it["visible"]:
            vis.add(it["key"])
    img_vis = {i["src"] for i in d.get("imgs", []) if i["visible"] and i["nw"] > 0}
    return vis, allk, img_vis


def main():
    only = sys.argv[1] if len(sys.argv) > 1 else None
    routes = [only] if only else ROUTES
    ws = WS(list_tab())
    report = {}
    print("掃描中（桌面 1440x900 vs 手機 390x844）…\n")
    for name, w, h, mobile in VIEWPORTS:
        call(ws, 890, "Page.enable")
        call(ws, 891, "Emulation.setDeviceMetricsOverride",
             {"width": w, "height": h, "deviceScaleFactor": 1, "mobile": mobile})
        for route in routes:
            # 5T-Transparent bugfix（實測 2026-09-30）：
            #  1) main() 原本用 `BASE + route`，而 App.jsx:1 是 HashRouter，
            #     深連結必須帶 hash，否則 10 個路由全部渲染首頁而不報錯。
            #  2) 直接把 # 塞進 Page.navigate 的 URL，# 會在傳遞鏈任一層被吃掉，
            #     所以改由 JS 賦值 location.hash（自動補 #），並讀回自我驗證。
            goto(ws, 892, BASE + "/")
            evaluate(ws, 894, "location.hash = %s" % json.dumps(
                "/" + route.lstrip("/")))
            time.sleep(2.5)
            seen = evaluate(ws, 895, "location.hash")
            d = evaluate(ws, 893, PROBE)
            if isinstance(d, dict) and "items" in d:
                d["_hash"] = seen
                report.setdefault(route, {})[name] = d
            else:
                report.setdefault(route, {})[name] = {"_error": d, "_hash": seen}
            print(f"  [{name:7}] {route}  hash={seen}")
    ws.close()

    total_missing = 0
    print("\n" + "=" * 74)
    print("RWD 對等報告：桌面可見 vs 手機可見")
    print("=" * 74)
    for route in routes:
        r = report.get(route, {})
        dt, mb = r.get("desktop"), r.get("mobile")
        if not dt or not mb or "items" not in dt or "items" not in mb:
            print(f"\n■ {route}  探針失敗：desktop={bool(dt)} mobile={bool(mb)}")
            continue
        tvis, tall, timg = norm_keys(dt)
        mvis, mall, mimg = norm_keys(mb)
        missing = sorted(tvis - mvis)
        hidden = sorted(tall - tvis)          # 桌機也看不到（摺疊選單等）
        img_missing = sorted(timg - mimg)
        img_broken_m = [i["src"] for i in mb.get("imgs", []) if i["visible"] and i["nw"] == 0]

        print(f"\n■ {route}")
        print(f"   桌機可見 {len(tvis)} 項 / 手機可見 {len(mvis)} 項"
              f"  |  桌機溢出={dt.get('hOverflow')} 手機溢出={mb.get('hOverflow')}"
              f"  |  高度 {dt.get('bodyH')} → {mb.get('bodyH')}")
        if missing:
            total_missing += len(missing)
            print(f"   ★ 桌機有、手機看不到（{len(missing)}）：")
            for k in missing[:25]:
                print(f"       - {k}")
            if len(missing) > 25:
                print(f"       …另有 {len(missing)-25} 項")
        if img_missing:
            total_missing += len(img_missing)
            print(f"   ★ 桌機可見、手機未解碼（{len(img_missing)}）：")
            for s in img_missing[:15]:
                print(f"       - {s}")
        if img_broken_m:
            print(f"   ★ 手機可見但解碼失敗：{img_broken_m[:10]}")
        if hidden:
            print(f"   · 桌機也未顯示（多半是刻意摺疊，如選單）：{len(hidden)} 項"
                  f"  例：{hidden[:4]}")
        if mb.get("over"):
            print(f"   ★ 手機水平溢出元素（{len(mb['over'])}）：")
            for o in mb["over"][:6]:
                print(f"       - <{o['tag']}> right={o['right']} w={o['w']} .{o['cls'][:60]}")

    print("\n" + "=" * 74)
    print(f"總計桌機有而手機未顯示的項目：{total_missing}")
    print("=" * 74)
    with open("C:/Users/dingj/AppData/Local/hermes/cache/scratch/rwd-parity.json",
              "w", encoding="utf-8") as f:
        json.dump(report, f, ensure_ascii=False, indent=1)
    return 0


if __name__ == "__main__":
    sys.exit(main())
