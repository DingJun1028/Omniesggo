#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# run_5t_check.sh — 5T 狀態檢查腳本
# ═══════════════════════════════════════════════════════════
# 功能:
#   1. 檢查 VERSION 檔案
#   2. 檢查 START_ENCODING
#   3. 執行 5T 狀態檢查
#   4. 輸出結果
#
# 用法:
#   run_5t_check.sh [--check]
#
#  ejecución:
#   chmod +x run_5t_check.sh
#   ./run_5t_check.sh --check
# ═══════════════════════════════════════════════════════════

set -euo pipefail

# ── 工具調用 ────────────────────────────────────────────
log()  { echo "[5t_check] $*"; }
die()  { echo "[5t_check] ERROR: $*" >&2; exit 1; }

# ── 解析參數 ────────────────────────────────────────────
CHECK=false

for arg in "$@"; do
  case "$arg" in
    --check) CHECK=true ;;
  esac
done

# ── 1. 檢查 VERSION 檔案 ───────────────────────────────
check_version() {
  if [ ! -f "VERSION" ]; then
    die "VERSION 檔案不存在"
  fi

  log "VERSION 檔案存在"
  cat VERSION
}

# ── 2. 檢查 START_ENCODING ─────────────────────────────
check_start_encoding() {
  if [ ! -f "VERSION" ]; then
    die "VERSION 檔案不存在"
  fi

  if ! grep -q "START_ENCODING" VERSION; then
    die "START_ENCODING not found in VERSION"
  fi

  log "START_ENCODING found in VERSION"
}

# ── 3. 執行 5T 狀態檢查 ────────────────────────────────
check_5t() {
  log "Running 5T status check..."

  local checks=(
    "Traceable:source_origin"
    "Trackable:START_ENCODING"
    "Tangible:tangible_count"
    "Transparent:transparency_count"
    "Trustworthy:hash_lock"
  )

  local all_pass=true

  for check in "${checks[@]}"; do
    local name="${check%%:*}"
    local expected="${check#*:}"

    local result=false

    case "$name" in
      Traceable)
        if grep -q "source_origin" VERSION; then
          result=true
        fi
        ;;
      Trackable)
        if grep -q "START_ENCODING" VERSION; then
          result=true
        fi
        ;;
      Tangible)
        if grep -q "tangible_count" VERSION; then
          result=true
        fi
        ;;
      Transparent)
        if grep -q "transparency_count" VERSION; then
          result=true
        fi
        ;;
      Trustworthy)
        if grep -q "hash_lock" VERSION; then
          result=true
        fi
        ;;
    esac

    if [ "$result" = true ]; then
      log "  ✅ $name: OK"
    else
      log "  ❌ $name: NOT FOUND"
      all_pass=false
    fi
  done

  if [ "$all_pass" = false ]; then
    die "5T status check FAILED"
  fi

  log "5T status check PASSED"
}

# ── 主流程 ──────────────────────────────────────────────
main() {
  log "=== 5T Status Check ==="
  check_version
  check_start_encoding
  check_5t
  log "=== 5T Status Check Complete ==="
}

main "$@"
