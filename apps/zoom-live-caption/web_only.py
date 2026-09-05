"""
web_only.py — Headless 模式啟動檔
無 GUI，僅啟動 Web 串流伺服器
"""
import sys
import os
import asyncio
import threading
import time
import socket

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def get_local_ip() -> str:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def main():
    import yaml
    from zoom_caption.web_streamer import WebStreamer

    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.yaml')
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    web_cfg = config.get('web_stream', {})
    http_port = web_cfg.get('http_port', 8080)
    ws_port = web_cfg.get('ws_port', 8081)
    ws_host = web_cfg.get('ws_host', '')

    print("=" * 50)
    print("  Zoom Live Caption — Headless Mode")
    print("=" * 50)

    # 啟動 Web 串流伺服器
    streamer = WebStreamer(
        http_port=http_port,
        ws_port=ws_port,
        host="0.0.0.0",
        static_dir=os.path.join(os.path.dirname(os.path.abspath(__file__)), "zoom_caption"),
        ws_host=ws_host
    )
    streamer.start()

    local_ip = get_local_ip()
    print(f"\n[分享] 其他人可用此連結即時觀看字幕:")
    print(f"  http://{local_ip}:{http_port}/viewer.html")
    print(f"\n按 Ctrl+C 停止\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[停止] 伺服器已停止")
        streamer.stop()


if __name__ == "__main__":
    main()
