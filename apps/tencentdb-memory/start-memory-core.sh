#!/usr/bin/env bash
# 單獨拉起 memory-core（核心 gateway，埠 8420），首次啟動自動 init-admin +
# 把生成的 user_key 持久化到 .admin-key 供 proxy / claude-code 使用。
#
# 用法：
#   ./start-memory-core.sh
#
# 資料持久化到 named volume（預設 tdai-memory-core-data，可在 .env 改 MEMORY_CORE_VOLUME）。
# 重複執行會先移除舊容器再啟新的，volume 資料保留 —— admin user_key 也隨之保留。

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_lib.sh
source "$SCRIPT_DIR/_lib.sh"

load_env
require_vars MEMORY_CORE_IMAGE MEMORY_CORE_PORT MEMORY_CORE_VOLUME

# ── Gateway 內部管理憑據 ─────────────────────────────────────────
# 用 ${VAR-default}（不是 :-default）：允許 .env 里顯式設為空字串來關閉 Bearer gate。
#
# 當前 memory-core 的 Bearer gate 與 proxy auth 存在**已知不相容**：proxy 調
# /v3/meta/auth/verify 時不帶 Bearer（原始碼遺漏，見 MemoryProxy/src/auth.ts），
# 所以 proxy 啟用 auth 時必須把 MEMORY_CORE_GATEWAY_API_KEY 留空。預設已置空。
MEMORY_CORE_GATEWAY_API_KEY="${MEMORY_CORE_GATEWAY_API_KEY-}"
MEMORY_CORE_ADMIN_USERNAME="${MEMORY_CORE_ADMIN_USERNAME:-admin}"

# admin user_key 持久化位置（宿主機側；volume 資料被清后需一併刪掉此檔案）
ADMIN_KEY_FILE="${MEMORY_CORE_ADMIN_KEY_FILE:-$SCRIPT_DIR/.admin-key}"

if [[ -n "$MEMORY_CORE_GATEWAY_API_KEY" ]]; then
  warn "MEMORY_CORE_GATEWAY_API_KEY 非空 —— proxy 的 sessionInit/auth 目前會因缺 Bearer 而失敗。"
  warn "本地體驗請把 .env 里的 MEMORY_CORE_GATEWAY_API_KEY 留空。"
fi

CONTAINER=tdai-memory-core
NETWORK=host

# 建立共享網路（冪等）
if ! $DOCKER network inspect "$NETWORK" >/dev/null 2>&1; then
  info "建立 docker 網路 $NETWORK"
  $DOCKER network create "$NETWORK" >/dev/null
fi

pull_image "$MEMORY_CORE_IMAGE"
rm_container_if_exists "$CONTAINER"

# ── 生成 gateway config.yaml，挂到容器 /data/config/tdai-gateway.yaml ──
# 預設映象里沒 config，memory-core 走編譯時的預設（skill / knowledge 模組關閉）。
# 從 .env 里的 MEMORY_LLM_* 生成一份 standalone+skill 的最小配置。
CORE_CONFIG_DIR="${MEMORY_CORE_CONFIG_DIR:-$SCRIPT_DIR/.memory-core-config}"
mkdir -p "$CORE_CONFIG_DIR"
CORE_CONFIG_FILE="$CORE_CONFIG_DIR/tdai-gateway.yaml"
info "生成 gateway config → $CORE_CONFIG_FILE"
cat > "$CORE_CONFIG_FILE" <<YAML
# 由 start-memory-core.sh 自動生成 —— 每次啟動覆蓋，請不要手動改。
deployMode: standalone
stateBackend: local

server:
  port: 8420
  host: 0.0.0.0

data:
  baseDir: /data/tdai-memory

llm:
  baseUrl: "${MEMORY_LLM_BASE_URL:-}"
  apiKey: "${MEMORY_LLM_API_KEY:-}"
  model: "${MEMORY_LLM_MODEL:-}"
  maxTokens: 32000
  timeoutMs: 300000

memory:
  # promptMode: chat（預設，通用聊天/教學場景）| code（程式碼工程場景，
  # LLM 會重點抽"改了什麼/發現什麼問題/工具用法"，普通聊天可能抽出 0 條）
  # 通過 .env 里 MEMORY_PROMPT_MODE 覆蓋。
  promptMode: ${MEMORY_PROMPT_MODE:-chat}
  capture: { enabled: true }
  extraction:
    enabled: true
    enableDedup: true
    maxMemoriesPerSession: 20
  persona:
    triggerEveryN: 50
    maxScenes: 15
  pipeline:
    everyNConversations: 5
    enableWarmup: true
    l1IdleTimeoutSeconds: 600
    l2DelayAfterL1Seconds: 90
    l2MinIntervalSeconds: 900
    l2MaxIntervalSeconds: 3600
  recall:
    enabled: true
    maxResults: 5
    scoreThreshold: 0.3
    strategy: hybrid
    timeoutMs: 5000
  storeBackend: sqlite
  embedding:
    enabled: true
    provider: ollama
    baseUrl: "${MEMORY_LLM_BASE_URL}"
    model: "nomic-embed-text"
    apiKey: "ollama-local"
    dimensions: 768
    sendDimensions: true

# ── Skill 模組 ──
skill:
  enabled: true
  routing:
    mode: bm25
    searchTopK: 20
  extraction:
    enabled: true
    maxIterations: 16
    queue:
      backend: local
      keyPrefix: tdai
      resultTtlSeconds: 86400
      lockTtlMs: 600000
      maxRetries: 2
      retryBackoffsMs: [5000, 15000]
  resources:
    maxResourceSizeBytes: 5000000
YAML

info "啟動 memory-core (image=$MEMORY_CORE_IMAGE, port=$MEMORY_CORE_PORT)"
$DOCKER run -d --name "$CONTAINER" \
  --network "$NETWORK" \
  -p "${MEMORY_CORE_PORT}:8420" \
  -v "${MEMORY_CORE_VOLUME}:/data/tdai-memory" \
  -v "$CORE_CONFIG_FILE:/data/config/tdai-gateway.yaml:ro" \
  -e TDAI_GATEWAY_PORT=8420 \
  -e TDAI_GATEWAY_HOST=0.0.0.0 \
  -e TDAI_GATEWAY_API_KEY="$MEMORY_CORE_GATEWAY_API_KEY" \
  -e TDAI_DATA_DIR=/data/tdai-memory \
  "$MEMORY_CORE_IMAGE" >/dev/null

wait_healthy "$CONTAINER" 90
ok "memory-core 已啟動 → http://127.0.0.1:${MEMORY_CORE_PORT}/"

# ── Ollama LLM pre-warm (避免 memory-core 首次呼叫 LLM 時的 cold-start 空響應) ──
# 背景: gemma4:latest 是 9GB 模型，首次從磁碟載入需要 ~24s，期間若被呼叫
# 會回傳空 content 觸發 "no content extracted" 警告。在 memory-core init-admin
# 之前預熱一次，讓首次 LLM 呼叫能拿到真實響應。
#
# 邏輯:
#   - 僅當 MEMORY_LLM_BASE_URL 是本地 Ollama 時才做（不汙染其他 provider）
#   - 不阻塞啟動：失敗只 warn，因為 pre-warm 失敗不代表 memory-core 不能用
#   - 超時 90s（24s 載入 + 60s 餘量）
if [[ "${MEMORY_LLM_BASE_URL:-}" == *"127.0.0.1:11434"* || "${MEMORY_LLM_BASE_URL:-}" == *"localhost:11434"* ]]; then
  OLLAMA_URL="${MEMORY_LLM_BASE_URL%/v1}/api/generate"
  OLLAMA_MODEL="${MEMORY_LLM_MODEL:-gemma4:latest}"
  info "Pre-warming Ollama model '${OLLAMA_MODEL}' (24s cold start → warm)..."
  if curl -sS --max-time 90 -X POST "$OLLAMA_URL" \
       -H "Content-Type: application/json" \
       -d "$(printf '{"model":"%s","prompt":"ok","stream":false,"options":{"num_predict":3}}' "$OLLAMA_MODEL")" \
       >/dev/null 2>&1; then
    ok "Ollama pre-warm complete ($OLLAMA_MODEL ready)"
  else
    warn "Ollama pre-warm failed (model=${OLLAMA_MODEL}, url=${OLLAMA_URL}). memory-core 仍可啟動，但首次 LLM 呼叫可能 cold-start。"
  fi
fi

# ── Admin user 生命周期 ─────────────────────────────────────────
# 首次啟動：init-admin 時**傳入我們生成的隨機 user_key**，返回體里讀回來存檔案。
# 重啟且已初始化（409）：優先讀 .admin-key；若 volume 是新造的但 .admin-key 是
#   舊的，無法恢復（volume/key 必須同步；提示使用者清理）。
#
# init-admin 介面尊重傳入的 user_key（見 MemoryCore/src/metadata/store/sqlite-adapter.ts
# defaultKeyValue = input.default_key_value ?? generateUserKey()）；只要 volume 空、
# 我們傳固定 key，就能拿到自己指定的 key。首次啟動時指令碼生成一把 32 位元組隨機
# base32url —— 每臺機器/每次 purge 都是獨立 key，不會撞車。

generate_user_key() {
  # sk-mem-<32 chars A-Za-z0-9>，與 metadata/utils/user-key.ts 的格式一致
  # 用 openssl（可移植；tr 過濾 base64 里的 +/= 到 32 位）
  local raw
  if command -v openssl >/dev/null 2>&1; then
    raw=$(openssl rand -base64 48 | LC_ALL=C tr -dc 'A-Za-z0-9' | head -c 32)
  else
    # 兜底：讀足夠多的 urandom 保證過濾后 >=32
    raw=$(head -c 256 /dev/urandom | LC_ALL=C tr -dc 'A-Za-z0-9' | head -c 32)
  fi
  echo "sk-mem-${raw}"
}

verify_user_key() {
  local key="$1"
  local code
  code=$(curl -sS -w "%{http_code}" --max-time 5 \
    -X POST -H "Content-Type: application/json" \
    -H "x-tdai-service-id: default" \
    ${MEMORY_CORE_GATEWAY_API_KEY:+-H "Authorization: Bearer ${MEMORY_CORE_GATEWAY_API_KEY}"} \
    "http://127.0.0.1:${MEMORY_CORE_PORT}/v3/meta/auth/verify" \
    -d "$(printf '{"user_key":"%s"}' "$key")" 2>/dev/null | tail -c 3 || echo "000")
  [[ "$code" == "200" ]]
}

info "初始化 admin user（username=${MEMORY_CORE_ADMIN_USERNAME}, key 持久化 → $ADMIN_KEY_FILE）..."

# 生成隨機 key（首次 init-admin 用；若之前有 file 就複用）
if [[ -s "$ADMIN_KEY_FILE" ]]; then
  ADMIN_KEY=$(cat "$ADMIN_KEY_FILE")
  info "  複用已儲存的 admin key（.admin-key 已存在）"
else
  ADMIN_KEY=$(generate_user_key)
fi

init_body=$(printf '{"username":"%s","user_key":"%s"}' \
  "$MEMORY_CORE_ADMIN_USERNAME" "$ADMIN_KEY")
init_resp=$(curl -sS -o /tmp/init-admin.$$ -w "%{http_code}" \
  -X POST -H "Content-Type: application/json" \
  ${MEMORY_CORE_GATEWAY_API_KEY:+-H "Authorization: Bearer ${MEMORY_CORE_GATEWAY_API_KEY}"} \
  -H "x-tdai-service-id: default" \
  "http://127.0.0.1:${MEMORY_CORE_PORT}/v3/internal/meta/user/init-admin" \
  -d "$init_body" 2>/dev/null | tail -c 3 || echo "000")

case "$init_resp" in
  200)
    ok "admin user 已建立"
    # 落盤 key（把宿主機 file 的許可權收緊）
    umask 077
    echo -n "$ADMIN_KEY" > "$ADMIN_KEY_FILE"
    ok "  admin user_key 已保存到 $ADMIN_KEY_FILE"
    ;;
  409)
    if [[ -s "$ADMIN_KEY_FILE" ]]; then
      ok "admin user 已存在（跳過 init-admin，用 $ADMIN_KEY_FILE 里的 key）"
    else
      warn "admin user 已存在，但 $ADMIN_KEY_FILE 缺失，無法恢復 user_key。"
      warn "選項 A: 清理 volume 重建 —— ./stop-all.sh --purge && ./start-memory-core.sh"
      warn "選項 B: 手動建立新 admin user_key（需要舊 key 或 gateway apiKey）"
    fi
    ;;
  *)
    warn "init-admin 返回 HTTP=${init_resp}，可能需要手動排查："
    cat /tmp/init-admin.$$ 2>/dev/null; echo
    ;;
esac
rm -f /tmp/init-admin.$$

sleep 2
# ── 校驗 admin key 可用 ─────────────────────────────────────────
if [[ -s "$ADMIN_KEY_FILE" ]]; then
  ADMIN_KEY=$(cat "$ADMIN_KEY_FILE")
  if verify_user_key "$ADMIN_KEY"; then
    # 只在末尾做脫敏輸出：整串路徑 masked，讓終端歷史裡不留全值
    masked="${ADMIN_KEY:0:11}****${ADMIN_KEY: -4}"
    ok "admin user_key 校驗通過（auth/verify 200）—— $masked"
    ok "  key file: $ADMIN_KEY_FILE"
  else
    warn "admin user_key 校驗失敗（auth/verify 非 200）。檢查 $ADMIN_KEY_FILE 與 volume 是否匹配。"
  fi
fi
