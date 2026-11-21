#!/usr/bin/env python
"""線上渲染實證：對正式域名逐條路由做真瀏覽器驗收（5T-Trackable / Tangible）。

為什麼不能用 curl 看 HTTP status：
  本專案是 HashRouter + nginx SPA fallback。任何字串路徑都回 200，
  包括不存在的路徑。實測 bytes 也是 0（HEAD 語意）。
  「路由回 200」不構成任何證據 —— 這是本檔存在的第一原因。

為什麼不能比對 bundle 內的字串、也不能比對 CSS 類名：
  verify_live_routes.py 只證明「路由定義字串存在於 bundle」，
  不證明 React 真的 render 出來 —— 路由全部命中首頁時它一樣會 PASS。
  verify_live_overlay.py 原本比對 Tailwind 類名（.bg-ftg-forest/[0.42] 等），
  但類名會隨 Tailwind 版本與 purge 結果消失，且它斷言的是「舊的全域遮罩
  必須存在」，與現在的設計相反（照片要明亮、不加全域遮罩）。
  2026-10-02 實測該腳本 6/6 全數「規則不存在」，等於把修復前的 bug
  狀態當成契約。CSS 類名比對是脆弱契約，真實瀏覽器量測才是證據。

因此本檔在 headless Chromium 實際 render，量測使用者真正看到的東西：
  - 每條路由的 h1 與畫面長度 → 證明路由真的分流（而非全部渲染首頁）
  - 不存在的路由是否落到 404 → 證明 catch-all 有效
  - 破圖 / JS 例外 / 橫向溢出 → 證明頁面可用
  - 觸控目標尺寸 → 證明手機可點
  - 橫幅幾何：全幅遮罩數必須為 0、文字方框必須恰好 1 → 證明照片明亮
  - 英文版地址欄位 → 證明沒漏翻譯
  - 44px 觸控目標下限依 Apple HIG / WCAG 2.5.5

用法：
  python scripts/verify_live_render.py                 # 對正式域名驗收
  python scripts/verify_live_render.py --base http://127.0.0.1:8791
  python scripts/verify_live_render.py --routes-only    # 跳過瀏覽器，只做路由分流檢查
  python scripts/verify_live_render.py --allow-no-browser  # 環境無 Chromium 時降級警告

退出碼：0 = 全部通過 / 1 = 有項目未通過 / 2 = 環境不足且未允許降級
"""
import argparse
import os
import re
import sys
import time
import urllib.request

BASE = "https://ftgtours.esggo.co"
UA_DESKTOP = "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
UA_MOBILE = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) "
             "AppleWebKit/605.1.15 (KHTML, like Gecko) "
             "Version/17.0 Mobile/15E148 Safari/604.1")

# 13 條具名路由 + 1 條故意不存在的路徑（驗 catch-all）= 14
ROUTES = [
    "/", "/corporate-travel", "/family-day", "/esg-team-day",
    "/wellbeing-retreat", "/executive-retreat", "/esg-impact-note",
    "/contact", "/journey-design", "/streams", "/privacy", "/terms",
    "/about",
]
NOT_FOUND_ROUTE = "/this-route-does-not-exist"
TAP_MIN = 44  # WCAG 2.5.5 / Apple HIG

VIEWPORTS = {
    "desktop": {"width": 1440, "height": 900, "mobile": False},
    "mobile": {"width": 390, "height": 844, "mobile": True},
}

PROBE_JS = """() => {
  const root = document.getElementById('root');
  const b = document.body;
  const imgs = [...document.images];
  const clickables = [...document.querySelectorAll('a,button,[role=button]')]
      .filter(e => e.offsetParent !== null);
  const small = clickables.filter(e => {
      const r = e.getBoundingClientRect();
      return r.width > 0 && r.height > 0 &&
             (r.height < MIN || r.width < MIN);
    }).map(e => {
      const r = e.getBoundingClientRect();
      const label = (e.innerText || e.ariaLabel || '').trim().slice(0, 18);
      return `${e.tagName}:${label}[${Math.round(r.width)}x${Math.round(r.height)}]`;
    });

  // 橫幅幾何：找出「全幅半透明層」與「文字後方框」
  const hero = [...document.querySelectorAll('section,header,div')]
      .find(e => e.querySelector(':scope > img, :scope > div > img'));
  let fullBleed = 0, textBoxes = 0, heroImg = null;
  if (hero) {
    const img = hero.querySelector('img');
    heroImg = img ? getComputedStyle(img).filter : 'n/a';
    const hb = hero.getBoundingClientRect();
    fullBleed = [...hero.children].filter(e => {
      if (e.tagName === 'IMG') return false;
      const r = e.getBoundingClientRect();
      const bg = getComputedStyle(e).backgroundColor;
      const semi = /rgba\\(.*,\\s*0?\\.[1-9]/.test(bg);
      return semi && r.width >= hb.width * 0.95 && r.height >= hb.height * 0.95;
    }).length;
    textBoxes = [...hero.querySelectorAll('h1,h2,p,div')].filter(e => {
      const bg = getComputedStyle(e).backgroundColor;
      return /rgba\\(0,\\s*0,\\s*0,\\s*0?\\.[3-9]/.test(bg) ||
             /rgba\\(.*,\\s*0?\\.[5-9]\\)/.test(bg);
    }).length;
  }

  return {
    hash: location.hash,
    h1: document.querySelector('h1')?.innerText?.trim().slice(0, 60) || null,
    h1Count: document.querySelectorAll('h1').length,
    len: (root?.innerText || '').trim().length,
    imgs: imgs.length,
    broken: imgs.filter(i => i.complete && i.naturalWidth === 0).map(i => i.src.slice(0, 80)),
    overflow: b.scrollWidth > window.innerWidth + 1,
    sw: b.scrollWidth, iw: window.innerWidth,
    is404: /404|找不到|not found/i.test(root?.innerText || ''),
    fullBleed, textBoxes, heroImg,
    smallTargets: [...new Set(small)].slice(0, 6),
    smallCount: small.length,
    footerAddress: (document.querySelector('footer')?.innerText || '')
        .match(/\\d{5,6}\\s+[\\u4e00-\\u9fff][^\\n]*|Xingde Rd[^\\n]*/)?.[0]?.slice(0, 60)
        || null,
  };
}"""


HOST_HEADER = None  # 由 main 依 --host-header 設定，供 fetch() 使用


def fetch(url, timeout=60):
    headers = {"User-Agent": UA_DESKTOP, "Cache-Control": "no-cache"}
    # 對 127.0.0.1 取站點內容時必須帶 Host，否則 nginx 會回預設 vhost，
    # 拿到的是別的站（或 404），preflight 會誤判成「找不到 bundle 引用」。
    if HOST_HEADER and url.startswith(
            ("http://127.0.0.1", "https://127.0.0.1",
             "http://localhost", "https://localhost")):
        headers["Host"] = HOST_HEADER
    req = urllib.request.Request(url, headers=headers)
    # CI 路徑會指向 VPS 本機 nginx，其憑證非公共 CA 簽發。
    # 這裡只影響「抓 HTML 確認 bundle 引用」這一步，TLS 身分由後續
    # TLS 驗證等級（--tls-allow-selfsigned）另行把關。
    ctx = None
    if url.startswith("https://127.0.0.1") or url.startswith("https://localhost"):
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
    with urllib.request.urlopen(req, timeout=timeout, context=ctx) as r:
        return r.read().decode("utf-8", "replace")


def preflight(base):
    """確認線上 bundle 與本機 dist 是同一份 —— 部署鏈路任一環節都可能只送出一部分。"""
    import glob
    import os
    print("== 0/3 部署鏈路一致性 ==")
    html = fetch(base + "/")
    m = re.search(r'src="(/assets/index-[A-Za-z0-9_-]+\.js)"', html)
    if not m:
        print("  FAIL: 無法從線上 HTML 找出 bundle 引用")
        return False
    live_js = m.group(1)
    print(f"  線上 bundle: {live_js}")

    repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    local = glob.glob(os.path.join(repo, "dist", "assets", "index-*.js"))
    if local:
        local_js = "/" + os.path.relpath(local[0], os.path.join(repo, "dist")).replace(os.sep, "/")
        same = local_js == live_js
        print(f"  本機 dist  : {local_js}")
        print(f"  → {'一致 ✅' if same else '不一致 ❌ 線上不是本機剛 build 的版本'}")
        if not same:
            return False
    else:
        print("  本機無 dist/（跳過比對）")
    print()
    return True


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default=BASE)
    ap.add_argument("--routes-only", action="store_true",
                    help="只做路由分流檢查，不啟動瀏覽器")
    ap.add_argument("--allow-no-browser", action="store_true",
                    help="無 Chromium 時降級為警告而非失敗")
    ap.add_argument("--tls-allow-selfsigned", action="store_true",
                    help="允許自簽憑證（CI 對 VPS 本機 nginx 驗證時需要）")
    ap.add_argument("--host-header", default=None,
                    help="覆寫 Host header（僅用於 urllib preflight；"
                         "瀏覽器層 Chromium 禁止覆寫 Host，請改用 "
                         "http://localhost:<port> + nginx 預設 vhost）")
    args = ap.parse_args()
    base = args.base.rstrip("/")
    global HOST_HEADER
    HOST_HEADER = args.host_header

    print("=" * 74)
    print(f"線上渲染實證 — {base}")
    print("=" * 74)
    print()

    if not preflight(base):
        return 1

    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print("FAIL: 未安裝 playwright。")
        print("  安裝：python -m pip install playwright && python -m playwright install chromium")
        return 2 if not args.allow_no_browser else 0

    all_routes = ROUTES + [NOT_FOUND_ROUTE]
    results, sigs, failures = [], {}, []

    try:
        from playwright.sync_api import sync_playwright
        pw = sync_playwright().start()
    except Exception as exc:
        print(f"FAIL: 無法啟動 Playwright：{exc}")
        print("  安裝：python -m playwright install chromium")
        return 2 if not args.allow_no_browser else 0

    # playwright 升級後預設路徑會變（chromium_headless_shell-<build>），
    # 但既有安裝常停在舊 build。自動挑一個真實存在的 chromium，
    # 否則錯誤訊息會指向不存在的路徑，讓人誤以為要重裝整個瀏覽器。
    import glob
    ms_root = os.path.expandvars(r"%LOCALAPPDATA%\ms-playwright")
    cands = []
    for pat in ("chromium-*/chrome-win*/chrome.exe",
                "chromium_headless_shell-*/chrome-headless-shell-win64/"
                "chrome-headless-shell.exe"):
        cands += sorted(glob.glob(os.path.join(ms_root, pat)), reverse=True)
    launch = {"headless": True, "args": ["--no-sandbox"]}
    if cands:
        launch["executable_path"] = cands[0]
        print(f"  Chromium: {os.path.basename(os.path.dirname(cands[0]))}")
    else:
        print("  WARN: 找不到 Chromium，改用 playwright 預設路徑")
        print("        若因此失敗請執行：python -m playwright install chromium")
    print()

    browser = None
    ctx_kw = {}
    if args.tls_allow_selfsigned:
        ctx_kw["ignore_https_errors"] = True
    # 刻意不在這裡設 extra_http_headers={"Host": ...}：
    # Chromium 禁止腳本覆寫 Host header，帶了會直接 ERR_INVALID_ARGUMENT。
    # 要指定 vhost 請用 http://localhost:<port> 搭配 nginx 預設 vhost。
    try:
        browser = pw.chromium.launch(**launch)
        for vp_name, cfg in VIEWPORTS.items():
            if args.routes_only and vp_name != "desktop":
                continue
            print(f"===== {vp_name} ({cfg['width']}x{cfg['height']}) =====")
            ctx = browser.new_context(
                viewport={"width": cfg["width"], "height": cfg["height"]},
                is_mobile=cfg["mobile"], has_touch=cfg["mobile"],
                user_agent=UA_MOBILE if cfg["mobile"] else UA_DESKTOP,
                locale="zh-TW", **ctx_kw,
            )
            page = ctx.new_page()
            # 5T-Trustworthy：listener 必須在迴圈外綁一次。
            # 舊版在 for 迴圈內 page.on()，每條路由多綁一對 handler；又因為
            # errs 每輪重新賦值成新 list，早期的 handler 仍寫進已被丟棄的舊
            # list，錯誤被吞掉且數量失真（實測 14 條路由只有第 1 條看得到
            # JS_ERR）。現在 errs 全程同一個物件，只 clear() 不重新賦值。
            errs: list[str] = []
            page.on("pageerror", lambda e: errs.append(str(e)[:200]))
            page.on("console", lambda m: errs.append(m.text[:200])
                    if m.type == "error" else None)
            for route in all_routes:
                errs.clear()
                page.goto(f"{base}/#{route}", wait_until="networkidle", timeout=45000)
                page.wait_for_timeout(500)
                data = page.evaluate(PROBE_JS.replace("MIN", str(TAP_MIN)))

                issues = []
                if data["h1Count"] != 1:
                    issues.append(f"H1x{data['h1Count']}")
                if data["len"] < 40:
                    issues.append("WHITE_SCREEN")
                if data["overflow"]:
                    issues.append("H_OVERFLOW")
                if data["broken"]:
                    issues.append(f"BROKEN_IMG({len(data['broken'])})")
                if errs:
                    issues.append(f"JS_ERR({len(errs)})")
                if route == NOT_FOUND_ROUTE and not data["is404"]:
                    issues.append("CATCHALL_NOT_404")
                if route != NOT_FOUND_ROUTE and data["is404"]:
                    issues.append("UNEXPECTED_404")
                if data["fullBleed"]:
                    issues.append(f"FULLBLEED_OVERLAY({data['fullBleed']})")
                if data["textBoxes"] > 1:
                    issues.append(f"MULTI_TEXTBOX({data['textBoxes']})")
                if data["smallCount"]:
                    issues.append(f"TAP<{TAP_MIN}px({data['smallCount']})")

                flag = "OK" if not issues else "!! " + ",".join(issues)
                print(f"  {route:<28} h1={str(data['h1'])[:26]:<28} "
                      f"len={data['len']:<5} img={data['imgs']:<3} "
                      f"sw={data['sw']}/{data['iw']} "
                      f"遮罩={data['fullBleed']}/{data['textBoxes']} {flag}")
                if issues:
                    failures.append((vp_name, route, issues, data))

                sigs.setdefault((vp_name, data["h1"], data["len"]), []).append(route)
                results.append({"vp": vp_name, "route": route, **data,
                                "issues": issues, "errors": errs[:3]})
            ctx.close()

        # 英文版檢查必須在 try 內：finally 會 pw.stop()，
        # 之后再 new_context() 會得到 "Event loop is closed"。
        print()
        print("===== 英文版頁尾地址（須先注入 ftg_lang=en，否則會看到中文版）=====")
        # locale 由 localStorage.ftg_lang 驅動（LanguageContext.jsx:6,11）。
        # 未先注入就斷言「英文版地址」會拿到中文版頁尾——
        # 那會把腳本缺陷誤報成站點缺陷，必須先切語系。
        ctx_en = browser.new_context(
            viewport={"width": 1440, "height": 900}, locale="en-US",
            user_agent=UA_DESKTOP, **ctx_kw,
        )
        ctx_en.add_init_script("window.localStorage.setItem('ftg_lang','en')")
        page_en = ctx_en.new_page()
        for route in ["/", "/contact", "/privacy", "/terms", "/about", "/streams"]:
            page_en.goto(f"{base}/#{route}", wait_until="networkidle", timeout=45000)
            page_en.wait_for_timeout(400)
            addr = page_en.evaluate("""() => {
              const m = (document.querySelector('footer')?.innerText || '')
                .match(/\\d{5,6}\\s+[^\\n]{6,70}|Xingde Rd[^\\n]*/);
              return m ? m[0].trim() : null;
            }""")
            lang_attr = page_en.evaluate("document.documentElement.lang")
            if not addr:
                print(f"  ❌ 未找到地址   {route}")
                failures.append(("footer", route, ["NO_ADDRESS"], {}))
                continue
            cjk = bool(re.search(r"[一-鿿]", addr))
            tag = "❌ 含中文" if cjk else "✅ 英文"
            print(f"  {tag}  [{lang_attr}]  {route:<12}  {addr[:64]}")
            if cjk:
                failures.append(("footer", route, ["CJK_IN_EN_ADDRESS"], {"addr": addr}))
        ctx_en.close()
    finally:
        if browser:
            browser.close()
        pw.stop()

    print()
    print("===== 路由分流檢查（無兩條路由應渲染出相同畫面）=====")
    bad_groups = 0
    for (vp, h1, ln), rs in sigs.items():
        if len(rs) > 1:
            print(f"  !! {vp}: {len(rs)} 條路由畫面相同 h1={h1!r} len={ln}: {rs}")
            bad_groups += 1
    print(f"  相同畫面群組: {bad_groups}（預期 0）")

    print()
    print("===== 觸控目標 < %dpx =====" % TAP_MIN)
    for r in results:
        if r["smallCount"] and r["smallTargets"]:
            print(f"  {r['vp']:<8}{r['route']:<28}{r['smallCount']:>3}  {r['smallTargets']}")
    else:
        if not any(r["smallCount"] for r in results):
            print("  （無）")

    total = len(results)
    print()
    print("=" * 74)
    print(f"共 {total} 項 route×viewport 檢查 | 失敗 {len(failures)} | "
          f"相同畫面群組 {bad_groups}")
    print("=" * 74)
    for vp, route, issues, data in failures:
        print(f"  FAIL [{vp}] {route}: {issues}")
        if data.get("broken"):
            print(f"        破圖: {data['broken'][:3]}")
        if data.get("errors"):
            print(f"        JS: {data['errors'][:2]}")
    return 1 if failures or bad_groups else 0


if __name__ == "__main__":
    raise SystemExit(main())