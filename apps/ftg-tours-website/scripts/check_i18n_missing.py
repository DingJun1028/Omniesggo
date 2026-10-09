"""5T-Transparent: 掃描「實際會顯示字面量」的缺 key，不只比對字典。

背景：t() 對缺鍵原樣回傳 key（LanguageContext.jsx），回傳值為真值，不觸發
任何 fallback。字典缺 key ≠ 會壞；但「頁面真的用 t() 讀了那個 key」才是
訪客會看到的 bug。因此本驗證器比對的是「頁面實際引用的 key」vs
「en 字典實際存在的 key」，兩者交集之差才是真正要修的缺口。

用法：python scripts/check_i18n_missing.py [--root <repo>]
exit 0 = 無缺口 / 1 = 有缺口（逐項列出）
"""
import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
if len(sys.argv) > 2 and sys.argv[1] == "--root":
    ROOT = Path(sys.argv[2])

# 頁面檔 -> 翻譯命名空間。刻意寫死成清單而非自動推導：自動推導會漏掉
# 命名空間與檔名不同的情況（例如 streams 頁讀多個命名空間）。
PAGES = {
    "pages/family-day": "familyDay",
    "pages/esg-team-day": "esgTeamDay",
    "pages/wellbeing-retreat": "wellbeing",
    "pages/executive-retreat": "executive",
    "pages/esg-impact-note": "impactNote",
    # 純靜態 key 的檔案：沒有動態組字串，直接比對即可
    # （about/privacy/terms 在 pages；notFound/footer 在 components）
    "pages/About": "about",
    "pages/Privacy": "privacy",
    "pages/Terms": "terms",
    "pages/NotFound": "notFound",
    "components/Footer": "footer",
}


def load_dict_block(text: str, lang: str) -> str:
    """切出某語言的整段字典內容。"""
    if lang == "zh":
        start = text.index("  zh: {")
        return text[start : text.index("  en: {")]
    return text[text.index("  en: {") :]


def ns_keys(block: str, ns: str) -> set:
    m = re.search(r"^    " + ns + r": \{\n(.*?)^    \},", block, re.M | re.S)
    if not m:
        return set()
    body = m.group(1)
    # 本專案的字典有兩種寫法，二者都必須算入：
    #   1) 獨立成行：      design1Desc: '...'          （^ 空白 key:）
    #   2) 同行合併：      design1Title: '...', design1Desc: '...'
    # 早期只抓 (1)，造成 96 個「缺 key」的假警報 —— 事實上那些 key 都存在。
    linestart = set(re.findall(r"^      ([A-Za-z0-9_]+):", body, re.M))
    inline = set(re.findall(r"([A-Za-z0-9_]+):\s*['\"]", body))
    return linestart | inline


def strip_comments(src: str) -> str:
    """移除 JS/JSX 註解，避免註解中的 t() 字樣被誤判為實際引用。

    不處理字串內的內容（例如 URL 裡的 //），因為那種情況下「粗略移除」
    會砍掉真正的程式碼；本專案的 src/ 沒有這類字串，且驗證器的用途是
    找出缺 key —— 寧可漏報也不要因誤報而讓人忽略真結果。
    """
    # /* ... */ 可跨行；// 到行尾
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"(?m)^\s*//.*$", "", src)
    return src


def used_keys(src: str, ns: str):
    """抓頁面實際引用的 key，涵蓋靜態與動態兩種寫法。

    動態寫法（t(`ns.design${i}Desc`)）無法靜態還原具體數字，只能推出前綴
    前綴比對會把 `design` 誤報成缺鍵（en 沒有 `design` 這個 key，但頁面也
    沒讀 `design`，它讀的是 design1Desc…design5Desc）。因此這裡對動態前綴
    改用「前綴 + 已存在的編號集合」推導：先用靜態 key 建立各前綴已知的編號
    集合，再用 zh 字典該前綴的編號集合交叉，得出頁面真正會讀到的 key。
    """
    keys = set(re.findall(r"t\(\s*'" + ns + r"\.([A-Za-z0-9_]+)'", src))
    # 動態前綴：抓 `ns.<前綴>${`，前綴本身不含結尾數字
    prefixes = set(re.findall(r"t\(\s*`" + ns + r"\.([A-Za-z_]+)\$\{", src))
    return keys, prefixes


def main() -> int:
    tpath = ROOT / "src" / "i18n" / "translations.js"
    text = tpath.read_text(encoding="utf-8")
    zh_block = load_dict_block(text, "zh")
    en_block = load_dict_block(text, "en")

    total = 0
    for key, ns in PAGES.items():
        # key 為 "pages/About" 或 "components/Footer"，一律補 .jsx
        p = ROOT / "src" / (key + ".jsx")
        if not p.exists():
            print("[SKIP] 找不到 %s" % p)
            continue
        src = strip_comments(p.read_text(encoding="utf-8"))
        static, prefixes = used_keys(src, ns)
        zh_keys = ns_keys(zh_block, ns)
        en_keys = ns_keys(en_block, ns)

        # 動態前綴展開：頁面用 `ns.<前綴>${n}Suffix`，n 來自頁內的資料陣列長度。
        # 無法靜態得知 n 的上界，但「zh 字典裡該前綴存在的所有編號」即為
        # 合理上界 —— 若頁面根本不會用到某編號，多算一個缺鍵只是多報；
        # 若漏算則會讓真 bug 通過。因此寧可多報不可漏報，並在輸出標明。
        dynamic = set()
        for pre in prefixes:
            zh_hit = {k for k in zh_keys if k.startswith(pre) and k[len(pre):].split("Desc")[0].split("Title")[0].isdigit()}
            dynamic |= zh_hit

        used = static | dynamic
        broken = sorted(k for k in used if k not in en_keys)
        total += len(broken)
        status = "OK " if not broken else "GAP"
        print("[%s] %-22s 引用 %3d 個 key（含 %d 動態），en 缺 %3d 個"
              % (status, p.stem, len(used), len(dynamic), len(broken)))
        for k in broken[:10]:
            print("        - %s.%s" % (ns, k))
        if len(broken) > 10:
            print("        ... 另有 %d 個" % (len(broken) - 10))

    print("")
    print("=== 會顯示字面量的缺 key 總數: %d" % total)
    if total:
        print("=== 結果: FAIL（英文訪客會看到 key 字串）")
        return 1
    print("=== 結果: PASS（所有頁面引用的 key 在 en 都存在）")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
