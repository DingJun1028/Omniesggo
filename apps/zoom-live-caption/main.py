"""
main.py — Zoom Live Caption 入口
"""
import sys
import os
import signal
import yaml
import socket
from PyQt5.QtWidgets import QApplication, QSystemTrayIcon, QMenu, QAction
from PyQt5.QtGui import QIcon, QFont
from PyQt5.QtCore import QTimer

# 加入專案根目錄到 path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def get_local_ip() -> str:
    """取得本機 IP 位址"""
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "127.0.0.1"


def main():
    # 載入設定
    config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'config.yaml')
    with open(config_path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f)

    # 初始化翻譯金鑰 (從環境變數)
    trans_cfg = config.get('translation', {})
    api_key_env = trans_cfg.get('api_key_env', 'OLLAMA_API_KEY')
    api_key = os.environ.get(api_key_env, '')
    if not api_key:
        print(f"[警告] 未設定環境變數 {api_key_env}", flush=True)

    # 建立 app
    app = QApplication(sys.argv)
    app.setFont(QFont("Microsoft JhengHei", 10))

    # 建立主視窗
    from zoom_caption.overlay import CaptionWindow
    window = CaptionWindow(config)

    # 建立系統托盤
    tray = QSystemTrayIcon(app)
    # 使用文字圖示 (無圖示資源時)
    menu = QMenu()

    show_action = QAction("顯示字幕")
    show_action.triggered.connect(window.show)
    menu.addAction(show_action)

    hide_action = QAction("隱藏字幕")
    hide_action.triggered.connect(window.hide)
    menu.addAction(hide_action)

    menu.addSeparator()

    share_action = QAction("複製分享連結")
    share_action.setVisible(False)  # 等 web_streamer 啟動後再顯示
    menu.addAction(share_action)

    menu.addSeparator()

    quit_action = QAction("離開")
    quit_action.triggered.connect(app.quit)
    menu.addAction(quit_action)

    tray.setContextMenu(menu)
    tray.show()

    # 建立協調器
    from zoom_caption.orchestrator import Orchestrator
    orch = Orchestrator(config)

    # 設定翻譯金鑰
    if api_key:
        orch.translator.api_key = api_key

    # 連線字幕回呼
    window.signals.new_caption.connect(
        lambda s, t, d: window._update_caption(s, t, d)
    )
    orch.set_caption_callback(
        lambda s, t, d: window.signals.new_caption.emit(s, t, d)
    )

    # 啟動
    orch.start()
    window.show()

    # 如果有 web_streamer，顯示分享連結
    if orch.web_streamer:
        web_cfg = config.get('web_stream', {})
        http_port = web_cfg.get('http_port', 8080)
        local_ip = get_local_ip()
        share_url = f"http://{local_ip}:{http_port}/viewer.html"
        print(f"\n[分享] 其他人可用此連結即時觀看字幕:")
        print(f"  {share_url}\n", flush=True)
        share_action.setVisible(True)
        share_action.triggered.connect(lambda: QApplication.clipboard().setText(share_url))

    # 優雅關閉
    def shutdown():
        orch.stop()
        app.quit()

    signal.signal(signal.SIGINT, lambda *a: shutdown())

    sys.exit(app.exec_())


if __name__ == "__main__":
    main()
