#!/usr/bin/env python3
"""
5T-Transparent：掃描 src/ 裡「沒走 t() 的硬編碼繁中」。

背景：使用者回報「英文版 還是繁體中文」。
  - check_i18n_missing.py → PASS（所有 key 在 en 都存在）
  - scan-en-chinese.mjs   → PASS（en 字典 1084 串僅 1 個中文，是 lang.zh 標籤）
  兩個都綠，代表「英文版顯示中文」不是字典缺譯，而是某些文案根本沒接 t()，
  切換語言時它不變 → 使用者看到的就是繁中。

作法：逐檔移除 JSX/JS 註解與 t('…') 引數，再找殘餘 CJK。
  殘餘 = 一定是硬編碼（或是 t() 之外的字串常數）。
"""
from __future__ import annotations
import re
import sys
from pathlib import Path

CJK = re.compile(r"[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF]")

ROOT = Path(__file__).resolve().parent.parent / "src"

# 刻意保留中文的檔案：翻譯工具本體（字典本身就是雙語來源）。
SKIP_FILES = {"i18n/translations.js", "i18n/translations.js.bak"}


def strip_noise(src: str) -> str:
    # 1) 行註解 / 區塊註解
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    src = re.sub(r"(?<![:'\"])//[^\n]*", "", src)
    # 2) t('…') / t("…") 的引數內容 —— 那是字典 key，不是文案
    src = re.sub(r"\bt\(\s*(['\"`])(?:\\.|(?!\1).)*\1", "t(''", src, flags=re.S)
    return src


def main() -> int:
    hits: list[tuple[str, int, str]] = []
    scanned = 0

    for path in sorted(ROOT.rglob("*.jsx")) + sorted(ROOT.rglob("*.js")):
        rel = path.relative_to(ROOT).as_posix()
        if rel in SKIP_FILES:
            continue
        scanned += 1
        raw = path.read_text(encoding="utf-8")
        clean = strip_noise(raw)
        for i, line in enumerate(clean.splitlines(), 1):
            if CJK.search(line):
                hits.append((rel, i, line.strip()[:150]))

    print(f"掃描檔案: {scanned}")
    print(f"硬編碼中文行: {len(hits)}")
    print()
    by_file: dict[str, list[tuple[int, str]]] = {}
    for rel, ln, text in hits:
        by_file.setdefault(rel, []).append((ln, text))

    for rel in sorted(by_file, key=lambda r: -len(by_file[r])):
        rows = by_file[rel]
        print(f"■ {rel}  ({len(rows)} 行)")
        for ln, text in rows[:12]:
            print(f"    L{ln:<5} {text}")
        if len(rows) > 12:
            print(f"    ... 另有 {len(rows) - 12} 行")
        print()

    if hits:
        print("→ 有硬編碼中文，切英文版時不會跟著切。")
        return 1
    print("→ 無硬編碼中文，所有文案皆走 t()。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
