#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""5T-Trustworthy: 把「實際被引用」且檔名含空格/全形斜線的圖片改為 URL-safe 檔名。

為何必須做（線上實測證據）：
  /images/hero-banner.webp            → HTTP 200, image/webp, RIFF….WEBP 魔數   ✓
  /images/esg-team-day/team%20day-…  → HTTP 200, text/html,  <!doctype html>     ✗

  空格與全形斜線（U+FF0F）讓 nginx 匹配不到檔案，於是落到
  `try_files $uri $uri/ /index.html`，把 SPA 首頁當成「圖片」回傳。
  **HTTP 狀態碼是 200，但內容是 HTML**——只看狀態碼的檢查會誤判為成功。

處理範圍嚴格限定為「原始碼實際引用」到的檔案：
  未被引用的檔名即使難看也不動，避免無謂的檔案變動。
"""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BAD = re.compile(r"[ 　／]")  # 半形空格 / 全形空格 / 全形斜線


def collect_references() -> set[str]:
    """找出原始碼中所有被引用的 /images/ 路徑。"""
    refs: set[str] = set()
    files = list((ROOT / "src").rglob("*.jsx")) + list((ROOT / "src").rglob("*.js"))
    files += [ROOT / "index.html"]
    for f in files:
        if not f.is_file():
            continue
        # 5T-Trustworthy：嚴格解碼。舊版 errors="ignore" 會讓壞位元組直接消失，
        # 這個迴圈收集到的引用會是「殘缺的真值」；下游會依這些引用
        # 搬檔並改寫原始碼，一個被截斷的 /images/ 路徑就足以造成圖片 404。
        # 壞位元組必須讓它炸出來。
        text = f.read_text(encoding="utf-8")
        for m in re.finditer(r"['\"](/images/[^'\"]+?\.(?:webp|png|jpg|jpeg|svg|avif))['\"]", text):
            refs.add(m.group(1))
    return refs


def to_safe(url: str) -> str:
    """把 URL 路徑轉成 URL-safe：去空格、全形斜線轉半形、空白收斂為 -。

    注意：`／` (U+FF0F) 必須轉成「連字號」而不是半形 `/`。
    檔名裡的 `ESG／SDGs` 若轉成 `ESG/SDGs`，會被當成新的目錄分隔符，
    等於憑空多出一層目錄，檔案根本搬不過去（pyftsubset 那次踩過同類坑：
    6 個簡體字以為要另建 SC 補遺檔，實測 TC 變數字型已 883/883 涵蓋）。
    """
    out: list[str] = []
    for seg in url.split("/"):
        seg = seg.replace("／", "-")  # 全形斜線 → 連字號，維持單一段
        seg = seg.replace(" ", "-").replace("　", "-")
        seg = re.sub(r"-{2,}", "-", seg).strip("-")
        out.append(seg)
    return "/".join(out)


def resolve_renames() -> dict[str, str]:
    """從 git 的 rename 記錄建立「舊 URL → 新 URL」對照。

    為什麼需要這個：檔案重新命名可能已經發生（例如分兩次執行、或前一次執行
    已完成搬檔但當時中斷在更新引用之前）。此時磁碟上只有新檔名，
    `src.exists()` 對舊名稱一律為 False，若直接略過，原始碼引用就永遠停在
    舊路徑——症狀是部署後圖片 404。git 是唯一可靠的新舊名對照來源。
    """
    mapping: dict[str, str] = {}
    try:
        out = subprocess.run(
            ["git", "-c", "core.quotepath=false", "diff", "--cached",
             "--name-status", "--diff-filter=R"],
            cwd=ROOT, capture_output=True, text=True, encoding="utf-8",
        ).stdout
    except (OSError, subprocess.SubprocessError):
        return mapping
    for line in out.splitlines():
        if "\t" not in line:
            continue
        # 格式為 "R100\t<舊路徑>\t<新路徑>"——三段，不是 "舊 -> 新"。
        # 只切一次會把新舊黏成同一段，導致下面的比對永遠失效。
        parts = line.split("\t")
        if len(parts) < 3:
            continue
        old, new = parts[1].strip(), parts[2].strip()
        # 只處理同一個目錄底下的重新命名（跨目錄搬遷不屬本腳本範圍）
        if old.rsplit("/", 1)[0] != new.rsplit("/", 1)[0]:
            continue
        mapping["/" + old[len("public/"):]] = "/" + new[len("public/"):]
    return mapping


def main() -> int:
    refs = collect_references()
    bad_refs = sorted(u for u in refs if BAD.search(u))
    renames = resolve_renames()
    print(f"5T-Traceable: 引用 {len(refs)} 條，其中檔名含空格/全形斜線 {len(bad_refs)} 條")
    if renames:
        print(f"5T-Traceable: 從 git 索引取得 {len(renames)} 組已完成的重新命名對照")
    print()

    if not bad_refs:
        print("  無需處理。")
        return 0

    moves: list[tuple[Path, Path]] = []
    resolved: list[tuple[str, str]] = []  # (舊 URL, 新 URL)，僅引用更新時需要
    for url in bad_refs:
        src = ROOT / "public" / url.lstrip("/")
        dst_url = to_safe(url)
        dst = ROOT / "public" / dst_url.lstrip("/")

        if src.exists():
            if dst.exists() and dst != src:
                print(f"  ! 目標已存在，略過：{dst_url}")
                continue
            moves.append((src, dst))
            resolved.append((url, dst_url))
        elif url in renames:
            # 檔案已搬過，直接採用 git 記錄的新名，不重複搬檔
            resolved.append((url, renames[url]))
        else:
            print(f"  ! 原始檔不存在且無 rename 記錄，略過：{url}")
            continue
        print(f"  {url}")
        print(f"    → {resolved[-1][1]}")

    if moves:
        print(f"\n5T-Traceable: 執行 {len(moves)} 次重新命名")
        for src, dst in moves:
            dst.parent.mkdir(parents=True, exist_ok=True)
            src.rename(dst)
            print(f"  renamed: {src.name}")
    elif not resolved:
        return 1

    # 同步更新原始碼引用
    print("\n5T-Traceable: 更新原始碼引用")
    changed = 0
    sources = list((ROOT / "src").rglob("*.jsx")) + list((ROOT / "src").rglob("*.js")) + [ROOT / "index.html"]
    for old_url, new_url in resolved:
        for f in sources:
            if not f.is_file():
                continue
            t = f.read_text(encoding="utf-8")
            if old_url in t:
                # 保持原檔的行尾：newline="" 讓 write_text 不做轉換，
                # 否則整檔會被改成 LF，diff 膨脹成「每行都改」（曾在這裡踩過）。
                f.write_text(t.replace(old_url, new_url), encoding="utf-8", newline="")
                print(f"  {f.relative_to(ROOT).as_posix()}: {old_url} → {new_url}")
                changed += 1

    print(f"\n完成：{len(moves)} 個檔案重新命名，{changed} 處引用更新")
    return 0


if __name__ == "__main__":
    sys.exit(main())
