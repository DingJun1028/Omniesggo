"""
FTG TOURS 明亮版橫幅替換 — 原地覆寫 7 個大橫幅。

5T-Traceable: 對應關係由 grep 實際引用點確認，非猜測
5T-Trustworthy: 先備份舊圖，轉換後逐檔回讀尺寸與大小驗證
"""
import os
import shutil
import sys
from datetime import datetime
from PIL import Image

SRC_DIR = r"C:\Users\dingj\Downloads\墾趣旅遊官網-20260925T192419Z-1-001\墾趣旅遊官網"
WEB = r"C:\Users\dingj\ftg-tours-website"
STAMP = datetime.now().strftime("%Y%m%d-%H%M%S")
BACKUP = os.path.join(WEB, f".img-backup-{STAMP}")

# (來源檔名, 目標相對路徑)  — 目標為程式實際引用的既有檔名
MAP = [
    ("墾趣永續旅遊-官網首頁.png",          "public/images/hero-banner.webp"),
    ("墾趣永續旅遊-子網頁員工旅遊.png",     "public/images/corporate-travel/企業員工旅遊-頁首大橫幅.webp"),
    ("墾趣永續旅遊-子網頁家庭日.png",       "public/images/family-day/企業家庭日-頁首大橫幅.webp"),
    ("墾趣永續旅遊-子網頁ESG Team Day.png", "public/images/esg-team-day/team-day-頁首大橫幅.webp"),
    ("墾趣永續旅遊-子網頁員工身心平衡.png", "public/images/wellbeing-retreat/員工身心平衡-頁首大橫幅.webp"),
    ("墾趣永續旅遊-子網頁高階主管共識營.png", "public/images/executive-retreat/高階主管共識-頁首橫幅.webp"),
    ("墾趣永續旅遊-子網頁ESG Impact Note.png", "public/images/esg-impact-note/ESG-Impact-Note-頁首大橫幅.webp"),
]

QUALITY = 86
fail = 0

print(f"備份目錄: {BACKUP}\n")
print(f"{'結果':<6} {'新尺寸':<12} {'新大小':>9}  {'舊大小':>9}  目標")
print("-" * 92)

for src_name, dst_rel in MAP:
    src = os.path.join(SRC_DIR, src_name)
    dst = os.path.join(WEB, dst_rel.replace("/", os.sep))

    if not os.path.isfile(src):
        print(f"  FAIL  來源不存在: {src_name}")
        fail += 1
        continue

    old_size = os.path.getsize(dst) if os.path.isfile(dst) else 0

    # 備份原檔（保留相對路徑結構）
    bak = os.path.join(BACKUP, dst_rel.replace("/", os.sep))
    os.makedirs(os.path.dirname(bak), exist_ok=True)
    if os.path.isfile(dst):
        shutil.copy2(dst, bak)

    with Image.open(src) as im:
        im = im.convert("RGB")
        dims = im.size
        im.save(dst, "WEBP", quality=QUALITY, method=6)

    new_size = os.path.getsize(dst)

    # 回讀驗證：真的能解碼成 webp，且尺寸正確
    try:
        with Image.open(dst) as v:
            v.load()
            ok = v.format == "WEBP" and v.size == dims
        tag = "OK" if ok else "BAD"
        if not ok:
            fail += 1
    except Exception as e:
        tag = "FAIL"
        fail += 1
        dims = ("?", "?")

    print(f"  {tag:<6} {str(dims[0])+'x'+str(dims[1]):<12} "
          f"{new_size:>9,} {old_size:>9,}  {dst_rel}")

print("-" * 92)
print(f"備份於: {BACKUP}")
print(f"失敗數: {fail}")
sys.exit(1 if fail else 0)
