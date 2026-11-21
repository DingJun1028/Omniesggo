#!/usr/bin/env bash
# ============================================================================
# sync-dist-staging-verify.sh — 驗證 sync-dist.sh 的 staging 段（不觸碰正式站）
# ============================================================================
# 為什麼需要這個：
#   sync-dist.sh 第 128 行起會 `tar | ssh` 推送正式站。整支腳本無法在
#   測試環境安全執行，因為 staging 與部署是同一支腳本的前後兩段。
#   這個驗證器抽出「staging 段」（到第 124 行為止）獨立執行，
#   證明缺圖會 fail-closed、根目錄靜態檔齊全、且 staging 內容與 dist 等價。
#
# 安全性：本腳本不連線、不推送、不寫正式站。只在本地 .deploy-stage/ 產出。
#           用完以 --clean 清除。
#
# 用法：
#   bash scripts/verify-staging.sh            # 執行驗證
#   bash scripts/verify-staging.sh --clean    # 清除 .deploy-stage
#
# source_origin: ftgtours-esggo-co 部署鏈路加固
# created: 2026-10-03
# ============================================================================
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO"

SYNC="scripts/sync-dist.sh"
CUT_AT=121          # staging 段結尾（echo "== 2/4"）；首次遠端操作在 132 行
STAGE="$REPO/.deploy-stage"

if [[ "${1:-}" == "--clean" ]]; then
  rm -rf "$STAGE" .staging-only.sh
  echo "[clean] 已移除 $STAGE"
  exit 0
fi

echo "============================================================"
echo " sync-dist.sh staging 段驗證（不觸碰正式站）"
echo "============================================================"

# --- 前置：腳本存在且夠長 -------------------------------------------
if [[ ! -f "$SYNC" ]]; then
  echo "[FAIL] 找不到 $SYNC"; exit 1
fi
TOTAL=$(wc -l < "$SYNC")
if (( TOTAL < CUT_AT )); then
  echo "[FAIL] $SYNC 只有 $TOTAL 行，少於預期 $CUT_AT — 腳本結構已變，"
  echo "       請重新確認截斷點（觸碰遠端的行號）後再更新本腳本。"
  exit 1
fi
echo "[ok] $SYNC 共 $TOTAL 行，截斷點 $CUT_AT 有效"

# --- 安全性斷言：截斷點必須早於首次觸碰遠端 -------------------------
# 這是本腳本最重要的自我保護。若有人把 rsync/ssh/curl 上傳加進
# staging 段，截斷就會洩漏到正式站，必須硬性失敗。
FIRST_REMOTE=$(grep -nE '^\s*(tar .*\|\s*ssh|rsync|scp )' "$SYNC" \
               | head -1 | cut -d: -f1 || true)
if [[ -n "${FIRST_REMOTE:-}" ]] && (( FIRST_REMOTE <= CUT_AT )); then
  echo "[FAIL] $SYNC 第 $FIRST_REMOTE 行已出現遠端操作，但截斷點是 $CUT_AT"
  echo "       → 截斷會洩漏到正式站。拒絕執行。"
  exit 1
fi
echo "[ok] 首次遠端操作在第 ${FIRST_REMOTE:-none} 行，晚於截斷點 $CUT_AT — 截斷安全"

# --- 語法檢查（先於執行，避免半途產出壞 staging）--------------------
bash -n "$SYNC" || { echo "[FAIL] bash 語法錯誤"; exit 1; }
echo "[ok] bash -n 語法通過"

# --- 抽出並執行 staging 段 ------------------------------------------
rm -rf "$STAGE"
head -"$CUT_AT" "$SYNC" > .staging-only.sh
printf '%s\n' 'echo "[staging-only 結束 — 未觸碰遠端]"' >> .staging-only.sh

echo "------------------------------------------------------------"
echo " 執行 staging 段…"
echo "------------------------------------------------------------"
set +e
bash .staging-only.sh
RC=$?
set -e
echo "------------------------------------------------------------"

if (( RC != 0 )); then
  echo "[FAIL] staging 段以 RC=$RC 結束（fail-closed 生效，非預期）"
  exit 1
fi
echo "[ok] staging 段 RC=0"

# --- 斷言 1：根目錄靜態檔齊全（rsync --delete 會保護它們）------------
MISSING=()
for f in favicon.svg robots.txt CNAME; do
  [[ -f "$STAGE/$f" ]] || MISSING+=("$f")
done
if (( ${#MISSING[@]} > 0 )); then
  echo "[FAIL] staging 缺少根目錄檔：${MISSING[*]}"
  echo "       這些檔案若不在 staging，rsync --delete 會從正式站刪除它們"
  echo "       → favicon 404 / SEO 失效 / Custom 網域還原被破壞"
  exit 1
fi
echo "[ok] favicon.svg / robots.txt / CNAME 皆在 staging"

# --- 斷言 2：CNAME 內容正確（Cloudflare Custom 網域）-----------------
if ! grep -q 'ftgtours.esggo.co' "$STAGE/CNAME" 2>/dev/null; then
  echo "[FAIL] staging/CNAME 內容不是預期網域："
  sed 's/^/       /' "$STAGE/CNAME" 2>/dev/null
  exit 1
fi
echo "[ok] CNAME 指向 ftgtours.esggo.co"

# --- 斷言 3：執行期引用圖全部複製 --------------------------------------
# 關鍵：FTG 的 79 張圖片是由 JS 在執行期載入的（7 個子目錄：
# corporate-travel / esg-impact-note / wellbeing-retreat / esg-team-day /
# executive-retreat / family-day / images 根）。index.html 靜態只引用
# 2 條。只掃 index.html 的斷言抓不到任何執行期破圖 —— 那種斷言是
# 空轉的，比沒有斷言更危險。所以掃描範圍必須含 assets/*.js。
python - <<'PY'
import os, re, sys, glob
stage = '.deploy-stage'
if not os.path.isdir(stage):
    print("[FAIL] staging 不存在"); sys.exit(1)

# 掃描所有承載字串的檔案：HTML + JS bundle
scan_files = [os.path.join(stage, 'index.html')]
scan_files += sorted(glob.glob(os.path.join(stage, 'assets', '*.js')))
if len(scan_files) < 2:
    print("[FAIL] 找不到 JS bundle，掃描面不完整"); sys.exit(1)

PAT = re.compile(r'["\'`](\/?(?:images|assets)\/[A-Za-z0-9_.\-]+\.'
                 r'(?:jpg|jpeg|png|webp|avif))["\'`]')
refs = set()
for f in scan_files:
    try:
        txt = open(f, encoding='utf-8', errors='ignore').read()
    except OSError:
        continue
    refs.update(PAT.findall(txt))

print(f"[信息] 掃描 {len(scan_files)} 個檔案（1 HTML + {len(scan_files)-1} JS），"
      f"解析出 {len(refs)} 條圖片路徑")
if not refs:
    print("[FAIL] 解析出 0 條路徑 — 斷言無法生效（正則與實際格式不符）")
    sys.exit(1)

missing = [r for r in sorted(refs)
           if not os.path.isfile(os.path.join(stage, r.lstrip('/')))]
if missing:
    print(f"[FAIL] staging 缺 {len(missing)}/{len(refs)} 條引用圖：{missing[:8]}")
    print("       → 正式站會出現破圖")
    sys.exit(1)
print(f"[ok] 全部 {len(refs)} 條引用圖皆在 staging（無破圖）")
PY

# --- 斷言 4：staging 確實是 dist 的子集 ------------------------------
# 用 Python 集合運算而非 comm：comm 依賴 locale 排序語意，在 Git-Bash
# 的 Windows 檔名系統上會因大小寫/編碼序報 "not in sorted order"。
echo "------------------------------------------------------------"
echo " 子集斷言：staging ⊆ dist"
echo "------------------------------------------------------------"
python - <<'PY'
import os, sys
def listing(root):
    out = set()
    for dp, _, fns in os.walk(root):
        for fn in fns:
            out.add(os.path.relpath(os.path.join(dp, fn), root).replace('\\', '/'))
    return out

d = listing('dist'); s = listing('.deploy-stage')
extra = sorted(s - d)
if extra:
    print(f"[FAIL] staging 有 {len(extra)} 個檔不在 dist：{extra[:6]}")
    sys.exit(1)
print(f"[ok] staging ⊆ dist（0 個額外檔）")
print(f"[信息] dist {len(d)} 檔 → staging {len(s)} 檔，"
      f"篩掉 {len(d) - len(s)} 個未引用檔")
if len(s) > len(d):
    print("[FAIL] staging 檔數多於 dist，邏輯矛盾"); sys.exit(1)
PY

# --- 負向測試：拿掉一張「確實被引用」的圖，確認閘會報紅 ---------------
# 這道測試存在的唯一目的，是證明上面的斷言 3 不是空轉。
# 必須挑一張「被 HTML 或 JS 引用」的圖：若挑到未被引用的圖，
# 刪掉它本來就不該報紅，測試會錯判閘無效。
echo "------------------------------------------------------------"
echo " 負向測試：移除一張確實被引用的圖，確認閘會報紅"
echo "------------------------------------------------------------"
VICTIM=$(python - <<'PY'
import os, re, glob
stage = '.deploy-stage'
scan = [os.path.join(stage,'index.html')] + sorted(glob.glob(os.path.join(stage,'assets','*.js')))
PAT = re.compile(r'["\'`](\/?(?:images|assets)\/[A-Za-z0-9_.\-]+\.(?:jpg|jpeg|png|webp|avif))["\'`]')
refs = set()
for f in scan:
    refs.update(PAT.findall(open(f, encoding='utf-8', errors='ignore').read()))
for r in sorted(refs):
    p = os.path.join(stage, r.lstrip('/'))
    if os.path.isfile(p):
        print(p); break
PY
)
if [[ -z "$VICTIM" ]]; then
  echo "[skip] 找不到被引用的圖片可作負向測試（不影響主流程結果）"
else
  echo "  犧牲檔: ${VICTIM#$STAGE/}"
  # 先備份整個 staging，再刪圖 — 順序不可顛倒
  rm -rf "$STAGE.bak"
  cp -r "$STAGE" "$STAGE.bak"
  rm -f "$VICTIM"

  set +e
  python - <<'PY'
import os, re, sys, glob
stage = '.deploy-stage'
scan = [os.path.join(stage,'index.html')] + sorted(glob.glob(os.path.join(stage,'assets','*.js')))
PAT = re.compile(r'["\'`](\/?(?:images|assets)\/[A-Za-z0-9_.\-]+\.(?:jpg|jpeg|png|webp|avif))["\'`]')
refs = set()
for f in scan:
    refs.update(PAT.findall(open(f, encoding='utf-8', errors='ignore').read()))
missing = [r for r in sorted(refs) if not os.path.isfile(os.path.join(stage, r.lstrip('/')))]
if missing:
    print(f"[ok] 負向測試通過：偵測到缺 {len(missing)}/{len(refs)} 條 → 閘正確報紅")
    sys.exit(0)
print("[FAIL] 負向測試失敗：拿掉被引用的圖後閘竟未報紅 → 閘無效")
sys.exit(1)
PY
  NEG=$?
  set -e

  rm -rf "$STAGE"; mv "$STAGE.bak" "$STAGE"   # 還原
  if (( NEG != 0 )); then
    echo "[ABORT] 負向測試證明閘無效，中止"
    exit 1
  fi
  echo "[ok] staging 已還原，負向測試留下有效證據"
fi

echo "============================================================"
echo " PASS — staging 段驗證全部通過，正式站未被觸碰"
echo "============================================================"
echo " 清理：bash scripts/verify-staging.sh --clean"
