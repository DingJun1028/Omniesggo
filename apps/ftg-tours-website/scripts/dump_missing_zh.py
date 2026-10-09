"""匯出缺 key 的中文原文，供翻譯使用。

5T-Traceable: 翻譯必須以 zh 字典的實際原文為依據，不得憑記憶或語意推測。
因此本工具把「頁面實際引用、但 en 缺」的每一個 key 連同其 zh 值一併輸出，
翻譯時對照原文逐條處理；譯完再以 --verify 模式比對 key 集合是否已對稱。

用法：
  python scripts/dump_missing_zh.py            # 匯出待譯清單
  python scripts/dump_missing_zh.py --ns esgTeamDay   # 只看單一命名空間
"""
import io
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
from check_i18n_missing import (  # noqa: E402
    PAGES, load_dict_block, ns_keys, used_keys, strip_comments,
)

TEXTS = ROOT / "src" / "i18n" / "translations.js"


def parse_values(block: str, ns: str) -> dict:
    """把某命名空間下的 key -> 值（字串值原樣，含跳脫）取出來。"""
    m = re.search(r"^    " + ns + r": \{\n(.*?)^    \},", block, re.M | re.S)
    if not m:
        return {}
    out = {}
    for k, v in re.findall(r"^      ([A-Za-z0-9_]+):\s*('(?:[^'\\]|\\.)*'|\"(?:[^\"\\]|\\.)*\"),",
                           m.group(1), re.M):
        out[k] = v
    return out


def main() -> int:
    only = None
    if len(sys.argv) > 2 and sys.argv[1] == "--ns":
        only = sys.argv[2]

    text = TEXTS.read_text(encoding="utf-8")
    zh_block = load_dict_block(text, "zh")
    en_block = load_dict_block(text, "en")

    total = 0
    for key, ns in PAGES.items():
        if only and ns != only:
            continue
        p = ROOT / "src" / (key + ".jsx")
        if not p.exists():
            continue
        src = strip_comments(p.read_text(encoding="utf-8"))
        static, prefixes = used_keys(src, ns)
        zh_vals = parse_values(zh_block, ns)
        zh_keys = set(zh_vals)
        en_keys = ns_keys(en_block, ns)

        dynamic = set()
        for pre in prefixes:
            zh_hit = {k for k in zh_keys
                      if k.startswith(pre)
                      and k[len(pre):].split("Desc")[0].split("Title")[0].isdigit()}
            dynamic |= zh_hit

        used = static | dynamic
        missing = sorted(k for k in used if k not in en_keys)
        if not missing:
            continue

        print("=" * 78)
        print("命名空間 %s（來源 %s）— 缺 %d 個" % (ns, key, len(missing)))
        print("=" * 78)
        for k in missing:
            zh = zh_vals.get(k)
            if zh is None:
                print("  %-22s <<< zh 字典也沒有此鍵，須回頁面補文案 >>>" % k)
            else:
                print("  %-22s %s" % (k, zh))
        print("")
        total += len(missing)

    print("### 合計缺 %d 個 key" % total)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
