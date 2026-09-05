#!/bin/bash
# docker-entrypoint.sh — 根據 RUN_MODE 決定啟動模式
set -e

echo "========================================"
echo "  Zoom Live Caption"
echo "  Run Mode: ${RUN_MODE:-headless}"
echo "========================================"

# 檢查必要環境變數
if [ -z "$OLLAMA_API_KEY" ]; then
    echo "[WARN] OLLAMA_API_KEY 未設定，翻譯功能可能無法運作"
fi

# 根據模式啟動
case "${RUN_MODE}" in
    "gui")
        echo "[啟動] GUI 模式 (需要 DISPLAY)"
        if [ -z "$DISPLAY" ]; then
            echo "[ERROR] GUI 模式需要設定 DISPLAY 環境變數"
            exit 1
        fi
        exec python main.py
        ;;
    "headless")
        echo "[啟動] Headless 模式 (僅 Web 串流)"
        echo "[啟動] 監聽 port 8080 (HTTP) / 8081 (WebSocket)"
        exec python web_only.py
        ;;
    *)
        echo "[ERROR] 未知的 RUN_MODE: $RUN_MODE"
        echo "  可用模式: gui, headless"
        exit 1
        ;;
esac
