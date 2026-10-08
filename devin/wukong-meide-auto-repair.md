# 無作妙德自動修復協議

## 目標：建立無作自愈的系統修復能力

### 修復機制架構
```
.hermes/auto-repair/
├── error-patterns.yaml       # 錯誤模式匹配規則
├── fix-actions.yaml          # 修復動作映射
├── repair-engine.py          # 核心修復引擎
├── clone-tracker.py          # 萬能分身追蹤器
├── auto-fix.sh               # 入口腳本
├── repair-log.jsonl          # 修復日誌
└── tracker-log.jsonl         # 追蹤日誌
```

### 自動修復範圍擴展

#### 1. 代碼質量自動修復
```yaml
# error-patterns.yaml 擴展
patterns:
  - name: "any-type-usage"
    regex: ": any|as any|<any>"
    severity: "medium"
    auto_fix: true
    fix_action: "replace_with_concrete_type"
    
  - name: "double-envelope"
    regex: "jsonResponse\(\{ success: true"
    severity: "high"
    auto_fix: true
    fix_action: "remove_double_wrap"
    
  - name: "error-message-leak"
    regex: "error\.message|err\.message"
    severity: "high"
    auto_fix: true
    fix_action: "replace_with_generic_error"
```

#### 2. 測試自動生成
```python
# repair-engine.py 擴展
class TestGenerator:
    async def generate_missing_tests(self, file_path: str):
        """為缺失測試的文件自動生成測試"""
        code_analysis = await self.analyze_code(file_path)
        test_template = self.get_test_template(code_analysis)
        await self.write_test_file(file_path, test_template)
        
    async def update_outdated_tests(self, test_path: str):
        """更新過時的測試"""
        implementation = await self.get_implementation(test_path)
        current_test = await self.read_test(test_path)
        updated_test = self.sync_test_with_impl(implementation, current_test)
        await self.write_test(test_path, updated_test)
```

#### 3. 依賴自動修復
```python
class DependencyAutoFix:
    async def fix_pnpm_issues(self):
        """自動修復 pnpm 問題"""
        if self.detect_windows_msys():
            return await self.switch_to_npm()
        return await self.fix_corepack()
        
    async def auto_resolve_conflicts(self):
        """自動解決依賴衝突"""
        conflicts = await self.detect_conflicts()
        for conflict in conflicts:
            resolution = await self.find_resolution(conflict)
            await self.apply_resolution(resolution)
```

#### 4. 構建自動修復
```python
class BuildAutoFix:
    async def fix_build_errors(self, build_output: str):
        """根據構建錯誤自動修復"""
        errors = self.parse_build_errors(build_output)
        for error in errors:
            if error.type == "module_not_found":
                await self.add_missing_dependency(error)
            elif error.type == "type_error":
                await self.fix_type_error(error)
            elif error.type == "lint_error":
                await self.fix_lint_error(error)
```

### 萬能分身追蹤增強

#### 1. 分身狀態追蹤
```python
class CloneTracker:
    def __init__(self):
        self.active_clones = {}
        self.clone_history = []
        
    def register_clone(self, task_id: str, clone_config: dict):
        """註冊新的修復分身"""
        clone_id = f"clone-{uuid.uuid4()}"
        self.active_clones[clone_id] = {
            "task_id": task_id,
            "config": clone_config,
            "status": "initialized",
            "start_time": time.time(),
            "progress": 0
        }
        return clone_id
        
    def update_clone_progress(self, clone_id: str, progress: int):
        """更新分身進度"""
        if clone_id in self.active_clones:
            self.active_clones[clone_id]["progress"] = progress
            self.active_clones[clone_id]["status"] = "running"
            
    def complete_clone(self, clone_id: str, result: dict):
        """完成分身任務"""
        if clone_id in self.active_clones:
            self.active_clones[clone_id]["status"] = "completed"
            self.active_clones[clone_id]["result"] = result
            self.active_clones[clone_id]["end_time"] = time.time()
            self.clone_history.append(self.active_clones[clone_id])
            del self.active_clones[clone_id]
```

#### 2. 分身升級機制
```python
class CloneUpgrade:
    def upgrade_clone(self, clone_id: str, failure_reason: str):
        """分身失敗時自動升級"""
        current_level = self.get_clone_level(clone_id)
        if current_level < 3:
            new_level = current_level + 1
            upgraded_clone = self.create_upgraded_clone(clone_id, new_level)
            return upgraded_clone
        else:
            return self.request_manual_intervention(clone_id, failure_reason)
```

### 使用方式擴展

```bash
# 高級修復命令
./auto-fix.sh --pattern "any-type-usage" --auto
./auto-fix.sh --generate-tests --coverage-target 80
./auto-fix.sh --fix-dependencies --auto-resolve
./auto-fix.sh --fix-build --errors-from build.log
./auto-fix.sh --monitor --continuous --notify-on-failure

# 分身管理
./auto-fix.sh --clone-status
./auto-fix.sh --clone-history --last 10
./auto-fix.sh --upgrade-clone <clone-id>
```

### 修復日誌增強

```json
// repair-log.jsonl 擴展格式
{
  "timestamp": "2026-08-13T10:30:00Z",
  "repair_id": "repair-123",
  "pattern": "any-type-usage",
  "file": "src/impl/core.ts",
  "severity": "medium",
  "auto_fixed": true,
  "fix_action": "replace_with_concrete_type",
  "result": {
    "status": "success",
    "changes": 5,
    "verification": "passed"
  },
  "clone_info": {
    "clone_id": "clone-abc123",
    "level": 1,
    "duration": 2.5
  }
}
```

### 持續改進
- 修復模式學習
- 自動修復策略優化
- 分身效率提升
- 修復成功率監控