"""驗證 dist / 線上 CSS 是否真的含目標遮罩 class（5T-Transparent）。

為什麼要這個工具：
  Tailwind 只會為「原始碼裡實際出現的 class」產生 CSS。寫了
  `bg-ftg-forest/42` 但若最終 CSS 沒有對應規則，瀏覽器會靜默忽略 ——
  畫面看起來「沒變亮」而不是「壞掉」，這是最難察覺的一類失敗。
  更麻煩的是 Tailwind 3 對 opacity 比例有限制：內建的是
  0/5/10/20/25/30/40/50/60/70/75/80/90/95/100，任意數字（如 42、56、7）
  需要 `theme.extend.opacity` 或改用 bracket 語法 bg-black/[0.42]。
  若沒設定，那些 class 會被靜默丟棄。

用法：python scripts/check_overlay_css.py
"""
import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# (顯示名, class 名)  —— 調整「後」應該存在的
# 註：Tailwind 3 的 opacity 是白名單制，任意數字必須用 bracket 語法
# （bg-black/[0.42]）；寫成 /42 會被靜默丟棄，CSS 不產生、頁面不報錯，
# 只是沒有變亮。因此這裡驗證的 class 全部是 bracket 形式。
EXPECT_NEW = [
    # 5T-Tangible（2026-10-02）：全站橫幅組態統一為「零層全域遮罩 +
    # 唯一一層文字方框」。這裡驗證的就是那唯一一層。
    ("Home 文字方框 black/50", "bg-black/50"),
    ("子頁 文字方框 black/50", "bg-black/50"),
    ("Hero 文字方框 cream/80", "bg-ftg-cream/80"),
    ("figcaption black/50", "bg-black/50"),
]
# 調整「前」，應該已消失
EXPECT_GONE = [
    # 全域濾鏡層 —— 必須完全消失。照片亮度取決於它們不存在。
    ("舊 Home 全域 forest/[0.42]", "bg-ftg-forest/[0.42]"),
    ("舊 Home 全域 white/[0.07]", "bg-white/[0.07]"),
    ("舊 Hero 全域 sunlight/[0.56]", "bg-ftg-sunlight/[0.56]"),
    ("舊子頁 全域 forest/[0.36]", "bg-ftg-forest/[0.36]"),
    ("舊 Home 方框 black/25", "bg-black/25"),
    # 更早的歷史組態
    ("舊 figcaption black/70", "bg-black/70"),
    ("冗餘遮罩 forest/95", "bg-ftg-forest/95"),
    ("舊 Home forest/60", "bg-ftg-forest/60"),
    ("舊 Hero sunlight/80", "bg-ftg-sunlight/80"),
]


def norm(cls: str) -> str:
    """把 class 名轉成 CSS 選擇器中實際會出現的轉義形式。

    Tailwind 輸出時會跳脫兩類字元：
      '/' → '\\/'   （opacity 修飾符）
      '.' → '\\.'   （bracket 語法裡的 0.42）
      '[' ']' 也會跳脫。實測 dist CSS 裡的寫法是
      .bg-ftg-forest\/\[0\.42\]{...}，因此不能只處理 '/'。
    """
    out = "."
    for ch in cls:
        if ch in "/.[]()#%!,":
            out += "\\" + ch
        else:
            out += ch
    return out


def check(css: str, label: str) -> int:
    print("=" * 72)
    print(label)
    print("=" * 72)
    bad = 0
    print("應存在：")
    for name, cls in EXPECT_NEW:
        ok = norm(cls) in css
        if not ok:
            bad += 1
        print(f"  {name:26} .{cls.replace('/', '/')}"
              f"   {'✅' if ok else '❌ 未產生（Tailwind 丟棄了這個 class）'}")
    print("應已消失：")
    for name, cls in EXPECT_GONE:
        # 5T-Transparent: 不能只看 CSS 裡有沒有這條規則就報「殘留」。
        # Tailwind 的 content 掃描器不做語法解析，會把「註解裡提到的 class 名」
        # 也當成有效 class 掃進去 —— 例如我在移除冗餘遮罩時留下的說明註解
        # （「原本這裡有一層 bg-ftg-forest/95 遮罩…」）會讓該規則被重新產生。
        # 這不是 bug，但代表「CSS 有這條規則」不等於「程式有在用它」。
        # 因此這裡改為比對「該 class 是否出現在非註解的 JSX 中」。
        gone = norm(cls) not in css
        in_code = _class_used_in_code(cls)
        if not in_code:
            print(f"  {name:26} .{cls.replace('/', '/')}"
                  f"   ✅ 已從程式碼移除（CSS 殘留規則僅來自註解，無害）")
        elif gone:
            print(f"  {name:26} .{cls.replace('/', '/')}"
                  f"   ✅ 已移除（程式碼與 CSS 都無）")
        else:
            bad += 1
            print(f"  {name:26} .{cls.replace('/', '/')}"
                  f"   ❌ 程式碼仍在使用且 CSS 仍存在")
    return bad


def _class_used_in_code(cls: str) -> bool:
    """class 是否出現在 src/ 的 JSX className 中（排除 JSX 註解）。"""
    import re as _re
    src_dir = ROOT / "src"
    # 去掉 /* ... */ 與 // ... 後再找，才不會被說明註解誤判為「仍在使用」
    for f in src_dir.rglob("*.jsx"):
        # 5T-Trustworthy：嚴格解碼。舊版 errors="ignore" 會讓壞位元組直接消失，
        # 這個檢查器的用途正是「找出仍殘留的樣式」，用殘缺的文字去找殘留
        # 等於關掉了自己。壞位元組必須讓它炸出來。
        raw = f.read_text(encoding="utf-8")
        stripped = _re.sub(r"/\*.*?\*/", "", raw, flags=_re.S)
        stripped = _re.sub(r"(?m)^\s*//.*$", "", stripped)
        for m in _re.findall(r"className=[\"']([^\"']*)[\"']", stripped):
            if cls in m:
                return True
    return False


def main() -> int:
    dist_css = sorted(ROOT.glob("dist/assets/*.css"))
    if not dist_css:
        print("❌ dist/assets 沒有 CSS，先跑 pnpm run build")
        return 1
    bad = 0
    for f in dist_css:
        css = f.read_text(encoding="utf-8")
        bad += check(css, f"本機 dist：{f.name}（{f.stat().st_size:,} bytes）")
    print()
    if bad:
        print(f"=== 結果：{bad} 項不符 ===")
        print()
        print("常見根因：Tailwind 3 的 opacity 比例是白名單制，任意數字需在")
        print("tailwind.config.js 加 theme.extend.opacity，或改用 bracket 語法")
        print("（bg-ftg-forest/[0.42]）。未設定時該 class 會被靜默丟棄，")
        print("畫面不會報錯，只是沒有變亮 —— 務必以本工具確認。")
        return 1
    print("=== 結果：全部符合 ===")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
