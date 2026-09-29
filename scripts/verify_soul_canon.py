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
    """偵測 repo 內多份 soul.md 的版號分歧"""
    found = []
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', '.next', '.scratch'}]
        if 'soul.md' in files:
            p = os.path.join(root, 'soul.md')
            try:
                with open(p, 'r', encoding='utf-8') as f:
                    head = f.read(4000)
            except OSError:
                continue
            mv = VERSION_RE.search(head)
            found.append((p, mv.group(0) if mv else '未標版號'))
    return found


def run():
    print('=' * 60)
    print('OA-Team 30 聖典結構驗證 v2')
    print('=' * 60)

    explicit = sys.argv[1] if len(sys.argv) > 1 else None
    filepath = find_canon(explicit)
    print(f'\n[0] 正典定位\n  → {filepath}')

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f'  [FAIL] {filepath} not found')
        sys.exit(1)

    print(f'  大小: {len(content)} B / {content.count(chr(10)) + 1} 行')
    mv = VERSION_RE.search(content)
    if mv:
        print(f'  版號: {mv.group(0)}')

    # 正典分歧偵測
    others = detect_divergence('.')
    if len(others) > 1:
        print(f'\n[0.1] 正典分歧偵測（發現 {len(others)} 份 soul.md）')
        for p, v in others:
            tag = '  ← 本次驗證目標' if os.path.normpath(p) == os.path.normpath(filepath) else ''
            print(f'  · {p}  [{v}]{tag}')
        if len(set(v for _, v in others)) > 1:
            print('  ⚠ 各份 soul.md 版號不一致 — 確認是否為刻意分卷，或舊版待歸檔')

    passed = True

    # 驗證 1: 30 矩陣完整性
    print('\n[1] 30 矩陣驗證')
    rows = MATRIX_ROW.findall(content)
    members = {}
    for num, name in rows:
        members[int(num)] = name
    members_found = len(members)
    if members_found >= 30:
        print('  ✓ 30/30 成員定義完整')
    else:
        missing = [f'{i:02d}' for i in range(1, 31) if i not in members]
        print(f'  ✗ 找到 {members_found}/30 — 缺漏編號: {", ".join(missing) if missing else "無"}')
        passed = False
    if len(rows) > members_found:
        print(f'  ℹ 資料列 {len(rows)} 筆（編號 {min(members)}–{max(members)}），'
              f'含 {len(rows) - members_found} 筆衍生列')

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
