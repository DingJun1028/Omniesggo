"""部署前閘門：驗證 dist bundle 的關鍵內容。

存在理由：grep -c 在此環境會回傳多行 "0\\n0"，導致 shell 的 [ ] 整數比較
報錯，容易被誤讀成「缺失」。改用 Python 明確計數並輸出 PASS/FAIL，
讓部署前的判斷只有一種可能。

5T-Transparent: 「舊錯資料未出現」用 not-in 檢查。但 bundle 內可能以跳脫
形式存在（例如 "7743-1006" 被拆成字串相加），因此 not-in 只是必要條件；
真正的確認仍以線上 origin 層驗證為準。此處擋的是最常見的「忘了改」。

exit 0 = 可部署 / 1 = 不可部署
"""
import sys
from pathlib import Path

DIST = Path(__file__).resolve().parent.parent / "dist"

# 必須存在：這次部署的核心成果
REQUIRED = {
    "about.zh": "三大永續目標",
    "about.en": "About Us",
    "privacy.zh": "隱私權政策",
    "terms.zh": "服務條款",
    "company.postal": "02-8512-3099",
    "company.addr": "新北市三重區",
    "goal.key": "goal1Desc",
}

# 必須不存在：先前已修正的錯誤資料
FORBIDDEN = {
    "old.phone": "7743-1006",
    "old.email": "hello@ftgtours.com",
    "old.addr": "台北市中山區",
    "dead.link": 'href="#/"',
}


def main() -> int:
    bundles = sorted(DIST.glob("assets/*.js"))
    if not bundles:
        print("FAIL: dist/assets 內找不到任何 JS bundle")
        return 1
    if len(bundles) > 1:
        # 多個 bundle 代表上一次的殘留，部署會讓舊檔案留在線上
        print("WARN: dist/assets 有 %d 個 bundle，部署前應清空重建：" % len(bundles))
        for b in bundles:
            print("      %s" % b.name)
    # 5T-Trustworthy：嚴格解碼。舊版 errors="replace" 會把 bundle 裡的壞位元組
    # 換成 U+FFFD；若 REQUIRED 錨點本身碰到那個位置，就會「假報 FAIL」，
    # 而部署無從分辨是真缺字元還是解碼損毀。解碼失敗必須讓它炸出來。
    text = "\n".join(b.read_text(encoding="utf-8") for b in bundles)
    print("驗證對象: %s (%d 檔, %d bytes)" % (", ".join(b.name for b in bundles), len(bundles), len(text)))
    print("")

    bad = 0
    for label, needle in REQUIRED.items():
        n = text.count(needle)
        ok = n > 0
        bad += 0 if ok else 1
        print("  [%s] 必須存在 %-14s %-16s (%d)" % ("OK" if ok else "FAIL", label, needle, n))

    print("")
    for label, needle in FORBIDDEN.items():
        n = text.count(needle)
        ok = n == 0
        bad += 0 if ok else 1
        print("  [%s] 必須不存在 %-12s %-22s (%d)" % ("OK" if ok else "FAIL", label, needle, n))

    print("")
    print("=== 結果: %s" % ("PASS 可部署" if bad == 0 else "FAIL 擋下 %d 項" % bad))
    return 0 if bad == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
