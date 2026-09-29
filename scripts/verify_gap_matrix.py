#!/usr/bin/env python3
"""
OA-Team 30 缺口補齊矩陣驗證 — 委派代理 (Delegating Shim)

【v0.6 修正紀錄】本檔原為獨立 regex 探針，直接解析 soul.md 的 `NN × NN` 配對行。
v0.6 canon 已將缺口補齊改為「程式化派生」，單一真相源 = shared/gap-matrix.ts
(30 名冊 + 10 陣列對 + 樞紐規則 → deriveAllPairings() 派生出 72 配對)。
soul.md 的手寫配對行已不存在，故舊探針恆為 0/72 假 FAIL —— 這是「量測方法錯」
而非「真缺口」，是最惡的一種失效：它會在缺口已補齊時報警，或在真缺口時被
繞過而無人察覺。

本檔改為薄委派層：真實驗證交給 scripts/verify_gap_matrix.ts (對 gap-matrix.ts
這個 SSOT 做實證)。Python 僅負責啟動與退出碼轉譯，確保單一路徑、單一真相。

5T 對齊：
  Traceable   委派目標明示於 stderr 日誌
  Trackable   與 TS 驗證器共用同一 deriveAllPairings() 推導鏈
  Transparent TS 驗證器全文輸出原樣轉發，不摺疊不美化
  Trustworthy EXIT=0 方可宣稱通過；無法驗證時報 ERROR 而非 PASS/SILENT PASS

用法:
  python scripts/verify_gap_matrix.py            # 委派 npx tsx 驗證
  python scripts/verify_gap_matrix.py --ts PATH  # 指定 TS 驗證器路徑
"""

import shutil
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TS = REPO_ROOT / 'scripts' / 'verify_gap_matrix.ts'


def find_ts_runner() -> str | None:
    """找出可執行 TS 的 runner。找不到就回 None（不得靜默 PASS）。"""
    if shutil.which('npx'):
        return 'npx'
    if shutil.which('tsx'):
        return 'tsx'
    return None


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    ts_path = Path(args[0]).resolve() if args else DEFAULT_TS

    if not ts_path.is_file():
        print(f'[ERROR] TS 驗證器不存在: {ts_path}', file=sys.stderr)
        print('        這是「無法驗證」，不是缺口。請修復工具鏈後重跑。', file=sys.stderr)
        return 2

    runner = find_ts_runner()
    if runner is None:
        print('[ERROR] 找不到 npx / tsx，無法執行 TS 驗證器。', file=sys.stderr)
        print('        這是「無法驗證」，不是缺口。', file=sys.stderr)
        return 2

    cmd = [runner, 'tsx', str(ts_path)] if runner == 'npx' else [runner, str(ts_path)]
    print(f'[verify_gap_matrix] 委派 SSOT 驗證: {ts_path}', file=sys.stderr)

    try:
        proc = subprocess.run(cmd, cwd=str(REPO_ROOT), check=False)
    except OSError as exc:
        print(f'[ERROR] 執行失敗: {exc}', file=sys.stderr)
        return 2

    # 退出碼直譯: 0=通過, 1=真缺口, 其他=工具鏈異常
    if proc.returncode == 0:
        print('\n[shim] 結論: PASS (SSOT 實證 exit=0)', file=sys.stderr)
        return 0
    if proc.returncode == 1:
        print('\n[shim] 結論: FAIL — 這是真缺口，非探針失效。', file=sys.stderr)
        return 1
    print(f'\n[shim] 結論: ERROR (工具鏈異常 rc={proc.returncode})', file=sys.stderr)
    return 2


if __name__ == '__main__':
    sys.exit(main())
