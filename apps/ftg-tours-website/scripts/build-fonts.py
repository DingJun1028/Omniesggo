#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""5T-Traceable: 產生本站自架字型子集，並寫出 codepoint 存檔清單。

為什麼需要這個腳本（src/tests/fonts.test.js 會強制呼叫它）：
本站字型是「依實際用字硬子集」的，體積從 Google Fonts 的 17.6MB / 366 檔
降到 734KB / 2 檔。代價是：**日後新增文案若用到子集沒有的字，該字會掉回
系統字型**。這在視覺上很難察覺，所以用測試把它變成可攔截的錯誤。

用法（Windows / git-bash）::

    uv venv .fontenv --python 3.11
    uv pip install --python .fontenv/Scripts/python.exe fonttools brotli
    .fontenv/Scripts/python.exe scripts/build-fonts.py

若新增文案後測試報缺字，直接重跑本腳本即可自動補齊。
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "fonts"
CACHE = ROOT / ".font-cache"
BASE = "https://raw.githubusercontent.com/notofonts/noto-cjk/main"
UA = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}

# 變數字型：一個檔涵蓋全站用到的字重（原本 Google 也是取變數版 wght@400;600;700）
SOURCES = {
    "noto-serif-tc": {
        "family": "Noto Serif TC",
        "url": f"{BASE}/Serif/Variable/OTF/NotoSerifCJKtc-VF.otf",
        "axes": "wght",
    },
    "inter-latin": {
        "family": "Inter",
        "url": "https://raw.githubusercontent.com/rsms/inter/master/docs/font-files/InterVariable.ttf",
        "axes": "opsz,wght",
    },
}

SCAN = ("src/**/*", "index.html", "public/**/*.html")
TEXT_EXT = {".js", ".jsx", ".ts", ".tsx", ".css", ".html", ".json", ".md"}


def site_text() -> str:
    """撈出全站會渲染的文案來源。"""
    import glob

    chunks: list[str] = []
    for pat in SCAN:
        for path in glob.glob(str(ROOT / pat), recursive=True):
            p = Path(path)
            if not p.is_file() or p.suffix not in TEXT_EXT:
                continue
            if any(part in {"node_modules", "dist", ".font-cache", "tests"} for part in p.parts):
                # tests/ 不渲染，其用字不該影響字型子集（與 release-guard 的品牌碼位測試一致）
                continue
            # 5T-Trustworthy：嚴格解碼，壞位元組立刻報錯而非無聲丟棄。
            # 舊版 errors="ignore" 會讓壞位元組消失 → 字型子集漏字 → 線上豆腐字，
            # 而且全程無任何錯誤訊息。先修好檔案，再來跑這裡。
            # 注意：UnicodeDecodeError 刻意不放進 except —— 那是損毀訊號，
            # 必須讓它炸出來，不能和真正的 I/O 錯誤一起被 continue 吃掉。
            try:
                chunks.append(p.read_text(encoding="utf-8"))
            except OSError:
                continue
    return "\n".join(chunks)


def charset(text: str) -> set[str]:
    """拆出漢字與非漢字。漢字走 Noto Serif TC，其餘走 Inter。"""
    han = set(re.findall(r"[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]", text))
    han |= set("0123456789")  # 數字全站通用，強制納入避免漏字
    # 非漢字：可列印 ASCII、Latin-1 補充、箭頭、間隔號、中日文標點
    non_han = set(
        re.findall(
            r"[!-~ -ÿ←→-⇓·"
            r"、-〃！-＠〔-〟【-】]",
            text,
        )
    )
    return han, non_han


def download(url: str, dest: Path) -> Path:
    if dest.exists() and dest.stat().st_size > 0:
        return dest
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  下載 {url.rsplit('/', 1)[-1]} …", flush=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=300) as r:
        dest.write_bytes(r.read())
    return dest


def subset(src: Path, out: Path, chars: set[str], label: str) -> None:
    text_file = CACHE / f"{label}.txt"
    text_file.parent.mkdir(parents=True, exist_ok=True)
    text_file.write_text("".join(sorted(chars)), encoding="utf-8")
    cmd = [
        sys.executable, "-m", "fontTools.subset", str(src),
        f"--text-file={text_file}",
        f"--output-file={out}",
        "--flavor=woff2",
        "--layout-features=kern,liga,locl,ccmp,vert,vrt2",
        "--notdef-outline",
        "--name-IDs=1,2,3,4,5,6",
        "--drop-tables+=DSIG",
        "--passthrough-tables",
        "--recalc-bounds",
    ]
    subprocess.run(cmd, check=True, capture_output=True)


def codepoints(font: Path) -> list[str]:
    from fontTools.ttLib import TTFont

    f = TTFont(str(font), lazy=True)
    cps: set[int] = set()
    for table in f["cmap"].tables:
        cps.update(table.cmap.keys())
    f.close()
    return [f"U+{c:04X}" for c in sorted(cps)]


def main() -> int:
    han, non_han = charset(site_text())
    print(f"5T-Traceable: 站方用字 漢字 {len(han)} / 非漢字 {len(non_han)}")

    OUT.mkdir(parents=True, exist_ok=True)
    manifest = {
        "generator": "scripts/build-fonts.py",
        "note": "由腳本產生；新增文案若測試報缺字，重跑本腳本，不要手改。",
        "fonts": {},
    }

    for key, meta in SOURCES.items():
        chars = han if key == "noto-serif-tc" else non_han
        src = download(meta["url"], CACHE / src_name(meta["url"]))
        out = OUT / f"{key}.woff2"
        print(f"  子集 {key}（{len(chars)} 字）…", flush=True)
        subset(src, out, chars, key)
        manifest["fonts"][key] = {
            "family": meta["family"],
            "file": out.name,
            "bytes": out.stat().st_size,
            "axes": meta["axes"],
            # 以單一空白分隔字串存放，而非 JSON 陣列：875 個碼位用陣列會讓
            # 存檔清單膨脹成 1100 行；測試仍可 .split(' ') 逐一比對。
            #
            # 5T-Trustworthy: 這裡必須是「產出的 .woff2 實際含有的碼位」，
            # 而不是來源字型的全部碼位。差異是實質的：若記錄來源全部碼位，
            # 測試會對任何用字都通過，等於把字型子集檢查整個廢掉 ——
            # 子集沒某個字時，該字會掉回系統字型，正是這個欄位要擋的。
            # 讀的是 out（產出），不是 src（來源）。
            "codepoints": " ".join(codepoints(out)),
        }
        print(f"    → {out.stat().st_size:,} bytes")

    # 存檔清單放 src/ 而非 public/：public/ 會被整包部署到公開網域，
    # 這份建置中繼資料不需要對外，也沒必要佔 19KB 的傳輸。
    manifest_path = ROOT / "src" / "font-subset-manifest.json"
    manifest_path.write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"  已寫出 {manifest_path.relative_to(ROOT).as_posix()}")
    return 0


def src_name(url: str) -> str:
    return url.rsplit("/", 1)[-1]


if __name__ == "__main__":
    raise SystemExit(main())
