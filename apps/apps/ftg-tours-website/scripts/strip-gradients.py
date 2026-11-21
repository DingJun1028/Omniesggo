"""
5T-Tangible: 移除全站漸層（gradient），改為實色半透明遮罩。

為什麼遮罩不能直接拿掉：
  hero/figcaption 上的文字是白色，底下是攝影照片。沒有遮罩 = 白字疊淺色照片 = 看不見。
  所以改成單一實色 + 固定不透明度，視覺上「乾淨」但仍達 WCAG 對比。

- from-X/60 via-Y/40 to-Z/30  (三色漸層) → 單一實色，取最深的 from 色並依需求微調
- from-black/70 to-transparent   (照片說明文字底) → bg-black/70
"""
import io
import os

WEB = r"C:\Users\dingj\ftg-tours-website"

# (相對路徑, 舊 class, 新 class, 說明)
REPLACEMENTS = [
    # ── Hero 橫幅主遮罩：取最深色 forest，維持 ~60% 覆蓋 ──
    ("src/pages/Home.jsx",
     "bg-gradient-to-br from-ftg-forest/60 via-ftg-green/40 to-ftg-leaf/30",
     "bg-ftg-forest/60",
     "首頁 hero 主遮罩：forest 實色 60%"),
    # Hero.jsx 橫幅左側遮罩：原本靠 sunlight 漸層壓左邊讓深綠字清楚 → 整片 sunlight 實色
    ("src/components/Hero.jsx",
     "bg-gradient-to-r from-ftg-sunlight via-ftg-sunlight/70 to-transparent",
     "bg-ftg-sunlight/80",
     "Hero 橫幅遮罩：sunlight 實色 80%（文字為深綠，需亮底）"),
    # 子頁 hero 共用遮罩（index.css）
    ("src/index.css",
     "absolute inset-0 bg-gradient-to-br from-ftg-forest/60 via-ftg-green/40 to-ftg-leaf/30",
     "absolute inset-0 bg-ftg-forest/60",
     "子頁 hero 共用遮罩：forest 實色 60%"),
    # JourneyDesign hero：原本近乎不透明的三色漸層 → 單一 forest
    ("src/pages/JourneyDesign.jsx",
     "bg-gradient-to-br from-ftg-forest via-ftg-green/90 to-ftg-forest",
     "bg-ftg-forest/95",
     "JourneyDesign hero：forest 實色 95%"),
    # 照片 figcaption 說明文字底：統一 black/70
    ("src/pages/corporate-travel.jsx",
     "bg-gradient-to-t from-black/70 to-transparent",
     "bg-black/70", "corporate-travel 圖說底"),
    ("src/pages/esg-impact-note.jsx",
     "bg-gradient-to-t from-black/70 to-transparent",
     "bg-black/70", "esg-impact-note 圖說底"),
    ("src/pages/esg-team-day.jsx",
     "bg-gradient-to-t from-black/70 to-transparent",
     "bg-black/70", "esg-team-day 圖說底"),
    ("src/pages/executive-retreat.jsx",
     "bg-gradient-to-t from-black/70 to-transparent",
     "bg-black/70", "executive-retreat 圖說底"),
    ("src/pages/family-day.jsx",
     "bg-gradient-to-t from-black/70 to-transparent",
     "bg-black/70", "family-day 圖說底"),
    ("src/pages/wellbeing-retreat.jsx",
     "bg-gradient-to-t from-black/70 to-transparent",
     "bg-black/70", "wellbeing-retreat 圖說底"),
]

print("=" * 68)
print("5T-Traceable — 漸層 → 實色遮罩 轉換")
print("=" * 68)

changed = 0
for rel, old, new, note in REPLACEMENTS:
    p = os.path.join(WEB, rel.replace("/", os.sep))
    src = io.open(p, encoding="utf-8").read()
    n = src.count(old)
    if n == 0:
        print(f"  MISS  {rel:34s} {note}")
        continue
    src = src.replace(old, new)
    io.open(p, "w", encoding="utf-8").write(src)
    changed += n
    print(f"  OK x{n}  {rel:34s} {note}")

print(f"\n共替換 {changed} 處")

# ── 驗證：全站不應再有 gradient ──
print("\n" + "=" * 68)
print("5T-Trustworthy — 驗證無殘留 gradient")
print("=" * 68)
left = []
for root, dirs, files in os.walk(os.path.join(WEB, "src")):
    dirs[:] = [d for d in dirs if d != "node_modules"]
    for f in files:
        if not f.endswith((".js", ".jsx", ".css")):
            continue
        fp = os.path.join(root, f)
        body = io.open(fp, encoding="utf-8").read()
        for i, line in enumerate(body.splitlines(), 1):
            if "gradient" in line:
                left.append(f"{os.path.relpath(fp, WEB).replace(os.sep,'/')}:{i}: {line.strip()}")

if left:
    print(f"FAIL — 仍有 {len(left)} 處：")
    for x in left:
        print("   " + x)
    raise SystemExit(1)
print("PASS — src/ 內已無任何 gradient")
