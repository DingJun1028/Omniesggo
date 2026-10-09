#!/usr/bin/env python3
"""check_mojibake.py — 編碼損毀防護閘

根因（2026-10-02 實測）：
  某環節以 errors="ignore"/"replace" 解碼文字檔，再寫回 UTF-8，
  會把無法解碼的位元組「吞掉」或換成 U+FFFD（EF BF BD）。這是
  單向不可逆的：原始位元組永久丟失，之後無法從 repo 還原。

  實例：scripts/verify_live_routes.py 的「有路由缺失」三個字，
  「失」被吃掉成三個 U+FFFD，且已 commit 進版控。

  真正的根因不是那一個字，而是「損毀能無聲通過」——
  沒有任何檢查會因此報錯。本檔就是補上那個檢查。

檢查三類：
  1. MOJIBAKE      文字檔含 U+FFFD（已發生的損毀）
  2. LOSSY_DECODER  第一方程式碼用 errors="ignore"/"replace" 讀寫檔案
                    （損毀的成因；純檢查不做診斷時這是預警）
  3. 非 UTF-8       宣稱是文字檔卻無法以 UTF-8 解碼

退出碼：0 = 乾淨；1 = 有發現。
刻意不做的事：不猜測原本是什麼字（位元組已丟失，猜測只會製造
新的幻覺）。只報告「這裡損毀了，請從來源重新產生」。

用法：
  python scripts/check_mojibake.py            # 掃整個 repo
  python scripts/check_mojibake.py --quiet    # 只印摘要
"""
from __future__ import annotations

import argparse
import os
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

# 不掃：依賴、建置產物、版控、字型環境
SKIP_DIRS = {
    ".git", "node_modules", "dist", "build", "coverage", "__pycache__",
    ".venv", "venv", ".fontenv", ".next", ".cache", "site-packages",
    ".brand-backup", ".tmp",
}
# 不掃：二進位或字型資源（對二進位做文字比對只會產生雜訊）
SKIP_SUFFIX = {
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".ico", ".bmp",
    ".woff", ".woff2", ".ttf", ".otf", ".eot",
    ".zip", ".gz", ".tgz", ".bz2", ".xz", ".7z", ".rar",
    ".mp3", ".mp4", ".mov", ".avi", ".webm", ".wav",
    ".pdf", ".exe", ".dll", ".so", ".dylib", ".wasm",
    ".db", ".sqlite", ".lock",
}

TEXT_SUFFIX = {
    ".py", ".js", ".jsx", ".mjs", ".cjs", ".ts", ".tsx",
    ".sh", ".bash", ".yml", ".yaml", ".json", ".jsonc",
    ".md", ".mdx", ".html", ".htm", ".css", ".scss",
    ".txt", ".env", ".toml", ".ini", ".cfg", ".xml", ".svg",
}

FFFD = "\ufffd"

# 第一方程式碼裡的「損毀成因」慣犯。
# 只對會寫回檔案的呼叫有意義：讀取時 ignore 只是寬容，寫回時才會毀損。
LOSSY_RE = re.compile(r"""errors\s*=\s*['"](?:ignore|replace)['"]""")

# 寫回檔案的動詞：這些行附近的 errors= 才真的會造成損毀
WRITE_VERBS = re.compile(
    r"""write_text|\.write\s*\(|open\s*\([^)]*['"][wax]b?['"]|dump\(|dumpjs\("""
)


def iter_candidates() -> list[Path]:
    out: list[Path] = []
    for root, dirs, files in os.walk(REPO):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS and not d.startswith(".")]
        for fn in files:
            p = Path(root) / fn
            if p.suffix.lower() in SKIP_SUFFIX:
                continue
            if p.suffix.lower() in TEXT_SUFFIX or p.suffix == "":
                out.append(p)
    return out


def scan_mojibake(paths: list[Path]) -> list[tuple[Path, int, int]]:
    """回傳 (檔案, 行號, 該行 U+FFFD 數量)"""
    hits = []
    for p in paths:
        try:
            raw = p.read_bytes()
            text = raw.decode("utf-8")
        except UnicodeDecodeError:
            continue  # 交給 non_utf8 檢查處理
        except OSError:
            continue
        if FFFD not in text:
            continue
        for i, line in enumerate(text.splitlines(), 1):
            n = line.count(FFFD)
            if n:
                hits.append((p, i, n))
    return hits


def scan_non_utf8(paths: list[Path]) -> list[tuple[Path, str]]:
    out = []
    for p in paths:
        try:
            raw = p.read_bytes()
        except OSError:
            continue
        if not raw:
            continue
        try:
            raw.decode("utf-8")
        except UnicodeDecodeError as e:
            out.append((p, f"{e.start}: {e.reason}"))
    return out


def scan_lossy_decoders(paths: list[Path]) -> list[tuple[Path, int, str]]:
    """只在使用者程式碼中，同一行/相鄰行出現寫檔動詞時才回報。"""
    out = []
    for p in paths:
        if p.suffix.lower() not in {".py", ".sh", ".bash", ".mjs", ".cjs", ".js"}:
            continue
        try:
            lines = p.read_text(encoding="utf-8").splitlines()
        except (UnicodeDecodeError, OSError):
            continue
        for i, line in enumerate(lines):
            if not LOSSY_RE.search(line):
                continue
            # 往前後各看 3 行，捕捉「先讀 ignore、再寫回」的拆行寫法
            ctx = lines[max(0, i - 3): i + 4]
            if not any(WRITE_VERBS.search(c) for c in ctx):
                continue
            out.append((p, i + 1, line.strip()[:100]))
    return out


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--quiet", action="store_true")
    args = ap.parse_args()

    paths = iter_candidates()
    moji = scan_mojibake(paths)
    non_utf8 = scan_non_utf8(paths)
    lossy = scan_lossy_decoders(paths)

    rel = lambda p: str(p.relative_to(REPO)).replace("\\", "/")

    if not args.quiet:
        print("=" * 66)
        print("編碼損毀防護閘 — check_mojibake.py")
        print("=" * 66)
        print(f"  掃描文字檔：{len(paths)} 個")
        print()

    for p, line, n in moji:
        print(f"  [MOJIBAKE]      {rel(p)}:{line}  ({n} 個 U+FFFD)")
        if not args.quiet:
            try:
                text = p.read_text(encoding="utf-8").splitlines()[line - 1]
                snippet = text.strip()
                if len(snippet) > 90:
                    snippet = snippet[:90] + "..."
                print(f"                 {snippet}")
            except (OSError, IndexError):
                pass
            print("                 修復：位元組已丟失，請從來源重新產生"
                  "（不可靠猜測原字）")

    for p, why in non_utf8:
        print(f"  [NON_UTF8]      {rel(p)}  ({why})")

    for p, line, src in lossy:
        print(f"  [LOSSY_DECODER] {rel(p)}:{line}")
        if not args.quiet:
            print(f"                 {src}")
            print("                 讀取時 ignore 只丟棄該檔案的壞位元組；"
                  "若此結果被寫回檔案則不可逆。")

    total = len(moji) + len(non_utf8) + len(lossy)
    print()
    if total:
        print(f"FAIL: {total} 項發現"
              f"（MOJIBAKE {len(moji)} / NON_UTF8 {len(non_utf8)}"
              f" / LOSSY_DECODER {len(lossy)}）")
        return 1

    print("PASS: 無編碼損毀、無損毀成因慣犯。")
    return 0


if __name__ == "__main__":
    sys.exit(main())