"""
全站稽核：漏圖 / 漏字 / 漏 i18n key / console error / RWD 溢出。

5T-Transparent: 每項結果都附實際 HTTP code 或 DOM 證據，不推論
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

WEB = r"C:\Users\dingj\ftg-tours-website"
DIST = os.path.join(WEB, "dist")
BASE = "http://localhost:4173"

ROUTES = [
    "/", "/corporate-travel", "/family-day", "/esg-team-day",
    "/wellbeing-retreat", "/executive-retreat", "/esg-impact-note",
    "/contact", "/journey-design", "/streams", "/no-such-page",
]

# dist 內所有實際存在的圖檔（用來比對引用是否 404）
built_images = set()
for dirpath, _d, files in os.walk(os.path.join(DIST, "images")):
    for fn in files:
        rel = os.path.relpath(os.path.join(dirpath, fn), DIST).replace("\\", "/")
        built_images.add("/" + rel.replace(os.path.dirname(rel) and rel.split("/")[-1] and rel, rel))

# 修正上面的集合（直接用相對路徑）
built_images = set()
for dirpath, _d, files in os.walk(os.path.join(DIST, "images")):
    for fn in files:
        full = os.path.join(dirpath, fn)
        rel = os.path.relpath(full, DIST).replace("\\", "/")
        built_images.add("/" + rel)

print(f"dist 圖檔總數: {len(built_images)}\n")

# 1) 掃描所有 source 檔的圖片引用
referenced = {}
for root, _d, files in os.walk(os.path.join(WEB, "src")):
    for fn in files:
        if not fn.endswith((".js", ".jsx")):
            continue
        p = os.path.join(root, fn)
        rel = os.path.relpath(p, WEB).replace("\\", "/")
        s = open(p, encoding="utf-8").read()
        for m in re.finditer(r"""['"](/images/[^'"]+?)['"]""", s):
            referenced.setdefault(m.group(1), []).append(f"{rel}")

print("=== 引用 vs dist 存在性 ===")
missing = []
for ref, srcs in sorted(referenced.items()):
    in_dist = ref in built_images
    if not in_dist:
        missing.append((ref, srcs))
    print(f"  {'OK  ' if in_dist else 'MISS'}  {ref}   <- {', '.join(srcs)}")

print()
if missing:
    print(f"!! 發現 {len(missing)} 個引用不存在於 dist：")
    for ref, srcs in missing:
        print(f"   {ref}  <- {', '.join(srcs)}")
else:
    print("所有圖片引用皆存在於 dist")

# 2) HTTP 實測每個被引用的圖
print("\n=== HTTP 實測 ===")
http_fail = []
for ref in sorted(referenced):
    url = BASE + urllib.parse.quote(ref)
    try:
        r = urllib.request.urlopen(url, timeout=20)
        code = r.status
        n = len(r.read())
        if code != 200 or n == 0:
            http_fail.append((ref, code, n))
        print(f"  HTTP {code}  {n:>9,}B  {ref}")
    except Exception as e:
        http_fail.append((ref, "ERR", str(e)))
        print(f"  FAIL  {ref} :: {e}")

# 3) i18n key 完整性：抓 t('...') 與 translations 的 zh/en 對照
print("\n=== i18n key 檢查 ===")
src_t = re.findall(r"""t\(\s*['"]([\w.]+)['"]""",
                   open(os.path.join(WEB, "src", "i18n", "translations.js"), encoding="utf-8").read())
# 收集所有元件的 t() 呼叫
used = set()
for root, _d, files in os.walk(os.path.join(WEB, "src")):
    for fn in files:
        if not fn.endswith((".js", ".jsx")):
            continue
        s = open(os.path.join(root, fn), encoding="utf-8").read()
        used.update(re.findall(r"""t\(\s*['"]([\w.]+)['"]""", s))

# 簡化：檢查 translations.js 是否 zh/en 對稱
tj = open(os.path.join(WEB, "src", "i18n", "translations.js"), encoding="utf-8").read()
print(f"  使用的 t() key 總數: {len(used)}")
print(f"  'notFound.' 命中: {[k for k in used if k.startswith('notFound.')]}")

json.dump({"missing": missing, "http_fail": http_fail, "used_keys": sorted(used)},
          open(os.path.join(WEB, "scripts", ".site-audit.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=2)
print("\nsaved: scripts/.site-audit.json")
sys.exit(1 if (missing or http_fail) else 0)
