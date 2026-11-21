#!/usr/bin/env bash
# obsidian-sync-status.sh — 查 vault git 同步狀態 (手機/電腦/Hermex 共用)
# 輸出 JSON: {vault_clean, unpushed, last_commit, branch}
set -e
VAULT="C:/Project/esggo/vault"
cd "$VAULT" 2>/dev/null || { echo '{"error":"vault not found"}'; exit 1; }
UNCOMMITTED=$(git status --porcelain | wc -l)
UNPUSHED=$(git log origin/$(git branch --show-current)..HEAD --oneline 2>/dev/null | wc -l || echo 0)
LAST=$(git log -1 --format='%h %s' 2>/dev/null)
BRANCH=$(git branch --show-current)
cat <<JSON
{
  "vault_clean": $([ "$UNCOMMITTED" -eq 0 ] && echo true || echo false),
  "uncommitted": $UNCOMMITTED,
  "unpushed": $UNPUSHED,
  "last_commit": "$LAST",
  "branch": "$BRANCH",
  "obsidian_git_plugin": $([ -d .obsidian/plugins/obsidian-git ] && echo true || echo false),
  "hermes_agent": $([ -f .obsidian/plugins/hermes-agent/config.json ] && echo true || echo false)
}
JSON
