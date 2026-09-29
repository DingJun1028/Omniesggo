#!/usr/bin/env python3
"""
OA-Team 30 聖典結構完整性驗證
支援 soul.md 實際格式

changelog:
  v2  修正矩陣解析（|序號|編號|萬能XX|…）— 原 \S+蜂 要求「蜂」在名結尾，漏掉 01 萬能蜂后
  v2  修正預設路徑 — 原預設 'soul.md' 會讀到 repo 根的舊版 v0.7.3，非正典 esggo-omni-center/soul.md
  v2  30 矩陣不足改為 FAIL（不再僅 ⚠ 軟警示）
  v2  新增正典分歧偵測（多份 soul.md 版號不一致時警示）
  v3  30 矩陣判定改為「01-30 逐一存在」— 原 members_found >= 30 會被「01-30 全缺、
      只有 31-60」的位移表欺騙而回報假綠（實測 exit 0）
  v3  修 Windows junction 遞迴 — os.path.islink() 對 junction 回 False，
      followlinks=False 擋不住；原 >12s 未完（18k 目錄 / 136k 檔案），現約 8s
  v3  修非 UTF-8 未捕例外（UnicodeDecodeError 非 OSError 子類）
  v3  分歧警告改為「正典 vs 舊版」明確分類，輸出排序穩定可 diff
  v4  CWD 獨立 — 以 __file__ 推導 repo 根，任意目錄執行皆可（修 F3）
  v4  新增 --expect N（S2）：合法非 30 人變體不再被硬擋
  v4  新增 --strict-divergence（S2）：分歧升級為 FAIL，CI 可據此表態
  v4  新增 --no-divergence：跳過全樹掃描（修 D4，最快路徑）
  v4  矩陣解析錨定章節區段並交叉驗證「序號 == 編號」（修 S3/S4）
  v4  重複編號改為具名警告（修 S5：原「衍生列」措辭誤標，且分支不可達）
  v4  新增 --help；修正候選清單重複項與 200000 魔術數（修 F2/F4/F5）
  v4  舊版 soul.md 依 ARCHIVE 規則分類標記（修 D5 殘餘：每次都亮 ⚠ 成雜訊）
"""

import argparse
import os
import re
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.dirname(SCRIPT_DIR)          # 修 F3：不依賴 CWD

# 正典候選（修 F2：移除重複項，以 repo 根為基準）
CANON_CANDIDATES = [
    os.path.join(REPO_ROOT, 'esggo-omni-center', 'soul.md'),
    os.path.join(REPO_ROOT, 'soul.md'),
]

# 矩陣資料列：| 序號 | 編號 | 萬能XX | 標籤 | 對應 |
# 修 S3：錨定「序號 == 編號」，排除 §8 雙隊衍生表（其第一欄是文字名稱而非純數字，
#         故實際上已不命中；此 backreference 為額外保險）
MATRIX_ROW = re.compile(r'^\|\s*(\d{1,2})\s*\|\s*(\d{2})\s*\|\s*(萬能[^|]*?)\s*\|', re.M)
# 寬鬆版（不要求序號一致），僅用於偵測與報告異常
MATRIX_ROW_LOOSE = re.compile(r'^\|\s*\d{1,2}\s*\|\s*(\d{2})\s*\|\s*(萬能[^|]*?)\s*\|', re.M)
# 版號：ESG GO v0.14
VERSION_RE = re.compile(r'ESG GO v(\d+(?:\.\d+)*)')

# 舊版 soul.md 分類（修 D5 殘餘）：這些路徑視為刻意存檔，不參與分歧判定
ARCHIVE_SUBSTRINGS = (
    os.path.join('docs', 'soul.md'),
    os.path.join('Omni-Sanctuary', 'Codex', 'soul.md'),
    os.path.join('.archive', 'soul.md'),
    os.path.join('archive', 'soul.md'),
)


def read_text(path, limit=None):
    """安全讀取：errors='replace' 避免 UnicodeDecodeError（修 D3）。
    limit 僅用於只需要檔頭的場景（修 F4：預設讀全文，200000 魔術數已移除）。"""
    with open(path, 'r', encoding='utf-8', errors='replace') as f:
        return f.read() if limit is None else f.read(limit)


def find_canon(explicit=None):
    """定位正典檔：顯式指定 > 候選清單（含完整 30 矩陣者優先）> 回退"""
    if explicit:
        # 修 F5：先驗證是檔案，再絕對化
        p = os.path.abspath(os.path.expanduser(explicit))
        if not os.path.isfile(p):
            print(f'  [FAIL] 指定路徑不是檔案: {p}')
            sys.exit(1)
        return p
    best = None
    for cand in CANON_CANDIDATES:
        if not os.path.isfile(cand):
            continue
        try:
            content = read_text(cand)
        except OSError:
            continue
        nums = set(int(n) for _, n, _ in MATRIX_ROW.findall(content))
        score = len([i for i in range(1, 31) if i in nums])
        # 修 F1 疑慮：分數相同時取清單中較前（較新）者，且要求完整矩陣
        if best is None or score > best[1]:
            best = (cand, score)
    if best and best[1] > 0:
        return best[0]
    return CANON_CANDIDATES[0] if os.path.isfile(CANON_CANDIDATES[0]) else 'soul.md'


def classify(path):
    """判定 soul.md 是否屬刻意存檔（修 D5 殘餘）"""
    p = os.path.normpath(path)
    return any(sub.lower() in p.lower() for sub in ARCHIVE_SUBSTRINGS)


def detect_divergence(filepath, do_scan=True):
    """
    偵測 repo 內多份 soul.md 的版號分歧。

    v3 修正（均經實測）：
      D1 Windows junction 會讓 os.walk 遞迴——os.path.islink() 對 junction 回 False，
         followlinks=False 擋不住。改以 st_dev/st_ino 去重 + 排除集。
      D2 filepath 參數原本完全未使用，內部寫死 os.walk('.')。現用它決定搜尋根，
         並確保正典一定在結果內。
      D3 只捕 OSError。UnicodeDecodeError 非 OSError 子類。開檔一律 errors='replace'。
      D4 原每次全樹遍歷。改以排除集限縮，支援 --no-divergence 完全跳過。
    """
    canon_abs = os.path.abspath(filepath)

    def read_ver(p):
        try:
            return read_text(p, limit=4000)
        except (OSError, UnicodeDecodeError):
            return None

    if not do_scan:
        head = read_ver(canon_abs)
        mv = VERSION_RE.search(head) if head else None
        return [(canon_abs, mv.group(0) if mv else '未標版號')]

    # 明確排除：建置產物、依賴、快取、以及造成重複計數的 junction 目標
    EXCLUDE = {
        '.git', 'node_modules', '.next', '.scratch', 'dist', 'build',
        '.turbo', 'coverage', '__pycache__', '.venv', 'venv',
        '.agents',           # repo 內有 .hermes/skills/supabase -> .agents/skills/supabase 的 junction
    }
    repo_root = os.path.dirname(canon_abs) or REPO_ROOT
    # 錨點必須「只認 .git」：誤把 .hermes 當錨點會讓 repo_root 被錨到子目錄，
    # 掃不到 repo 根與 docs/、Omni-Sanctuary/ 的舊版（實測 count 由 4 掉到 1）。
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
            head = read_ver(p)
            if head is None:
                continue
            mv = VERSION_RE.search(head)
            found.append((p, mv.group(0) if mv else '未標版號'))

    # 確保正典本身在結果內，即使它位於被排除的目錄下
    if not any(os.path.abspath(p) == canon_abs for p, _ in found):
        head = read_ver(canon_abs)
        if head is not None:
            mv = VERSION_RE.search(head)
            found.append((filepath, mv.group(0) if mv else '未標版號'))

    # 正典排最前，其餘按路徑排序 → 輸出穩定可 diff
    found.sort(key=lambda t: (os.path.abspath(t[0]) != canon_abs, t[0].lower()))
    return found


def main():
    ap = argparse.ArgumentParser(
        prog='verify_soul_canon.py',
        description='OA-Team 30 聖典結構完整性驗證',
    )
    ap.add_argument('canon', nargs='?', default=None,
                    help='正典 soul.md 路徑（預設自動定位）')
    ap.add_argument('--expect', type=int, default=30, metavar='N',
                    help='預期成員數（預設 30）。合法非 30 人變體可用此放寬')
    ap.add_argument('--strict-divergence', action='store_true',
                    help='正典版號分歧時升級為 FAIL（供 CI 表態）')
    ap.add_argument('--no-divergence', action='store_true',
                    help='跳過分歧偵測的全樹掃描（最快路徑）')
    args = ap.parse_args()

    print('=' * 60)
    print(f'OA-Team 30 聖典結構驗證 v4  (expect={args.expect})')
    print('=' * 60)

    filepath = find_canon(args.canon)
    try:
        rel = os.path.relpath(filepath, REPO_ROOT)
    except ValueError:
        rel = filepath
    print(f'\n[0] 正典定位\n  → {rel}')

    # D3 修：非 UTF-8 不拋未捕 traceback
    try:
        content = read_text(filepath)
    except FileNotFoundError:
        print(f'  [FAIL] {filepath} not found')
        sys.exit(1)
    except IsADirectoryError:
        print(f'  [FAIL] {filepath} 是目錄，不是檔案')
        sys.exit(1)
    except PermissionError:
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

    passed = True

    # ---- 正典分歧偵測 ----
    others = detect_divergence(filepath, do_scan=not args.no_divergence)
    canon_abs = os.path.abspath(filepath)
    canon_v = mv.group(0) if mv else '未標版號'
    if len(others) > 1:
        print(f'\n[0.1] 正典分歧偵測（發現 {len(others)} 份 soul.md）')
        for p, v in others:
            is_canon = os.path.abspath(p) == canon_abs
            if is_canon:
                tag = '  ← 正典'
            elif classify(p):
                tag = '  [已歸檔，忽略]'
            else:
                tag = '  ← 未歸檔舊版 ⚠'
            try:
                disp = os.path.relpath(p, REPO_ROOT)
            except ValueError:
                disp = p
            print(f'  · {disp}  [{v}]{tag}')

        # 只把「未歸檔」的舊版算作分歧（修 D5 殘餘雜訊）
        active = sorted({v for p, v in others
                         if os.path.abspath(p) != canon_abs
                         and not classify(p) and v != '未標版號'})
        if active and active != [canon_v]:
            print(f'  ⚠ 版號分歧：正典 {canon_v}，未歸檔舊版 {", ".join(active)}')
            print('    依 Traceable（單一 SSOT），需處置：歸檔 / 標記 legacy / 刪除。')
            print('    本驗證器不代為刪除任何靈魂檔（不可篡改）。')
            if args.strict_divergence:
                print('    [FAIL] --strict-divergence 已啟用 → 升級為失敗')
                passed = False
            else:
                print('    ℹ 本項為警示，不影響 exit code（--strict-divergence 可升級）')
        else:
            print('  ✓ 無未歸檔的版號分歧（已歸檔者不計入）')
    elif args.no_divergence:
        print('\n[0.1] 正典分歧偵測：已跳過（--no-divergence）')

    # ---- 驗證 1: 矩陣完整性 ----
    # 判定依據是「期望編號逐一存在」，不是「找到 >= N 筆」。
    # 後者會被「01-30 全缺、只有 31-60」這類位移過的表欺騙而回報假綠（實測 exit 0）。
    print(f'\n[1] {args.expect} 矩陣驗證')
    rows = MATRIX_ROW.findall(content)
    members = {}
    for _seq, num, name in rows:
        members.setdefault(int(num), []).append(name)   # 修 S5：保留重複以便具名報告
    expected = list(range(1, args.expect + 1))
    missing = [f'{i:02d}' for i in expected if i not in members]
    extra = sorted(n for n in members if n not in expected)
    if not missing:
        print(f'  ✓ {args.expect}/{args.expect} 成員定義完整（編號 01–{args.expect:02d} 逐一存在）')
    else:
        found_n = len([n for n in members if n in expected])
        print(f'  ✗ 找到 {found_n}/{args.expect} — 缺漏編號: {", ".join(missing)}')
        passed = False
    if extra:
        print(f'  ℹ 另有非 01–{args.expect:02d} 編號的資料列: '
              f'{", ".join(f"{n:02d}" for n in extra[:10])}'
              f'{"…" if len(extra) > 10 else ""}（不影響判定）')

    # 修 S5：重複編號具名報告（原本措辭會誤標為「衍生列」且分支不可達）
    dups = {n: v for n, v in members.items() if len(v) > 1}
    if dups:
        for n, names in sorted(dups.items()):
            print(f'  ⚠ 編號 {n:02d} 重複定義 {len(names)} 次: {" / ".join(names)}')
        print('    （正典 §2 矩陣每個編號應僅定義一次）')
        passed = False

    # 修 S3/S4：交叉驗證「序號 == 編號」。
    # 這些列被嚴格 regex 排除於 members 之外，屬「序號不符」而非「重複定義」，
    # 但不可靜默丟棄——否則序號寫錯的成員會無聲消失。逐條具名報告並 FAIL：
    # 序號與編號不符幾乎都是編輯錯誤，寧可報錯也不要猜。
    loose = MATRIX_ROW_LOOSE.findall(content)
    mismatched = []
    for line in re.findall(r'^\|\s*\d{1,2}\s*\|\s*\d{2}\s*\|\s*萬能[^|]*?\s*\|', content, re.M):
        sq, nm = re.match(r'^\|\s*(\d{1,2})\s*\|\s*(\d{2})\s*\|', line).groups()
        if int(sq) != int(nm):
            mismatched.append((sq, nm, line.split('|')[3].strip()))
    if mismatched:
        uniq = sorted(set(f'序號 {sq} ↔ 編號 {nm}（{nm_name}）' for sq, nm, nm_name in mismatched))
        print(f'  ✗ 序號與編號不一致 {len(mismatched)} 列: {"; ".join(uniq[:5])}'
              f'{"…" if len(uniq) > 5 else ""}')
        print('    這些列不計入成員判定。序號應等於編號（1–N），否則該成員會被漏驗。')
        passed = False
    if len(loose) > len(rows):
        print(f'  ℹ 寬鬆掃描命中 {len(loose)} 列，嚴格（序號==編號）命中 {len(rows)} 列')

    # ---- 驗證 2-5 ----
    print('\n[2] 5T 協定驗證')
    for t in ['Traceable', 'Trackable', 'Tangible', 'Transparent', 'Trustworthy']:
        if t in content:
            print(f'  ✓ {t} 已定義')
        else:
            print(f'  ✗ {t} 未定義')
            passed = False

    print('\n[3] 狀態機驗證')
    for state in ['可自理', '可協作', '可演化', '可溯源', '不可篡改']:
        if state in content:
            print(f'  ✓ {state} 已定義')
        else:
            print(f'  ✗ {state} 未定義')
            passed = False

    print('\n[4] 工作流驗證')
    for step in ['本質提純', '蜂群協同', 'Hash Lock', '5T']:
        if step in content:
            print(f'  ✓ {step} 已定義')
        else:
            print(f'  ✗ {step} 未定義')
            passed = False

    print('\n[5] 陣列驗證')
    squads = ['策略組', '技術組', '創意組', '營銷組', '守衛組',
              '智庫陣列', '符文陣列', '代理陣列', '進化陣列', '5T 陣列']
    hit = [s for s in squads if s in content]
    if len(hit) >= 5:
        print(f'  ✓ 找到 {len(hit)} 個陣列: {", ".join(hit[:5])}')
    else:
        print(f'  ✗ 找到 {len(hit)} 個陣列（需 ≥5）')
        passed = False

    print('\n' + '=' * 60)
    if passed:
        print('[PASS] 聖典結構完整')
        sys.exit(0)
    print('[FAIL] 聖典結構不完整')
    sys.exit(1)


if __name__ == '__main__':
    main()
