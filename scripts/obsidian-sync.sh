#!/usr/bin/env bash
# 萬能蜂群三端同步 (Obsidian Mobile + Desktop + Git)
#
# 三個端點:
#   1. Obsidian Desktop (Windows) — 主要編輯
#   2. Obsidian Mobile (iOS/Android) — 隨時閱讀/撰寫
#   3. Git Repository (GitHub: DingJun1028/esggo) — 自動同步
#
# 同步機制:
#   - Desktop + Mobile 透過 Obsidian Git plugin 自動 commit + push
#   - VPS cron 每天 06:00 執行 avatar-daily.sh (knowledge avatar 週期)
#   - 本地記憶體同步透過 TencentDB Agent Memory (port 8420/8096)

set -euo pipefail

# --- Vault 設定 ---
VAULT_DIR="/c/Project/esggo/vault"
ESGGO_DIR="/c/Project/esggo"

cd "$ESGGO_DIR"

echo "=== OA-Team 30 Knowledge Garden Sync ==="
echo "Timestamp: $(date -Iseconds)"

# --- Step 1: Knowledge Avatar → TencentDB Memory ---
echo ""
echo "Step 1: Avatar registry → TencentDB Memory"
if [ -f "scripts/tdai-memory-sync.mjs" ]; then
    if node scripts/tdai-memory-sync.mjs 2>&1; then
        echo "  ✅ TencentDB sync complete"
    else
        echo "  ⚠ TencentDB sync failed (graceful degradation — local state preserved)"
    fi
else
    echo "  ⏭ No tdai-memory-sync.mjs found"
fi

# --- Step 2: Vault → Canonical TS Types ---
echo ""
echo "Step 2: Vault types → shared/types.ts"
if [ -f "scripts/sync-vault-types.ts" ]; then
    npx tsx scripts/sync-vault-types.ts --apply 2>&1 | tail -5
    echo "  ✅ Types sync complete"
else
    echo "  ⏭ No sync-vault-types.ts found"
fi

# --- Step 3: Canonical → Vault (TypeMatrix.md) ---
echo ""
echo "Step 3: Canonical types → TypeMatrix.md"
if [ -f "scripts/sync-types-to-vault.ts" ]; then
    npx tsx scripts/sync-types-to-vault.ts 2>&1 | tail -5
    echo "  ✅ TypeMatrix updated"
fi

# --- Step 4: Git Commit + Push ---
echo ""
echo "Step 4: Git commit + push"
cd "$VAULT_DIR"

git add -A

if git diff --cached --quiet; then
    echo "  ℹ No changes to commit"
else
    git commit -m "knowledge-garden: auto-sync $(date +%Y-%m-%dT%H:%M)" 2>&1
    echo "  ✅ Committed"
    
    if git remote get-url origin &>/dev/null; then
        git push origin "$(git branch --show-current)" 2>&1
        echo "  ✅ Pushed to $(git remote get-url origin)"
    fi
fi

echo ""
echo "=== Sync Complete ==="