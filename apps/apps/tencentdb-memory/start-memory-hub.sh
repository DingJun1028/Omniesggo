#!/usr/bin/env bash
# 單獨拉起 memory-hub（panel + knowledge 合併映象，埠 8125 + 8424）。
#
# 依賴：memory 需要先起來（memory-hub 里 knowledge 調 memory 做 embed/RAG）。
# 如果 memory 容器不存在，此指令碼會打 warn 但仍繼續（LLM_MODE=proxy 時 memory-hub
# 自身可以啟動，只是 knowledge 首次調 memory 時會失敗）。
#
# 用法：
#   ./start-memory-hub.sh
#
# 需要以下 LLM 引數（寫在 .env）：
#   MEMORY_LLM_BASE_URL / MEMORY_LLM_API_KEY / MEMORY_LLM_MODEL

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_lib.sh
source "$SCRIPT_DIR/_lib.sh"

load_env
require_vars \
  MEMORY_HUB_IMAGE PANEL_PORT KNOWLEDGE_PORT PANEL_VOLUME \
  MEMORY_LLM_BASE_URL MEMORY_LLM_API_KEY MEMORY_LLM_MODEL \
  KNOWLEDGE_PUBLIC_BASE_URL

# 與 memory-core 保持一致的 gateway 內部憑據（預設 local，僅本地體驗）
MEMORY_CORE_GATEWAY_API_KEY="${MEMORY_CORE_GATEWAY_API_KEY:-local}"

# Panel UI "客戶端接入地址"卡片顯示的 base URL（供 CodeBuddy / ClaudeCode 複製使用）。
# 開源本地部署 core 和 proxy 分開跑，客戶端要接的是 proxy，不是 core/gateway。
#
# 預設按下面順序探測宿主機對外可達地址：
#   1) Linux 上 `hostname -I` 首個非 127 的 IPv4（LAN IP）
#   2) macOS 上常見網絡卡（en0 / en1）的 IPv4
#   3) 前兩步都失敗 → localhost（僅同機使用，跨機需要使用者顯式設 MEMORY_HUB_PROXY_PUBLIC_URL）
#
# 顯式設了 MEMORY_HUB_PROXY_PUBLIC_URL 環境變數則完全按你給的值來。
# 顯式設為空字串則 Panel 前端回落到 gateway_endpoint（老行為）。
# Panel 後端 → Kernel 的轉發地址始終走 REMOTE_INSTANCE_URL，不受此變數影響。
detect_host_ip() {
  # 只接受合法 IPv4；任何分支抓到非 IP 垃圾（如 Windows ipconfig 的 help 文）都忽略，
  # 最終回落 host.docker.internal，避免 Panel 卡片 URL 變 "http://:8096" 或帶 \r 破解容器配置。
  local ip=""
  local ip_re='^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$'
  # Linux
  if command -v hostname >/dev/null 2>&1; then
    ip=$(hostname -I 2>/dev/null | tr -d '\r' | tr ' ' '\n' | awk '/^[0-9]+\./ && $0 !~ /^127\./ && $0 !~ /^169\.254\./' | head -n1)
    [[ -n "$ip" && "$ip" =~ $ip_re ]] && { echo "$ip"; return; }
  fi
  # macOS (ipconfig getifaddr 僅 macOS 有效；Windows 上會印 help 且抓不到 IP，故用正則擋掉)
  if command -v ipconfig >/dev/null 2>&1; then
    for iface in en0 en1 en2; do
      ip=$(ipconfig getifaddr "$iface" 2>/dev/null | tr -d '\r')
      [[ -n "$ip" && "$ip" =~ $ip_re ]] && { echo "$ip"; return; }
    done
  fi
  # 兜底：ip route（Linux 無 hostname -I 時）
  if command -v ip >/dev/null 2>&1; then
    ip=$(ip -4 route get 1 2>/dev/null | tr -d '\r' | awk '/src/ {for (i=1;i<=NF;i++) if ($i=="src") print $(i+1); exit}')
    [[ -n "$ip" && "$ip" =~ $ip_re ]] && { echo "$ip"; return; }
  fi
  # Windows Docker Desktop / 探測失敗：用 host.docker.internal 讓容器內迴環到宿主。
  echo "host.docker.internal"
}

if [[ -z "${MEMORY_HUB_PROXY_PUBLIC_URL+x}" ]]; then
  # 未設 → 用探測出的 IP + PROXY_PORT 拼預設值
  _host_ip=$(detect_host_ip)
  MEMORY_HUB_PROXY_PUBLIC_URL="http://${_host_ip}:${PROXY_PORT:-8096}"
  info "自動探測宿主機地址: MEMORY_HUB_PROXY_PUBLIC_URL=$MEMORY_HUB_PROXY_PUBLIC_URL"
  info "  (如需覆蓋，在 .env 里顯式設 MEMORY_HUB_PROXY_PUBLIC_URL=http://<your-ip>:${PROXY_PORT:-8096})"
fi

CONTAINER=tdai-memory-hub
NETWORK=host

if ! $DOCKER network inspect "$NETWORK" >/dev/null 2>&1; then
  info "建立 docker 網路 $NETWORK"
  $DOCKER network create "$NETWORK" >/dev/null
fi

# memory 未起來時給提醒，不阻塞
if ! $DOCKER ps --format '{{.Names}}' 2>/dev/null | grep -qx "tdai-memory-core"; then
  warn "memory-core 容器未執行。memory-hub 能啟動，但 knowledge 調 memory 時會失敗。"
  warn "建議先 ./start-memory-core.sh 再來這裡，或直接 ./start-all.sh"
fi

pull_image "$MEMORY_HUB_IMAGE"
rm_container_if_exists "$CONTAINER"

# 內部 knowledge 通過 upstream memory 調 LLM 走 custom 模式，直接指向 MEMORY_LLM_*
# LLM_MODE=custom → 不走 memory 的 LLM proxy，而是 knowledge 直連使用者提供的端點
info "啟動 memory-hub (image=$MEMORY_HUB_IMAGE, panel=$PANEL_PORT knowledge=$KNOWLEDGE_PORT)"
$DOCKER run -d --name "$CONTAINER" \
  --network "$NETWORK" \
  -p "${PANEL_PORT}:8125" \
  -p "${KNOWLEDGE_PORT}:8424" \
  -v "${PANEL_VOLUME}:/data/knowledge" \
  -e PANEL_PORT=8125 \
  -e KNOWLEDGE_PORT=8424 \
  -e KNOWLEDGE_PUBLIC_BASE_URL="$KNOWLEDGE_PUBLIC_BASE_URL" \
  -e REMOTE_INSTANCE_ID=default \
  -e REMOTE_INSTANCE_NAME=default \
  -e REMOTE_INSTANCE_URL="http://memory-core:8420" \
  -e REMOTE_INSTANCE_KEY="$MEMORY_CORE_GATEWAY_API_KEY" \
  -e REMOTE_INSTANCE_PROXY_URL="$MEMORY_HUB_PROXY_PUBLIC_URL" \
  -e LLM_MODE=custom \
  -e LLM_PROTOCOL="${MEMORY_LLM_PROTOCOL:-openai}" \
  -e LLM_API_KEY="$MEMORY_LLM_API_KEY" \
  -e LLM_BASE_URL="$MEMORY_LLM_BASE_URL" \
  -e LLM_MODEL="$MEMORY_LLM_MODEL" \
  -e KNOWLEDGE_LLM_BINDING_SYNC=0 \
  "$MEMORY_HUB_IMAGE" >/dev/null

wait_healthy "$CONTAINER" 120
ok "memory-hub 已啟動"
ok "  Panel UI  → http://localhost:${PANEL_PORT}/"
ok "  KS Health → http://localhost:${KNOWLEDGE_PORT}/health"
