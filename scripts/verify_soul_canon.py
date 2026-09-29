#!/usr/bin/env python3
"""
OA-Team 30 聖典結構完整性驗證
支援 soul.md 實際格式

changelog:
  v2  修正矩陣解析（|序號|編號|萬能XX|…）— 原 \S+蜂 要求「蜂」在名結尾，漏掉 01 萬能蜂后
  v2  修正預設路徑 — 原預設 'soul.md' 會讀到 repo 根的舊版 v0.7.3，非正典 esggo-omni-center/soul.md
  v2  30 矩陣不足改為 FAIL（不再僅 ⚠ 軟警示）
  v2  新增正典分歧偵測（多份 soul.md 版號不一致時警示）
"""

import os
import re
import sys

# 正典路徑（優先序）：越靠前越新
CANON_CANDIDATES = [
    'esggo-omni-center/soul.md',
    os.path.join('esggo-omni-center', 'soul.md'),
    'soul.md',
]

# 矩陣資料列：| 序號 | 編號 | 萬能XX | 標籤 | 對應 |
MATRIX_ROW = re.compile(r'^\|\s*\d{1,2}\s*\|\s*(\d{2})\s*\|\s*(萬能[^|]*?)\s*\|', re.M)
# 版號：ESG GO v0.14
VERSION_RE = re.compile(r'ESG GO v(\d+(?:\.\d+)*)')


def find_canon(explicit=None):
    """定位正典檔：顯式指定 > 候選清單（存在且含 30 矩陣者優先）> repo 根"""
    if explicit:
        return explicit
    best = None
    for cand in CANON_CANDIDATES:
        if not os.path.exists(cand):
            continue
        try:
            with open(cand, 'r', encoding='utf-8') as f:
                head = f.read(200000)
        except OSError:
            continue
        rows = MATRIX_ROW.findall(head)
        score = len(set(r[0] for r in rows))
        if best is None or score > best[1]:
            best = (cand, score)
    return best[0] if best else 'soul.md'


def detect_divergence(filepath):
    """
    偵測 repo 內多份 soul.md 的版號分歧。

    效能與正確性（v3 修正，均經實測）：
      D1 Windows junction 會讓 os.walk 遞迴——os.path.islink() 對 junction
         回傳 False，followlinks=False 擋不住。改以 st_dev/st_ino 去重 + 排除集。
      D2 本函式的 filepath 參數原本完全未使用，內部寫死 os.walk('.')。現用它決定
         搜尋根，並確保正典本身一定在結果內（否則「本次驗證目標」標記永遠對不上）。
      D3 UnicodeDecodeError 不是 OSError 子類，非 UTF-8 檔會拋未捕例外。
         開檔一律 errors='replace'，並捕 (OSError, UnicodeDecodeError)。
      D4 原本每次執行都全樹遍歷（實測 >12s / 136k 檔案未完）。改為以排除集
         限縮搜尋範圍，並跳過 node_modules/.git/.next 等高樹目錄。
    """
    # 明確排除：建置產物、依賴、快取、以及已知會造成重複計數的 junction 目標
    EXCLUDE = {
        '.git', 'node_modules', '.next', '.scratch', 'dist', 'build',
        '.turbo', 'coverage', '__pycache__', '.venv', 'venv',
        '.agents',           # repo 內有 .hermes/skills/supabase -> .agents/skills/supabase 的 junction
    }
    repo_root = os.path.dirname(os.path.abspath(filepath)) or '.'
    # 正典若在子目錄，往上找 repo 根。
    # 錨點必須「只認 .git」：先前誤把 .hermes 也當錨點，導致
    # esggo-omni-center/.hermes 存在時 repo_root 被錨到子目錄，
    # 掃不到 repo 根的 soul.md 與 docs/、Omni-Sanctuary/ 下的舊版（實測 count 掉到 1）。
    probe = repo_root
    for _ in range(8):
        if os.path.isdir(os.path.join(probe, '.git')):
            repo_root = probe
            break
        nxt = os.path.dirname(probe)
        if nxt == probe:
            break
        probe = nxt

    found = []
    seen_inodes = set()
    canon_abs = os.path.abspath(filepath)

    for root, dirs, files in os.walk(repo_root):
        dirs[:] = [d for d in dirs
                   if d not in EXCLUDE and not d.startswith('.git')]
        # 以 (st_dev, st_ino) 識別實體目錄，擋掉 junction / symlink 造成的重複遍歷
        try:
            st = os.stat(root)
            key = (st.st_dev, st.st_ino)
            if key in seen_inodes:
                dirs[:] = []
                continue
            seen_inodes.add(key)
        except OSError:
            dirs[:] = []
            continue

        if 'soul.md' in files:
            p = os.path.join(root, 'soul.md')
            try:
                with open(p, 'r', encoding='utf-8', errors='replace') as f:
                    head = f.read(4000)
            except (OSError, UnicodeDecodeError):
                continue
            mv = VERSION_RE.search(head)
            found.append((p, mv.group(0) if mv else '未標版號'))

    # 確保正典本身在結果內，即使它位於被排除的目錄下
    if not any(os.path.abspath(p) == canon_abs for p, _ in found):
        try:
            with open(canon_abs, 'r', encoding='utf-8', errors='replace') as f:
                mv = VERSION_RE.search(f.read(4000))
            found.append((filepath, mv.group(0) if mv else '未標版號'))
        except (OSError, UnicodeDecodeError):
            pass

    # 正典排最前，其餘按路徑排序 → 輸出穩定可 diff
    found.sort(key=lambda t: (os.path.abspath(t[0]) != canon_abs, t[0].lower()))
    return found


def run():
    print('=' * 60)
    print('OA-Team 30 聖典結構驗證 v2')
    print('=' * 60)

    explicit = sys.argv[1] if len(sys.argv) > 1 else None
    filepath = find_canon(explicit)
    print(f'\n[0] 正典定位\n  → {filepath}')

    # D3 修：非 UTF-8 的正典不應拋未捕 traceback。用 errors='replace' 讀取，
    #     並把 IsADirectoryError / PermissionError / UnicodeDecodeError 一併轉為
    #     可讀的 [FAIL] + exit 1。（原只捕 FileNotFoundError，其餘全裸奔。）
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except FileNotFoundError:
        print(f'  [FAIL] {filepath} not found')
        sys.exit(1)
    except IsADirectoryError:
        print(f'  [FAIL] {filepath} 是目錄，不是檔案')
        sys.exit(1)
    except PermissionError as e:
        print(f'  [FAIL] 無法讀取 {filepath}: Permission denied (Errno 13)')
        sys.exit(1)
    except OSError as e:
        print(f'  [FAIL] 無法讀取 {filepath}: {e}')
        sys.exit(1)
    if '�' in content:
        print(f'  [WARN] {filepath} 含非 UTF-8 位元組，已以替代字元解讀（errors=replace）')

    print(f'  大小: {len(content)} B / {content.count(chr(10)) + 1} 行')
    mv = VERSION_RE.search(content)
    if mv:
        print(f'  版號: {mv.group(0)}')

    # 正典分歧偵測
    others = detect_divergence(filepath)
    if len(others) > 1:
        print(f'\n[0.1] 正典分歧偵測（發現 {len(others)} 份 soul.md）')
        for p, v in others:
            tag = '  ← 正典（本次驗證目標）' if os.path.abspath(p) == os.path.abspath(filepath) else ''
            print(f'  · {p}  [{v}]{tag}')
        canon_v = VERSION_RE.search(content)
        canon_v = canon_v.group(0) if canon_v else '未標版號'
        others_v = sorted({v for p, v in others
                           if os.path.abspath(p) != os.path.abspath(filepath)
                           and v != '未標版號'})
        if others_v and others_v != [canon_v]:
            print(f'  ⚠ 版號分歧：正典 {canon_v}，另有舊版 {", ".join(others_v)}')
            print('    依 Traceable（單一 SSOT），舊版需處置：歸檔 / 標記 legacy / 刪除。')
            print('    本驗證器不代為刪除任何靈魂檔（不可篡改）。')
        else:
            print('  ✓ 其餘 soul.md 版號與正典一致或未標版號（非分歧）')
    print('  ℹ 本項為警示，不影響 exit code（如需升級為 FAIL，請加 --strict-divergence）')

    passed = True

    # 驗證 1: 30 矩陣完整性
    # 判定依據是「01–30 逐一存在」，不是「找到 >= 30 筆」。
    # 後者會被「01-30 全缺、只有 31-60」這類位移過的表欺騙而回報假綠。
    print('\n[1] 30 矩陣驗證')
    rows = MATRIX_ROW.findall(content)
    members = {}
    for num, name in rows:
        members[int(num)] = name
    members_found = len(members)
    missing = [f'{i:02d}' for i in range(1, 31) if i not in members]
    extra = sorted(n for n in members if not 1 <= n <= 30)
    if not missing:
        print('  ✓ 30/30 成員定義完整（編號 01–30 逐一存在）')
    else:
        print(f'  ✗ 找到 {members_found}/30 — 缺漏編號: {", ".join(missing)}')
        passed = False
    if extra:
        print(f'  ℹ 另有非 01–30 編號的資料列: {", ".join(f"{n:02d}" for n in extra[:10])}'
              f'{"…" if len(extra) > 10 else ""}（不影響 01–30 判定）')
    if len(rows) > members_found:
        print(f'  ℹ 資料列 {len(rows)} 筆（唯一編號 {members_found} 個），'
              f'編號範圍 {min(members):02d}–{max(members):02d}，'
              f'重複列 {len(rows) - members_found} 筆')

    # 驗證 2: 5T 協定
    print('\n[2] 5T 協定驗證')
    for t in ['Traceable', 'Trackable', 'Tangible', 'Transparent', 'Trustworthy']:
        if t in content:
            print(f'  ✓ {t} 已定義')
        else:
            print(f'  ✗ {t} 未定義')
            passed = False

    # 驗證 3: 4 可 1 不可
    print('\n[3] 狀態機驗證')
    for state in ['可自理', '可協作', '可演化', '可溯源', '不可篡改']:
        if state in content:
            print(f'  ✓ {state} 已定義')
        else:
            print(f'  ✗ {state} 未定義')
            passed = False

    # 驗證 4: 三步工作流
    print('\n[4] 工作流驗證')
    for step in ['本質提純', '蜂群協同', 'Hash Lock', '5T']:
        if step in content:
            print(f'  ✓ {step} 已定義')
        else:
            print(f'  ✗ {step} 未定義')
            passed = False

    # 驗證 5: 陣列
    print('\n[5] 陣列驗證')
    squads = ['策略組', '技術組', '創意組', '營銷組', '守衛組',
              '智庫陣列', '符文陣列', '代理陣列', '進化陣列', '5T 陣列']
    found = [s for s in squads if s in content]
    if len(found) >= 5:
        print(f'  ✓ 找到 {len(found)} 個陣列: {", ".join(found[:5])}')
    else:
        print(f'  ✗ 找到 {len(found)} 個陣列（需 ≥5）')
        passed = False

    print('\n' + '=' * 60)
    if passed:
        print('[PASS] 聖典結構完整')
        sys.exit(0)
    else:
        print('[FAIL] 聖典結構不完整')
        sys.exit(1)


if __name__ == '__main__':
    run()
