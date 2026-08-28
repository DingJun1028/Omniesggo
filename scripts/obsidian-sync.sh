#!/bin/bash
# obsidian-sync.sh — OA-Team 30 Knowledge Garden 同步
# 每日 05:30 UTC cron 執行 (VPS)
#
# Phase 1: TencentDB knowledge → Obsidian vault (pull latest 24h)
# Phase 2: Obsidian vault → TencentDB memory (push new notes)
# Phase 3: Git commit + push (mobile/desktop 3端同步)
set -euo pipefail

KEY=*** API_SERVER_KEY
VAULT="/opt/esggo/vault"
INBOX="$VAULT/00-inbox"
LOG="/home/ubuntu/logs/obsidian-sync.log"

echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] === Obsidian sync start ===" >> "$LOG"

# Phase 1: Pull knowledge from TencentDB
curl -sf --max-time 30 "http://127.0.0.1:8420/v3/knowledge/search?q=avatar&limit=50" \
  -H "Authorization: Bearer $KEY" \
  -o "$INBOX/_tdai-import-$(date -u +%Y%m%d).json" 2>>"$LOG"

if [ $? -eq 0 ]; then
    echo "[SUCCESS] Phase 1: Pulled TencentDB knowledge" >> "$LOG"
else
    echo "[WARN] Phase 1: TencentDB pull failed, continuing with git sync" >> "$LOG"
fi

# Phase 2: Git commit + push
cd "$VAULT"
git add -A
git commit -m "obsidian-sync: $(date -u +%Y-%m-%dT%H:%M:%SZ) — $(git status --short | wc -l) files" >> "$LOG" 2>&1 || true
git push origin feature/aistation-core-modules >> "$LOG" 2>&1 || echo "[WARN] Push failed" >> "$LOG"

echo "[DONE] Git sync complete" >> "$LOG"
