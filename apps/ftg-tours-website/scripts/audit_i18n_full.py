"""全站 i18n 完整性驗證（5T-Transparent：證據方法先於結論）。

為什麼重寫而不沿用 check_i18n_missing.py：
  那支只查 PAGES 字典裡列出的 10 個檔案（硬編碼清單）。未列入的頁面與
  元件完全沒被掃到 —— 這是「逐檔打地苗」：清單外的缺陷會靜靜通過。
  站上已有 src/components/*.jsx 十幾支、pages/*.jsx 十幾支，硬編碼必然漏。

本驗證器的做法：
  1. 遞迴掃描 src/ 下所有 .js/.jsx（排除 __tests__、node_modules）。
  2. 抓出每一個 t('ns.key') / t(`ns.key...`) 呼叫（含動態前綴）。
  3. 對每個 key 檢查 zh 與 en 兩份字典是否都有。
  4. 另外做反向檢查：字典裡有但全站沒人用的 key（孤兒 key），
     通常代表改名後的殘留，會讓維護者誤以為該文案有在用。

三種失敗分開報，不混為一談：
  MISSING_EN  頁面在用、zh 有、en 缺 → 英文訪客看到字面量（真 bug）
  MISSING_ZH  頁面在用、en 有、zh 缺 → 中文訪客看到字面量（真 bug）
  BOTH_MISSING 兩份都缺            → 兩種語系都壞（多半是打錯 key）

字典 key 解析必須涵蓋兩種寫法（實測踩過）：
  獨立成行   design1Desc: '...'
  同行合併   design1Title: '...', design1Desc: '...'
只抓前者會產生大量假警報（曾誤報 96 個）。

exit 0 = 全站無缺 key / 1 = 有缺
"""
import io
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
DICT_FILE = SRC / "i18n" / "translations.js"

SKIP_DIRS = {"__tests__", "tests", "node_modules", "coverage"}
SCAN_EXT = (".js", ".jsx")


def split_lang_blocks(text: str):
    """切出 zh / en 兩段字典內容。"""
    i_en = text.index("  en: {")
    return text[:i_en], text[i_en:]


def ns_keys(block: str, ns: str) -> set:
    m = re.search(r"^    " + ns + r": \{\n(.*?)^    \},", block, re.M | re.S)
    if not m:
        return set()
    body = m.group(1)
    a = set(re.findall(r"^      ([A-Za-z0-9_]+):", body, re.M))
    b = set(re.findall(r"([A-Za-z0-9_]+):\s*['\"]", body))
    return a | b


def all_ns_names(block: str) -> set:
    return set(re.findall(r"^    ([A-Za-z][A-Za-z0-9_]*): \{", block, re.M))


def strip_comments(src: str) -> str:
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"(?m)^\s*//.*$", "", src)
    return src


def scan_file(path: Path):
    """回傳 (靜態 key 集合, 動態前綴集合)。"""
    src = strip_comments(path.read_text(encoding="utf-8"))
    static = set()
    for ns, k in re.findall(r"t\(\s*'([A-Za-z][A-Za-z0-9_]*)\.([A-Za-z0-9_]+)'", src):
        static.add((ns, k))
    prefixes = set()
    for ns, pre in re.findall(r"t\(\s*`([A-Za-z][A-Za-z0-9_]*)\.([A-Za-z_]+)\$\{", src):
        prefixes.add((ns, pre))
    return static, prefixes


def expand_dynamic(prefix_set, zh_keys_by_ns):
    """動態前綴展開：以 zh 字典該前綴的編號集合為上界。

    刻意寧可多報：頁面用 `ns.design${i}Desc` 時無法靜態得知 i 上界，
    以 zh 現有編號為上界會涵蓋所有可能渲染到的 key。若某編號頁面其實
    渲染不到，多報一個不影響正確性；反之若漏報，真 bug 就會通過。
    """
    out = set()
    for ns, pre in prefix_set:
        for k in zh_keys_by_ns.get(ns, set()):
            tail = k[len(pre):]
            for sep in ("Desc", "Title", "Name", "Text"):
                if tail.startswith(sep):
                    tail = tail[len(sep):]
                    break
            if tail.isdigit():
                out.add((ns, k))
    return out


def main() -> int:
    text = DICT_FILE.read_text(encoding="utf-8")
    zh_block, en_block = split_lang_blocks(text)
    zh_nss = all_ns_names(zh_block)
    en_nss = all_ns_names(en_block)

    zh_keys_by_ns = {ns: ns_keys(zh_block, ns) for ns in zh_nss}
    en_keys_by_ns = {ns: ns_keys(en_block, ns) for ns in en_nss}

    # ---- 掃描全部 src 檔案 ----
    static_all = set()
    prefix_all = set()
    files = []
    for root, dirs, fs in os.walk(SRC):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for f in fs:
            if f.endswith(SCAN_EXT):
                p = Path(root) / f
                files.append(p)
                s, d = scan_file(p)
                static_all |= s
                prefix_all |= d

    used = static_all | expand_dynamic(prefix_all, zh_keys_by_ns)

    print("=" * 74)
    print("全站 i18n 驗證")
    print("=" * 74)
    print("掃描檔案數 : %d" % len(files))
    print("zh 命名空間 : %d" % len(zh_nss))
    print("en 命名空間 : %d" % len(en_nss))
    print("頁面實際引用 key : %d（靜態 %d + 動態展開 %d）"
          % (len(used), len(static_all), len(used) - len(static_all)))
    print("")

    # ---- 命名空間層級 ----
    ns_miss_en = zh_nss - en_nss
    ns_miss_zh = en_nss - zh_nss
    if ns_miss_en:
        print("[GAP] en 缺整個命名空間: %s" % ", ".join(sorted(ns_miss_en)))
    if ns_miss_zh:
        print("[GAP] zh 缺整個命名空間: %s" % ", ".join(sorted(ns_miss_zh)))

    # ---- key 層級三種失敗 ----
    missing_en, missing_zh, both = [], [], []
    for ns, k in sorted(used):
        in_zh = k in zh_keys_by_ns.get(ns, set())
        in_en = k in en_keys_by_ns.get(ns, set())
        if in_zh and not in_en:
            missing_en.append("%s.%s" % (ns, k))
        elif in_en and not in_zh:
            missing_zh.append("%s.%s" % (ns, k))
        elif not in_zh and not in_en:
            both.append("%s.%s" % (ns, k))

    for label, items, desc in (
        ("MISSING_EN", missing_en, "英文訪客會看到字面量"),
        ("MISSING_ZH", missing_zh, "中文訪客會看到字面量"),
        ("BOTH_MISSING", both, "兩種語系都會看到字面量"),
    ):
        print("[%s] %d 個 — %s" % (label, len(items), desc))
        for it in items[:25]:
            print("        - %s" % it)
        if len(items) > 25:
            print("        ... 另有 %d 個" % (len(items) - 25))
    print("")

    # ---- 反向：孤兒 key（字典有但沒人用）----
    orphan_zh = set()
    for ns in zh_nss:
        for k in zh_keys_by_ns[ns]:
            if (ns, k) not in used:
                orphan_zh.add("%s.%s" % (ns, k))
    print("[ORPHAN_ZH] %d 個字典 key 未被任何頁面引用" % len(orphan_zh))
    if orphan_zh:
        sample = sorted(orphan_zh)[:12]
        print("        範例: %s" % ", ".join(sample))
        print("        （非阻斷項：可能是預留文案，但改名後的殘留也長這樣）")
    print("")

    bad = len(missing_en) + len(missing_zh) + len(both) + len(ns_miss_en) + len(ns_miss_zh)
    if bad == 0:
        print("=== 結果: PASS（全站每一個 t() 呼叫在 zh/en 都有對應字串）")
        return 0
    print("=== 結果: FAIL（%d 項缺失，阻斷項為 MISSING_* / BOTH_MISSING）" % bad)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
