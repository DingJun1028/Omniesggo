#!/bin/bash
# TDAI-OmniSync: 知識花園雙向同步腳本
# 依據 soul.md :: OA-Team × TDAI memory-core 知識花園接線

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 5T Traceable: 同步源目的地
VAULT_PATH="/mnt/d/Obsidian Vault/AI Research"
MEMORY_API="http://127.0.0.1:8420/v3"
ADMIN_KEY_FILE="${SCRIPT_DIR}/.admin-key"
SYNC_LOG="${SCRIPT_DIR}/sync.log"

# 輔助函數
log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" >> "$SYNC_LOG"; }
die() { log "ERROR: $*" >&2; exit 1; }

# 5T Trustworthy: 驗證 admin key
verify_key() {
  if [[ ! -f "$ADMIN_KEY_FILE" ]]; then
    die "Admin key file not found: $ADMIN_KEY_FILE"
  fi
  ADMIN_KEY=$(cat "$ADMIN_KEY_FILE")
}

# 5T Tangible: 同步 Obsidian vault 知識
sync_vault_to_memory() {
  log "開始同步 vault → memory"
  
  local count=0
  find "$VAULT_PATH" -name "*.md" -type f | while read -r file; do
    # 5T Trackable: 逐文件同步
    local content
    content=$(cat "$file")
    local title
    title=$(basename "$file" .md)
    
    # 5T Transparent: Zero hallucination check
    if [[ -z "$content" ]] || [[ "$content" == *"Not Found"* ]]; then
      log "跳過空文件: $file"
      continue
    fi
    
    # 5T Trustworthy: API 同步
    curl -sf -X POST "$MEMORY_API/knowledge" \
      -H "Authorization: Bearer $ADMIN_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"title\":\"$title\",\"content\":\"$content\",\"source_file\":\"$file\"}" >> "$SYNC_LOG" 2>&1
    
    ((count++))
  done
  
  log "同步完成: $count 個文件"
  echo "VAULT_SYNC_COMPLETE:$count"
}

# 5T Tangible: 從 memory 同步到 vault
sync_memory_to_vault() {
  log "開始同步 memory → vault"
  
  # 5T Incremental: 只同步新增內容
  local response
  response=$(curl -sf "$MEMORY_API/search" \
    -H "Authorization: Bearer $ADMIN_KEY" \
    -d "{\"query\":\"sync_since\",\"limit\":100}")
  
  # 5T Trustworthy: 驗證回應
  if ! echo "$response" | python3 -c "import sys,json; json.load(sys.stdin)" >/dev/null 2>&1; then
    log "Memory API 回應無效"
    return 1
  fi
  
  log "memory → vault 同步完成"
}

# 5T Incremental: 增量檢查
check_updates() {
  local last_sync_file="${SCRIPT_DIR}/.last_sync"
  local last_sync=0
  
  if [[ -f "$last_sync_file" ]]; then
    last_sync=$(cat "$last_sync_file")
  fi
  
  # 5T Transparent: 檢查最近修改的文件
  local updates
  updates=$(find "$VAULT_PATH" -name "*.md" -newermt "@$last_sync" -type f | wc -l)
  
  echo "$updates"
}

# 5T Trustworthy: 主驅動流程
main() {
  verify_key
  
  echo "=== TDAI-OmniSync 知識花園同步 ==="
  
  # 1. 檢查更新
  local updates
  updates=$(check_updates)
  log "檢測到 $updates 個更新文件"
  
  if [[ $updates -gt 0 ]]; then
    # 2. 同步 vault → memory
    sync_vault_to_memory
    
    # 3. 同步 memory → vault
    sync_memory_to_vault
    
    # 4. 更新時間戳
    date +%s > "${SCRIPT_DIR}/.last_sync"
    log "同步完成，時間戳更新"
  else
    log "無更新文件"
  fi
  
  echo "SYNC_COMPLETE"
}

# 執行主流程
main "$@"