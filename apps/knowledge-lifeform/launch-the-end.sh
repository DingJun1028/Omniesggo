#!/usr/bin/env bash
# launch-the-end.sh — 永恆生命力啟動器 (真實版)
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
echo "🌌 啟動永恆生命力計..."
"$DIR/life-genesis.sh"
echo "✓ 生命力核心已啟動"
echo "📊 查看狀態: cat C:/Project/esggo/vault/.system/life-force-energy.json"
echo "🌐 儀表板: 在 Hermes 桌面 app 用 open_preview 開 $DIR/holorama.html"
echo "🔄 每日自動進化: cron 02c49b0ce20d (04:00)"
