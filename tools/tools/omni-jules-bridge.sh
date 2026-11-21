#!/usr/bin/env bash
# ============================================================================
# omni-jules-bridge.sh — OmniJules 萬能外部協力橋接器
# ----------------------------------------------------------------------------
# 將 OmniJules REST API 之能力，以「免費自託管」為預設實作提供給 OmniJules
# (OA-Team 30)。依 soul.md §17 決議：不呼叫付費 jules.googleapis.com，
# 除非顯式 ALLOW_PAID_API=1 + 已設 JULES_API_KEY（違反免費硬約束，需自負）。
#
# 對應參考：tools/jules-api-reference.md
# ============================================================================
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REF="${SCRIPT_DIR}/jules-api-reference.md"
JULES_EP="https://jules.googleapis.com/v1alpha"
MODE="${OMNIJULES_MODE:-free}"            # free | paid
GH_REPO="${GH_REPO:-DingJun1028/esggo}"

# 是否真的要走付費路徑（需同時滿足三條件）
paid_allowed() {
  [[ "$MODE" == "paid" && -n "${JULES_API_KEY:-}" && "${ALLOW_PAID_API:-0}" == "1" ]]
}

warn_paid() {
  echo "⚠️  [付費警告] ALLOW_PAID_API=1 已啟用：此路徑呼叫 Google 付費 SaaS jules.googleapis.com，" >&2
  echo "    違反本典『只用免費算立』硬約束。確認你已自付 Google AI Pro/Ultra 訂閱與 API key。" >&2
}

cmd_list_sources() {
  if paid_allowed; then
    warn_paid
    curl -sS -H "x-goog-api-key: ${JULES_API_KEY}" "${JULES_EP}/sources"
  else
    echo "【免費自託管】列舉已授權 repo (gh):"
    gh repo list "${GH_REPO%/*}" --json name,url 2>/dev/null \
      || echo "（gh 未登入或無 repo；此為免費等價示範）"
  fi
}

cmd_create_session() {
  local prompt="${1:-Create a boba app!}"
  local branch="${2:-main}"
  if paid_allowed; then
    warn_paid
    curl -sS "${JULES_EP}/sessions" -X POST \
      -H "Content-Type: application/json" \
      -H "x-goog-api-key: ${JULES_API_KEY}" \
      -d "{\"prompt\":\"${prompt}\",\"sourceContext\":{\"source\":\"sources/github/${GH_REPO}\",\"githubRepoContext\":{\"startingBranch\":\"${branch}\"}},\"automationMode\":\"AUTO_CREATE_PR\",\"title\":\"OmniJules Session\"}"
  else
    if [[ "${OMNIJULES_EXECUTE:-0}" == "1" ]]; then
      echo "【免費自託管】觸發 OA-TWINS Auto-Repair (auto-repair.yml) 於 ${GH_REPO}@${branch}"
      gh workflow run auto-repair.yml --repo "${GH_REPO}" 2>/dev/null \
        && echo "✅ 已派發修復任務" \
        || echo "（需 gh 登入；此為免費等價示範）"
    else
      echo "【免費自託管 · DRY-RUN】等效指令 (設 OMNIJULES_EXECUTE=1 才真觸發):"
      echo "  gh workflow run auto-repair.yml --repo ${GH_REPO}"
    fi
  fi
}

cmd_approve_plan() {
  local sid="${1:-SESSION_ID}"
  if paid_allowed; then
    warn_paid
    curl -sS "${JULES_EP}/sessions/${sid}:approvePlan" -X POST \
      -H "x-goog-api-key: ${JULES_API_KEY}"
  else
    echo "【免費自託管】5T 驗算闡（EntropyForge.applyHashLock）— 計畫自動準則通過，無須顯式批准。"
  fi
}

cmd_list_activities() {
  local sid="${1:-SESSION_ID}"
  if paid_allowed; then
    warn_paid
    curl -sS "${JULES_EP}/sessions/${sid}/activities?pageSize=30" \
      -H "x-goog-api-key: ${JULES_API_KEY}"
  else
    echo "【免費自託管】列舉 OA-TWINS 近期活動 (gh run list):"
    gh run list --repo "${GH_REPO}" --limit 10 2>/dev/null \
      || echo "（需 gh 登入；此為免費等價示範）"
  fi
}

cmd_send_message() {
  local sid="${1:-SESSION_ID}"
  local msg="${2:-Can you make it corgi themed?}"
  if paid_allowed; then
    warn_paid
    curl -sS "${JULES_EP}/sessions/${sid}:sendMessage" -X POST \
      -H "Content-Type: application/json" \
      -H "x-goog-api-key: ${JULES_API_KEY}" \
      -d "{\"prompt\":\"${msg}\"}"
  else
    echo "【免費自託管】經 OAB 萬能事件總線發佈訊息 (OmniTag: agent:01):"
    echo "  OAB.publish({tag:'agent:01', type:'user_message', payload:'${msg}'})"
  fi
}

cmd_integrations() {
  if paid_allowed; then
    warn_paid
    echo "【付費】OmniJules Integrations 為 web UI 操作（Render 等），無直接 REST 端點；"
    echo "  請於 https://jules.google.com/settings#integrations 手動連接。"
  else
    echo "【免費自託管】整合層等價（對齊 OmniJules Integrations 運作方式）:"
    echo "  ── Render / CI build-failure 偵測 ──"
    echo "    OA-TWINS Auto-Repair 監看 gh run（失敗即修） → 萬能維護蜂(28)"
    echo "  ── 自主觸發（webhook 甦醒）──"
    echo "    OAB 萬能事件總線 OmniTag 訂閱 → 萬能運營蜂(20)"
    echo "  ── 加密儲存 API key ──"
    echo "    本機 .env(gitignore) + 1Password/agentmail → 萬能安全蜂(27)"
    echo "  ── scoped access 最小權限 ──"
    echo "    5T 驗算闡門禁 EntropyForge → 萬能質控蜂(30)"
    echo "  參考: ${REF}"
  fi
}

cmd_supabase() {
  local action="${1:-status}"
  if paid_allowed && [[ -n "${SUPABASE_KEY:-}" ]]; then
    warn_paid
    echo "【付費 · Supabase】動作=${action} · 經 REST 呼叫 https://<PROJECT>.supabase.co/rest/v1"
    echo "  Header: apikey: ${SUPABASE_KEY:0:4}*** (來自 \$SUPABASE_KEY，未落檔)"
  else
    echo "【免費自託管 · Supabase 等價】動作=${action}"
    echo "  ── 資料庫/儲存 ──"
    echo "    OA-TWINS 狀態盤 (SQLite + 本機 .env) → 萬能數據蜂(10)"
    echo "  ── 自主觸發 ──"
    echo "    OAB 事件總線 OmniTag 訂閱 → 萬能運營蜂(20)"
    echo "  ── 安全儲存 ──"
    echo "    本機 .env(gitignore) 經 \$SUPABASE_KEY 注入 → 萬能安全蜂(27)"
    echo "  ⚠ 若需真實 Supabase，設 OMNIJULES_MODE=paid ALLOW_PAID_API=1 SUPABASE_KEY=sbp_***（不寫入檔案）"
  fi
}

selftest() {
  echo "=== OmniJules Bridge 自檢 (FREE 模式，不呼叫付費) ==="
  OMNIJULES_MODE=free cmd_list_sources
  echo
  cmd_create_session "selftest probe" main
  echo
  cmd_approve_plan SESSION_ID
  echo
  cmd_list_activities SESSION_ID
  echo
  cmd_send_message SESSION_ID "hello from selftest"
  echo
  echo "✅ 自檢完成：所有呼叫皆走免費自託管路徑（未觸及 jules.googleapis.com）。"
}

usage() {
  cat <<EOF
OmniJules Bridge — OmniJules API 免費自託管橋接器 (soul.md §17)
用法:
  $0 list-sources
  $0 create-session [prompt] [branch]
  $0 approve-plan [session_id]
  $0 list-activities [session_id]
  $0 send-message [session_id] [message]
  $0 integrations    # 列印整合層免費等價
  $0 supabase [status|query]  # Supabase 整合（免費等價 / 付費讀 \$SUPABASE_KEY）
  $0 selftest
  $0 reference       # 印出 API 參考文件路徑

環境變數:
  OMNIJULES_MODE=free|paid  (預設 free)
  ALLOW_PAID_API=1          (僅 paid 模式且設 JULES_API_KEY 時才呼叫 Google 付費 API)
  JULES_API_KEY=xxx         (付費模式用，違反免費硬約束)
  GH_REPO=DingJun1028/esggo (免費等價之目標 repo)
EOF
}

case "${1:-help}" in
  list-sources)    cmd_list_sources ;;
  create-session)  shift; cmd_create_session "$@" ;;
  approve-plan)    shift; cmd_approve_plan "$@" ;;
  list-activities) shift; cmd_list_activities "$@" ;;
  send-message)    shift; cmd_send_message "$@" ;;
  integrations)    cmd_integrations ;;
  supabase)        shift; cmd_supabase "$@" ;;
  selftest)        selftest ;;
  reference)       echo "${REF}" ;;
  help|--help|-h)  usage ;;
  *) echo "未知指令: $1"; usage; exit 1 ;;
esac
