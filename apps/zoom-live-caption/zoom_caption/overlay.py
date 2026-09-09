"""
overlay.py — PyQt5 透明字幕視窗 + Zoom 上方 overlay
"""
import sys
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QLabel,
    QGraphicsDropShadowEffect, QPushButton, QHBoxLayout
)
from PyQt5.QtCore import Qt, QTimer, pyqtSignal, QObject
from PyQt5.QtGui import QFont, QColor, QCursor, QClipboard


class CaptionSignals(QObject):
    """跨執行緒訊號"""
    new_caption = pyqtSignal(str, str, str)  # source, translated, direction


class OverlayWindow(QWidget):
    """透明字幕 Overlay 視窗 (置於 Zoom 上方)"""

    def __init__(self, config: dict):
        super().__init__()
        self.config = config
        self.display_cfg = config.get('display', {})
        self.signals = CaptionSignals()
        self.signals.new_caption.connect(self._update_caption)
        self._last_source = ""
        self._last_translated = ""
        self._init_ui()

    def _init_ui(self):
        self.setWindowType()  # 置頂、無邊框、透明背景
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setWindowFlags(
            Qt.FramelessWindowHint
            | Qt.WindowStaysOnTopHint
            | Qt.Tool
            | Qt.WindowDoesNotAcceptFocus
        )

        # 主佈局
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 10, 20, 10)
        layout.setSpacing(5)

        # 標題列
        header = QHBoxLayout()
        self.title_label = QLabel("字幕翻譯")
        self.title_label.setStyleSheet("color: #c9a24b; font-size: 12px; font-weight: bold;")
        header.addWidget(self.title_label)
        header.addStretch()

        # 關閉按鈕
        self.close_btn = QPushButton("✕")
        self.close_btn.setFixedSize(20, 20)
        self.close_btn.setStyleSheet("""
            QPushButton { background: transparent; color: white; border: none; font-size: 14px; }
            QPushButton:hover { color: #ff4444; }
        """)
        self.close_btn.clicked.connect(self.hide)
        header.addWidget(self.close_btn)
        layout.addLayout(header)

        # 原文標籤
        self.source_label = QLabel("")
        self.source_label.setWordWrap(True)
        self.source_label.setAlignment(Qt.AlignCenter)
        font_size = self.display_cfg.get('font_size', 24)
        self.source_label.setStyleSheet(f"""
            color: #FFFFFF;
            font-size: {font_size}px;
            font-weight: bold;
            padding: 8px 16px;
            background: rgba(0, 0, 0, 180);
            border-radius: 8px;
        """)
        layout.addWidget(self.source_label)

        # 翻譯標籤
        self.translated_label = QLabel("")
        self.translated_label.setWordWrap(True)
        self.translated_label.setAlignment(Qt.AlignCenter)
        self.translated_label.setStyleSheet(f"""
            color: #c9a24b;
            font-size: {font_size - 2}px;
            padding: 6px 16px;
            background: rgba(16, 36, 63, 200);
            border-radius: 8px;
        """)
        layout.addWidget(self.translated_label)

        # 方向指示
        self.direction_label = QLabel("")
        self.direction_label.setAlignment(Qt.AlignCenter)
        self.direction_label.setStyleSheet("color: #888888; font-size: 11px;")
        layout.addWidget(self.direction_label)

        # 分享連結按鈕
        self.share_btn = QPushButton("複製分享連結")
        self.share_btn.setStyleSheet("""
            QPushButton {
                background: rgba(201, 162, 75, 0.2);
                color: #c9a24b;
                border: 1px solid #c9a24b;
                border-radius: 6px;
                padding: 4px 12px;
                font-size: 11px;
            }
            QPushButton:hover { background: rgba(201, 162, 75, 0.4); }
        """)
        self.share_btn.clicked.connect(self._copy_share_link)
        layout.addWidget(self.share_btn, alignment=Qt.AlignCenter)

        # 設定位置
        self._position_overlay()

    def setWindowType(self):
        """設定視窗類型 (Windows 上穿透點擊)"""
        pass  # Qt.Tool + WindowDoesNotAcceptFocus 已足夠

    def _position_overlay(self):
        """定位 overlay 到螢幕頂部中央"""
        screen = QApplication.primaryScreen().geometry()
        width = self.display_cfg.get('window_width', 800)
        height = self.display_cfg.get('window_height', 200)
        x = (screen.width() - width) // 2
        y = 10  # 頂部
        self.setGeometry(x, y, width, height)

    def _update_caption(self, source: str, translated: str, direction: str):
        """更新字幕顯示"""
        self._last_source = source
        self._last_translated = translated
        self.source_label.setText(source)
        self.translated_label.setText(translated)
        direction_text = "你" if direction == "mic" else "對方"
        self.direction_label.setText(direction_text)
        self.show()

    def _copy_share_link(self):
        """複製分享連結到剪貼簿"""
        if hasattr(self, '_share_url') and self._share_url:
            clipboard = QApplication.clipboard()
            clipboard.setText(self._share_url)
            self.share_btn.setText("已複製!")
            QTimer.singleShot(2000, lambda: self.share_btn.setText("複製分享連結"))

    def set_share_url(self, url: str):
        """設定分享連結"""
        self._share_url = url
        self.share_btn.setVisible(True)


class CaptionWindow(QWidget):
    """獨立字幕視窗 (可拖曳到 Zoom 下方)"""

    def __init__(self, config: dict):
        super().__init__()
        self.config = config
        self.display_cfg = config.get('display', {})
        self.signals = CaptionSignals()
        self.signals.new_caption.connect(self._update_caption)
        self._init_ui()

    def _init_ui(self):
        self.setWindowTitle("Zoom 字幕翻譯")
        self.setWindowFlags(
            Qt.WindowStaysOnTopHint
            | Qt.WindowDoesNotAcceptFocus
        )
        self.setAttribute(Qt.WA_ShowWithoutActivating)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(15, 10, 15, 10)

        # 原文
        self.source_label = QLabel("等待語音...")
        self.source_label.setWordWrap(True)
        self.source_label.setAlignment(Qt.AlignCenter)
        font_size = self.display_cfg.get('font_size', 24)
        self.source_label.setStyleSheet(f"""
            color: white;
            font-size: {font_size}px;
            font-weight: bold;
            padding: 10px;
            background: rgba(0, 0, 0, 160);
            border-radius: 8px;
        """)
        layout.addWidget(self.source_label)

        # 翻譯
        self.translated_label = QLabel("")
        self.translated_label.setWordWrap(True)
        self.translated_label.setAlignment(Qt.AlignCenter)
        self.translated_label.setStyleSheet(f"""
            color: #c9a24b;
            font-size: {font_size - 2}px;
            padding: 8px;
            background: rgba(16, 36, 63, 180);
            border-radius: 8px;
        """)
        layout.addWidget(self.translated_label)

        # 方向
        self.direction_label = QLabel("")
        self.direction_label.setAlignment(Qt.AlignCenter)
        self.direction_label.setStyleSheet("color: #888; font-size: 11px;")
        layout.addWidget(self.direction_label)

        # 設定大小和位置
        width = self.display_cfg.get('window_width', 800)
        height = self.display_cfg.get('window_height', 200)
        self.setGeometry(100, 500, width, height)

    def _update_caption(self, source: str, translated: str, direction: str):
        self.source_label.setText(source)
        self.translated_label.setText(translated)
        direction_text = "你" if direction == "mic" else "對方"
        self.direction_label.setText(direction_text)
