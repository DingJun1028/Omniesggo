#!/usr/bin/env bash
# 安裝 5T Traceable commit-msg hook
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

HOOK_DIR=$(mktemp -d)
cp scripts/git-hooks/commit-msg-5t.sh "$HOOK_DIR/commit-msg"
chmod +x "$HOOK_DIR/commit-msg"
cp "$HOOK_DIR/commit-msg" .git/hooks/commit-msg
chmod +x .git/hooks/commit-msg
rm -rf "$HOOK_DIR"

echo "✓ 已安裝 .git/hooks/commit-msg"

# 負向測試：無標籤應被擋
printf 'test: no tag\n' > /tmp/_m1
if bash .git/hooks/commit-msg /tmp/_m1 >/dev/null 2>&1; then
  echo "✗ 負向測試失敗：無標籤的訊息竟被放行"
  exit 1
fi
echo "✓ 負向測試通過：無 source_origin/5T 標籤 → 已擋下"

# 正向測試：帶標籤應放行
printf 'test: with tag\n\n5T: source_origin=self-test\n' > /tmp/_m2
bash .git/hooks/commit-msg /tmp/_m2 >/dev/null 2>&1 \
  && echo "✓ 正向測試通過：帶 5T 標籤 → 放行" \
  || { echo "✗ 正向測試失敗：帶標籤卻被擋"; exit 1; }
rm -f /tmp/_m1 /tmp/_m2
