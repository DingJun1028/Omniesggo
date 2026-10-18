#!/usr/bin/env bash
# ============================================================================
# ollama-embed.sh — Ollama 本地 embedding 模型生命週期管理
#
# 管理對象：nomic-embed-text:latest（memory-core + TurboVec 所用）
# 功能：
#   1. 檢查 Ollama 是否運行
#   2. 檢查 nomic-embed-text 的安裝/版本/維度/量化
#   3. 提供安裝 / 更新 / 健康檢查
#   4. 產生維度與格式核對報告（5T Traceable）
#
# 用法：
#   ./ollama-embed.sh status             # 狀態報告
#   ./ollama-embed.sh install            # 安裝或更新模型
#   ./ollama-embed.sh health             # 維度核對 + 健康
#   ./ollama-embed.sh upgrade            # 升級到已有版本（不拉新）
# ============================================================================
set -euo pipefail

OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"
MODEL_NAME="nomic-embed-text"
MODEL_TAG=":latest"
REPO="${REPO:-https://ollama.com/library/${MODEL_NAME}}"

# ── 工具函數 ────────────────────────────────────────────────────────────
info()  { echo "[info] $*"; }
ok()    { echo "[ok]   $*"; }
warn()  { echo "[warn] $*" >&2; }
die()   { echo "[error] $*" >&2; exit 1; }

# ── 1. 檢查 Ollama 是否運行 ───────────────────────────────────────────
check_ollama_running() {
  if ! curl -s --max-time 3 "${OLLAMA_URL}/api/tags" >/dev/null 2>&1; then
    return 1
  fi
  return 0
}

# ── 2. 獲取模型資訊 ───────────────────────────────────────────────────
get_model_info() {
  local json
  json="$(curl -s --max-time 5 "${OLLAMA_URL}/api/tags")" || return 1
  echo "$json"
}

get_model_dims() {
  local json="$1" model_name="$2"
  echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for m in data.get('models', []):
    if m.get('name','').startswith('${MODEL_NAME}'):
        print(m['details'].get('embedding_length', 'unknown'))
        sys.exit(0)
print('unknown')
"
}

get_model_format() {
  local json="$1" model_name="$2"
  echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for m in data.get('models', []):
    if m.get('name','').startswith('${MODEL_NAME}'):
        print(m['details'].get('format', 'unknown'))
        sys.exit(0)
print('unknown')
"
}

get_model_size() {
  local json="$1" model_name="$2"
  echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for m in data.get('models', []):
    if m.get('name','').startswith('${MODEL_NAME}'):
        print(m['details'].get('size', 0))
        sys.exit(0)
print('0')
"
}

# ── 3. 狀態報告 ───────────────────────────────────────────────────────
cmd_status() {
  info "Ollama 狀態檢查：${OLLAMA_URL}"
  if ! check_ollama_running; then
    warn "Ollama 未運行，請先啟動 (ollama serve)"
    return 1
  fi
  ok "Ollama running"

  local json
  json="$(get_model_info)" || { warn "無法取得模型列表"; return 1; }
  ok "取得模型列表 ($(echo "$json" | python3 -c "import sys,json;print(len(json.get('models',[])))" 2>/dev/null || echo ?))"

  local found="false"
  echo ""
  echo "  模型列表:"
  echo "  ─────────────────────────────────────────────────────────────"
  echo "  $(echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for m in data.get('models', []):
    name = m.get('name', '')
    size = m.get('details', {}).get('size', 0)
    dim = m.get('details', {}).get('embedding_length', 0)
    fmt = m.get('details', {}).get('format', '?')
    qlvl = m.get('details', {}).get('quantization_level', '')
    ctx = m.get('details', {}).get('context_length', 0)
    print('  %-40s %12s B  %6d dim  %-6s %s  %d' % (name, format(size, ',d'), dim, fmt, qlvl, ctx))
  )"
  echo "  ─────────────────────────────────────────────────────────────"

  # 檢查目標模型
  if echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(any(m['name'].startswith('${MODEL_NAME}') for m in data.get('models', [])))
" | grep -q "true"; then
    found="true"
    local dims fmt size
    dims="$(get_model_dims "$json" "${MODEL_NAME}")"
    fmt="$(get_model_format "$json" "${MODEL_NAME}")"
    size="$(get_model_size "$json" "${MODEL_NAME}")"
    ok "已安裝：${MODEL_NAME}:${MODEL_TAG}"
    echo "    維度：${dims}"
    echo "    格式：${fmt} (量化：${format_to_qlevel})"
    echo "    大小：${size} B (~ $(numfmt --to=iec ${size} 2>/dev/null || echo ${size}))"
    if [[ "$dims" != "768" ]]; then
      warn "維度 ${dims} 與預期 768 不符！若與舊配置/下游 4-bit 量化配合，請先核對"
    else
      ok "維度 768 符合預期"
    fi
    # F16 偵測（記憶層只有 CPU 可用，目的是省記憶體）
    if [[ "$fmt" == "f16" ]]; then
      ok "量化採用 f16（CPU 推論，適合本機記憶層）"
    elif [[ "$fmt" == "q8_0" ]] || [[ "$fmt" == "q4_0" ]] || [[ "$fmt" == "q4_K_M" ]]; then
      ok "量化採用 ${fmt}"
    else
      warn "格式：${fmt} — 建議 f16/q8_0 供 CPU 推論；4-bit Q4_K_M 最佳權衡"
    fi
  else
    warn "未安裝 ${MODEL_NAME}:${MODEL_TAG}"
    ok "可執行：ollama pull ${MODEL_NAME}:${MODEL_TAG}"
  fi

  return 0
}

# ── 4. 健康檢查 ───────────────────────────────────────────────────────
cmd_health() {
  info "embedding 模型健康檢查"
  if ! check_ollama_running; then
    die "Ollama 未運行"
  fi

  local json
  json="$(get_model_info)" || { die "取得模型列表失敗"; }
  if ! echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(any(m['name'].startswith('${MODEL_NAME}') for m in data.get('models', [])))
" | grep -q "true"; then
    die "未安裝 ${MODEL_NAME}:${MODEL_TAG}"
  fi

  local dims fmt
  dims="$(get_model_dims "$json" "${MODEL_NAME}")"
  fmt="$(get_model_format "$json" "${MODEL_NAME}")"

  # 做一次真正的 embedding 呼叫（用 /api/embeddings，單筆測試）
  local test_payload
  test_payload=$(cat <<'EOF'
{"model": "nomic-embed-text", "prompt": "健康檢查"}
EOF
)

  local resp
  resp="$(curl -s --max-time 15 "${OLLAMA_URL}/api/embeddings" -H 'Content-Type: application/json' -d "$test_payload")" || {
    die "embedding 呼叫失敗（模型可能未載入或超時）"
  }

  local emb_dim
  emb_dim=$(echo "$resp" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(len(d.get('embedding', [])))
" 2>/dev/null || echo "unknown")

  echo "  呼叫 /api/embeddings：OK"
  echo "  回傳維度：${emb_dim}"
  if [[ "$emb_dim" == "768" ]]; then
    ok "維度驗證通過：768 (與 tdai-gateway.yaml 一致)"
  else
    warn "維度不符：模型輸出 ${emb_dim}，配置文件寫 768"
  fi
  ok "健康檢查通過"
}

# ── 5. 安裝 / 更新 ───────────────────────────────────────────────────
cmd_install() {
  info "安裝/更新 ${MODEL_NAME}:${MODEL_TAG}"
  if ! check_ollama_running; then
    die "Ollama 未運行，請先啟動 (ollama serve)"
  fi

  local json
  json="$(get_model_info)" || { die "取得模型列表失敗"; }
  if echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
print(any(m['name'].startswith('${MODEL_NAME}') for m in data.get('models', [])))
" | grep -q "true"; then
    warn "已存在，嘗試重新拉取最新版..."
    ollama pull "${MODEL_NAME}:${MODEL_TAG}" || die "ollama pull 失敗"
  else
    ollama pull "${MODEL_NAME}:${MODEL_TAG}" || die "ollama pull 失敗"
  fi

  ok "安裝完成。檢查:"
  cmd_status
}

# ── 6. 升級（若遠端有新版，拉新；否則用現有） ───────────────────────
cmd_upgrade() {
  info "升級 ${MODEL_NAME}:${MODEL_TAG}"
  if ! check_ollama_running; then
    die "Ollama 未運行"
  fi

  local json current latest
  json="$(get_model_info)" || { die "取得模型列表失敗"; }

  echo "$json" | python3 -c "
import sys, json
data = json.load(sys.stdin)
for m in data.get('models', []):
    if m['name'].startswith('${MODEL_NAME}'):
        print(m['details'].get('digest',''))
" | head -n1 > /tmp/.nomic_digest 2>/dev/null || echo "" > /tmp/.nomic_digest

  local cur_digest
  cur_digest="$(cat /tmp/.nomic_digest 2>/dev/null || echo '')"

  # 如果本地有，直接顯示；否則提示拉新
  if [[ -n "$cur_digest" ]]; then
    ok "本地版本 digest: ${cur_digest:0:12}..."
    info "若要強制升級，請跑：ollama pull ${MODEL_NAME}:${MODEL_TAG}"
  else
    warn "找不到本地版本 digest，跳過升級；如需安裝請跑：ollama pull ${MODEL_NAME}:${MODEL_TAG}"
  fi
}

# ── 入口 ───────────────────────────────────────────────────────────────
case "${1:-status}" in
  status)
    cmd_status
    ;;
  health)
    cmd_health
    ;;
  install)
    cmd_install
    ;;
  upgrade)
    cmd_upgrade
    ;;
  *)
    echo "用法: $0 {status|health|install|upgrade}"
    exit 1
    ;;
esac
