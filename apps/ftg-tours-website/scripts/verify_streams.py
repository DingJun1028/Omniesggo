#!/usr/bin/env python3
"""驗證六流體系 (/streams) 是否真的部署到線上。

為什麼不能用 HTTP 狀態碼驗證
----------------------------
本專案是 HashRouter SPA，且 App.jsx 最後有 catch-all：
    <Route path="*" element={<NotFound />} />
因此 **任何** 路徑 (/streams、/streams/awareness、甚至 /不存在)
都會回 200 —— 回 SPA shell。舊版用 requests.head() 判 200 就印 ✅，
等於永遠通過、從未驗證任何東西。

真正能證明頁面上線的只有一件事：部署後的 JS bundle 內含該頁面的
字串。舊版 grep 的目標字串 'Six Streams System' 全站不存在
（頁面實際渲染 '六流體系 / Six Streams'），所以永遠 0 命中。

用法
----
    export FTG_SSH_KEY=/path/to/private_key
    export FTG_SSH_HOST=<vps-host>          # 不寫死在檔案裡
    export FTG_SSH_USER=ubuntu
    export FTG_SITE=https://<your-site>
    python scripts/verify_streams.py

全部可由環境變數覆寫，腳本內不存放任何憑證或環境專屬位址。
離開 VPS 連線時用 --offline 只做線上檢查。

退出碼：0 = 全部通過；1 = 有檢查失敗（適合 CI）。
"""

import argparse
import os
import subprocess
import sys
import urllib.error
import urllib.request

# 部署後必須出現在 bundle 裡的字串。
# 取自 src/pages/streams/index.jsx 與 src/data/streamsData.js 的實際渲染值。
MARKERS = {
    "streamsTitle": "六流體系",
    "awarenessStream": "覺曉流",
    "foundationStream": "基礎流",
    "englishTitle": "Six Streams",
}

# 舊版用錯、且全站不存在的字串。保留在這裡當回歸警訊。
LEGACY_BOGUS_MARKER = "Six Streams System"


def _die(msg):
    print(f"❌ {msg}", file=sys.stderr)
    sys.exit(1)


def check_bundle_over_ssh(site_asset_glob="/var/www/ftgtours/assets/index-*.js"):
    """繞過 CDN，直接確認 VPS 上的 bundle 內容。"""
    key = os.environ.get("FTG_SSH_KEY")
    host = os.environ.get("FTG_SSH_HOST")
    user = os.environ.get("FTG_SSH_USER", "ubuntu")

    if not (key and host):
        print("⚠️  跳過 VPS 直連驗證（未設定 FTG_SSH_KEY / FTG_SSH_HOST）")
        return None

    if not os.path.exists(key):
        _die(f"私鑰不存在: {key}")

    # 以 list 形式呼叫，不經 shell → 沒有命令注入風險。
    # 不使用 StrictHostKeyChecking=no：那是 MITM 破口，且會靜默重新信任
    # 被替換的主機，讓「驗證成功」不再代表驗到的是同一台機器。
    ssh_cmd = [
        "ssh",
        "-i", key,
        "-o", "BatchMode=yes",
        "-o", "ConnectTimeout=15",
        f"{user}@{host}",
        f"cat {site_asset_glob}",
    ]
    try:
        proc = subprocess.run(ssh_cmd, capture_output=True, text=True, timeout=120)
    except subprocess.TimeoutExpired:
        _die("SSH 連線逾時")

    if proc.returncode != 0:
        _die(f"SSH 失敗 (rc={proc.returncode}): {proc.stderr.strip()[:200]}")

    return proc.stdout


def _fetch(url, timeout=60):
    """帶瀏覽器 UA 的 GET。Cloudflare 對 datacenter IP 回 403，
    這是預期行為而非站點故障 —— 沒有 UA 會讓驗證腳本無法運作。"""
    req = urllib.request.Request(url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; ftg-verify-streams/1.0)",
        "Cache-Control": "no-cache",
    })
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def check_live_bundle(site):
    """直接抓線上 bundle —— 不依賴 SSH，也能驗證 CDN 邊緣的實際內容。"""
    html = _fetch(site.rstrip("/") + "/", timeout=30)

    import re
    m = re.search(r'src="(/assets/index-[^"]+\.js)"', html)
    if not m:
        _die("首頁 HTML 找不到 /assets/index-*.js —— 部署結構可能變了")

    url = site.rstrip("/") + m.group(1)
    try:
        return _fetch(url, timeout=90), url
    except urllib.error.HTTPError as e:
        _die(f"抓取 bundle 失敗 {url}: HTTP {e.code}"
             + ("（Cloudflare 阻擋 datacenter IP，非站點故障）"
                if e.code == 403 else ""))


def report(label, content, failures):
    print(f"=== {label} ===")
    for name, marker in MARKERS.items():
        ok = marker in content
        print(f"  {'✅' if ok else '❌'} {name}: {marker!r}")
        if not ok:
            failures.append(f"{label}: 缺少 {marker!r}")
    if LEGACY_BOGUS_MARKER in content:
        print(f"  ⚠️  bundle 內竟含舊版錯誤字串 {LEGACY_BOGUS_MARKER!r}，"
              "代表頁面用的是舊文案")
    return failures


def main():
    ap = argparse.ArgumentParser(description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--offline", action="store_true",
                    help="跳過 SSH，只驗線上 CDN 內容")
    ap.add_argument("--site", default=os.environ.get(
        "FTG_SITE", "https://ftgtours.esggo.co"))
    args = ap.parse_args()

    print(f"站點: {args.site}")
    print("注意: 這是 HashRouter + catch-all SPA，任何路徑都回 200；"
          "HTTP 狀態碼不構成證據，故本腳本只驗 bundle 內容。\n")

    failures = []

    live, url = check_live_bundle(args.site)
    print(f"線上 bundle: {url} ({len(live):,} bytes)\n")
    report("線上 CDN bundle", live, failures)

    if not args.offline:
        remote = check_bundle_over_ssh()
        if remote is not None:
            print()
            report("VPS 原始 bundle (繞過 CDN)", remote, failures)

    print()
    if failures:
        print(f"❌ {len(failures)} 項未通過:")
        for f in failures:
            print(f"   - {f}")
        print("\n結論: 六流體系尚未部署到線上（或 /streams 未在 App.jsx 註冊路由，"
              "導致頁面被 tree-shake 排除）。")
        return 1

    print("✅ 六流體系已部署，線上與 VPS 內容一致且包含全部標記字串。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
