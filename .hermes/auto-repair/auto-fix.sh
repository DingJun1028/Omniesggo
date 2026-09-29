#!/bin/bash
# esggo Auto-Fix Entry Point
# Usage: ./auto-fix.sh "<error_message>"
#        ./auto-fix.sh --file <error_log_file>
#        ./auto-fix.sh --monitor  (watch mode)
#        ./auto-fix.sh --status   (check tracker state)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# MSYS 路徑正規化：只把 /c/... 轉成 C:/...，保留正斜線。
# 舊版額外做 ${VAR//\//\\} 把分隔線換成反斜線，結果把路徑元件裡的
# \a（auto-repair）、\u 等字母誤判為跳脫序列而吞掉，log 路徑變成
# 「C:\Projectggo\.hermesuto-repair」（2026-09-29 實測）。
# Windows 版 Python 與 MSYS bash 都能處理 C:/... 正斜線路徑，無需反斜線。
SCRIPT_DIR="C:/${SCRIPT_DIR#/c/}" 2>/dev/null || true
SCRIPT_DIR="${SCRIPT_DIR%/}"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# 同上：僅做 /c/ → C:/ 前綴轉換，保留正斜線（避免 \a、\u 被當跳脫序列吞掉）
REPO_ROOT="C:/${REPO_ROOT#/c/}" 2>/dev/null || true
REPO_ROOT="${REPO_ROOT%/}"
AUTO_REPAIR_DIR="$SCRIPT_DIR"
TRACKER="$AUTO_REPAIR_DIR/clone-tracker.py"
ENGINE="$AUTO_REPAIR_DIR/repair-engine.py"
TRACKER_LOG="$AUTO_REPAIR_DIR/tracker-log.jsonl"
REPAIR_LOG="$AUTO_REPAIR_DIR/repair-log.jsonl"
# engine 輸出的暫存證據檔，供 tracker 結案時讀取（不可用 /dev/null 以免污染）
TRACKER_EVIDENCE="$AUTO_REPAIR_DIR/.tracker-evidence.tmp"

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
    # 只取純 ID：create-task 會印 emoji banner + "TASK_ID=TASK-XXXXXXXX"，
    # 直接 $(...) 會把整段輸出當成 task_id，導致 tracker 回寫時找不到任務
    # （2026-09-29 實測：--task-id 收到含 emoji 的多行字串，任務永久卡 running）。
    task_id=$(python3 "$TRACKER" create-task --task "Auto-fix: $error_text" --steps "匹配模式,執行修復,驗證修復" 2>/dev/null \
                | grep -oE 'TASK-[0-9A-F]{8}' | head -1)
    if [ -z "$task_id" ]; then
        task_id="TASK-$(date +%s)"
        log_warn "tracker create-task 未回傳 ID，改用 fallback: $task_id"
    fi

    log_clone "任務 ID: $task_id"
    log_info "匹配錯誤模式..."

    # 捕捉 engine 輸出，之後作為 tracker 結案的證據。
    # 必須用 "|| true" 吞掉 engine 的非零結束碼：腳本開了 set -euo pipefail，
    # 而 engine 對 no_match/failed 都 sys.exit(1)，會讓賦值這一行直接終止整支腳本，
    # 後續的 tracker 回寫與狀態回報永遠執行不到（2026-09-29 實測：
    # 「匹配錯誤模式...」之後直接無輸出結束，任務卡在 running）。
    local engine_out exit_code
    engine_out=$(python3 "$ENGINE" "$error_text" --task-id "$task_id" 2>&1) || true
    exit_code=0
    grep -q '"status": "fixed"' <<< "$engine_out" && exit_code=0 || exit_code=1

    # 關鍵回寫：engine 只寫 repair-log.jsonl，從不更新 tracker-state.json。
    # 舊版缺此步，導致任務永遠卡在 active_tasks/running
    # （2026-09-29 實測：TASK-D6741720 停滯 active 4 天，實際修復早已 VERIFY_OK）。
    # 只有 engine 有真實輸出時才標成功 —— 空輸出視為未證實。
    if [ -n "$(printf '%s' "$engine_out" | tr -d '[:space:]')" ]; then
        printf '%s' "$engine_out" > "$TRACKER_EVIDENCE"
        python3 "$TRACKER" complete --task-id "$task_id" \
            --success "$([ $exit_code -eq 0 ] && echo true || echo false)" \
            --evidence-file "$TRACKER_EVIDENCE" 2>/dev/null \
            || log_warn "tracker 結案回寫失敗，狀態可能停滯"
    else
        python3 "$TRACKER" complete --task-id "$task_id" --success false \
            --evidence-file /dev/null 2>/dev/null
        log_warn "engine 無輸出，判定為未證實的修復"
    fi

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
        # Windows: 先授權 ACL 再 chmod，否則只有 Read 的檔案會 Permission denied
        # （2026-09-29 實測：~/.ssh/esggo_original icacls 為 dingj:(R)，chmod 600 exit 1）。
        if [ "${OS:-}" = "Windows_NT" ] || [ -n "$USERNAME" ]; then
            for k in ~/.ssh/esggo_vps_fix ~/.ssh/esggo_original; do
                [ -e "$k" ] && icacls "$(cygpath -w "$k" 2>/dev/null || echo "$k")" \
                    /grant "${USERNAME}:(F)" >/dev/null 2>&1 || true
            done
        fi
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
