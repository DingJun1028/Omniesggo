#!/bin/bash
# recover_omnilive1.sh — Omnilive1 ESGGO 服務復原腳本
# 設計目標：Linux VPS 上的 omnilive1.esggo.co 從掛掉、502、無回應等狀態恢復
# 使用方式: sudo bash recover_omnilive1.sh
# 作者: OA-Team 萬能蜂群 (Omni-Bee Colony)
# 版本: v0.1.0
# 協議: 5T 合規 (Traceable / Trackable / Tangible / Transparent / Trustworthy)

set -euo pipefail

##############################################################################
# 1. 配置常數 (可自訂於部署環境)
##############################################################################
APP_NAME="omnilive"
APP_DIR="/opt/$APP_NAME"
DOCKER_COMPOSE_FILE="$APP_DIR/docker-compose.yml"
NGINX_CONF="/etc/nginx/sites-available/$APP_NAME"
NGINX_ENABLED="/etc/nginx/sites-enabled/$APP_NAME"
PORTS=(8001 8002)          # 容災：若一個埠被佔，改用下一個
TIMEOUT=30                 # 健康檢查等待上限 (秒)
LOG_TAG="[recover_omnilive1]"

##############################################################################
# 2. 日誌輔助 (Trackable 輸出)
##############################################################################
log()  { echo "$LOG_TAG $*" | tee -a /var/log/recover_omnilive1.log; }
warn() { log "WARN:  $*"; }
err()  { log "ERROR: $*" >&2; }

##############################################################################
# 3. 環境前置檢查
##############################################################################
need_sudo() {
  if [ "$(id -u)" -ne 0 ]; then
    err "必須以 root 執行：sudo bash recover_omnilive1.sh"
    exit 1
  fi
}

require_commands() {
  local missing=()
  for cmd in docker docker-compose nginx curl; do
    if ! command -v "$cmd" &>/dev/null; then
      missing+=("$cmd")
    fi
  done
  if [ ${#missing[@]} -gt 0 ]; then
    err "缺少指令: ${missing[*]}"
    err "請安裝 Docker + nginx + curl 後重試"
    exit 1
  fi
}

##############################################################################
# 4. 判斷空閒埠
##############################################################################
find_free_port() {
  local candidate="$1"
  if ss -tlnp | grep -q ":$candidate "; then
    warn "埠 $candidate 已被佔用，改用偏移 +1"
    echo $((candidate + 1))
  else
    echo "$candidate"
  end
}

##############################################################################
# 5. Docker 映像 & 容器健康檢查 (Trackable)
##############################################################################
docker_ready() {
  if ! docker info &>/dev/null; then
    err "Docker daemon 未就緒"
    return 1
  fi
  log "Docker daemon 正常"
  return 0
}

container_running() {
  docker ps --format '{{.Names}}' | grep -q "^${APP_NAME}\.\|^${APP_NAME}$"
}

##############################################################################
# 6. 復原主流程
##############################################################################
recover() {
  log "開始復原 ${APP_NAME} ..."

  # 6a. 確認目錄存在
  if [ ! -d "$APP_DIR" ]; then
    err "應用目錄不存在: $APP_DIR"
    err "請確認 docker-compose.yml 已放置於 $APP_DIR"
    exit 1
  fi
  log "應用目錄存在: $APP_DIR"

  # 6b. 撿回 / 重建 container
  cd "$APP_DIR"

  if container_running; then
    log "容器已在運行，直接重啟以刷新配置 ..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down 2>&1 | log "down: %s"
  else
    log "容器未運行，將從鏡像重建 ..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" pull 2>&1 | log "pull: %s"
    docker-compose -f "$DOCKER_COMPOSE_FILE" up -d --build 2>&1 | log "up: %s"
  fi

  # 6c. 確認容器起來
  log "等待容器啟動 (最多 ${TIMEOUT}s) ..."
  for i in $(seq 1 $TIMEOUT); do
    if container_running; then
      log "容器已啟動"
      break
    fi
    sleep 1
    if [ "$i" -eq "$TIMEOUT" ]; then
      err "容器在 ${TIMEOUT}s 內仍未啟動"
      docker-compose -f "$DOCKER_COMPOSE_FILE" logs 2>&1 | log "logs: %s"
      exit 1
    fi
  done

  # 6d. 選擇可用埠並確認 nginx 指向正確
  local chosen_port
  chosen_port=$(find_free_port "${PORTS[0]}")
  log "選用埠: $chosen_port"

  if [ -f "$NGINX_CONF" ]; then
    log "更新 nginx 配置指向埠 $chosen_port ..."
    # 容災：保留原配置，直接覆寫 upstream 埠
    sed -i "s/\${APP_PORT:-[0-9]*}/$chosen_port/g" "$NGINX_CONF" 2>/dev/null \
      || sed -i "s/listen[[:space:]]*[[:digit:]]\+;/listen $chosen_port;/" "$NGINX_CONF" 2>/dev/null \
      || true
    nginx -t 2>&1 && nginx -s reload 2>&1 | log "nginx reload: %s"
  else
    warn "nginx 配置檔案缺失: $NGINX_CONF — 跳過 nginx 刷新"
  fi

  # 6e. 健康檢查 (Tangible)
  sleep 3
  local health_url="http://localhost:$chosen_port/health"
  if curl -fsS --max-time 5 "$health_url" >/dev/null 2>&1; then
    log "健康檢查通過: $health_url"
  else
    warn "健康端點未回應: $health_url"
    warn "服務可能已恢復但尚無 /health 路由"
  fi

  log "復原流程結束，狀態: $(container_running && echo 'RUNNING' || echo 'DOWN')"
}

##############################################################################
# 7. 主程序入口
##############################################################################
main() {
  need_sudo
  require_commands
  docker_ready
  recover
}

main "$@"
