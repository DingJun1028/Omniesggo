#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────
# scripts/verify-secrets.sh
# ────────────────────────────────────────────────────────────
# 終端機/CI 環境下安全檢查腳本
# 功能：掃描專案中是否包含真實機密值
# 執行：chmod +x scripts/verify-secrets.sh && ./scripts/verify-secrets.sh
# ────────────────────────────────────────────────────────────

set -euo pipefail

# ── 設定 ────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SECRET_PATTERNS=(
  "your_actual_"
  "sk-ant-"
  "gsk_"
  "mstrl_"
  "NCBDB_API_TOKEN=your_actual"
  "OMNIMASTER_KEY=your_actual"
  "MISTRAL_API_KEY=your_actual"
  "MISTRAL_ADMIN_KEY=your_actual"
  "MISTRAL_WORKFLOW_KEY=your_actual"
  "CONDUIT_PASSWORD=your_actual"
  "GROQ_API_KEY=your_actual"
  "passwordless"
)
WATCH_DIRS=(
  "$REPO_ROOT"
  "$REPO_ROOT/secret-vault"
  "$REPO_ROOT/.env*"
  "$REPO_ROOT/.github"
  "$REPO_ROOT/Agent-Reach"
)

# ── 工具準備 ────────────────────────────────────────────────
log_info()  { echo -e "\033[1;32mℹ\033[0m $1"; }
log_warn()  { echo -e "\033[1;33m⚠\033[0m $1"; }
log_error() { echo -e "\033[1;31m✗\033[0m $1"; }

# ── 掃描執行 ────────────────────────────────────────────────
log_info "檢查目錄：$REPO_ROOT"
log_info "掃描模式：關鍵字匹配 + 檔案權限"
echo ""

danger_count=0
for pattern in "${SECRET_PATTERNS[@]}"; do
  matches=$(grep -rln --include="*.ts" --include="*.js" --include="*.py" \
    --include="*.env*" --include="*.yaml" --include="*.yml" \
    --include="*.md" --include="*.sh" --include="*.json" \
    -e "$pattern" "$REPO_ROOT" 2>/dev/null || true)

  if [ -n "$matches" ]; then
    log_error "發現機密值模式：$pattern"
    log_error "命中檔案："
    echo "$matches" | sed 's/^/    /'
    ((danger_count++))
  fi
done

# ── 檔案權限檢查 ────────────────────────────────────────────
log_info "檢查檔案權限..."
while IFS= read -r -d '' f; do
  perms=$(stat -c "%a" "$f" 2>/dev/null || echo "N/A")
  if [ "$perms" != "600" ] && [ "$perms" != "700" ]; then
    log_warn "檔案權限異常：$f （$perms）"
  fi
done < <(find "$REPO_ROOT/secret-vault" -type f -print0 2>/dev/null || true)

# ── 結果匯總 ────────────────────────────────────────────────
echo ""
if [ "$danger_count" -eq 0 ]; then
  log_info "✅ 掃描完成：未發現真實機密值"
  log_info "   安全狀態：PASS"
  exit 0
else
  log_error "🔴 掃描完成：發現 $danger_count 處真實機密值"
  log_error "   安全狀態：FAIL"
  exit 1
fi
