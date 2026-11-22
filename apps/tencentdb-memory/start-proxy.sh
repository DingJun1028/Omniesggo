#!/usr/bin/env bash
# 單獨拉起 proxy（context-proxy，埠 8096）。
#
# proxy 的轉發上游走 PROXY_UPSTREAM_URL（與 memory 組的 MEMORY_LLM_* 獨立）。
# proxy 會調 memory:8420 做鑑權 / skill / tdai memory 注入；調 memory-hub:8125
# 做 sessionInit control plane。可以單跑 proxy 但相關能力會降級 / 關閉。
#
# 用法：
#   ./start-proxy.sh
#
# 需要以下 proxy 組引數（寫在 .env）：
#   PROXY_UPSTREAM_URL / PROXY_UPSTREAM_API_KEY / PROXY_UPSTREAM_MODEL

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_lib.sh
source "$SCRIPT_DIR/_lib.sh"

load_env
require_vars \
  PROXY_IMAGE PROXY_PORT \
  PROXY_UPSTREAM_URL PROXY_UPSTREAM_API_KEY PROXY_UPSTREAM_MODEL

# 與 memory-core 保持一致的 gateway 內部憑據（預設 local，僅本地體驗）
MEMORY_CORE_GATEWAY_API_KEY="${MEMORY_CORE_GATEWAY_API_KEY:-local}"
# 使用 127.0.0.1 而非 Docker service name (host network mode 下容器間不能解析服務名)
MEMORY_CORE_URL="${MEMORY_CORE_URL:-http://127.0.0.1:${MEMORY_CORE_PORT}}"

CONTAINER=tdai-proxy
NETWORK=host

if ! $DOCKER network inspect "$NETWORK" >/dev/null 2>&1; then
  info "建立 docker 網路 $NETWORK"
  $DOCKER network create "$NETWORK" >/dev/null
fi

# 依賴檢查（不阻塞，僅提醒）
if ! $DOCKER ps --format '{{.Names}}' 2>/dev/null | grep -qx "tdai-memory-core"; then
  warn "memory-core 容器未執行，proxy 的 auth / tdai memory / skill 注入將全部降級。"
fi
if ! $DOCKER ps --format '{{.Names}}' 2>/dev/null | grep -qx "tdai-memory-hub"; then
  warn "memory-hub 容器未執行，proxy 的 sessionInit control plane 不可達。"
fi

pull_image "$PROXY_IMAGE"
rm_container_if_exists "$CONTAINER"

# proxy 只從 YAML 讀上游 URL / API key（不認 PROXY_UPSTREAM_URL 環境變數），
# 所以我們從 .env 生成一個最小 config.yaml 掛到容器 /data/config.yaml。
# 容器 CMD 已經是 [--config /data/config.yaml]。
CONFIG_DIR="${PROXY_CONFIG_DIR:-$SCRIPT_DIR/.proxy-config}"
mkdir -p "$CONFIG_DIR"
CONFIG_FILE="$CONFIG_DIR/config.yaml"

# ── 三大能力開關（預設最小可用；開啟時自動串聯依賴）──
# PROXY_ENABLE_AUTH        : 客戶端憑 x-tdai-user-key 走核心 auth/verify → user_id
# PROXY_ENABLE_SESSION_INIT: 首輪彈表單選 team/agent/task；依賴 auth+tdai
# PROXY_ENABLE_TDAI        : L2/L3 記憶注入 + L1 召回；依賴 memory-core
#
# 便捷開關 PROXY_FULL_STACK=1 一鍵把三個都開。
if [[ "${PROXY_FULL_STACK:-0}" == "1" ]]; then
  PROXY_ENABLE_AUTH=1
  PROXY_ENABLE_TDAI=1
  PROXY_ENABLE_SESSION_INIT=1
fi
PROXY_ENABLE_AUTH="${PROXY_ENABLE_AUTH:-0}"
PROXY_ENABLE_TDAI="${PROXY_ENABLE_TDAI:-0}"
PROXY_ENABLE_SESSION_INIT="${PROXY_ENABLE_SESSION_INIT:-0}"

# sessionInit 依賴 auth 拿 user_id；開 sessionInit 時自動補 auth
if [[ "$PROXY_ENABLE_SESSION_INIT" == "1" && "$PROXY_ENABLE_AUTH" != "1" ]]; then
  warn "PROXY_ENABLE_SESSION_INIT=1 需要 auth；自動開啟 PROXY_ENABLE_AUTH"
  PROXY_ENABLE_AUTH=1
fi

bool() { [[ "$1" == "1" ]] && echo "true" || echo "false"; }

info "生成 proxy config → $CONFIG_FILE  (auth=$(bool $PROXY_ENABLE_AUTH) session-init=$(bool $PROXY_ENABLE_SESSION_INIT) tdai=$(bool $PROXY_ENABLE_TDAI))"
cat > "$CONFIG_FILE" <<YAML
# 由 start-proxy.sh 自動生成 —— 每次啟動覆蓋，請不要手動改。
server:
  host: 0.0.0.0
  port: 8096
  forwardTimeoutMs: 600000

upstream:
  url: "${PROXY_UPSTREAM_URL}"
  apiKey: "${PROXY_UPSTREAM_API_KEY}"

log:
  file: ""
  level: info
  backend: console

# tdai 核心對接（用於 injection / skill / auth 拉取）
tdai:
  enabled: $(bool $PROXY_ENABLE_TDAI)
  endpoint: "${MEMORY_CORE_URL}"
  apiKey: "${MEMORY_CORE_GATEWAY_API_KEY}"
  serviceId: default
  memory:
    enabled: true
    inject: true
    writeL0: true
    recallL1: true
    injectL2L3: true

skill:
  endpoint: "${MEMORY_CORE_URL}"
  serviceToken: "${MEMORY_CORE_GATEWAY_API_KEY}"

auth:
  enabled: $(bool $PROXY_ENABLE_AUTH)
  url: "${MEMORY_CORE_URL}"
  timeoutMs: 5000

sessionInit:
  enabled: $(bool $PROXY_ENABLE_SESSION_INIT)
  maxRetries: 3
  injectAgentContext: true
  injectTaskContext: true
  headerAutoSelect:
    enabled: true
    teamHeader: "x-team-id"
    agentHeader: "x-agent-id"
    taskHeader: "x-task-id"
    onMismatch: "form"

costGuard:
  enabled: false

# 開啟 skill + knowledge + tdai-memory 三個注入器；
# knowledge 依賴 memory-hub 起來，否則 hook 內部會降級為空塊。
injection:
  enabled: true
  injectors:
    - skill
    - knowledge
    - tdai-memory

redis:
  enabled: false
YAML

info "啟動 proxy (image=$PROXY_IMAGE, port=$PROXY_PORT)"
$DOCKER run -d --name "$CONTAINER" \
  --network "$NETWORK" \
  -p "${PROXY_PORT}:8096" \
  -v "$CONFIG_FILE:/data/config.yaml:ro" \
  "$PROXY_IMAGE" >/dev/null

wait_healthy "$CONTAINER" 90
ok "proxy 已啟動 → http://localhost:${PROXY_PORT}/"
ok "  用法：把 coding agent 的 API base 指向 http://localhost:${PROXY_PORT}"
