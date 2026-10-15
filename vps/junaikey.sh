#!/usr/bin/env bash
# ============================================================================
# junaikey.sh — JunAikey 萬能元鑰 安全喚醒包裝器 (v2.0.0)
# 用途: 統一由秘密聖櫃授權, 自動載入 NCB 憑證, 規避 'stdin is not a tty' 故障。
# 原則: 憑證單一來源 = secret-vault/ENV20230818.env (5T: Traceable/Trustworthy)
# 用法: junaikey.sh <command> [args...]
# 範例: junaikey.sh awaken | junaikey.sh grow "name" "body" --traits=永恆
# ============================================================================
set -euo pipefail

# --- 單一憑證來源 (秘密聖櫃 / 第一原則) ---
SECRET_VAULT="C:/Users/dingj/secret-vault/ENV20230818.env"
JUNAIKEY_MJS="C:/Project/esggo/vps/junaikey.mjs"

# --- 健檢: 秘密聖櫃存在且可讀 ---
if [ ! -f "$SECRET_VAULT" ]; then
  echo "[junaikey] ✗ 秘密聖櫃不存在: $SECRET_VAULT" >&2
  echo "[junaikey] 請先建立/確認 secret-vault (含 NCBDB_* 變數)。" >&2
  exit 2
fi

# --- 健檢: junaikey.mjs 存在 ---
if [ ! -f "$JUNAIKEY_MJS" ]; then
  echo "[junaikey] ✗ 找不到 junaikey.mjs: $JUNAIKEY_MJS" >&2
  exit 2
fi

# --- 執行: node --env-file=vault 自動載入全部環境變數 (含 NCBDB_*) ---
# --- 超能力 7 階段追蹤 (Superpowers 融合) ---
# 用法: junaikey.sh superpowers <stage> <status> [--source=X] [--sourceOrigin=X] [--notes=X]
# 例: junaikey.sh superpowers brainstorming start
# 例: junaikey.sh superpowers plans done --source=cli --sourceOrigin=github-issue-42 --notes="設計已簽核"
superpowers_track() {
  local stage="$1"
  local status="$2"
  shift 2
  local source="cli"
  local sourceOrigin="manual"
  local notes=""
  while [[ $# -gt 0 ]]; do
    case "$1" in
      --source=*) source="${1#*=}";;
      --sourceOrigin=*) sourceOrigin="${1#*=}";;
      --notes=*) notes="${1#*=}";;
      *) echo "[junaikey] ✗ 未知參數: $1" >&2; return 2;;
    esac
    shift
  done
  local valid="brainstorming,worktrees,plans,subagent,tdd,codereview,finish5t"
  if ! echo "$valid" | grep -qw "$stage"; then
    echo "[junaikey] ✗ 未知階段: $stage。合法值: $valid" >&2
    return 2
  fi
  if ! echo "start,done,blocked,skipped" | grep -qw "$status"; then
    echo "[junaikey] ✗ 未知狀態: $status。合法值: start,done,blocked,skipped" >&2
    return 2
  fi
  node --env-file="$SECRET_VAULT" "$JUNAIKEY_MJS" trackSuperPowersStage "$stage" "$status" --source="$source" --sourceOrigin="$sourceOrigin" --notes="$notes" </dev/null
}

# --- 取得超能力階段進度 ---
superpowers_list() {
  node --env-file="$SECRET_VAULT" "$JUNAIKEY_MJS" listSuperPowersStages </dev/null
}

# --- 重置超能力階段追蹤 ---
superpowers_reset() {
  node --env-file="$SECRET_VAULT" "$JUNAIKEY_MJS" resetSuperPowersStages </dev/null
}

# --- 執行 ---
case "${1:-}" in
  superpowers)
    if [[ $# -lt 2 ]]; then
      echo "[junaikey] ✗ 超能力追蹤需要至少 2 個參數: <stage> <status>" >&2
      echo "[junaikey] 用法: junaikey.sh superpowers <brainstorming|worktrees|plans|subagent|tdd|codereview|finish5t> <start|done|blocked|skipped> [--source=X] [--sourceOrigin=X] [--notes=X]" >&2
      exit 2
    fi
    superpowers_track "$2" "${@:3}"
    ;;
  superpowers-list)
    superpowers_list
    ;;
  superpowers-reset)
    superpowers_reset
    ;;
  *)
    # 預設: 傳遞給 junaikey.mjs
    exec node --env-file="$SECRET_VAULT" "$JUNAIKEY_MJS" "$@" </dev/null
    ;;
esac

# 關鍵: 使用 </dev/null 作為輸出重定向, 絕不可將 </dev/null 作為變數值傳遞
exec node --env-file="$SECRET_VAULT" "$JUNAIKEY_MJS" "$@" </dev/null
