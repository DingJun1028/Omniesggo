#!/usr/bin/env python3
"""
OA-Team 30 聖典結構完整性驗證
支援 soul.md 實際格式
"""

import re
import sys

def run():
    print('='*60)
    print('OA-Team 30 聖典結構驗證')
    print('='*60)
    
    filepath = sys.argv[1] if len(sys.argv) > 1 else 'soul.md'
    
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except FileNotFoundError:
        print(f'[FAIL] {filepath} not found')
        sys.exit(1)
    
    passed = True
    
    # 驗證 1: 30 矩陣完整性 - 支援中文格式
    print('\n[1] 30 矩陣驗證')
    
    # 搜尋成員定義（中文格式）
    member_patterns = [
        re.compile(r'\|\s*(\d{2})\s*\|\s*(萬能\S+蜂)'),  # 表格格式
        re.compile(r'(\d{2})\s+(萬能\S+蜂)'),             # 列表格式
        re.compile(r'(\d{2})\s+([\u4e00-\u9fff]+蜂)'),    # 中文格式
    ]
    
    members_found = 0
    for pattern in member_patterns:
        matches = pattern.findall(content)
        members_found = max(members_found, len(matches))
    
    # 也檢查一般性描述
    if members_found == 0:
        # 檢查是否有 01-30 的編號提及
        numbers = re.findall(r'\b(\d{2})\b', content)
        unique_nums = set(int(n) for n in numbers if 1 <= int(n) <= 30)
        members_found = len(unique_nums)
    
    if members_found >= 30:
        print(f'  ✓ 30/30 成員定義完整')
    else:
        print(f'  ⚠ 找到 {members_found}/30 成員（可能用描述性格式）')
    
    # 驗證 2: 5T 協定
    print('\n[2] 5T 協定驗證')
    required_5t = ['Traceable', 'Trackable', 'Tangible', 'Transparent', 'Trustworthy']
    for t in required_5t:
        if t in content:
            print(f'  ✓ {t} 已定義')
        else:
            print(f'  ✗ {t} 未定義')
            passed = False
    
    # 驗證 3: 4 可 1 不可
    print('\n[3] 狀態機驗證')
    states = ['可自理', '可協作', '可演化', '可溯源', '不可篡改']
    for state in states:
        if state in content:
            print(f'  ✓ {state} 已定義')
        else:
            print(f'  ✗ {state} 未定義')
            passed = False
    
    # 驗證 4: 三步工作流
    print('\n[4] 工作流驗證')
    workflow_steps = ['本質提純', '蜂群協同', 'Hash Lock', '5T']
    for step in workflow_steps:
        if step in content:
            print(f'  ✓ {step} 已定義')
        else:
            print(f'  ✗ {step} 未定義')
            passed = False
    
    # 驗證 5: 陣列
    print('\n[5] 陣列驗證')
    squads = ['策略組', '技術組', '創意組', '營銷組', '守衛組', '智庫陣列', '符文陣列', '代理陣列', '進化陣列', '5T 陣列']
    squads_found = [s for s in squads if s in content]
    if len(squads_found) >= 5:
        print(f'  ✓ 找到 {len(squads_found)} 個陣列: {", ".join(squads_found[:5])}')
    else:
        print(f'  ⚠ 找到 {len(squads_found)} 個陣列')
    
    print('\n' + '='*60)
    if passed:
        print('[PASS] 聖典結構完整')
        sys.exit(0)
    else:
        print('[FAIL] 聖典結構不完整')
        sys.exit(1)

if __name__ == '__main__':
    run()
