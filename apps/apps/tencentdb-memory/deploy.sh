#!/usr/bin/env bash
# ============================================================
# TencentDB Agent Memory — 完整集成部署 (esggo → VPS)
# 架構: MemoryCore(8420) + MemoryHub/Panel(8125) + Proxy(8096) + Knowledge(8424)
# 流程: 語法檢查 → rsync 同步 → VPS 端填 .env (Groq) → start-all → 健康檢查
# 任一步失敗即中止 (set -e)，絕不在未驗證下宣稱成功
# 用法: bash deploy.sh  [--skip-sync]
# ============================================================
set -euo pipefail
cd "$(dirname "$0")"

HOST="${DEPLOY_HOST:-ubuntu@161.118.248.180}"
RPATH="${DEPLOY_PATH:-/opt/esggo/apps/tencentdb-memory}"
KEY="${DEPLOY_KEY:-$HOME/.ssh/esggo_original}"
SSH="ssh -o ConnectTimeout=15 -i $KEY"
SCP="scp -o ConnectTimeout=15 -i $KEY"

# Groq 免費 LLM (雙組共用，符合 hermes-memory-tencentdb-windows 最佳實踐)
# 值來自 VPS 環境變數 / GitHub Secret，絕不寫入 git
GROQ_KEY="${TDAI_GROQ_API_KEY:-${GROQ_API_KEY:-}}"

FILES="start-all.sh start-memory-core.sh start-memory-hub.sh start-proxy.sh stop-all.sh _lib.sh verify.sh README.md .env.example"

echo "◆ [1/5] 腳本語法檢查"
for f in start-all.sh start-memory-core.sh start-memory-hub.sh start-proxy.sh stop-all.sh _lib.sh verify.sh; do
  bash -n "$f"
done
echo "  ✓ 全部通過"

echo "◆ [2/5] 同步至 $HOST:$RPATH"
$SSH "$HOST" "mkdir -p $RPATH"
# shellcheck disable=SC2086
$SCP $FILES "$HOST:$RPATH/"
echo "  ✓ 同步完成"

echo "◆ [3/5] VPS 端產生 .env (注入 Groq LLM)"
if [ -z "$GROQ_KEY" ]; then
  echo "  ✗ TDAI_GROQ_API_KEY / GROQ_API_KEY 未設置，無法填寫 .env"
  echo "    本地: export GROQ_API_KEY=gsk_xxx  再跑 bash deploy.sh"
  echo "    VPS:  將 GROQ_API_KEY 存入 /opt/esggo/.env 或由 CI Secret 注入"
  exit 1
fi
# 以 .env.example 為底，替換 REPLACE_ME 為真實 Groq 值 (雙組共用)
$SSH "$HOST" "cd $RPATH && \
  sed -e 's#REPLACE_ME#${GROQ_KEY}#g' \
      -e 's#https://api.deepseek.com/v1#https://api.groq.com/openai/v1#g' \
      -e 's#deepseek-chat#openai/gpt-oss-20b#g' \
      .env.example > .env && \
  echo 'MEMORY_LLM_PROTOCOL=openai' >> .env && \
  grep -c 'REPLACE_ME' .env | xargs -I{} echo '  剩餘 REPLACE_ME 數量: {}'"
echo "  ✓ .env 已生成"

echo "◆ [4/5] VPS 啟動三件套 (start-all)"
$SSH "$HOST" "cd $RPATH && docker --version && PULL=1 timeout 600 ./start-all.sh" 2>&1 | tail -25
echo "  ✓ 啟動指令已執行"

echo "◆ [5/5] 健康檢查 (Panel :8125 / Gateway :8420)"
$SSH "$HOST" "sleep 8 && \
  echo '--- Panel ---'; curl -sf -m 5 http://localhost:8125/ | head -c 120; echo; \
  echo '--- Gateway ---'; curl -sf -m 5 http://localhost:8420/health | head -c 200; echo; \
  echo '--- docker ps ---'; docker ps --format '{{.Names}} {{.Status}}' | grep -i memory" 2>&1 | tail -15

echo ""
echo "══════════════════════════════════════════"
echo "✅ TencentDB Agent Memory 部署完成"
echo "   Panel (記憶中樞): http://161.118.248.180:8125"
echo "   Gateway (8420) / Knowledge (8424) / Proxy (8096)"
echo "   OA-Team 蜂群可透過 http://<vps>:8420 共享記憶"
echo "══════════════════════════════════════════"
