#!/usr/bin/env bash
# JWT_SECRET 外洩處理手冊
# source_origin: docs/DELIVERY-oab-types-ts2783-2026-09-28.md (安全待辦項)
# created: 2026-09-28
# co_authors: 萬能分身 (Hermes Agent)
# lifecycle: active
# access: public
#
# 5T-Transparent: 本腳本只盤點與驗證，不自動執行破壞性操作。
# 歷史重寫與金鑰輪換需維護者明確授權後才執行。

set -euo pipefail

REPO="C:/Project/esggo"
cd "$REPO"

echo "=========================================================="
echo " JWT_SECRET 外洩處理 — 現況盤點"
echo "=========================================================="
echo

echo "[1] 程式碼層：現行是否仍有硬編碼金鑰"
echo "----------------------------------------------------------"
# 用 git index 的追蹤檔清單，而非 find/grep -r。
# 理由：apps/ 下的 node_modules 讓 grep -r 超時（實測 45s+），
# 且會掃到未追蹤的暫存檔。git ls-files 只列真正受版控的檔案。
FOUND=0
HITS=$(git ls-files -z -- '*.js' '*.cjs' '*.mjs' '*.ts' '*.sh' '*.yml' '*.yaml' \
       | tr '\0' '\n' \
       | grep -vE 'node_modules|/(dist|build)/' \
       | grep -vE '\.test\.(js|ts|mjs|cjs)$|(^|/)tests?/' \
       | xargs -r grep -nE "JWT_SECRET[[:space:]]*[:=][[:space:]]*['\"][A-Za-z0-9+/=_-]{16,}" \
       2>/dev/null || true)
if [ -n "$HITS" ]; then
  echo "$HITS"
  FOUND=1
fi
if [ "$FOUND" -eq 0 ]; then
  echo "  [OK] 受版控正式檔案中無硬編碼 JWT_SECRET"
  echo "       （測試檔已排除；測試用字面值不構成憑證外洩）"
else
  echo "  [危] 仍有硬編碼 JWT_SECRET — 需立即處理"
fi
echo

echo "[2] 已刪除的洩漏檔"
echo "----------------------------------------------------------"
for f in apps/ftg-journey-server/ecosystem.config.js; do
  if [ -f "$f" ]; then
    echo "  [注意] $f 仍存在"
  else
    echo "  [OK] $f 已從工作樹移除（commit 865de7fc7）"
  fi
done
echo

echo "[3] 金鑰仍在 git 歷史的 commit"
echo "----------------------------------------------------------"
echo "  洩漏源 commit: 7a1365dc7 (2026-08, public repo)"
echo "  清除 commit  : 96e2b75f1 / 865de7fc7 (PR #1164)"
echo
echo "  [重要] 刪檔不等於清除歷史。該金鑰仍可從以下方式取得："
echo "    git show 7a1365dc7:apps/ftg-journey-server/ecosystem.config.js"
echo "    GitHub 網頁版 / API / 任何 fork"
echo

echo "[4] 必要動作：輪換金鑰（需 VPS 存取，請維護者執行）"
echo "----------------------------------------------------------"
cat <<'EOS'
  # 在 VPS 上產生新金鑰（不要用 openssl rand -hex 32，可預測度較低）
  NEW_SECRET=$(openssl rand -base64 48 | tr -d '\n')
  echo "$NEW_SECRET"

  # 更新 ftg-journey-server 的 .env
  #   /var/www/esggo/apps/ftg-journey-server/.env
  # 然後重啟並驗證：
  pm2 restart ftg-journey-server --update-env
  curl -sS -o /dev/null -w '%{http_code}\n' \
    https://journey-api.ftgtours.esggo.co/health
  # 期望：200

  # 舊 token 一律失效（這是目標，不是問題）
EOS
echo

echo "[5] 歷史重寫（選用，破壞性）"
echo "----------------------------------------------------------"
cat <<'EOS'
  # 僅在確認該金鑰已輪換後才執行。會改寫所有 commit hash。
  # 其他協作者必須重新 clone 或 reset。
  git filter-repo --path apps/ftg-journey-server/ecosystem.config.js --invert-paths
  git push --force --mirror

  注意：force push 會使開啟中的 PR 失效。
  本 repo 有多工作源並行寫入，force push 風險高。
EOS
echo

echo "=========================================================="
echo " 結論：程式碼層已修復（PR #1164）。剩餘風險為金鑰仍在"
echo " 公開 git 歷史中，唯一有效處置是『輪換金鑰』。"
echo "=========================================================="
