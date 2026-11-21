#!/usr/bin/env python
"""
Hero 遮罩對比度評估器（5T-Transparent：零幻覺驗算）

用途
----
決定 hero 遮罩配方時，「亮一點」與「白字看得懂」是互相拉扯的：
照片越亮，白字對比越低。本腳本把兩者都算成數字，用資料選配方，
而不是靠目測反覆試。

它做三件事
  1. 模擬「底圖 → 遮罩堆疊 → 文字」的完整像素合成
  2. 輸出合成後的亮度統計（代表觀感上的「亮不亮」）
  3. 輸出白字 WCAG 對比度（代表「看不看得懂」）

關鍵設計：風險區取「文字實際佔位的置中方框」，而非整個 hero。
文字只落在那個方框裡，方框外的亮部像素對可讀性沒有影響 ——
把它們算進來會讓指標失真、誤判成不可行。

遮罩形狀
--------
  flat:     全面積平鋪半透明色層（無差別壓暗，照片失色）
  radial:   以畫面中心為軸的徑向漸層
  vertical: 由上到下的線性漸層
  scrim:    置中羽化方框 —— 高級網站常用的做法：
            文字區壓暗到位、四周留亮，照片的顏色與細節仍在

WCAG 門檻：內文 4.5:1（AA）、大字 3:1（AA Large，>=24px 或 >=18.66px 粗體）

執行：python scripts/hero-mask-contrast.py
"""

import sys
from PIL import Image

# ── 色彩（對應 tailwind.config.js，勿硬改；改色請同步 tailwind.config.js）──
FTG_FOREST = (0x1A, 0x3C, 0x34)   # bg-ftg-forest
WHITE = (255, 255, 255)
GRAY_100 = (0xF3, 0xF4, 0xF6)     # text-gray-100（hero 副標）

IMG = 'public/images/hero-banner.webp'

# 文字實際佔位（置中，約 max-w-3xl ＝ 視覺寬 64%）
TEXT_HALF_W = 0.32
TEXT_HALF_H = 0.22
TEXT_CY = 0.50


# ── WCAG 亮度與對比 ──────────────────────────────────────────────
def _lin(c8: int) -> float:
    u = c8 / 255.0
    return u / 12.92 if u <= 0.04045 else ((u + 0.055) / 1.055) ** 2.4


def lum(rgb) -> float:
    r, g, b = (_lin(v) for v in rgb)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(l1: float, l2: float) -> float:
    hi, lo = max(l1, l2), min(l1, l2)
    return (hi + 0.05) / (lo + 0.05)


def over(fg_rgb, alpha: float, bg_lum: float) -> float:
    """把不透明色 fg 以 alpha 疊在亮度為 bg_lum 的底層上，回傳新亮度。"""
    return alpha * lum(fg_rgb) + (1.0 - alpha) * bg_lum


# ── 遮罩形狀 ────────────────────────────────────────────────────
# flat:     全面積平鋪的半透明色層
# radial:   以畫面中心為軸的徑向漸層
# vertical: 由上到下的線性漸層
# scrim:    置中羽化方框


def radial_alpha(u, v, amax, amin, power):
    """以畫面中心為心的橢圓距離（中心 1 / 邊角 0），alpha 由 amax 衰到 amin。"""
    d = (((u - 0.5) * 2.0) ** 2 + ((v - 0.5) * 2.0) ** 2) ** 0.5 / 1.414
    d = min(1.0, d)
    t = d ** power
    return amax + (amin - amax) * t


def vertical_alpha(v, amax, amin, power):
    """由上到下線性衰減（v=0 頂端）。"""
    t = min(1.0, max(0.0, v)) ** power
    return amax + (amin - amax) * t


def scrim_alpha(u, v, half_w, half_h, feather, amax, amin, cy=TEXT_CY):
    """置中羽化方框：框內 amax，框外以 feather 寬度平滑衰到 amin。

    這是「文字看得懂、畫面又亮」的關鍵形狀 —— 把需要的對比度
    精準投放到文字上，而不是無差別壓暗整張照片。
    """
    dx = abs(u - 0.5) / max(half_w, 1e-6)
    dy = abs(v - cy) / max(half_h, 1e-6)
    d = max(dx, dy)                      # 方形邊界距離（Chebyshev）
    if d <= 1.0:
        return amax
    t = min(1.0, (d - 1.0) / max(feather, 1e-6))
    # smoothstep 讓過渡自然，不出現硬邊
    t = t * t * (3.0 - 2.0 * t)
    return amax + (amin - amax) * t


def build_recipes():
    """格狀搜尋：flat 底層 × 局部加強層（radial / scrim）。

    目標是找出 Pareto 前沿 —— 在「文字區對比達 AA」的約束下，
    全圖最亮能到多少。單純降低 flat 並不夠，因為中央亮部像素
    正是文字所在處，必須靠局部集中層補對比。
    """
    r = {}
    r['A_current'] = dict(flat=[(FTG_FOREST, 0.60), (WHITE, 0.10)])
    r['B_flat30_字面降30%'] = dict(flat=[(FTG_FOREST, 0.42), (WHITE, 0.07)])

    # 徑向集中層
    for fa in (0.14, 0.20, 0.26):
        for am in (0.50, 0.60, 0.70, 0.80):
            r[f'R_f{fa:.2f}_a{am:.2f}'] = dict(
                flat=[(FTG_FOREST, fa)],
                radial=dict(amax=am, amin=0.0, power=1.6),
            )
    # 羽化方框 scrim：底層很淡（照片保色），只在文字區壓暗
    for fa in (0.10, 0.16, 0.22):
        for am in (0.55, 0.65, 0.75, 0.85):
            r[f'S_f{fa:.2f}_a{am:.2f}'] = dict(
                flat=[(FTG_FOREST, fa)],
                scrim=dict(half_w=TEXT_HALF_W, half_h=TEXT_HALF_H,
                           feather=0.22, amax=am, amin=0.0),
            )
    # 垂直漸層（文字偏下時的自然選擇）
    for fa in (0.16, 0.24):
        for am in (0.55, 0.70):
            r[f'V_f{fa:.2f}_a{am:.2f}'] = dict(
                flat=[(FTG_FOREST, fa)],
                vertical=dict(amax=am, amin=0.0, power=1.5),
            )
    return r


RECIPES = build_recipes()


def evaluate(img_path: str):
    im = Image.open(img_path).convert('RGB')
    W, H = im.size
    px = im.load()

    # 抽樣：全圖用粗網格，文字方框內獨立收集（風險區需要準確統計）
    step = max(1, W // 200)
    ystep = max(1, H // 120)
    base = []      # (u, v, L) 全圖
    inbox = []     # (u, v, L) 文字方框內
    for y in range(0, H, ystep):
        v = y / H
        for x in range(0, W, step):
            u = x / W
            L = lum(px[x, y])
            base.append((u, v, L))
            if (abs(u - 0.5) <= TEXT_HALF_W
                    and abs(v - TEXT_CY) <= TEXT_HALF_H):
                inbox.append((u, v, L))

    results = {}
    for name, cfg in RECIPES.items():
        flat = cfg.get('flat', [])
        rad = cfg.get('radial')
        ver = cfg.get('vertical')
        scr = cfg.get('scrim')

        def compose(u, v, L):
            for (rgb, a) in flat:
                L = over(rgb, a, L)
            if rad:
                L = over(FTG_FOREST, radial_alpha(u, v, **rad), L)
            if ver:
                L = over(FTG_FOREST, vertical_alpha(v, **ver), L)
            if scr:
                L = over(FTG_FOREST, scrim_alpha(u, v, **scr), L)
            return L

        out_all = sorted(compose(u, v, L) for (u, v, L) in base)
        out_box = sorted(compose(u, v, L) for (u, v, L) in inbox)
        m = len(out_box)
        # 白字風險在亮端：白字疊亮背景＝低對比。取 p90 / p99 / max。
        p90 = out_box[min(m - 1, int(m * 0.90))]
        p99 = out_box[min(m - 1, int(m * 0.99))]
        brightest = out_box[-1]

        results[name] = dict(
            mean_all=sum(out_all) / len(out_all),
            mean_box=sum(out_box) / m,
            p90=p90, p99=p99, mx=brightest,
            cr_w_p90=contrast(1.0, p90),
            cr_w_p99=contrast(1.0, p99),
            cr_w_max=contrast(1.0, brightest),
            cr_g_p90=contrast(lum(GRAY_100), p90),
            cr_g_p99=contrast(lum(GRAY_100), p99),
        )
    return results, W, H


def main():
    try:
        results, W, H = evaluate(IMG)
    except FileNotFoundError:
        print(f'找不到底圖：{IMG}')
        return 1

    print(f'底圖：{IMG}  {W}x{H}')
    print('徑向層以畫面中央為軸（與 hero 置中文字位置對齊）')
    print()
    print('風險端 = 文字區「亮部」像素（白字疊亮背景才是對比度問題）')
    print()
    hdr = (f'{"配方":<22}{"全圖亮度":>10}{"文字區":>9}'
           f'{"白字p90":>9}{"白字p99":>9}{"白字max":>9}'
           f'{"灰100p90":>10}  判定')
    print(hdr)
    print('-' * 78)

    base_mean = results['A_current']['mean_all']
    rows = []
    for name, r in results.items():
        ok_big = r['cr_w_p90'] >= 3.0 and r['cr_w_p99'] >= 3.0
        ok_body = r['cr_g_p90'] >= 4.5
        rows.append((name, r, ok_big and ok_body, ok_big))
    rows.sort(key=lambda t: -t[1]['mean_all'])
    passing = [t for t in rows if t[2]]
    failing = [t for t in rows if not t[2]]

    def line(name, r, verdict):
        d = (r['mean_all'] - base_mean) / base_mean * 100
        return (f'{name:<20}{r["mean_all"]:>9.3f}{r["mean_box"]:>8.3f}'
                f'{r["cr_w_p90"]:>8.2f}{r["cr_w_p99"]:>8.2f}'
                f'{r["cr_w_max"]:>8.2f}{r["cr_g_p90"]:>9.2f}'
                f'  {verdict} ({d:+.0f}%)')

    hdr = (f'{"配方":<20}{"全圖亮度":>9}{"文字區":>8}'
           f'{"白字p90":>8}{"白字p99":>8}{"白字max":>8}{"灰100p90":>9}  判定')

    print(f'底圖：{IMG}  {W}x{H}')
    print(f'風險區：置中方框 {TEXT_HALF_W*2:.0%}w x {TEXT_HALF_H*2:.0%}h'
          f'（文字實際佔位）')
    print(f'遮罩合成 {len(RECIPES)} 種配方')
    print()
    print(hdr)
    print('-' * 78)
    print(line('A_current', results['A_current'], '❌ 未達 AA'))
    print(line('B_字面降30%', results['B_flat30_字面降30%'], '❌ 未達 AA'))
    print()
    if passing:
        print(f'✅ 達 AA（依全圖亮度排序，{len(passing)}/{len(RECIPES)}）')
        for name, r, _, _ in passing[:14]:
            print(line(name, r, '✅ AA'))
    if failing:
        print()
        print(f'❌ 未達 AA（{len(failing)} 個）')
        for name, r, _, ok_big in failing[:5]:
            print(line(name, r,
                       '🟡 大字達／內文不足' if ok_big else '❌ 未達 AA'))
    print()
    print('欄位說明：')
    print('  全圖亮度  合成後全圖平均線性亮度，數值越高觀感越亮')
    print('  文字區    文字方框內平均亮度')
    print('  白字p90   文字區亮端 90 分位與純白對比（實務風險值）')
    print('  白字p99/max 更亮極端像素的對比（最壞情況）')
    print('  灰100p90  text-gray-100 副標與亮端 90 分位的對比')
    print()
    print('門檻：白字 ≥3.0（AA Large）／ 灰100 副標 ≥4.5（AA 內文）')
    print('物理前提：白字亮度恆為 1.0，對比 = 1.05/(背景亮度+0.05)，')
    print('          故文字區背景越暗對比越高 —— 亮與可讀是取捨關係。')
    return 0


if __name__ == '__main__':
    sys.exit(main())
