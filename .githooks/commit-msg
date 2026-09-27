#!/usr/bin/env bash
# 5T Traceable：強制每個 commit 帶 source_origin 標籤
# 對應 soul.md §8.2「所有代碼提交需附加 source_origin 標籤 | Git pre-commit hook 強制檢查」
# 與 pre_commit_gate.py check_traceable()。
#
# 安裝：bash scripts/git-hooks/install.sh   （必須安裝到 git rev-parse --git-path hooks，
#                                          本 repo 有 core.hooksPath=.githooks）
# 解除：rm "$(git rev-parse --git-path hooks)/commit-msg"
set -euo pipefail

MSG_FILE="$1"
MSG=$(cat "$MSG_FILE")

# 允許的標記形式：
#   source_origin=...        （明確標籤）
#   5T:  / 5T-Traceable: …    （5T 必須是獨立 token）
#
# 邊界處理（2026-09-27 實測修正）：原本的 /5T/ 不分詞邊界，
# 會讓 "chore: 5things" 這類無關訊息誤放行。
# 合法形式為 5T 後接 '-'(如 5T-Traceable)、':'(如 5T: )、空白或行尾；
# 後接英數字者視為無關字串（如 5things、5TH）。
if printf '%s' "$MSG" | grep -qiE 'source_origin|(^|[^A-Za-z0-9])5T([-:]|[[:space:]]|$)'; then
  exit 0
fi

cat >&2 <<'HOOK'

⛔ commit 被擋下：缺少 5T Traceable 標籤

依 soul.md §8.2，每個 commit 必須可溯源。請在訊息中加入其中一種：

  5T: source_origin=<來源>
  或 5T: source_origin=<來源>  (可再加其他 5T 標記)

例：
  fix(ftg-journey-server): JWT 金鑰改為 fail-fast

  5T: source_origin=omni-best-practice 覺醒通典
  5T-Traceable: commit 68724e831
  5T-Trustworthy: 消除硬編碼金鑰

HOOK
exit 1
