#!/usr/bin/env bash
# 停止並移除三件套容器。
#
# 用法：
#   ./stop-all.sh              # 停容器，保留 volume（資料保留）
#   ./stop-all.sh --purge      # 停容器 + 刪 volume + 刪網路（徹底清理）

set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=./_lib.sh
source "$SCRIPT_DIR/_lib.sh"

PURGE=0
if [[ "${1:-}" == "--purge" ]]; then
  PURGE=1
fi

# .env 不存在時也允許執行（用預設卷名兜底）
if [[ -f "$ENV_FILE" ]]; then
  set -a; source "$ENV_FILE"; set +a
fi
MEMORY_CORE_VOLUME="${MEMORY_CORE_VOLUME:-tdai-memory-core-data}"
PANEL_VOLUME="${PANEL_VOLUME:-tdai-panel-data}"

for c in tdai-proxy tdai-memory-hub tdai-memory-core; do
  if $DOCKER ps -a --format '{{.Names}}' 2>/dev/null | grep -qx "$c"; then
    info "停止並移除 $c"
    $DOCKER rm -f "$c" >/dev/null
  else
    info "$c 未執行，跳過"
  fi
done

if (( PURGE == 1 )); then
  warn "--purge 已啟用：刪除 volume + 網路 + admin key 檔案"
  for v in "$MEMORY_CORE_VOLUME" "$PANEL_VOLUME"; do
    if $DOCKER volume inspect "$v" >/dev/null 2>&1; then
      $DOCKER volume rm "$v" >/dev/null && ok "已刪除 volume $v" || warn "刪除 volume $v 失敗"
    fi
  done
  if $DOCKER network inspect tdai-memory-stack >/dev/null 2>&1; then
    $DOCKER network rm tdai-memory-stack >/dev/null && ok "已刪除網路 tdai-memory-stack" || true
  fi
  # admin key 與 volume 強繫結，purge volume 必須同步清 key，否則下次啟動會讀到
  # 舊 key 但 volume 是新的，auth 校驗會失敗。
  ADMIN_KEY_FILE="${MEMORY_CORE_ADMIN_KEY_FILE:-$SCRIPT_DIR/.admin-key}"
  if [[ -f "$ADMIN_KEY_FILE" ]]; then
    rm -f "$ADMIN_KEY_FILE" && ok "已刪除 admin key 檔案 $ADMIN_KEY_FILE"
  fi
  # 順帶清 proxy / memory-core 生成的 config
  PROXY_CFG_DIR="${PROXY_CONFIG_DIR:-$SCRIPT_DIR/.proxy-config}"
  if [[ -d "$PROXY_CFG_DIR" ]]; then
    rm -rf "$PROXY_CFG_DIR" && ok "已刪除 proxy config 目錄 $PROXY_CFG_DIR"
  fi
  CORE_CFG_DIR="${MEMORY_CORE_CONFIG_DIR:-$SCRIPT_DIR/.memory-core-config}"
  if [[ -d "$CORE_CFG_DIR" ]]; then
    rm -rf "$CORE_CFG_DIR" && ok "已刪除 memory-core config 目錄 $CORE_CFG_DIR"
  fi
fi

ok "完成。"
