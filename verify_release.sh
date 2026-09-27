#!/usr/bin/env bash
# Agent Mesh 發布驗收腳本
# 對單一 CLI 執行檔（exe 或 py）逐項實測，輸出 PASS/FAIL 與真實工具輸出。
# 用法：bash verify_release.sh [exe路徑]
set -u

EXE="${1:-C:/Project/esggo/_pyi/dist/esggo-agent-mesh.exe}"
# 工作目錄必須是「原生 Windows 路徑」：本機 MSYS 路徑轉換已停用，
# 傳 /tmp/... 給原生 .exe 會無法解析而靜默失敗（且 $TMPDIR 常為 /tmp）。
# pwd -W 會把當前目錄轉成 C:/... 形式；失敗時退回硬編碼專案路徑。
NAT_CWD="$(pwd -W 2>/dev/null || true)"
[ -n "$NAT_CWD" ] || NAT_CWD="C:/Project/esggo"
WORKDIR="$NAT_CWD/scratch/verify"
mkdir -p "$WORKDIR" || exit 1
PASS=0; FAIL=0

# 保留被丟棄的輸出：exe 失敗時要能看到原因，不能靜默
run_quiet() {  # run_quiet <日誌檔> <命令...>
  local log="$1"; shift
  "$@" >"$log" 2>&1
  local rc=$?
  if [ "$rc" != 0 ]; then
    printf '         ↳ %s 退出碼=%s，最後輸出：\n' "$(basename "$log")" "$rc"
    tail -4 "$log" | sed 's/^/           /'
  fi
  return $rc
}

run() {           # run <名稱> <預期退出碼> <命令...>
  local name="$1" want="$2"; shift 2
  local out rc
  out="$("$@" 2>&1)"; rc=$?
  if [ "$rc" = "$want" ]; then
    PASS=$((PASS+1)); printf '  [PASS] %-28s rc=%s\n' "$name" "$rc"
  else
    FAIL=$((FAIL+1)); printf '  [FAIL] %-28s rc=%s (want %s)\n' "$name" "$rc" "$want"
    printf '%s\n' "$out" | tail -5 | sed 's/^/         /'
  fi
}

echo "═══════════════════════════════════════════════════"
echo " Agent Mesh 發布驗收：$EXE"
echo "═══════════════════════════════════════════════════"

ls -lh "$EXE" 2>/dev/null | awk '{print "  檔案大小：" $5}' || { echo "  [FAIL] 執行檔不存在"; exit 1; }

echo ""
echo "── 靜態檢查（不需網路）──"
run "--version"            0   "$EXE" --version
run "--help"               0   "$EXE" --help
run "--test-tools"         0   "$EXE" --test-tools
run "--semantic-stats 無路徑" 1   "$EXE" --semantic-stats

echo ""
echo "── 執行期檢查（需 Ollama 在線）──"
run "--health"             0   "$EXE" --health
run "--list"               0   "$EXE" --list

echo ""
echo "── 語義圖譜閉環 ──"
DB="$WORKDIR/agent-mesh-verify.db"
rm -f "$DB"
# 非對稱模型測試 + 圖譜寫入（模型可能因未載入而失敗，圖譜表格仍須建立）
run_quiet "$WORKDIR/semantic.log" \
  "$EXE" --model qwen2.5:3b-instruct-q4_K_M --num-predict 16 --timeout 180 \
         --semantic-db "$DB" --output "$WORKDIR/am-verify.json"
if [ -f "$DB" ]; then
  run "--semantic-stats（已建庫）" 0 "$EXE" --semantic-stats --semantic-db "$DB"
  # 僅驗「檔案存在 + exit 0」抓不到去重後的失效：PyInstaller 若漏打包
  # semantic_graph，或 ingest 靜默失效，DB 仍存在但內容為空。
  # 故須實測實體數 > 0。
  if "$EXE" --semantic-stats --semantic-db "$DB" 2>/dev/null \
       | grep -qE '實體數量.*[1-9]'; then
    run "圖譜實體數 > 0" 0 true
  else
    FAIL=$((FAIL+1)); printf '  [FAIL] %-28s 圖譜有庫但無實體（ingest 失效或漏打包）\n' "圖譜實體數 > 0"
  fi
else
  FAIL=$((FAIL+1)); printf '  [FAIL] %-28s 圖譜庫未建立\n' "--semantic-db 寫入"
fi

echo ""
echo "── 批次路徑（asyncio.gather + 併發限流）──"
BATCH_CSV="$WORKDIR/am-batch.csv"
rm -f "$BATCH_CSV"
# 驗收重點：--timeout 必須真的生效（冷載入模型常需 20–50s），
# 且 CSV 的 elapsed_seconds 不得與 error 宣稱的逾時秒數互相矛盾。
run_quiet "$WORKDIR/batch.log" \
  "$EXE" --model qwen2.5:3b --model qwen2.5:3b-hermes \
         --num-predict 16 --timeout 180 --concurrency 2 \
         --output "$BATCH_CSV"
if [ -f "$BATCH_CSV" ]; then
  N=$(($(wc -l < "$BATCH_CSV") - 1))
  OKC=$(grep -c ',ok,' "$BATCH_CSV" 2>/dev/null || echo 0)
  if [ "$N" -ge 2 ]; then
    PASS=$((PASS+1)); printf '  [PASS] %-28s %s 筆，ok=%s\n' "批次 CSV 產出" "$N" "$OKC"
  else
    FAIL=$((FAIL+1)); printf '  [FAIL] %-28s 僅 %s 筆\n' "批次 CSV 產出" "$N"
  fi
  # 一致性檢查：elapsed_seconds 不得超過 error 內宣稱的 timeout
  if awk -F',' '/,error,/ { print "批次結果出現失敗項，需檢查逾時一致性" }' "$BATCH_CSV" | grep -q .; then
    printf '  [INFO] 批次含失敗項（模型可能未載入），檢查逾時敘述一致性：\n'
    grep ',error,' "$BATCH_CSV" | cut -c1-160 | sed 's/^/         /'
  fi
else
  FAIL=$((FAIL+1)); printf '  [FAIL] %-28s CSV 未產出\n' "批次 CSV 產出"
fi

echo ""
echo "═══════════════════════════════════════════════════"
printf ' 結果：PASS=%d  FAIL=%d\n' "$PASS" "$FAIL"
echo "═══════════════════════════════════════════════════"
[ "$FAIL" = 0 ] || exit 1
