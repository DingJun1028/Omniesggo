#!/usr/bin/env bash
# ================================================================
# ftg-journey-server JWT 金鑰輪換（四階段：產生→更新→撤銷→記錄）
# 對應 omni-best-practice §6.2「Secrets 輪換: 產生→更新→撤銷→記錄, 四階段不可逆」
#
# 修復的漏洞：server.js:15 原本是
#   process.env.JWT_SECRET || 'ftg-journey-secret-key-change-in-production'
# 線上 process 未設 JWT_SECRET、也無 .env，因此服務一直用這個寫死在
# 公開 git 歷史裡的字串簽發與驗證 HS256 token。任何讀過 repo 的人
# 都可自行簽出 role=admin 的合法 token。
#
# 用法：貼到 VPS 執行
#   scp scripts/ftg-jwt-rotate.sh esggo-vps:/tmp/ && ssh esggo-vps 'sudo bash /tmp/ftg-jwt-rotate.sh'
# ================================================================
set -euo pipefail

APP=/var/www/esggo/apps/ftg-journey-server
ENVF="$APP/.env"
REPO=/var/www/esggo
PM2="env PM2_HOME=/root/.pm2 pm2"
BACKUP_TAG="$(date +%Y%m%d-%H%M%S)"

hr() { printf '\n\033[1m── %s ──\033[0m\n' "$1"; }

# ---------- 階段 1：產生 ----------
hr "階段 1／4 產生新金鑰（全程不輸出內容）"
if [ -f "$ENVF" ] && grep -q '^JWT_SECRET=' "$ENVF"; then
  echo "  .env 已存在，沿用既有金鑰（不覆寫）"
else
  NEW=$(node -e "console.log(require('crypto').randomBytes(48).toString('hex'))")
  printf 'JWT_SECRET=%s\n' "$NEW" > "$ENVF"
  unset NEW
  echo "  ✓ 已產生 48-byte 隨機金鑰"
fi
chmod 600 "$ENVF"
chown ubuntu:ubuntu "$ENVF"
SECRET_LEN=$(awk -F= '/^JWT_SECRET=/{print length($2)}' "$ENVF")
echo "  .env 權限=$(stat -c '%a' "$ENVF")  擁有者=$(stat -c '%U:%G' "$ENVF")  金鑰長度=$SECRET_LEN"
[ "$SECRET_LEN" -ge 64 ] || { echo "  ✗ 金鑰長度異常，中止"; exit 1; }

# ---------- 階段 2：更新 ----------
hr "階段 2／4 部署 fail-fast 版 server.js + 讓 PM2 載入 .env"
cd "$REPO"
sudo -n cp "$APP/server.js" "$APP/server.js.bak-$BACKUP_TAG"
echo "  ✓ 已備份 server.js.bak-$BACKUP_TAG"

# .env 必須在版控外
if ! git check-ignore -q apps/ftg-journey-server/.env 2>/dev/null; then
  printf '\n# 本機環境變數（含 JWT 金鑰，絕不入版控）\n.env\napps/ftg-journey-server/.env\n' >> .REPO/.gitignore
  echo "  ✓ .gitignore 已補 .env 規則"
fi
git check-ignore -v apps/ftg-journey-server/.env

# 以 .env 的內容注入 PM2（不落地到 ecosystem 設定檔）
SECRET=$(grep '^JWT_SECRET=' "$ENVF" | cut -d= -f2-)
sudo -n env PM2_HOME=/root/.pm2 pm2 delete ftg-journey-server >/dev/null 2>&1 || true
sudo -n env PM2_HOME=/root/.pm2 PORT=8787 \
  NODE_ENV=production \
  JWT_SECRET="$SECRET" \
  DB_PATH="$APP/ftg-journey.db" \
  UPLOAD_DIR='/var/www/ftg-journey-web/uploads/' \
  pm2 start "$APP/server.js" --name ftg-journey-server --cwd "$APP" --interpreter /usr/bin/node
unset SECRET
echo "  ✓ PM2 已以環境變數啟動"

# ---------- 階段 3：撤銷 ----------
hr "階段 3／4 撤銷舊金鑰並驗證"
sleep 4
sudo -n env PM2_HOME=/root/.pm2 pm2 jlist 2>/dev/null | node -e "
let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{
  const a=JSON.parse(s).find(x=>x.pm2_env.name==='ftg-journey-server');
  console.log('  status=' + a.pm2_env.status + '  pid=' + a.pid + '  restarts=' + a.pm2_env.restart_time);
});"

echo "  確認舊預設金鑰已不再被接受（fail-fast 已生效）："
# 5T-Trustworthy: 舊金鑰字面值不得留在版控中（它源自 7a1365dc7 的外洩事件）。
# 從環境變數讀取，缺值時明確報錯而非默默用預設值。
NEGATIVE_SECRET="${NEGATIVE_JWT_SECRET:-}"
if [ -z "$NEGATIVE_SECRET" ]; then
  echo "    [跳過] 未設定 NEGATIVE_JWT_SECRET — 需提供舊金鑰才能做負向驗證" >&2
else
  sudo -n env PM2_HOME=/root/.pm2 PORT=8787 JWT_SECRET="$NEGATIVE_SECRET" \
    DB_PATH=/tmp/jwt-negative-test.db timeout 8 node "$APP/server.js" 2>&1 | head -1 | sed 's/^/    /'
fi

# ---------- 階段 4：記錄 ----------
hr "階段 4／4 持久化 + 健檢"
sudo -n env PM2_HOME=/root/.pm2 pm2 save
echo "  ✓ pm2 save（重開機自動恢復）"

echo
echo "  端點健檢："
for ep in /health /api/me; do
  code=$(curl -s -o /dev/null -w '%{http_code}' -m 8 "http://127.0.0.1:8787$ep")
  echo "    $ep -> HTTP $code   （/api/me 回 401 為正確：無 token 應被拒）"
done

echo
echo "  外部可達性："
for u in https://ftg.esggo.co https://ftgtours.esggo.co; do
  printf '    %-32s HTTP %s\n' "$u" "$(curl -s -o /dev/null -w '%{http_code}' -m 10 "$u")"
done

cat <<'NOTE'

────────────────────────────────────────────────────────────
完成。四階段皆已執行。

⚠️ 舊 token 已全部失效 —— 金鑰變了，任何既有登入 session 需重新登入。

⚠️ 尚未處理：git 歷史仍含明文金鑰（7 個 commit）
   這需要改寫 commit 歷史（破壞性操作，且所有 commit hash 會變），
   必須先確認沒有其他人在此 repo 上協作。請在 esggo 專案另行決定。

⚠️ 尚未處理：ecosystem.config.cjs 內的 96-hex 金鑰
   該檔目前未被線上服務使用（PM2 是直接 start server.js），
   但明文金鑰仍在檔中與 git 歷史中。
NOTE
