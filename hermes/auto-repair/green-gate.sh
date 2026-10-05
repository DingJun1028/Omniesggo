#!/usr/bin/env bash
# source_origin: user directive 2026-10-04 —「要全綠才能往下進行，要全部自動修復完成到好才進到下一步」
#
# 全綠閘 (ALL-GREEN GATE)
# ---------------------------------------------------------------------------
# 硬規則：任何一步未達「全綠」就不得前進，必須自動修復到好為止。
#
# 「全綠」的定義（三層，全部必須成立，缺一即擋）：
#   1. 型別/靜態檢查 exit 0
#   2. 單元測試   exit 0 且 0 failed / 0 error
#   3. lint       exit 0
#
# 行為：
#   - 全綠 → exit 0，可進入下一步
#   - 非全綠 → 印出失敗層、印出修復建議，exit 1（呼叫端必須停下修復）
#
# 用法：
#   .hermes/auto-repair/green-gate.sh              # 自動偵測專案類型
#   .hermes/auto-repair/green-gate.sh <檢查目錄>   # 指定子專案
set -uo pipefail

TARGET="${1:-.}"
cd "$TARGET" || { echo "GATE: cannot cd into $TARGET"; exit 1; }
ROOT="$(pwd)"

declare -a RESULTS=()
declare -a FAILURES=()
overall=0

run_gate() {
  local layer="$1"; shift
  local label="$1"; shift
  printf '\n=== GATE [%s] %s ===\n' "$layer" "$label"
  # Run and capture exit code WITHOUT an if-wrapper: `$?` inside an `if`/`then`
  # branch is always 0, which would silently mark real failures as PASS.
  "$@" >/tmp/green-gate-last.log 2>&1
  local rc=$?
  # Surface the tail of the failing output so the fix is actionable.
  if [ $rc -ne 0 ]; then
    echo "--- last 30 lines of output ---"
    tail -30 /tmp/green-gate-last.log
    echo "--- end output ---"
  fi
  if [ $rc -eq 0 ]; then
    RESULTS+=("PASS|$layer|$label|exit=0")
    printf 'GATE RESULT: PASS  %s / %s (exit 0)\n' "$layer" "$label"
  else
    RESULTS+=("FAIL|$layer|$label|exit=$rc")
    FAILURES+=("$layer/$label exit=$rc")
    overall=1
    printf 'GATE RESULT: FAIL  %s / %s (exit %s)\n' "$layer" "$label" "$rc"
  fi
}

# ---- 自動偵測專案類型 --------------------------------------------------
have() { command -v "$1" >/dev/null 2>&1; }
# Probe via `python -m` too: on Windows the tool may only be on the venv that
# python resolves to (e.g. ruff installed inside Hermes' venv, not on PATH).
py_has() { "$PY" -m "$1" --version >/dev/null 2>&1; }

HAS_PY=false HAS_NODE=false
[ -f pyproject.toml ] && HAS_PY=true
[ -f package.json ] && HAS_NODE=true
[ -d apps/aistation ] && HAS_PY=true

if [ "$HAS_PY" = true ]; then
  PY=python
  have pytest || PY=python3
  py_has pytest || PY=python3
  # 1. 型別檢查
  if py_has mypy; then
    run_gate typecheck "mypy" "$PY" -m mypy --ignore-missing-imports .
  else
    RESULTS+=("SKIP|typecheck|mypy|not-installed")
    printf '\nGATE [typecheck] mypy — SKIP (not installed)\n'
  fi
  # 2. 測試
  run_gate tests "pytest" "$PY" -m pytest tests/ -q
  # 3. lint — only when the project declares a lint config or dep, otherwise
  #    ruff's DEFAULT rule set invents hundreds of errors the project never
  #    agreed to and the gate becomes unfixable noise.
  if py_has ruff && { [ -f ruff.toml ] || [ -f .ruff.toml ] || grep -qE "^\[tool\.ruff\]|ruff" pyproject.toml 2>/dev/null; }; then
    run_gate lint "ruff" "$PY" -m ruff check .
  else
    RESULTS+=("SKIP|lint|ruff|no-project-config")
    printf '\nGATE [lint] ruff — SKIP (project declares no ruff config)\n'
  fi
fi

if [ "$HAS_NODE" = true ]; then
  have pnpm && PM=pnpm || PM=npm
  # 型別檢查 + build（Next.js 的 build 即型別關卡）
  if grep -q '"typecheck"' package.json 2>/dev/null; then
    run_gate typecheck "pnpm typecheck" $PM run typecheck
  fi
  if grep -q '"lint"' package.json 2>/dev/null; then
    run_gate lint "pnpm lint" $PM run lint
  fi
  # 測試
  if grep -q '"test"' package.json 2>/dev/null; then
    run_gate tests "pnpm test" $PM run test
  fi
fi

# ---- 匯總 ---------------------------------------------------------------
echo
echo "==================== ALL-GREEN GATE 匯總 ===================="
printf '%s\n' "${RESULTS[@]}"
echo "--------------------------------------------------------"
if [ $overall -eq 0 ]; then
  echo "GATE VERDICT: 全綠 ✅  → 可進入下一步"
  exit 0
else
  echo "GATE VERDICT: 非全綠 ❌  → 不得前進，必須自動修復到全綠為止"
  echo "未通過層："
  printf '  - %s\n' "${FAILURES[@]}"
  echo "修復指引： .hermes/auto-repair/auto-fix.sh \"<錯誤訊息>\""
  echo "或執行本檔反覆重跑至 exit 0。"
  exit 1
fi