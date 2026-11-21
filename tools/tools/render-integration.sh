#!/usr/bin/env bash
# ============================================================================
# render-integration.sh — OmniJules "Render Integration" 免費自託管等價 (soul.md §17.7)
# ----------------------------------------------------------------------------
# OmniJules: 連接 Render → 自動偵測 build 失敗 → 分析 log → 推修復進 OmniJules 的 PR。
# 本典等價：Render deploy-hook / failure webhook → 觸發 OA-TWINS Auto-Repair
#           (.github/workflows/auto-repair.yml) → 免費自動修復 + 開 PR。
#
# 三動作：
#   receive-webhook  解析 Render 傳來的 deploy 事件 (stdin JSON)，失敗則轉發
#   trigger-repair   手動觸發 OA-TWINS Auto-Repair (DRY-RUN 預設)
#   status           顯示目前整合狀態
#
# 安全：不接 OmniJules 本體；不寫任何憑證；預設 DRY-RUN。
# ============================================================================
set -euo pipefail

REF="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/jules-api-reference.md"
GH_REPO="${GH_REPO:-DingJun1028/esggo}"
AUTO_REPAIR_WF="auto-repair.yml"

usage() {
  cat <<EOF
render-integration.sh — OmniJules Render 整合免費等價 (soul.md §17.7)
用法:
  $0 receive-webhook   # 從 stdin 讀 Render deploy 事件 JSON，失敗則轉發 auto-repair
  $0 trigger-repair [branch]   # 手動觸發 OA-TWINS Auto-Repair (DRY-RUN 預設)
  $0 status            # 顯示整合狀態
環境:
  GH_REPO=DingJun1028/esggo
  OMNIJULES_EXECUTE=1  # 設此才真觸發 gh workflow run (預設 DRY-RUN)
參考: ${REF}
EOF
}

# 解析 Render webhook JSON：取 deploy status 與 commit
parse_render_event() {
  local json="${1:-}"
  # 用 python 安全解析 (避免 bash 正則炸 JSON)
  python3 - "$json" <<'PY'
import sys, json
raw = sys.argv[1]
try:
    d = json.loads(raw)
except Exception:
    print("status=UNKNOWN"); sys.exit(0)
# Render webhook 欄位: deploy.status / commit / environment
st = d.get("deploy", {}).get("status") or d.get("status") or "unknown"
commit = d.get("commit", {}).get("id") or d.get("commit") or "unknown"
env = d.get("deploy", {}).get("environment") or d.get("environment") or "unknown"
print(f"status={st}")
print(f"commit={commit}")
print(f"environment={env}")
PY
}

cmd_receive_webhook() {
  local json
  json="$(cat)"
  echo "【免費自託管 · Render 整合】接收 webhook 事件:"
  local ev
  ev="$(parse_render_event "$json")"
  echo "$ev"
  local status
  status="$(echo "$ev" | grep '^status=' | cut -d= -f2)"
  if [[ "$status" == "failed" || "$status" == "deactivated" ]]; then
    echo "→ 偵測到部署失敗，轉發 OA-TWINS Auto-Repair (萬能維護蜂28)"
    cmd_trigger_repair "main"
  else
    echo "→ 部署狀態非失敗 ($status)，無需修復。"
  fi
}

cmd_trigger_repair() {
  local branch="${1:-main}"
  if [[ "${OMNIJULES_EXECUTE:-0}" == "1" ]]; then
    echo "【免費自託管】觸發 OA-TWINS Auto-Repair (${AUTO_REPAIR_WF}) @ ${GH_REPO}:${branch}"
    gh workflow run "$AUTO_REPAIR_WF" --repo "$GH_REPO" 2>/dev/null \
      && echo "✅ 已派發修復任務" \
      || echo "（需 gh 登入；此為免費等價示範）"
  else
    echo "【免費自託管 · DRY-RUN】等效指令 (設 OMNIJULES_EXECUTE=1 才真觸發):"
    echo "  gh workflow run ${AUTO_REPAIR_WF} --repo ${GH_REPO}"
  fi
}

cmd_status() {
  echo "【免費自託管 · Render 整合狀態】(soul.md §17.7)"
  echo "  對應 OmniJules 能力: Render build-failure 自動偵測與修復"
  echo "  實作: OA-TWINS Auto-Repair (${AUTO_REPAIR_WF})"
  echo "  負責靈魂: 萬能維護蜂(28) + 萬能編碼蜂(07)"
  echo "  模式: DRY-RUN (OMNIJULES_EXECUTE=1 才真觸發 gh)"
  echo "  近期活動:"
  gh run list --repo "$GH_REPO" --workflow "$AUTO_REPAIR_WF" --limit 3 2>/dev/null \
    || echo "    (gh 未登入或無權限)"
}

case "${1:-help}" in
  receive-webhook) cmd_receive_webhook ;;
  trigger-repair)  shift; cmd_trigger_repair "$@" ;;
  status)          cmd_status ;;
  help|--help|-h)  usage ;;
  *) echo "未知指令: $1"; usage; exit 1 ;;
esac
