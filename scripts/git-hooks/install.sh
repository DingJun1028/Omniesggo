#!/usr/bin/env bash
# 安裝 5T Traceable commit-msg hook
#
# ⚠️ 關鍵：不可寫死 .git/hooks。本 repo 的 .git/config 設有
#    core.hooksPath = .githooks，git 只會查該目錄，完全不看 .git/hooks。
#    （2026-09-27 實測：先前版本寫進 .git/hooks/commit-msg，
#      自我測試因「直接呼叫該腳本」而通過，但 git 從未執行它 —— 形同虛設。）
#
# 正確做法：以 `git rev-parse --git-path hooks` 取得實際生效目錄。
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

HOOKS_DIR=$(git rev-parse --git-path hooks)
mkdir -p "$HOOKS_DIR"
cp scripts/git-hooks/commit-msg-5t.sh "$HOOKS_DIR/commit-msg"
chmod +x "$HOOKS_DIR/commit-msg"

echo "✓ 已安裝到 $HOOKS_DIR/commit-msg"
if git config --get core.hooksPath >/dev/null 2>&1; then
  echo "  （本 repo core.hooksPath=$(git config --get core.hooksPath)，git 只查此路徑）"
fi

# ---- 測試 ----
# 分兩層：腳本邏輯層 + 整合層（git 是否真的會執行它）。
probe() {
  local desc="$1" msg="$2" expect="$3"
  local msgfile; msgfile=$(mktemp)
  printf '%s' "$msg" > "$msgfile"
  if bash "$HOOKS_DIR/commit-msg" "$msgfile" >/dev/null 2>&1; then got=PASS; else got=BLOCK; fi
  rm -f "$msgfile"
  if [ "$got" = "$expect" ]; then
    echo "  ✓ $desc → $got"
  else
    echo "  ✗ $desc → $got（預期 $expect）"
    return 1
  fi
}

echo ""
echo "腳本邏輯層："
probe "無標籤"          "chore: bump deps"                  BLOCK || exit 1
probe "有 source_origin" $'fix: x\n\n5T: source_origin=test'   PASS  || exit 1
probe "有 5T 標記"       $'fix: x\n\n5T-Traceable: ok'        PASS  || exit 1
probe "誤觸：5things"     "chore: 5things"                     BLOCK || exit 1
probe "誤觸：5"           "fix: 5"                             BLOCK || exit 1
probe "誤觸：no trace"    "chore: no trace"                    BLOCK || exit 1

echo ""
echo "整合層（git 是否真的會執行它）："
if [ -x "$HOOKS_DIR/commit-msg" ]; then
  echo "  ✓ git 實際使用的 hooks 目錄下已有可執行檔：$HOOKS_DIR/commit-msg"
else
  echo "  ✗ $HOOKS_DIR/commit-msg 不存在或不可執行"
  exit 1
fi
