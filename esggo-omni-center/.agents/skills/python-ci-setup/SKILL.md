---
name: python-ci-setup
description: Set up Python packages, test infrastructure, and CI configuration for Next.js/full-stack projects. Covers pyproject.toml, esggo/ package creation, ruff config, pytest setup, and build-backend compatibility. Use when Python CI fails or needs initialization.
uuid: "d4e5f6a7-b8c9-0123-defa-234567890123"
version: "1.0.0"
---

# Python CI Setup Skill

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
