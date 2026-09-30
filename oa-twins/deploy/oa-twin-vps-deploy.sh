#!/usr/bin/env bash
# ============================================================
# OA-Twins :: VPS 端部署 — 把 OAB broker 同步到 OA-VPS
# ============================================================
# 貫徹始終規定：5T（Traceable 來源 / Trackable 步驟 / Trustworthy 不可篡改）
# 用法（在 VPS 上）：
#   bash deploy/oa-twin-vps-deploy.sh /opt/esggo/oab
# 預期：建立 /opt/esggo/oab，複製 broker.py，並以 systemd 常駐雙子總線。

set -euo pipefail

TARGET="${1:-/opt/esggo/oab}"
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

log() { echo "[OA-Twins] $*"; }

log "目標目錄: $TARGET"
mkdir -p "$TARGET"

# 1) 複製核心（Traceable：來源為本 repo oa-twins/oab/broker.py）
install -m 0644 "$SRC_DIR/oab/broker.py" "$TARGET/broker.py"
log "broker.py 已複製 -> $TARGET/broker.py"

# 2) 健康檢查腳本同步
install -m 0644 "$SRC_DIR/bin/oa-twin-health.py" "$TARGET/oa-twin-health.py"
log "oa-twin-health.py 已複製"

# 3) 語法驗證（零幻覺：真的跑起來才算）
python3 -m py_compile "$TARGET/broker.py" "$TARGET/oa-twin-health.py"
log "py_compile 通過"

# 3b) 自檢回歸（真的跑，不是推定）
python3 "$TARGET/broker.py" --self-test  || { log "!! self-test 失敗"; exit 1; }
python3 "$TARGET/broker.py" --twin-test  || { log "!! twin-test 失敗"; exit 1; }
python3 "$TARGET/broker.py" --rotate-test || { log "!! rotate-test 失敗"; exit 1; }
log "三段自檢通過"

# 4) systemd 常駐（可自理 / 可演化）
UNIT="$TARGET/oa-twin-oab.service"
cat > "$UNIT" <<EOF
[Unit]
Description=OA-Twins OAB Broker (OA-VPS side)
After=network.target

[Service]
Type=simple
WorkingDirectory=$TARGET
ExecStart=/usr/bin/python3 $TARGET/broker.py --bus vps --instance oa-vps --store $TARGET --max-journal-bytes 33554432 --keep-archives 5 --max-archive-bytes 268435456
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
log "systemd unit 已寫入 $UNIT"

log "完成。手動啟動："
log "  sudo cp $UNIT /etc/systemd/system/ && sudo systemctl daemon-reload"
log "  sudo systemctl enable --now oa-twin-oab"
log "驗證：  systemctl status oa-twin-oab && journalctl -u oa-twin-oab -n 20"
