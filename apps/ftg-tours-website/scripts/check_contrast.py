"""量測遮罩提高亮度後，文字對比度是否仍達 WCAG AA（5T-Tangible：可感知且可讀）。

為什麼要算而不是直接改：
  「遮罩提高 30% 透明度、讓畫面亮一點」與「字要看得清楚」是互相拉扯的。
  單看遮罩顏色無法判斷安全 —— 必須知道「疊在什麼照片上」與「上面是什麼顏色的字」。
  這是實質取捨，不能靠眼睛判斷，因為「感覺還好」正是無障礙失效最常見的自欺。

本檔第一版犯的錯（保留記錄，因為它是同類錯誤的樣板）：
  假設「所有遮罩上的字都是白色」。實際上 Hero 的字是 text-ftg-forest（深綠）
  壓在亮黃遮罩上 —— 亮底深字，與深底白字是相反的邏輯。
  若照原假設計算，會把一個「完全合格」的組合誤判為「不合格」，
  進而對一個沒問題的地方動手。**量測前必須先讀實際前景色，不能推論。**

合成： C_out = α·C_mask + (1-α)·C_photo
照片取亮部／中間調／暗部三種情境（山景與人像都會遇到）。
判定：≥4.5:1 一般文字 AA / ≥3.0:1 大字 AA / <3.0:1 不合格

用法：python scripts/check_contrast.py
"""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def load_palette():
    """從 tailwind.config.js 讀真實色碼，避免手抄漂移（見上方說明）。"""
    import re as _re
    src = (ROOT / "tailwind.config.js").read_text(encoding="utf-8")
    out = {}
    for name in ("forest", "green", "sand", "cream", "orange"):
        m = _re.search(rf"\b{name}:\s*'(#[0-9a-fA-F]{{6}})'", src)
        if m:
            h = m.group(1).lstrip("#")
            out[name] = tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
    return out


_PAL = load_palette()


def srgb_to_lin(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def luminance(rgb: tuple[int, int, int]) -> float:
    r, g, b = (srgb_to_lin(v / 255) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: tuple[int, int, int], b: tuple[int, int, int]) -> float:
    la, lb = luminance(a), luminance(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def over(fg: tuple[int, int, int], alpha: float,
         bg: tuple[int, int, int]) -> tuple[int, int, int]:
    """把 alpha 前景疊在 bg 上（CSS alpha compositing）。"""
    return tuple(round(alpha * f + (1 - alpha) * b) for f, b in zip(fg, bg))


WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
# 品牌色 —— 必須與 tailwind.config.js 的 ftgPalette 完全一致。
#
# 5T-Transparent: 這裡曾用「看起來差不多」的近似值，結果 sunlight 用成
# #f4d88c（偏鮮黃），真實值是 #f5f0e8（近白的暖砂）。差異極大：
# 前者算出 3.76:1（僅大字可過），後者算出 9.58:1（AA 通過）——
# 同一個設計決策會被量測工具判成相反的結論。
# 改色時請同步更新本區，或直接從 tailwind.config.js 讀取。
FTG_FOREST = _PAL.get("forest", (0x1A, 0x3C, 0x34))    # #1a3c34
FTG_GREEN = _PAL.get("green", (0x2D, 0x4A, 0x3E))       # #2d4a3e
FTG_SUNLIGHT = _PAL.get("sand", (0xF5, 0xF0, 0xE8))    # #f5f0e8 = sunlight
FTG_CREAM = _PAL.get("cream", (0xFA, 0xF7, 0xF2))       # #faf7f2
FTG_ORANGE = _PAL.get("orange", (0xE0, 0x7A, 0x3D))     # #e07a3d
# Tailwind gray-100 —— 子頁副標 .subpage-hero__subtitle 的實際字色。
# 實測時不可用「白字」代替：gray-100 比純白暗，對比更低，用白字會高估。
GRAY100 = (243, 244, 246)

PHOTO_DARK = (40, 46, 40)
PHOTO_MID = (120, 128, 118)
PHOTO_LIGHT = (205, 205, 195)

# label, 遮罩堆疊（由下到上）, 前景文字色, 遮罩後方是照片還是實色
# 以下為 2026-09-30 調整「後」的狀態（全域遮罩提高 30% 透明度）。
CASES = [
    # 2026-10-02 組態：全站橫幅 = 零層全域遮罩 + 唯一一層文字方框。
    # 「讓照片保持明亮」與「字要看得清楚」在此互相拉扯 —— 方框 alpha 是取捨點，
    # 必須實測，不能靠眼睛。以下數值為實測最差值（亮/中/暗三情境）。
    ("Hero  單一 cream/80 方框（深綠字，亮底深字）",
     [(FTG_CREAM, 0.80)], FTG_FOREST, True),
    ("Home  單一 black/50 方框（白字）",
     [(BLACK, 0.50)], WHITE, True),
    ("子頁   單一 black/50 方框（白字 + gray-100 副標）",
     [(BLACK, 0.50)], GRAY100, True),
    # JourneyDesign 這個 section 沒有背景圖，是 bg-ftg-forest 實色底；
    # 原本疊一層同色 forest/95 —— 疊完顏色完全不變，是純冗餘層。已移除。
    ("JourneyDesign  實色底（冗餘遮罩已移除）", [], WHITE, False),
    ("圖片 figcaption  black/50", [(BLACK, 0.50)], WHITE, True),
]

# 調整「前」的狀態，作為對照組輸出
BEFORE = [
    # 「調整前」對照組 = 三層組態（全域 forest/0.42 + white/0.07 + 方框 black/25）
    ("Home  三層：forest/0.42 + white/0.07 + black/25（調整前）",
     [(FTG_FOREST, 0.42), (WHITE, 0.07), (BLACK, 0.25)], WHITE, True),
    ("Home  方框若沿用 black/25 但已無全域層（調整前誤判）",
     [(BLACK, 0.25)], WHITE, True),
    ("Hero  兩層：sand/0.56 + cream/80（調整前）",
     [(FTG_SUNLIGHT, 0.56), (FTG_CREAM, 0.80)], FTG_FOREST, True),
    ("子頁   兩層：forest/0.36 + black/25（調整前）",
     [(FTG_FOREST, 0.36), (BLACK, 0.25)], WHITE, True),
]


def build(layers, photo):
    bg = photo
    for color, a in layers:
        bg = over(color, a, bg)
    return bg


def judge(ratio: float) -> str:
    if ratio >= 4.5:
        return "AA 通過"
    if ratio >= 3.0:
        return "僅大字可過"
    return "不合格"


def lighten(layers, factor: float = 0.30):
    """提高透明度：alpha 乘上 (1 - factor)。"""
    return [(c, a * (1 - factor)) for c, a in layers]


def report(label, layers, fg, has_photo, before_map=None):
    """印出單一遮罩組態的對比；若 before_map 有同組的舊值則一併對照。"""
    fg_name = "深綠字" if fg == FTG_FOREST else "白字"
    print(f"■ {label}   前景：{fg_name}")
    if not has_photo:
        base = build(layers, FTG_FOREST)
        c = contrast(fg, base)
        print(f"    實色底（無照片） 底色 rgb{base}  "
              f"實際對比 {c:.2f}:1  [{judge(c)}]")
        print()
        return c
    worst = 99.0
    for pname, photo in (("亮部", PHOTO_LIGHT), ("中間調", PHOTO_MID), ("暗部", PHOTO_DARK)):
        b = build(layers, photo)
        c = contrast(fg, b)
        worst = min(worst, c)
        prev = ""
        if before_map:
            c0 = before_map
            arrow = f"{c0:6.2f}:1 → "
            delta = c - c0
            sign = "+" if delta >= 0 else ""
            mark = "  改良" if delta >= 0 else "  ← 較暗"
            prev = arrow + f"{c:6.2f}:1 ({sign}{delta:.2f}){mark}"
        else:
            prev = f"{c:6.2f}:1  {judge(c)}"
        flag = "" if c >= 4.5 else "   ← 未達 AA"
        print(f"    照片{pname:4} 底色 rgb{b}  {prev}{flag}")
    print(f"  → 最差對比 {worst:.2f}:1  [{judge(worst)}]")
    print()
    return worst


def main() -> int:
    print("=" * 80)
    print("遮罩提高 30% 透明度（讓畫面透亮）後的字形對比")
    print("=" * 80)
    print()
    print("色碼定源（已從 tailwind.config.js 讀取，避免手抄漂移）：")
    for k, v in _PAL.items():
        print(f"    {k:8} #{v[0]:02x}{v[1]:02x}{v[2]:02x}")
    print()

    worst_all = {}
    print("-" * 80)
    print("調整後")
    print("-" * 80)
    print()
    for label, layers, fg, has_photo in CASES:
        worst_all[label] = report(label, layers, fg, has_photo)

    print("-" * 80)
    print("調整前（對照組，僅供設計理由參考，不納入 gate）")
    print("-" * 80)
    print()
    for label, layers, fg, has_photo in BEFORE:
        report(label, layers, fg, has_photo)

    print("=" * 80)
    print("結論")
    print("=" * 80)
    # gate 只看「當前實作」(CASES)。BEFORE 是刻意保留的歷史組態，
    # 其中包含故意失敗的反例（例如沿用 black/25 但已無全域層 → 2.83:1），
    # 用來證明 alpha 必須加深。若把它算進 fails，gate 會永遠誤報失敗。
    fails = [l for l, w in worst_all.items() if w < 4.5]
    if fails:
        print("以下項目最差對比低於 AA 4.5:1：")
        for l in fails:
            print(f"    ! {l}  ({worst_all[l]:.2f}:1)")
        return 1
    print("所有遮罩組慃的最差對比均達到 AA 4.5:1 以上。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
