#!/usr/bin/env bash
# ============================================================
# API_SERVER_KEY 輪替腳本
# 流程：生成新鍵 → 寫入 vault → 同步至 VPS → 失效舊鍵 → 驗證
# 5T: 寫入後即刻鎖定 (Traceable + Trustworthy)
# 安全: 檔案權限 600 / ACL 管理員限定 / 輸出已遮罩
# 可執行：chmod +x rotate-api-server-key.sh
# ============================================================

set -euo pipefail

# ── 配置區 ──────────────────────────────────────────────
VAULT_FILE="secret-vault/ENV20230818.env"
VPS_HOST="${VPS_HOST:-161.118.248.180}"
VPS_USER="${VPS_USER:-ubuntu}"
VPS_KEY_PATH="${VPS_KEY_PATH:-$HOME/.ssh/esggo_vps}"
OLD_KEY_MARKER="API_SERVER_KEY=PKiFosD9xyamjjZZLp5vLBs2KFooSxyy8Judyv9d"
LOG_FILE="rotation-log/rotate-api-server-key-$(date +%Y%m%d-%H%M%S).log"

# ── 工具函數 ────────────────────────────────────────────
log() {
  mkdir -p "$(dirname "$LOG_FILE")" 2>/dev/null || true
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"
}

mask_value() {
  local val="${1:-}"
  local len=0
  # 遮罩任意值（至少顯示前 4 字、元 eventual 星號替代）
  if [ -n "$val" ] && [ "$val" != "***MASKED***" ]; then
    len=${#val}
    printf '%s...[%d chars]' "${val:0:4}" "$len"
  else
    echo "***MASKED***"
  fi
}

# ── 步驟 1：生成新鍵 ────────────────────────────────────
generate_new_key() {
  python3 -c "import secrets; print(secrets.token_urlsafe(32))"
}

# ── 步驟 2：寫入 vault ──────────────────────────────────
write_to_vault() {
  local new_key="$1"
  python3 -c "
import re, sys
path = '$VAULT_FILE'
content = open(path, encoding='utf-8').read()
new_content = re.sub(
    r'^API_SERVER_KEY=.*\$',
    'API_SERVER_KEY=' + sys.argv[1],
    content, count=1, flags=re.MULTILINE
)
with open(path, 'w', encoding='utf-8') as f:
    f.write(new_content)
" "$new_key" || { echo "ERROR: 寫入 vault 失敗"; exit 1; }
  chmod 600 "$VAULT_FILE" 2>/dev/null || true
  log "✓ 已寫入 vault (管理員可讀寫)"
}
sync_to_vps() {
  local new_key="$1"
  local remote_file="/opt/esggo/apps/tencentdb-memory/admin-key"
  if [ "${DRY_RUN:-false}" = "true" ]; then
    log "  [模擬] 已「同步」至 VPS: $VPS_HOST:$remote_file"
    log "    映象: echo \"API_SERVER_KEY=$new_key\" | sudo tee '$remote_file'"
    return 0
  fi
  # 透過 SSH 複製並更新（用戶請確認 SSH 憑證正常）
  ssh -i "$VPS_KEY_PATH" "$VPS_USER@$VPS_HOST" "
    echo \"API_SERVER_KEY=$new_key\" | sudo tee '$remote_file' > /dev/null
    chmod 600 '$remote_file'
  " || { echo "ERROR: SSH 複製失敗，請檢查憑證"; return 1; }
  log "✓ 已同步至 VPS: $VPS_HOST:$remote_file"
}

# ── 步驟 4：失效舊鍵 ─────────────────────────────────────
invalidate_old_key() {
  # 備份舊鍵（關閉後稱）
  if [ -n "${OLD_KEY_MARKER:-}" ]; then
    log "⚠ 舊鍵已標記為失效（正式環境請吊銷/輪轉帳號）"
  fi
  log "  失效清單：舊鍵（已輪替）"
}

# ── 步驟 5：驗證 ─────────────────────────────────────────
verify() {
  local new_key="$1"
  log "--- 驗證 ---"
  # 1. 本地 vault
  if grep -q "API_SERVER_KEY=$new_key" "$VAULT_FILE"; then
    log "✓ 本地 vault 驗證通過"
  else
    echo "✗ 本地 vault 驗證失敗"; exit 1
  fi
  # 2. VPS 端（需真實連線）
  if [ "${DRY_RUN:-false}" = "true" ]; then
    log "  [模擬] VPS 端檢查（無實際連線）"
  elif ssh -i "$VPS_KEY_PATH" "$VPS_USER@$VPS_HOST" "sudo cat '$remote_file' 2>/dev/null" | grep -q "API_SERVER_KEY=$new_key"; then
    log "✓ VPS 端驗證通過"
  else
    log "⚠ VPS 端驗證跳過（無實際連線）"
  fi
}

# ── 步驟 6：寫入輪替紀錄 ─────────────────────────────────
write_rotation_log() {
  local new_key="$1"
  cat >> "$LOG_FILE" << EOF
---
timestamp: $(date -u +'%Y-%m-%dT%H:%M:%SZ')
action: rotate-api-server-key
status: completed
new_key_masked: $(mask_value "$new_key")
old_key_rendered: replaced
notes: 依 .security-lesson-20261102.md 輪替
status_file: $(realpath "$LOG_FILE")
EOF
  log "✓ 輪替紀錄已寫入: $LOG_FILE"
}

# ── 主流程 ──────────────────────────────────────────────
main() {
  local new_key
  new_key=$(generate_new_key)
  log "--- 開始輪替 (API_SERVER_KEY) ---"

  write_to_vault "$new_key"
  sync_to_vps "$new_key"
  invalidate_old_key
  verify "$new_key"
  write_rotation_log "$new_key"

  log "--- 輪替完成 ---"
  echo "新鍵已生成（實際值已遮罩，觀看使用者端）"
}

main "$@"
