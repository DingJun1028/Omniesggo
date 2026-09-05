"""
orchestrator.py — 管線協調：音訊 → VAD → STT → 翻譯 → 顯示 + Web 分享
"""
import numpy as np
import threading
import time
import os
from collections import deque
from typing import Optional, Callable

from .audio_capture import AudioCapture
from .vad import VoiceActivityDetector
from .stt import SpeechToText
from .translator import GeminiTranslator
from .web_streamer import WebStreamer


class Orchestrator:
    """即時字幕翻譯管線協調器"""

    def __init__(self, config: dict):
        self.config = config
        audio_cfg = config['audio']
        stt_cfg = config['stt']
        trans_cfg = config['translation']

        # 初始化各模組
        self.audio = AudioCapture(
            sample_rate=audio_cfg['sample_rate'],
            block_size=audio_cfg['block_size'],
            mic_device=audio_cfg.get('mic_device'),
            loopback_device=audio_cfg.get('loopback_device'),
        )

        # Web 串流模組 (選擇性啟用)
        web_cfg = config.get('web_stream', {})
        self.web_streamer = None
        if web_cfg.get('enabled', False):
            self.web_streamer = WebStreamer(
                http_port=web_cfg.get('http_port', 8080),
                ws_port=web_cfg.get('ws_port', 8081),
                static_dir=os.path.dirname(os.path.abspath(__file__)),
            )
        self.vad_mic = VoiceActivityDetector(sample_rate=audio_cfg['sample_rate'])
        self.vad_loop = VoiceActivityDetector(sample_rate=audio_cfg['sample_rate'])
        self.stt = SpeechToText(
            model_size=stt_cfg['model'],
            device=stt_cfg['device'],
            compute_type=stt_cfg['compute_type'],
            language=stt_cfg.get('language'),
        )
        self.translator = GeminiTranslator(
            model=trans_cfg['model'],
            api_key=os.environ.get('GEMINI_API_KEY', ''),
            temperature=trans_cfg.get('temperature', 0.1),
            max_tokens=trans_cfg.get('max_tokens', 200),
        )

        self._running = False
        self._on_caption: Optional[Callable] = None
        self._mic_accum = []
        self._loop_accum = []
        self._mic_silent_count = 0
        self._loop_silent_count = 0
        self._lock = threading.Lock()

    def set_caption_callback(self, callback: Callable[[str, str, str], None]):
        """
        設定字幕回呼
        callback(source_text, translated_text, direction)
        direction: 'mic' (自己) 或 'loopback' (對方)
        """
        self._on_caption = callback

    def start(self):
        """啟動管線"""
        self._running = True
        self.audio.start()

        # 啟動 Web 串流伺服器
        if self.web_streamer:
            self.web_streamer.start()

        # 啟動處理執行緒
        self._mic_thread = threading.Thread(target=self._mic_loop, daemon=True)
        self._loop_thread = threading.Thread(target=self._loopback_loop, daemon=True)
        self._mic_thread.start()
        self._loop_thread.start()
        print("[Orchestrator] Started", flush=True)

    def _mic_loop(self):
        """麥克風音訊處理迴圈"""
        while self._running:
            audio = self.audio.get_mic_audio()
            if audio is None:
                time.sleep(0.05)
                continue

            audio_flat = audio.flatten()
            is_speech = self.vad_mic.is_speech(audio_flat)

            if is_speech:
                with self._lock:
                    self._mic_accum.append(audio_flat)
                    self._mic_silent_count = 0
            else:
                with self._lock:
                    self._mic_silent_count += 1
                    # 靜音超過 1.5 秒，觸發轉譯
                    if self._mic_silent_count > 10 and self._mic_accum:
                        segment = np.concatenate(self._mic_accum)
                        self._mic_accum.clear()
                        self._process_segment(segment, 'mic')

    def _loopback_loop(self):
        """喇叭迴路音訊處理迴圈"""
        while self._running:
            audio = self.audio.get_loopback_audio()
            if audio is None:
                time.sleep(0.05)
                continue

            audio_flat = audio.flatten()
            is_speech = self.vad_loop.is_speech(audio_flat)

            if is_speech:
                with self._lock:
                    self._loop_accum.append(audio_flat)
                    self._loop_silent_count = 0
            else:
                with self._lock:
                    self._loop_silent_count += 1
                    if self._loop_silent_count > 10 and self._loop_accum:
                        segment = np.concatenate(self._loop_accum)
                        self._loop_accum.clear()
                        self._process_segment(segment, 'loopback')

    def _process_segment(self, audio: np.ndarray, direction: str):
        """處理一段音訊：STT → 翻譯 → 顯示"""
        try:
            # STT
            text, detected_lang = self.stt.transcribe(audio)
            if not text:
                return

            # 決定目標語言
            if detected_lang == "zh":
                target_lang = "en"
            else:
                target_lang = "zh"

            # 翻譯
            translated = self.translator.translate(text, detected_lang, target_lang)

            # 顯示
            if self._on_caption:
                self._on_caption(text, translated, direction)

            # Web 廣播
            if self.web_streamer:
                self.web_streamer.push_caption(text, translated, direction)

            print(f"[{direction}] {detected_lang}: {text}", flush=True)
            print(f"[{direction}] {target_lang}: {translated}", flush=True)

        except Exception as e:
            print(f"[Process] Error: {e}", flush=True)

    def stop(self):
        """停止管線"""
        self._running = False
        self.audio.stop()
        print("[Orchestrator] Stopped", flush=True)
