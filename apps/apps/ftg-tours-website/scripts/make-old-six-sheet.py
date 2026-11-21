"""把舊的六大方案圖(孤兒檔)拼成一張對照圖給用戶看。"""
import os
from PIL import Image, ImageDraw

WEB = r"C:\Users\dingj\ftg-tours-website"
IMG = os.path.join(WEB, "public", "images")
OUT = r"C:\Users\dingj\AppData\Local\hermes\cache\scratch\ftg-old-six.png"
PREFIX = "\u516d\u5927\u65b9\u6848"          # 六大方案
SUFFIX = "\u65b9\u6848"                       # 方案 (for label strip)

files = [n for n in sorted(os.listdir(IMG))
         if n.startswith(PREFIX) and n.lower().endswith(".png")]
print("matched:", len(files))
for n in files:
    p = os.path.join(IMG, n)
    with Image.open(p) as im:
        print(f"  {im.size}  {os.path.getsize(p):>9,}B  {n}")

W, H = 620, 349
COLS = 2
rows = (len(files) + COLS - 1) // COLS
sheet = Image.new("RGB", (W * COLS + 20 * (COLS + 1), (H + 34) * rows + 10), "white")
d = ImageDraw.Draw(sheet)

for i, n in enumerate(files):
    r, c = divmod(i, COLS)
    x = 10 + c * (W + 20)
    y = r * (H + 34) + 10
    with Image.open(os.path.join(IMG, n)) as im:
        sheet.paste(im.convert("RGB").resize((W, H), Image.LANCZOS), (x, y))
    d.rectangle([x, y + H + 5, x + 14, y + H + 19], fill="black")
    d.text((x + 22, y + H + 7), f"OLD #{i + 1}", fill="black")

sheet.save(OUT)
print("saved:", OUT, os.path.getsize(OUT), "bytes")
