#!/bin/bash
# esggo Auto-Fix Entry Point
# Usage: ./auto-fix.sh "<error_message>"
#        ./auto-fix.sh --file <error_log_file>
#        ./auto-fix.sh --monitor  (watch mode)
#        ./auto-fix.sh --status   (check tracker state)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# Fix for Windows: convert /c/ paths to C:/ paths for Python compatibility
if [[ "$SCRIPT_DIR" == /c/* ]]; then
    SCRIPT_DIR="C:/${SCRIPT_DIR#/c/}"
    SCRIPT_DIR="${SCRIPT_DIR//\//\\}"
fi
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# Apply same fix to REPO_ROOT if needed
if [[ "$REPO_ROOT" == /c/* ]]; then
    REPO_ROOT="C:/${REPO_ROOT#/c/}"
    REPO_ROOT="${REPO_ROOT//\//\\}"
fi
AUTO_REPAIR_DIR="$SCRIPT_DIR"
TRACKER="$AUTO_REPAIR_DIR/clone-tracker.py"
ENGINE="$AUTO_REPAIR_DIR/repair-engine.py"
TRACKER_LOG="$AUTO_REPAIR_DIR/tracker-log.jsonl"
REPAIR_LOG="$AUTO_REPAIR_DIR/repair-log.jsonl"

export REPO_ROOT
export AUTO_REPAIR_DIR

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info()  { echo -e "${BLUE}[INFO]${NC}  $*"; }
log_ok()    { echo -e "${GREEN}[OK]${NC}    $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }
log_clone() { echo -e "${CYAN}[CLONE]${NC} $*"; }

# ── Banner ──
print_banner() {
    echo ""
    echo "╔══════════════════════════════════════════════════════╗"
    echo "║  🔧 esggo Auto-Fix Engine v1.0                       ║"
    echo "║  自動修復 + 萬能分身追蹤機制                          ║"
    echo "╚══════════════════════════════════════════════════════╝"
    echo ""
}

# ── Check dependencies ──
check_deps() {
    local missing=0
    command -v python3 >/dev/null 2>&1 || { log_error "python3 not found"; missing=1; }
    command -v gh >/dev/null 2>&1 || { log_warn "gh CLI not found (Dependabot PRs disabled)"; }
    command -v pnpm >/dev/null 2>&1 || { log_warn "pnpm not found"; }
    command -v ssh >/dev/null 2>&1 || { log_warn "ssh not found (VPS ops disabled)"; }
    [ "$missing" -eq 0 ]
}

# ── Mode: Fix from error string ──
mode_fix() {
    local error_text="$1"
    print_banner
    log_info "收到錯誤訊息，啟動自動修復..."
    log_clone "創建追蹤任務..."

    local task_id
    task_id=$(python3 "$TRACKER" create-task --task "Auto-fix: $error_text" --steps "匹配模式,執行修復,驗證修復" 2>/dev/null || echo "TASK-$(date +%s)")

    log_clone "任務 ID: $task_id"
    log_info "匹配錯誤模式..."

    python3 "$ENGINE" "$error_text" --task-id "$task_id"
    local exit_code=$?

    if [ $exit_code -eq 0 ]; then
        log_ok "修復成功！任務 $task_id 已完成。"
    else
        log_error "修復失敗或需要手動介入。任務 $task_id。"
        log_warn "查看詳細日誌: cat $REPAIR_LOG"
        log_warn "查看追蹤狀態: ./auto-fix.sh --status"
    fi

    return $exit_code
}

# ── Mode: Fix from file ──
mode_fix_file() {
    local file_path="$1"
    if [ ! -f "$file_path" ]; then
        log_error "File not found: $file_path"
        exit 1
    fi
    local error_text
    error_text=$(cat "$file_path")
    mode_fix "$error_text"
}

# ── Mode: Monitor (watch for errors in real-time) ──
mode_monitor() {
    print_banner
    log_info "進入監控模式... (按 Ctrl+C 停止)"
    log_info "監控目標: terminal 輸出、pnpm audit、gh api alerts"

    # Check VPS SSH health
    log_clone "檢查 VPS SSH 連線..."
    if ssh -o ConnectTimeout=5 -o BatchMode=yes esggo-vps "echo OK" 2>/dev/null; then
        log_ok "VPS SSH 連線正常"
    else
        log_warn "VPS SSH 連線異常，將自動嘗試修復"
        python3 "$TRACKER" track --task "修復 VPS SSH 連線" --steps "檢查權限,修復私鑰,重新連線"
        chmod 600 ~/.ssh/esggo_vps_fix ~/.ssh/esggo_original 2>/dev/null || true
    fi

    # Check Dependabot alerts
    log_clone "檢查 Dependabot 告警..."
    local alert_count
    alert_count=$(gh api repos/DingJun1028/esggo/dependabot/alerts?state=open\&per_page=100 2>/dev/null | python3 -c "import json,sys; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
    if [ "$alert_count" -gt 0 ]; then
        log_warn "仍有 $alert_count 個 Dependabot 告警"
        python3 "$TRACKER" track --task "處理 Dependabot 告警" --steps "分析告警,添加override,建立PR"
    else
        log_ok "無 Dependabot 告警"
    fi

    # Check pnpm audit
    log_clone "執行 pnpm audit..."
    if pnpm audit --prod 2>&1 | grep -q "0 vulnerabilities"; then
        log_ok "pnpm audit 通過：0 個生產環境漏洞"
    else
        log_warn "pnpm audit 發現漏洞，將自動修復"
        python3 "$TRACKER" track --task "修復 pnpm audit 漏洞" --steps "分析漏洞,添加override,驗證"
        pnpm audit --prod 2>&1 | python3 "$ENGINE" - --task-id "AUTO-PNA-$(date +%s)"
    fi

    log_info "監控循環完成。再次運行以重新檢查。"
}

# ── Mode: Status ──
mode_status() {
    print_banner
    log_info "追蹤器狀態："
    echo ""
    python3 "$TRACKER" status 2>/dev/null || echo "  (無活動任務)"
    echo ""
    if [ -f "$TRACKER_LOG" ]; then
        log_info "最近追蹤事件："
        tail -10 "$TRACKER_LOG" 2>/dev/null | while IFS= read -r line; do
            echo "  $line"
        done
    fi
    if [ -f "$REPAIR_LOG" ]; then
        log_info "最近修復日誌："
        tail -10 "$REPAIR_LOG" 2>/dev/null | while IFS= read -r line; do
            echo "  $line"
        done
    fi
}

# ── Mode: Help ──
mode_help() {
    print_banner
    echo "用法："
    echo "  ./auto-fix.sh \"<error_message>\"     根據錯誤訊息自動修復"
    echo "  ./auto-fix.sh --file <log_file>      從檔案讀取錯誤並修復"
    echo "  ./auto-fix.sh --monitor              監控模式：自動檢查並修復"
    echo "  ./auto-fix.sh --status               查看追蹤器狀態"
    echo "  ./auto-fix.sh --help                 顯示此幫助"
    echo ""
    echo "支援的自動修復範圍："
    echo "  🔒 Dependabot 漏洞 → 自動 override + PR"
    echo "  🔑 SSH 權限問題 → 自動 chmod + 重連"
    echo "  📦 pnpm audit 漏洞 → 自動添加 override"
    echo "  🏗️  建構失敗 → 自動 regenerate / reinstall"
    echo "  📝 .env.example 衝突 → 自動去重"
    echo "  🐍 Python 截斷 → 自動寫檔後執行"
    echo "  🖥️  VPS PM2 → 自動 SSH + reload"
    echo ""
    echo "萬能分身追蹤："
    echo "  每個任務分配唯一 ID，實時追蹤進度"
    echo "  失敗時自動升級並通知用戶"
    echo "  日誌保留於 .hermes/auto-repair/"
}

# ── Main ──
main() {
    check_deps || true

    case "${1:-}" in
        --file)
            [ -z "${2:-}" ] && { log_error "--file 需要參數"; exit 1; }
            mode_fix_file "$2"
            ;;
        --monitor)
            mode_monitor
            ;;
        --status)
            mode_status
            ;;
        --help|--h|-h)
            mode_help
            ;;
        "")
            print_banner
            mode_help
            ;;
        *)
            # Treat as error message
            mode_fix "$1"
            ;;
    esac
}

main "$@"
