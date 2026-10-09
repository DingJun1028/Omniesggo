"""驗證線上 bundle 內確實含 SPA 路由（5T-Transparent：證據方法先於結論）。

為什麼不能用 curl 看 HTTP status：
  本專案是 HashRouter + nginx SPA fallback（try_files → /index.html）。
  任何字串路徑都會回 200，包括 /zzz-this-path-does-not-exist-xyz。
  實測 bytes 也都是 0（HEAD 語意）。因此「路由回 200」不構成任何證據 ——
  這是本檔存在的第一原因：不要重蹈用無效探針自證的覆轍。

為什麼不能只找 "/about"：
  vite/rolldown minify 後字串用反引號，形態是 path:`/about`，
  不是 path:"/about" 也不是 '/about'。實測 path:" 出現 0 次。
  引號假設錯會讓真路由被誤判為不存在 —— 同樣是自證幻覺。

因此正確做法：從線上 HTML 取出實際 bundle 檔名，抓下該 bundle，
用反引號形態比對路由清單，並明確區分「找到 / 沒找到」兩種輸出。

exit 0 = 全部路由都在線上 bundle 內 / 1 = 有路由缺失
"""
import re
import sys
import urllib.request

BASE = "https://ftgtours.esggo.co"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

# 應存在於 App.jsx 的路由（與 repo 內 App.jsx 對照）
EXPECTED = [
    "corporate-travel", "family-day", "esg-team-day", "executive-retreat",
    "esg-impact-note", "wellbeing-retreat", "journey-design", "streams",
    "contact", "about", "privacy", "terms",
]


def fetch(url: str, timeout: int = 60) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def main() -> int:
    html = fetch(BASE + "/")
    m = re.search(r'src="(/assets/index-[A-Za-z0-9_-]+\.js)"', html)
    if not m:
        print("FAIL: 無法從線上 HTML 找出 bundle 引用")
        return 1
    js_url = m.group(1)
    bundle = fetch(BASE + js_url)
    print("線上 bundle: %s (%d bytes)" % (js_url, len(bundle)))
    print("")

    # 反引號形態：path:`/about`
    found = set(re.findall(r"path:`/([^`?]*?)`", bundle))
    print("=== bundle 內偵測到的路由 path（反引號形態）===")
    for p in sorted(found):
        print("  /%s" % p)
    print("")

    missing = [r for r in EXPECTED if r not in found]
    print("=== 預期 %d 條路由 ===" % len(EXPECTED))
    if missing:
        print("缺: %s" % ", ".join("/" + x for x in missing))
        print("=== 結果: FAIL")
        return 1
    print("全部命中 ✅")
    print("=== 結果: PASS（線上 bundle 含全部 SPA 路由定義）")
    print("")
    print("註：本檔只證明「路由定義存在於線上 bundle」。路由能否正確 render，")
    print("    需瀏覽器實測（本環境 browser daemon 回 402，無法執行）。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
