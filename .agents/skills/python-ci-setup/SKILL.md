---
name: python-ci-setup
description: Set up Python packages, test infrastructure, and CI configuration for Next.js/full-stack projects. Covers pyproject.toml, esggo/ package creation, ruff config, pytest setup, and build-backend compatibility. Use when Python CI fails or needs initialization.
uuid: "d4e5f6a7-b8c9-0123-defa-234567890123"
version: 1.0.0
title: Python CI 設定
category: python-ci-setup
title: Python CI 設定
category: python-ci-setup
---

1.0.0# Python CI Setup Skill

Bootstrap Python test/lint infrastructure for full-stack projects.

## Step 1: Create Package Structure

```
project-root/
├── pyproject.toml
├── esggo/
│   ├── __init__.py
│   └── config.py
└── tests/
    ├── __init__.py
    ├── conftest.py
    ├── test_config.py
    └── test_functions.py
```

### `esggo/__init__.py`
```python
"""ESG GO Python package."""
__version__ = "5.1.0"
```

### `esggo/config.py`
```python
"""Shared configuration module."""
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
LIB_DIR = PROJECT_ROOT / 'lib'
SUSTAIN_WRITE_DIR = LIB_DIR / 'sustain-write'
REPORTS_DIR = PROJECT_ROOT / 'reports'
SCRIPTS_DIR = PROJECT_ROOT / 'scripts'

def ensure_dirs():
    for d in [LIB_DIR, SUSTAIN_WRITE_DIR, REPORTS_DIR, SCRIPTS_DIR]:
        d.mkdir(parents=True, exist_ok=True)

def get_tmp_excel() -> Path:
    return PROJECT_ROOT / 'tmp_answers.xlsx'

def get_full_excel() -> Path:
    return SUSTAIN_WRITE_DIR / 'full.xlsx'

def get_answer_database_ts() -> Path:
    return SUSTAIN_WRITE_DIR / 'answer-database.ts'
```

## Step 2: pyproject.toml

```toml
[build-system]
requires = ["setuptools>=68.0"]
build-backend = "setuptools.build_meta"   # ← NOT setuptools.backends._legacy

[project]
name = "esggo-python"
version = "5.1.0"
requires-python = ">=3.11"
dependencies = ["openpyxl>=3.1.0"]

[project.optional-dependencies]
dev = ["pytest>=8.0", "ruff>=0.4.0"]

[tool.ruff]
target-version = "py311"
line-length = 200
select = ["E", "F", "W", "I", "N", "UP", "SIM"]

[tool.ruff.lint.per-file-ignores]
"tests/*.py" = ["E402"]
"generate_answer_db.py" = ["E402"]
"parse-esg.py" = ["E402"]

[tool.pytest.ini_options]
testpaths = ["tests"]
python_files = ["test_*.py"]
```

### Critical: `build-backend`
- ❌ `setuptools.backends._legacy:_Backend` — fails on Python 3.14+
- ✅ `setuptools.build_meta` — works on all Python versions

## Step 3: GitHub Actions CI

```yaml
jobs:
  ruff:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
      - run: pip install ruff
      - run: ruff check esggo/ scripts/ *.py  # include esggo/ package

  pytest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.13"
      - run: |
          pip install openpyxl pytest
          pip install -e .
      - run: python -m pytest tests/ -v
```

## Step 4: Ensure `.gitignore` Doesn't Block Package

Check that the package directory is NOT in `.gitignore`:
```bash
git check-ignore -v esggo/   # Should return nothing
```

If it returns a match, remove the line from `.gitignore`.

## Step 5: Verify

```bash
ruff check esggo/ scripts/ *.py     # Lint
python -m pytest tests/ -v          # Tests
pip install -e .                    # Editable install
python -c "from esggo.config import PROJECT_ROOT; print(PROJECT_ROOT)"
```

## Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `Cannot import 'setuptools.backends._legacy'` | Wrong build-backend | Use `setuptools.build_meta` |
| `cannot import name 'X' from 'esggo.config'` | Missing function | Add to `config.py` |
| `esggo/ not found` in CI | `.gitignore` blocks it | Remove from `.gitignore` |
| `ModuleNotFoundError: esggo` | Package not installed | Run `pip install -e .` |


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| python-ci-setup | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：python-ci-setup 並查詢目前狀態
{
  triggers: ["python-ci-setup", "query"],
  actions: ["awaken()", "query()"],
  priority: ["python-ci-setup", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | python-ci-setup, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | python-ci-setup, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：python-ci-setup
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 python-ci-setup 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 python-ci-setup 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
