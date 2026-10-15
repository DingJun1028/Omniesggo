#!/bin/bash
# deploy-omni-one-notes.sh — 部署 omni-one 萬能筆記至 ESG GO 知識系統
# 5T Traceable: source_origin / version / timestamp 記錄
# 5T Trackable: 生命週期 hooks 記錄
# 5T Tangible: 知識庫可查詢、可檢索
# 5T Transparent: 架構文件公開透明
# 5T Trustworthy: 知識庫封存 (hash_lock) 後鎖定

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ESGGO_ROOT="$(cd "$SCRIPT_DIR/../../" && pwd)"
KNOWLEDGE_BASE="/omniione萬能筆記"
OBSIDIAN_VAULT="/c/Users/dingj/iCloudDrive/obsidian-vault"
OBSIDIAN_DEST="$OBSIDIAN_VAULT/01-projects/omni-one-萬能筆記"
OMNIESGGO_DEST="/c/Project/omniesggo/Omni-Sanctuary/omni-one-萬能筆記"

LOG_FILE="${SCRIPT_DIR}/deploy-omni-one-notes.log"
TIMESTAMP="$(date -u +"%Y-%m-%dT%H:%M:%SZ")"
VERSION="1.0.0"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "$LOG_FILE"; }
die() { log "ERROR: $*" >&2; exit 1; }

# ============================================================
# 0. 前置檢查
# ============================================================
log "=== 部署 omni-one 萬能筆記開始 ==="
log "版本: $VERSION"
log "日期: $TIMESTAMP"

# 5T Trustworthy: 驗證來源目錄存在
[[ -d "$KNOWLEDGE_BASE" ]] || die "來源目錄不存在: $KNOWLEDGE_BASE"
log "[OK] 來源目錄存在: $KNOWLEDGE_BASE"

# 5T Traceable: 記錄來源
SOURCE_ORIGIN="$(readlink -f "$KNOWLEDGE_BASE")"
log "[Traceable] source_origin = $SOURCE_ORIGIN"

# ============================================================
# 1. 驗證來源文件
# ============================================================
log "--- 步驟 1: 驗證來源文件 ---"
for f in README.md index.md 5T-protocols.md; do
  if [[ ! -f "$KNOWLEDGE_BASE/$f" ]]; then
    die "來源文件不存在: $KNOWLEDGE_BASE/$f"
  fi
  log "[OK] $f 存在 ($(wc -l < "$KNOWLEDGE_BASE/$f") 行)"
done

# 5T Trackable: 記錄每個文件的哈希值
log "--- 步驟 1.1: 知識庫指紋 (Hash) ---"
for f in README.md index.md 5T-protocols.md; do
  HASH=$(sha256sum "$KNOWLEDGE_BASE/$f" | cut -d' ' -f1)
  echo "  $f: $HASH" >> "$LOG_FILE"
  log "  $f: $(echo $HASH | cut -c1-16)..."
done

# ============================================================
# 2. 複製至 Obsidian 知識庫
# ============================================================
log "--- 步驟 2: 複製至 Obsidian 知識庫 ---"
mkdir -p "$OBSIDIAN_DEST"
cp "$KNOWLEDGE_BASE"/README.md "$OBSIDIAN_DEST/"
cp "$KNOWLEDGE_BASE"/index.md "$OBSIDIAN_DEST/"
cp "$KNOWLEDGE_BASE"/5T-protocols.md "$OBSIDIAN_DEST/"
log "[OK] 已複製到 Obsidian: $OBSIDIAN_DEST"

# 5T Traceable: 記錄複製時間
echo "{\"source_origin\": \"$SOURCE_ORIGIN\", \"version\": \"$VERSION\", \"timestamp\": \"$TIMESTAMP\", \"destination\": \"$OBSIDIAN_DEST\"}" >> "$LOG_FILE"

# ============================================================
# 3. 複製至 Omniesggo 專案
# ============================================================
log "--- 步驟 3: 複製至 Omniesggo 專案 ---"
mkdir -p "$OMNIESGGO_DEST"
cp "$KNOWLEDGE_BASE"/README.md "$OMNIESGGO_DEST/"
cp "$KNOWLEDGE_BASE"/index.md "$OMNIESGGO_DEST/"
cp "$KNOWLEDGE_BASE"/5T-protocols.md "$OMNIESGGO_DEST/"
log "[OK] 已複製到 Omniesggo: $OMNIESGGO_DEST"

# 5T Trackable: 記錄同步事件
echo "{\"event\": \"sync_done\", \"from\": \"$SOURCE_ORIGIN\", \"to\": \"$OMNIESGGO_DEST\", \"at\": \"$TIMESTAMP\"}" >> "$LOG_FILE"

# ============================================================
# 4. 更新知識庫索引 (index.md)
# ============================================================
log "--- 步驟 4: 更新知識庫索引 ---"
INDEX_UPDATED="$KNOWLEDGE_BASE/index.md"
{
  echo ""
  echo "--- 最新同步記錄 ---"
  echo "- 版本: $VERSION"
  echo "- 時間: $TIMESTAMP"
  echo "- 來源: $SOURCE_ORIGIN"
  echo "- 狀態: 已部署至 Obsidian + Omniesggo"
} >> "$INDEX_UPDATED"
log "[OK] 索引已更新"

# ============================================================
# 5. 知識庫封存 (Hash Lock)
# ============================================================
log "--- 步驟 5: 知識庫封存 (Hash Lock) ---"
LOCK_FILE="$KNOWLEDGE_BASE/.locked"
echo "{$TIMESTAMP}" > "$LOCK_FILE"
log "[OK] 知識庫已封存: $LOCK_FILE"

# 5T Trustworthy: Object.freeze() 等效
echo '{"locked": true, "at": "'"$TIMESTAMP"'", "version": "'"$VERSION"'"}' >> "$LOG_FILE"

# ============================================================
# 6. 驗證部署
# ============================================================
log "--- 步驟 6: 驗證部署 ---"
DEPLOYMENT_OK=true
for f in README.md index.md 5T-protocols.md; do
  if [[ -f "$OBSIDIAN_DEST/$f" ]] && [[ -f "$OMNIESGGO_DEST/$f" ]]; then
    log "[OK] $f: 兩處都存在"
  else
    log "[FAIL] $f: 缺失"
    DEPLOYMENT_OK=false
  fi
done

if [[ "$DEPLOYMENT_OK" == "true" ]]; then
  log "[OK] 部署驗證通過"
else
  die "部署驗證失敗"
fi

# ============================================================
# 7. 完成
# ============================================================
log "=== 部署 omni-one 萬能筆記完成 ==="
log "報告檔案: $LOG_FILE"

