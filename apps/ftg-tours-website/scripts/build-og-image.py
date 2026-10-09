#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""5T-Traceable: 由 public/og-image.svg 產生社交平台用的 og-image.png。

為什麼需要（實測證據）：
- index.html 的 og:image 原本指向 `/images/logo.webp`，回 Content-Type: image/webp。
  **Facebook / LinkedIn / LINE 的 OG 解析器多數不支援 webp**，分享出去會沒有圖。
- 社群 OG 建議尺寸 1200×630，且 og:image:type 必須宣告為 image/png。

為什麼不能直接用 SVG 轉檔就了事：
- og-image.svg 的 font-family 是 `'Noto Sans TC'`，但**站台只自架了
  Noto Serif TC 與 Inter，根本沒有 Noto Sans TC**。直接轉檔會讓中文字
  掉回系統字型，字重與外觀就跟設計稿不同 —— 這正是報告 §3.1 的成因。
- 所以這裡明確改用站台實際擁有的 Noto Serif TC（public/fonts/ 的子集）。

用法：python scripts/build-og-image.py
"""

from __future__ import annotations

import io
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
W, H = 1200, 630
OUT = ROOT / "public" / "og-image.png"
FONT = ROOT / "public" / "fonts" / "noto-serif-tc.woff2"
LATIN_FONT = ROOT / "public" / "fonts" / "inter-latin.woff2"

# 深藍 → 綠的品牌漸層（沿用 og-image.svg 的色票）
GRAD = ((0x10, 0x24, 0x3F), (0x1B, 0x3A, 0x5C), (0x3C, 0x6E, 0x47))
GOLD = (0xC9, 0xA2, 0x4B)
GREEN = (0x3C, 0x6E, 0x47)

LINES = [
    ("FTG TOURS 墾趣旅遊", 26, GOLD, 250, 700),
    ("永續旅程", 58, (0xFF, 0xFF, 0xFF), 330, 900),
    ("戶外導覽 · 旅行服務 · 在地連結", 34, (0xDB, 0xE7, 0xF0), 410, 400),
    ("為企業設計兼顧員工身心健康、團隊連結、", 24, (0xAE, 0xBF, 0xD0), 470, 400),
    ("環境友善與地方價值的旅程。", 24, (0xAE, 0xBF, 0xD0), 510, 400),
    ("ftgtours.esggo.co", 20, (0x7E, 0x90, 0xA3), 580, 400),
]


def lerp(a: int, b: int, t: float) -> int:
    return int(round(a + (b - a) * t))


def background() -> "Image.Image":  # type: ignore[name-defined]
    from PIL import Image

    img = Image.new("RGB", (W, H))
    px = img.load()
    for y in range(H):
        for x in range(W):
            t = (x / (W - 1) + y / (H - 1)) / 2  # 對角線漸層，同 svg 的 x1y1→x2y2
            if t < 0.55:
                u = t / 0.55
                c = tuple(lerp(GRAD[0][i], GRAD[1][i], u) for i in range(3))
            else:
                u = (t - 0.55) / 0.45
                c = tuple(lerp(GRAD[1][i], GRAD[2][i], u) for i in range(3))
            px[x, y] = c
    return img


def _is_cjk(ch: str) -> bool:
    return "㐀" <= ch <= "鿿" or "豈" <= ch <= "﫿"


def draw_mixed(draw, xy, text: str, px: int, fill) -> None:
    """逐字元選字型繪製，中文與拉丁各自用對的字型。

    實測 `public/fonts/noto-serif-tc.woff2` 的 cmap 只有 875 個**漢字**碼位，
    完全不含拉丁字母；`inter-latin.woff2` 則只含 107 個非漢字字元。
    兩者互補，必須逐字分流，否則原稿的「FTG TOURS」與
    「ftgtours.esggo.co」會掉回系統字型，外觀與設計稿不符。
    """
    from PIL import ImageFont

    cjk = ImageFont.truetype(str(FONT), px)
    lat = ImageFont.truetype(str(LATIN_FONT), px)
    x, y = xy
    for ch in text:
        f = cjk if _is_cjk(ch) else lat
        draw.text((x, y), ch, font=f, fill=fill)
        x += f.getlength(ch)


def main() -> int:
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("  需要 Pillow：pip install Pillow")
        return 1

    if not FONT.exists():
        print(f"  找不到自架字型 {FONT}，請先跑 scripts/build-fonts.py")
        return 1
    if not LATIN_FONT.exists():
        print(f"  找不到自架 Inter {LATIN_FONT}，請先跑 scripts/build-fonts.py")
        return 1

    img = background()
    draw = ImageDraw.Draw(img, "RGBA")

    # 裝飾圓（沿用 svg 的兩個半透明圓）
    overlay = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((240 - 120, 200 - 120, 240 + 120, 200 + 120), fill=GREEN + (89,))
    od.ellipse((980 - 160, 460 - 160, 980 + 160, 460 + 160), fill=GOLD + (46,))
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")
    draw = ImageDraw.Draw(img)

    for text, px_size, color, y, _weight in LINES:
        draw_mixed(draw, (80, y), text, px_size, color)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, format="PNG", optimize=True)
    print(f"  已產生 {OUT.relative_to(ROOT).as_posix()}（{OUT.stat().st_size:,} bytes, {W}×{H}）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
