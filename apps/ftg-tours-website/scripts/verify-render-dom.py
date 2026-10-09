#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""5T-Trackable: 用 Chrome --dump-dom 量測渲染後的 <img> 與字型真實狀態。

背景：`--dump-dom` 拿得到 React 渲染後的 DOM，但看不到 `naturalWidth`
這類「載入後才有的屬性」。解法是注入一段 script，在頁面跑完後把量測結果
寫進 <title>，再從 dump 結果還原。

驗證的是「瀏覽器眼裡的樣子」，而非檔案系統裡的檔案存在與否。
"""
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
SCRATCH = Path(r"C:\Users\dingj\AppData\Local\hermes\cache\scratch")
URL = "http://127.0.0.1:8791/"
PROBED_URL = "http://127.0.0.1:8792/"

# 在頁面尾端注入的量測 script。__DONE__ 結尾是給 dump-dom 解析的哨兵。
PROBE_JS = r"""
<script>
(function(){
  function run(){
    var imgs = [].slice.call(document.querySelectorAll('img'));
    var rows = imgs.map(function(i){
      return (i.currentSrc || i.src).split('/').pop()
           + '|' + (i.complete ? 1 : 0) + '|' + i.naturalWidth + 'x' + i.naturalHeight;
    });
    var fonts = [].slice.call(document.fonts).map(function(f){
      return f.family + ':' + f.weight + ':' + f.status;});
    var ff = '', txt = '', col = '';
    var els = document.querySelectorAll('h1,h2,h3,p,span,a,li');
    for (var i=0;i<els.length;i++){
      var t = (els[i].textContent||'').trim();
      if (/[\u4e00-\u9fff]/.test(t) && t.length>1){
        var cs = getComputedStyle(els[i]);
        ff = cs.fontFamily; txt = t.slice(0,24); col = cs.color; break;
      }
    }
    var d = document.documentElement;
    var out = {
      viewport: window.innerWidth + 'x' + window.innerHeight,
      bodyH: document.body.scrollHeight,
      scrollW: d.scrollWidth, clientW: d.clientWidth,
      hOverflow: d.scrollWidth > d.clientWidth + 1,
      imgTotal: imgs.length,
      imgBroken: imgs.filter(function(i){return i.complete && i.naturalWidth===0;}).length,
      rows: rows, fonts: fonts, sampleFF: ff, sampleText: txt, sampleColor: col
    };
    var pre = document.createElement('pre');
    pre.id = '__PROBE__';
    pre.textContent = '__DONE__' + JSON.stringify(out) + '__END__';
    document.body.appendChild(pre);
  }
  if (document.readyState === 'complete') setTimeout(run, 1200);
  else window.addEventListener('load', function(){ setTimeout(run, 1200); });
})();
</script>
"""


def build_probed_dist() -> Path:
    """把量測 script 注入 dist/index.html，產生一份獨立的 probed 資料夾。

    為什麼要複製而不是直接改 dist：dist 是待部署的正式產物，量測不應污染它。
    原地複製 → 只改副本的 index.html → 用另一個 port 服務副本。
    """
    src = Path("dist")
    dst = SCRATCH / "probed-dist"
    if dst.exists():
        subprocess.run(["rmdir", "/s", "/q", str(dst)], capture_output=True)
    shutil.copytree(src, dst)
    idx = dst / "index.html"
    html = idx.read_text(encoding="utf-8")
    if "__DONE__" not in html:
        html = html.replace("</body>", PROBE_JS + "\n</body>")
        idx.write_text(html, encoding="utf-8")
    return dst


def probe(width: int, height: int, mobile: bool, label: str) -> dict | None:
    prof = SCRATCH / f"cp-{label}"
    prof.mkdir(parents=True, exist_ok=True)
    dom = SCRATCH / f"dom-{label}.html"
    cmd = [
        CHROME, "--headless=new", "--disable-gpu", "--no-sandbox",
        f"--user-data-dir={prof}",
        f"--window-size={width},{height}",
        "--virtual-time-budget=12000",
        "--dump-dom", PROBED_URL,
    ]
    r = subprocess.run(cmd, capture_output=True, timeout=180)
    dom.write_bytes(r.stdout)
    html = r.stdout.decode("utf-8", "replace")
    m = re.search(r"__DONE__(.*?)__END__", html, re.S)
    if not m:
        print(f"  [{label}] ★ 探針未注入（DOM {len(html)} bytes, exit={r.returncode}）")
        return None
    return json.loads(m.group(1))


def report(label: str, d: dict) -> None:
    print(f"\n{'='*62}\n【{label}】viewport {d['viewport']}  頁面高 {d['bodyH']}px\n{'='*62}")
    if d["hOverflow"]:
        print(f"  ★ 水平溢出！scrollW={d['scrollW']} > clientW={d['clientW']}")
    else:
        print(f"  水平溢出: 無 ✓ (scrollW={d['scrollW']} <= clientW={d['clientW']})")
    print(f"  <img>: 共 {d['imgTotal']} 張，損壞 {d['imgBroken']} 張")
    for r in d["rows"]:
        name, complete, dim = r.split("|")
        ok = dim.split("x")[0] != "0"
        print(f"    {'✓' if ok else '★損壞'} complete={complete} {dim:>11}  {name}")
    loaded = [f for f in d["fonts"] if f.endswith(":loaded")]
    print(f"  @font-face: 宣告 {len(d['fonts'])} 條，已載入 {len(loaded)} 條")
    for f in d["fonts"][:10]:
        print(f"    {f}")
    if d["sampleText"]:
        print(f"  中文抽樣「{d['sampleText']}」")
        print(f"    font-family = {d['sampleFF']}")
        print(f"    color       = {d['sampleColor']}")


def main() -> int:
    probed = build_probed_dist()
    print(f"  已注入探針於 {probed}")
    results = {}
    for label, w, h, mob in [("desktop", 1440, 900, False),
                             ("mobile", 390, 844, True)]:
        d = probe(w, h, mob, label)
        if d:
            results[label] = d
            report(label, d)
    (SCRATCH / "render-probe.json").write_text(
        json.dumps(results, ensure_ascii=False, indent=2), encoding="utf-8")
    broken = sum(r["imgBroken"] for r in results.values())
    print(f"\n{'='*62}")
    print(f"  總結: 損壞圖片 {broken} 張 / 水平溢出 "
          f"{sum(1 for r in results.values() if r['hOverflow'])} 個 viewport")
    return 1 if broken or any(r["hOverflow"] for r in results.values()) else 0


if __name__ == "__main__":
    sys.exit(main())
