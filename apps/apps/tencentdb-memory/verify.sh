#!/usr/bin/env bash
# 干跑校驗：不啟動任何容器，只檢查環境是否就緒。
#
# 用法：
#   ./verify.sh               # 預設全檢（含 LLM 通路預檢）
#   ./verify.sh --skip-llm    # 跳過 LLM 檢查（離線環境或不希望發外部請求時用）
#
# 檢查項：
#   1. docker 命令可用
#   2. .env 文件存在
#   3. .env 中所有必填引數已填寫（非 REPLACE_ME 且非空）
#   4. 三個映象是否已在本地（未在本地也不算失敗，只 warn）
#   5. 目標埠是否被佔用
#   6. LLM 上游通路（memory 組 + proxy 組，各自預檢）
#      - openai 協議：GET {base}/models，不消耗 token
#      - anthropic 協議：POST {base}/v1/messages max_tokens=1，消耗 ≤ 10 token
#      - 若容器已執行，額外 docker exec 從容器內再打一次（驗證容器 → LLM 網路可達）
#
# 全部通過 → exit 0；有錯 → exit 1；只 warn → exit 0

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_lib.sh
source "$SCRIPT_DIR/_lib.sh"

SKIP_LLM=0
for arg in "$@"; do
  case "$arg" in
    --skip-llm) SKIP_LLM=1 ;;
    --help|-h)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *) warn "未知引數: ${arg}（忽略）" ;;
  esac
done

ERRORS=0
WARNS=0
CURL=/usr/bin/curl

# ─── LLM 通路檢查函式 ───────────────────────────────────────────────
# check_llm_openai <label> <base_url> <api_key> <model>
#   OpenAI 相容：GET {base}/models 只驗證 auth+URL，不消耗 token。
#   base_url 允許帶或不帶 /v1；這裡做歸一化。
check_llm_openai() {
  local label="$1" base="$2" key="$3" model="$4"
  # 歸一化：去尾部 /，去 /messages 或 /chat/completions 字尾
  base="${base%/}"
  base="${base%/messages}"
  base="${base%/chat/completions}"
  local url="${base}/models"
  local code body_file=/tmp/llm-check.$$
  code=$("$CURL" -sS --max-time 10 -o "$body_file" -w "%{http_code}" \
    -H "Authorization: Bearer $key" \
    "$url" 2>/dev/null || echo "000")
  if [[ "$code" == "200" ]]; then
    # 嘗試解析 model 是否在列表里（寬鬆匹配，不匹配也只 warn）
    if grep -q "\"$model\"" "$body_file" 2>/dev/null; then
      ok "$label OpenAI 協議通路 OK（$model 在 /models 列表內）"
    else
      ok "$label OpenAI 協議通路 OK（未在 /models 里顯式列出 ${model}，業務側仍可能可用）"
    fi
    rm -f "$body_file"
    return 0
  elif [[ "$code" == "401" || "$code" == "403" ]]; then
    echo "${C_RED}[error]${C_RST} $label API key 無效（HTTP ${code}）：$url" >&2
    head -c 200 "$body_file" >&2; echo >&2
    rm -f "$body_file"
    return 1
  elif [[ "$code" == "404" ]]; then
    # 部分廠商沒有 /models 端點，改用 anthropic 風格或跳過：warn 不 error
    warn "$label GET /models 404 —— 該廠商可能沒有該端點，改用 anthropic 協議檢查"
    check_llm_anthropic "$label" "$base" "$key" "$model"
    rm -f "$body_file"
    return $?
  else
    warn "$label 無法訪問 ${url}（HTTP=${code}）$(head -c 100 "$body_file" 2>/dev/null)"
    rm -f "$body_file"
    return 1
  fi
}

# check_llm_anthropic <label> <base_url> <api_key> <model>
#   Anthropic：POST {base}/v1/messages 發 max_tokens=1，消耗 ≤ 10 token 但能同時驗 URL/auth/model。
check_llm_anthropic() {
  local label="$1" base="$2" key="$3" model="$4"
  base="${base%/}"
  # 歸一化：若已含 /messages 直接用；否則拼 /v1/messages
  local url
  if [[ "$base" == */messages ]]; then
    url="$base"
  elif [[ "$base" == */v1 ]]; then
    url="${base}/messages"
  else
    url="${base}/v1/messages"
  fi
  local code body_file=/tmp/llm-check.$$
  code=$("$CURL" -sS --max-time 15 -o "$body_file" -w "%{http_code}" \
    -X POST -H "Content-Type: application/json" \
    -H "x-api-key: $key" \
    -H "Authorization: Bearer $key" \
    -H "anthropic-version: 2023-06-01" \
    -d "{\"model\":\"$model\",\"max_tokens\":1,\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}]}" \
    "$url" 2>/dev/null || echo "000")
  case "$code" in
    200)
      ok "$label Anthropic 協議通路 OK（模型 $model 已應答）"
      rm -f "$body_file"; return 0 ;;
    401|403)
      echo "${C_RED}[error]${C_RST} $label API key 無效（HTTP ${code}）：$url" >&2
      head -c 200 "$body_file" >&2; echo >&2
      rm -f "$body_file"; return 1 ;;
    404)
      echo "${C_RED}[error]${C_RST} $label URL 不存在（HTTP 404）：$url —— 檢查 BASE_URL" >&2
      rm -f "$body_file"; return 1 ;;
    400)
      # 400 常見於模型名不存在或 body 校驗失敗
      if grep -qE "model.*not.*found|invalid.*model|model_not_found" "$body_file" 2>/dev/null; then
        echo "${C_RED}[error]${C_RST} $label 模型名 '$model' 無效（HTTP 400）" >&2
        rm -f "$body_file"; return 1
      fi
      warn "$label HTTP 400（可能是引數格式問題，非通路錯）：$(head -c 150 "$body_file")"
      rm -f "$body_file"; return 0 ;;
    *)
      warn "$label 無法訪問 ${url}（HTTP=${code}）$(head -c 100 "$body_file" 2>/dev/null)"
      rm -f "$body_file"; return 1 ;;
  esac
}

# check_llm_group <label> <base_url> <api_key> <model> <protocol>
check_llm_group() {
  local label="$1" base="$2" key="$3" model="$4" proto="${5:-openai}"
  info "檢查 $label 通路（協議=${proto}，base=${base}，model=${model}）..."
  case "$proto" in
    anthropic) check_llm_anthropic "$label" "$base" "$key" "$model" ;;
    *)         check_llm_openai    "$label" "$base" "$key" "$model" ;;
  esac
}

# 容器內 curl 驗證（可選，容器已執行時才做）
check_llm_from_container() {
  local container="$1" label="$2" base="$3" key="$4" model="$5" proto="${6:-openai}"
  if ! $DOCKER ps --format '{{.Names}}' | grep -qx "$container"; then
    return 0  # 容器沒跑，跳過（非錯誤）
  fi
  info "  ↳ 從容器 $container 內部再打一次 $label..."
  # 關注點是"網路可達"：只要能拿到任何 HTTP 狀態碼就算通；000 才算不可達。
  # auth 錯在宿主機側已經報過，容器內不再重複觸發 error。
  local url code
  case "$proto" in
    anthropic)
      base="${base%/}"; [[ "$base" == */messages ]] || base="${base}/v1/messages"
      url="$base"
      code=$($DOCKER exec "$container" curl -sS -o /dev/null --max-time 15 \
         -w "%{http_code}" -X POST -H "Content-Type: application/json" \
         -H "x-api-key: $key" -H "anthropic-version: 2023-06-01" \
         -d "{\"model\":\"$model\",\"max_tokens\":1,\"messages\":[{\"role\":\"user\",\"content\":\"ping\"}]}" \
         "$url" 2>/dev/null || echo "000")
      ;;
    *)
      base="${base%/}"; base="${base%/v1}"
      url="${base}/v1/models"
      code=$($DOCKER exec "$container" curl -sS -o /dev/null --max-time 10 \
         -w "%{http_code}" -H "Authorization: Bearer $key" "$url" 2>/dev/null || echo "000")
      ;;
  esac
  if [[ "$code" == "000" ]]; then
    warn "  容器 ${container} 無法訪問 ${url}（網路隔離 / DNS 失敗）"
    WARNS=$((WARNS+1))
  else
    ok "  容器 ${container} → $label 網路可達（HTTP ${code}）"
  fi
}

# 1. docker
if command -v "$DOCKER" >/dev/null 2>&1 || [[ -x "$DOCKER" ]]; then
  ok "docker 可用: $DOCKER"
else
  ERRORS=$((ERRORS+1))
  echo "${C_RED}[error]${C_RST} docker 不可用" >&2
fi

# 2. .env
if [[ ! -f "$ENV_FILE" ]]; then
  ERRORS=$((ERRORS+1))
  echo "${C_RED}[error]${C_RST} $ENV_FILE 不存在。執行：cp .env.example .env" >&2
else
  ok ".env 存在"
  set -a; source "$ENV_FILE"; set +a

  # 3. 必填引數
  MISSING=()
  for var in \
    MEMORY_CORE_IMAGE MEMORY_HUB_IMAGE PROXY_IMAGE \
    MEMORY_CORE_PORT PANEL_PORT KNOWLEDGE_PORT PROXY_PORT \
    MEMORY_CORE_VOLUME PANEL_VOLUME \
    MEMORY_LLM_BASE_URL MEMORY_LLM_API_KEY MEMORY_LLM_MODEL \
    KNOWLEDGE_PUBLIC_BASE_URL \
    PROXY_UPSTREAM_URL PROXY_UPSTREAM_API_KEY PROXY_UPSTREAM_MODEL; do
    val="${!var:-}"
    if [[ -z "$val" || "$val" == "REPLACE_ME" ]]; then
      MISSING+=("$var")
    fi
  done
  if (( ${#MISSING[@]} > 0 )); then
    ERRORS=$((ERRORS+1))
    echo "${C_RED}[error]${C_RST} 以下必填引數未設定：${MISSING[*]}" >&2
  else
    ok "所有必填引數已填寫"
  fi

  # 4. 映象是否本地存在
  for img_var in MEMORY_CORE_IMAGE MEMORY_HUB_IMAGE PROXY_IMAGE; do
    img="${!img_var:-}"
    if [[ -z "$img" ]]; then continue; fi
    if $DOCKER image inspect "$img" >/dev/null 2>&1; then
      ok "映象本地已存在: $img"
    else
      WARNS=$((WARNS+1))
      warn "映象本地不存在，啟動時會 pull: $img"
    fi
  done

  # 5. 埠占用（僅提醒）
  for port_var in MEMORY_CORE_PORT PANEL_PORT KNOWLEDGE_PORT PROXY_PORT; do
    port="${!port_var:-}"
    if [[ -z "$port" ]]; then continue; fi
    if lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      WARNS=$((WARNS+1))
      warn "埠 $port ($port_var) 已被佔用，啟動前請釋放或在 .env 改埠"
    else
      ok "埠 $port ($port_var) 空閒"
    fi
  done

  # 6. LLM 通路（預設檢查，--skip-llm 跳過）
  if (( SKIP_LLM == 1 )); then
    info "跳過 LLM 通路檢查（--skip-llm）"
  elif (( ${#MISSING[@]} > 0 )); then
    warn "跳過 LLM 通路檢查（必填引數未填齊）"
  else
    echo ""
    info "═══ LLM 通路檢查 ═══════════════════════════════════════"

    # memory 組
    if ! check_llm_group "memory 組" "$MEMORY_LLM_BASE_URL" "$MEMORY_LLM_API_KEY" \
         "$MEMORY_LLM_MODEL" "${MEMORY_LLM_PROTOCOL:-openai}"; then
      ERRORS=$((ERRORS+1))
    fi
    # 容器已執行則容器內也驗一次
    check_llm_from_container tdai-memory-hub "memory 組 (from container)" \
      "$MEMORY_LLM_BASE_URL" "$MEMORY_LLM_API_KEY" "$MEMORY_LLM_MODEL" \
      "${MEMORY_LLM_PROTOCOL:-openai}"

    # proxy 組（如果與 memory 組值完全一樣，說明使用者填的是同一份，只驗 1 次即可）
    if [[ "$PROXY_UPSTREAM_URL" == "$MEMORY_LLM_BASE_URL" && \
          "$PROXY_UPSTREAM_API_KEY" == "$MEMORY_LLM_API_KEY" && \
          "$PROXY_UPSTREAM_MODEL" == "$MEMORY_LLM_MODEL" ]]; then
      ok "proxy 組 與 memory 組完全相同，跳過重複檢查"
    else
      # proxy 組預設按 openai 協議（與 config.yaml 一致）
      if ! check_llm_group "proxy 組" "$PROXY_UPSTREAM_URL" "$PROXY_UPSTREAM_API_KEY" \
           "$PROXY_UPSTREAM_MODEL" openai; then
        ERRORS=$((ERRORS+1))
      fi
      check_llm_from_container tdai-proxy "proxy 組 (from container)" \
        "$PROXY_UPSTREAM_URL" "$PROXY_UPSTREAM_API_KEY" "$PROXY_UPSTREAM_MODEL" openai
    fi
  fi
fi

echo ""
if (( ERRORS > 0 )); then
  echo "${C_RED}✗ ${ERRORS} 個錯誤，${WARNS} 個警告 —— 無法啟動${C_RST}" >&2
  exit 1
elif (( WARNS > 0 )); then
  echo "${C_YLW}⚠ ${WARNS} 個警告 —— 可以啟動，但請注意上面的提示${C_RST}"
  exit 0
else
  echo "${C_GRN}✓ 全部檢查通過 —— 可以直接 ./start-all.sh${C_RST}"
  exit 0
fi
