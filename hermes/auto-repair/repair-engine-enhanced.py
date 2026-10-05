#!/usr/bin/env python3
"""
Enhanced Repair Engine - 無作妙德增強修復引擎
擴展現有 repair-engine.py 的功能
"""

import yaml
import re
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Any
from datetime import datetime

class EnhancedRepairEngine:
    def __init__(self, config_path: str = '.hermes/auto-repair/error-patterns-extended.yaml'):
        self.config_path = Path(config_path)
        self.patterns = self.load_patterns()
        self.repair_log = []
        
    def load_patterns(self) -> Dict[str, Any]:
        """載入擴展錯誤模式"""
        if not self.config_path.exists():
            print(f"⚠️  配置文件不存在: {self.config_path}")
            return {}
            
        with open(self.config_path, 'r', encoding='utf-8') as f:
            config = yaml.safe_load(f)
            
        return config.get('patterns', [])
    
    def scan_project(self, project_root: str = '.') -> List[Dict[str, Any]]:
        """掃描項目中的錯誤模式"""
        issues = []
        project_path = Path(project_root)
        
        for pattern in self.patterns:
            pattern_name = pattern['name']
            regex = pattern['regex']
            severity = pattern['severity']
            category = pattern['category']
            auto_fix = pattern.get('auto_fix', False)
            
            # 根據模式決定掃描目標
            file_pattern = pattern.get('file_pattern', '**/*.ts')
            target_files = list(project_path.glob(file_pattern))
            
            for file_path in target_files:
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        lines = content.split('\n')
                        
                    for line_num, line in enumerate(lines, 1):
                        matches = re.finditer(regex, line)
                        for match in matches:
                            issues.append({
                                'file': str(file_path),
                                'line': line_num,
                                'pattern': pattern_name,
                                'severity': severity,
                                'category': category,
                                'auto_fix': auto_fix,
                                'context': line.strip(),
                                'match': match.group()
                            })
                except Exception as e:
                    print(f"❌ 掃描文件失敗 {file_path}: {e}")
                    
        return issues
    
    def categorize_issues(self, issues: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """按類別分組問題"""
        categorized = {}
        
        for issue in issues:
            category = issue['category']
            if category not in categorized:
                categorized[category] = []
            categorized[category].append(issue)
            
        return categorized
    
    def prioritize_fixes(self, issues: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """根據優先級排序修復任務"""
        priority_order = {'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3}
        
        # 獲取類別優先級
        config = yaml.safe_load(self.config_path)
        categories = config.get('categories', {})
        
        def get_priority(issue):
            category = issue['category']
            category_priority = categories.get(category, {}).get('priority', 'P3')
            return priority_order.get(category_priority, 3)
        
        return sorted(issues, key=get_priority)
    
    def execute_fix(self, issue: Dict[str, Any]) -> bool:
        """執行單個問題修復"""
        if not issue['auto_fix']:
            print(f"📝 需要手動修復: {issue['file']}:{issue['line']} ({issue['pattern']})")
            return False
            
        try:
            # 根據問題類型調用相應修復腳本
            fix_action = issue.get('fix_action', 'manual')
            
            if fix_action == 'replace_with_concrete_type':
                return self.fix_any_type(issue)
            elif fix_action == 'remove_double_wrap':
                return self.fix_double_envelope(issue)
            elif fix_action == 'use_standard_response':
                return self.fix_raw_response(issue)
            elif fix_action == 'replace_with_generic_error':
                return self.fix_error_message_leak(issue)
            elif fix_action == 'use_standard_error_code':
                return self.fix_error_code(issue)
            else:
                print(f"⚠️  未知的修復動作: {fix_action}")
                return False
                
        except Exception as e:
            print(f"❌ 修復失敗 {issue['file']}:{issue['line']}: {e}")
            return False
    
    def fix_any_type(self, issue: Dict[str, Any]) -> bool:
        """修復 any 類型使用"""
        # 調用 TypeScript 修復腳本
        script_path = '.devin/scripts/any-type-eliminator.ts'
        cmd = f"npx ts-node {script_path} --auto-fix"
        
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            print(f"❌ any 類型修復失敗: {e}")
            return False
    
    def fix_double_envelope(self, issue: Dict[str, Any]) -> bool:
        """修復雙重包裝問題"""
        script_path = '.devin/scripts/api-architecture-optimizer.ts'
        cmd = f"npx ts-node {script_path} --fix"
        
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            print(f"❌ 雙重包裝修復失敗: {e}")
            return False
    
    def fix_raw_response(self, issue: Dict[str, Any]) -> bool:
        """修復原始 Response 使用"""
        script_path = '.devin/scripts/api-architecture-optimizer.ts'
        cmd = f"npx ts-node {script_path} --fix"
        
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            print(f"❌ 原始 Response 修復失敗: {e}")
            return False
    
    def fix_error_message_leak(self, issue: Dict[str, Any]) -> bool:
        """修復錯誤訊息洩漏"""
        script_path = '.devin/scripts/error-handling-fixer.ts'
        cmd = f"npx ts-node {script_path} --fix"
        
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            print(f"❌ 錯誤訊息洩漏修復失敗: {e}")
            return False
    
    def fix_error_code(self, issue: Dict[str, Any]) -> bool:
        """修復錯誤代碼"""
        script_path = '.devin/scripts/error-handling-fixer.ts'
        cmd = f"npx ts-node {script_path} --fix"
        
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            return result.returncode == 0
        except Exception as e:
            print(f"❌ 錯誤代碼修復失敗: {e}")
            return False
    
    def auto_repair(self, project_root: str = '.') -> Dict[str, Any]:
        """執行自動修復流程"""
        print("🔍 開始無作妙德自動修復...")
        
        # 1. 掃描問題
        issues = self.scan_project(project_root)
        print(f"📊 發現 {len(issues)} 個問題")
        
        # 2. 分類問題
        categorized = self.categorize_issues(issues)
        print(f"📋 分類: {list(categorized.keys())}")
        
        # 3. 優先級排序
        prioritized = self.prioritize_fixes(issues)
        
        # 4. 執行修復
        fixed = 0
        failed = 0
        manual = 0
        
        for issue in prioritized:
            if issue['auto_fix']:
                success = self.execute_fix(issue)
                if success:
                    fixed += 1
                else:
                    failed += 1
            else:
                manual += 1
        
        # 5. 生成報告
        report = {
            'timestamp': datetime.now().isoformat(),
            'total_issues': len(issues),
            'fixed': fixed,
            'failed': failed,
            'manual': manual,
            'categorized': {k: len(v) for k, v in categorized.items()}
        }
        
        self.log_repair(report)
        return report
    
    def log_repair(self, report: Dict[str, Any]):
        """記錄修復日誌"""
        log_path = '.hermes/auto-repair/repair-log.jsonl'
        
        with open(log_path, 'a', encoding='utf-8') as f:
            f.write(json.dumps(report) + '\n')
            
        print(f"📄 修復日誌已記錄: {log_path}")
    
    def print_report(self, report: Dict[str, Any]):
        """打印修復報告"""
        print('\n' + '='.repeat(60))
        print('🛠️  無作妙德自動修復報告')
        print('='.repeat(60))
        print(f"📅 時間: {report['timestamp']}")
        print(f"🔢 總計問題: {report['total_issues']}")
        print(f"✅ 自動修復: {report['fixed']}")
        print(f"❌ 修復失敗: {report['failed']}")
        print(f"📝 需手動: {report['manual']}")
        
        print('\n📊 分類統計:')
        for category, count in report['categorized'].items():
            print(f"  {category}: {count}")
            
        print('\n' + '='.repeat(60))

if __name__ == '__main__':
    engine = EnhancedRepairEngine()
    report = engine.auto_repair('.')
    engine.print_report(report)