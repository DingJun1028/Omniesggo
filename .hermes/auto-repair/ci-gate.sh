#!/usr/bin/env bash
# source_origin: 使用者指令 2026-10-04 —
# 「github 會跳倉庫通知 如果出現錯誤代碼的提示, 就要自動修復到正確才能進行下一個 PR」
#
# CI 全綠閘 (CI ALL-GREEN GATE)
# ---------------------------------------------------------------------------
# 硬規則：GitHub 上任何紅燈（失敗的 check / check run）都不得開下一個 PR，
#         必須自動修復到全綠為止。
#
# 行為：
#   - 全綠 → exit 0，可開下一個 PR
#   - 有紅燈 → 印出每個失敗 check + 可操作建議，exit 1（呼叫端必須停下修復）
#
# 用法：
#   .hermes/auto-repair/ci-gate.sh                 # 檢查當前分支的 HEAD commit
#   .hermes/auto-repair/ci-gate.sh <sha>           # 檢查特定 commit
#   .hermes/auto-repair/ci-gate.sh --list <sha>    # 只列出所有 check 狀態
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export SCRIPT_DIR

REPO="${GREEN_GATE_REPO:-$(gh repo view --json nameWithOwner --jq .nameWithOwner 2>/dev/null)}"
if [ -z "$REPO" ]; then
  echo "CIGATE: cannot determine repo (gh not authed or not in a git repo)"
  exit 1
fi

MODE="gate"
if [ "${1:-}" = "--list" ]; then MODE="list"; SHA="${2:-HEAD}"; else SHA="${1:-HEAD}"; fi

fetch_checks() {
  # NOTE: --paginate re-runs the jq filter per page, and the check-runs endpoint
  # can report the same check on more than one page (SonarCloud appeared 3x).
  # Sort -u de-duplicates the identical "name|status|conclusion" triples so each
  # check is counted — and printed — exactly once.
  gh api "repos/$REPO/commits/$SHA/check-runs" \
    --paginate \
    --jq '.check_runs[] | "\(.name)|\(.status)|\(.conclusion // "")"' 2>/dev/null \
    | sort -u
}

# --- known-flaky allow-list -------------------------------------------------
# Entries live in ci-gate-known-flaky.txt as  <name>|<allowed conclusion>|<reason>
# Returns the reason string when (name, conclusion) matches an entry, else "".
# NOTE: SCRIPT_DIR is resolved by the caller (see below). Deriving the path from
# BASH_SOURCE inside a nested $(...) / eval context resolves to empty, which
# silently made the whole allow-list a no-op — so the path is passed in as $3.
flaky_reason() {
  local want="$1" concl="$2" file line n c
  file="${3:-${SCRIPT_DIR:-.}}/ci-gate-known-flaky.txt"
  [ -f "$file" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in \#*) continue ;; esac
    line="${line%%#*}"                       # strip trailing comments
    line="$(printf '%s' "$line" | tr -d '\r' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
    [ -z "$line" ] && continue
    [ "${line#*|}" = "$line" ] && continue    # needs at least one pipe
    n="${line%%|*}"; c="$(printf '%s' "$line" | cut -d'|' -f2)"
    if [ "$n" = "$want" ] && [ "$c" = "$concl" ]; then
      printf '%s' "$(printf '%s' "$line" | cut -d'|' -f3-)"
      return 0
    fi
  done < "$file"
  return 0
}

if [ "$MODE" = "list" ]; then
  echo "=== check-runs for $SHA ==="
  fetch_checks | while IFS='|' read -r name status concl; do
    printf '  %-42s %-12s %s\n' "$name" "$status" "$concl"
  done
  exit 0
fi

# 等待 in_progress 的 check 跑完，最多 WAIT_MAX 秒（避免無限等待）
WAIT_MAX="${GREEN_GATE_WAIT:-900}"
elapsed=0
declare -a PENDING=()
declare -a RED=()
declare -a GREEN=()
declare -a MANUAL=()
declare -a WARNED=()   # known-flaky 降級項：不算綠也不算紅，但必須被看見

while :; do
  PENDING=(); RED=(); GREEN=(); MANUAL=(); WARNED=()
  while IFS='|' read -r name status concl; do
    [ -z "$name" ] && continue
    case "$status" in
      in_progress|queued|pending|waiting)
        PENDING+=("$name") ;;
      completed)
        case "$concl" in
          success|neutral|skipped) GREEN+=("$name|$concl") ;;
          # `cancelled` (and `timed_out`/`action_required`/`stale`) are NOT
          # repairable by our workflows — SonarCloud runs as an external GitHub
          # App with no workflow file in this repo, so `auto-repair.yml` (which
          # only fires on conclusion == 'failure') can never see it. Classifying
          # these as plain RED would send auto-repair into a loop it can never
          # win; classify them so a human can re-run or dismiss them.
          cancelled|timed_out|action_required|stale)
            # A known-flaky entry may downgrade this to WARN, but ONLY if the
            # live conclusion still matches what the allow-list records — if
            # the service starts working, the entry expires and we block
            # again (so the exemption can never become a silent pass).
            wl_reason="$(flaky_reason "$name" "$concl" "$SCRIPT_DIR")"
            if [ -n "$wl_reason" ]; then
              WARNED+=("$name|$concl|$wl_reason")
              echo "CIGATE: WARN  $name ($concl) allowed by known-flaky: $wl_reason"
            else
              MANUAL+=("$name|$concl")
            fi ;;
          *) RED+=("$name|$concl") ;;
        esac ;;
      *) RED+=("$name|status=$status") ;;
    esac
  done < <(fetch_checks)

  [ ${#PENDING[@]} -eq 0 ] && break
  [ "$elapsed" -ge "$WAIT_MAX" ] && break
  printf 'CIGATE: %d check(s) still running, waiting... (%ds/%ds)\n' \
    "${#PENDING[@]}" "$elapsed" "$WAIT_MAX"
  sleep 15
  elapsed=$((elapsed + 15))
done

echo
echo "==================== CI ALL-GREEN GATE ===================="
for g in ${GREEN[@]+"${GREEN[@]}"}; do  IFS='|' read -r n c <<<"$g"; printf '  PASS  %-42s %s\n' "$n" "$c"; done
for r in ${RED[@]+"${RED[@]}"};   do  IFS='|' read -r n c <<<"$r"; printf '  FAIL  %-42s %s\n' "$n" "$c"; done
for m in ${MANUAL[@]+"${MANUAL[@]}"}; do IFS='|' read -r n c <<<"$m"; printf '  ASK   %-42s %s (外部服務，需人工 re-run)\n' "$n" "$c"; done
for w in ${WARNED[@]+"${WARNED[@]}"}; do IFS='|' read -r n c r <<<"$w"; printf '  WARN  %-42s %s (known-flaky 例外，非綠燈)\n' "$n" "$c"; [ -n "$r" ] && printf '        └─ 理由: %s\n' "$r"; done
for p in ${PENDING[@]+"${PENDING[@]}"}; do printf '  WAIT  %s\n' "$p"; done
echo "--------------------------------------------------------"

if [ ${#RED[@]} -gt 0 ]; then
  echo "CIGATE VERDICT: 非全綠 ❌  → 不得開下一個 PR，必須自動修復到全綠"
  echo ""
  echo "修復步驟："
  echo "  1. 取得失敗日誌："
  echo "     gh run list --commit $SHA --limit 5"
  echo "     gh run view <run-id> --log-failed"
  echo "  2. 本地重現： .hermes/auto-repair/green-gate.sh <專案路徑>"
  echo "  3. 修復後重跑本 gate： .hermes/auto-repair/ci-gate.sh $SHA"
  exit 1
fi

if [ ${#MANUAL[@]} -gt 0 ]; then
  echo "CIGATE VERDICT: 待人工確認 ⚠  → 有外部服務檢查未通過，不得直接開下一個 PR"
  echo ""
  echo "需要人工處理（自動修復無法觸及）："
  for m in ${MANUAL[@]+"${MANUAL[@]}"}; do IFS='|' read -r n c <<<"$m"; echo "  - $n ($c)"; done
  echo ""
  echo "選項："
  echo "  a) GitHub UI 對該 check 按 Re-run jobs"
  echo "  b) 若為外部服務持續失敗，記錄為 known-flaky 並在本文件中列明"
  exit 1
fi

if [ ${#PENDING[@]} -gt 0 ]; then
  echo "CIGATE VERDICT: 未完成 ⚠  ($SHA 仍有 check 未跑完，等待上限 ${WAIT_MAX}s)"
  exit 1
fi

# known-flaky 例外存在時，絕不宣稱「全綠」——遠端 check 確實不是綠的。
# 區分兩種誠實陳述：
#   有例外 → 「條件式放行 ⚠」（例外必須是使用者明示批准、且有實測證據者）
#   無例外 → 「真全綠 ✅」
if [ ${#WARNED[@]} -gt 0 ]; then
  echo "CIGATE VERDICT: 條件式放行 ⚠  → 遠端 checks 並非全綠（${#WARNED[@]} 項為已記錄例外）"
  echo ""
  echo "以下 check 在 GitHub 上確實不是綠燈，僅因列入 known-flaky 白名單而未被阻擋："
  for w in ${WARNED[@]+"${WARNED[@]}"}; do IFS='|' read -r n c r <<<"$w"; echo "  - $n ($c)"; done
  echo ""
  echo "白名單: .hermes/auto-repair/ci-gate-known-flaky.txt（狀態一變即自動失效）"
  echo "注意: 這不是全綠。若要真正解除，須修復該服務本身（見上列理由中的根因）。"
  exit 0
fi

echo "CIGATE VERDICT: 真全綠 ✅  → 可開下一個 PR"
exit 0