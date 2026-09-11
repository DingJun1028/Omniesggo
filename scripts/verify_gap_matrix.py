#!/usr/bin/env python3
"""
OA-Team 30 缺口補齊矩陣驗證腳本
驗證 §四 跨組配對是否 MECE 窮盡
"""

import re
import sys

# 5 大陣列定義
SQUADS = {
    'strategy': list(range(1, 7)),    # 01-06
    'technology': list(range(7, 13)), # 07-12
    'creative': list(range(13, 19)),  # 13-18
    'marketing': list(range(19, 25)), # 19-24
    'guard': list(range(25, 31)),     # 25-30
}

# 成員名稱映射
MEMBER_NAMES = {
    1: '蜂后', 2: '規劃蜂', 3: '分析蜂', 4: '策効蜂', 5: '風險蜂', 6: '優化蜂',
    7: '編碼蜂', 8: '算法蜂', 9: '架構蜂', 10: '數據蜂', 11: '測試蜂', 12: '設計蜂',
    13: '圖像蜂', 14: '動畫蜂', 15: '文案蜂', 16: '音頻蜂', 17: '市場蜂', 18: '社群蜂',
    19: '增長蜂', 20: '運營蜂', 21: '商業分析蜂', 22: '探路蜂', 23: '外交蜂', 24: '調研蜂',
    25: '測場蜂', 26: '追蹤蜂', 27: '安全蜂', 28: '維護蜂', 29: '支援蜂', 30: '質控蜂',
}

def get_squad(member_id):
    for squad_name, members in SQUADS.items():
        if member_id in members:
            return squad_name
    return None

def verify_pairing_file(filepath):
    """解析 §四 配對定義"""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f'[SKIP] {filepath} not found')
        return set(), set()

    # 配對模式：AA × BB 或 AA × 全陣列 或 AA × 陣列+陣列
    pair_pattern = re.compile(
        r'(\d{2})\s+(\S+?)\s*[×x]\s*(.+?)(?:\n|$)'
    )
    
    pairs = set()
    hub_pairs = set()
    
    for match in pair_pattern.finditer(content):
        left_num = int(match.group(1))
        right_raw = match.group(3).strip()
        
        # 判斷是否為樞紐配對
        if '全陣列' in right_raw:
            hub_pairs.add((left_num, 'hub_all'))
        elif '+' in right_raw:
            hub_pairs.add((left_num, 'hub_multi'))
        else:
            # 嘗試解析右側編號
            right_match = re.match(r'(\d{2})', right_raw)
            if right_match:
                right_num = int(right_match.group(1))
                pair = tuple(sorted([left_num, right_num]))
                pairs.add(pair)
    
    return pairs, hub_pairs

def run():
    print('='*60)
    print('OA-Team 30 缺口補齊矩陣驗證')
    print('='*60)
    
    pairs, hub_pairs = verify_pairing_file('soul.md')
    
    # 計算應有配對數：C(5,2) = 10 陣列對 × 6 = 60 基礎 + 12 樞紐
    expected_pairs = 60
    expected_hubs = 12
    
    # 實際統計
    base_count = len(pairs)
    hub_count = len(hub_pairs)
    
    # 驗證成員觸達
    members_in_pairs = set()
    for a, b in pairs:
        members_in_pairs.add(a)
        members_in_pairs.add(b)
    for member_id, _ in hub_pairs:
        members_in_pairs.add(member_id)
    
    coverage = len(members_in_pairs)
    
    print(f'\n基礎配對: {base_count} (預期: {expected_pairs})')
    print(f'樞紐配對: {hub_count} (預期: {expected_hubs})')
    print(f'總配對: {base_count + hub_count} (預期: {expected_pairs + expected_hubs})')
    print(f'成員觸達: {coverage}/30 ({coverage/30*100:.1f}%)')
    
    # 驗證
    passed = True
    
    if base_count < expected_pairs:
        print(f'[FAIL] 基礎配對不足: {base_count} < {expected_pairs}')
        passed = False
    
    if hub_count < expected_hubs:
        print(f'[FAIL] 樞紐配對不足: {hub_count} < {expected_hubs}')
        passed = False
    
    if coverage < 30:
        missing = set(range(1, 31)) - members_in_pairs
        print(f'[FAIL] 成員未觸達: {sorted(missing)}')
        passed = False
    
    # 驗證編號歸屬
    for member_id in range(1, 31):
        squad = get_squad(member_id)
        if not squad:
            print(f'[FAIL] 成員 {member_id:02d} 無對應陣列')
            passed = False
    
    if passed:
        print(f'\n[PASS] 驗證通過: {base_count} 基礎 + {hub_count} 樞紐 = {base_count + hub_count} 組 | 30/30 觸達')
        sys.exit(0)
    else:
        print('\n[FAIL] 驗證未通過')
        sys.exit(1)

if __name__ == '__main__':
    run()
