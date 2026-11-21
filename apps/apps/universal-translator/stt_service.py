#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
萬能即時翻譯 — 伺服器端語音轉文字 (STT) 微服務
免費、零 key: faster-whisper (CTranslate2, CPU 優化)
接收: POST /transcribe  (multipart/form-data 或 raw binary 音訊: webm/ogg/wav/mp3/flac/m4a)
回傳: JSON {"text": "...", "language": "zh", "duration": 1.23}

設計:
- 常駐服務, 模型只載入一次 (首次 ~3-5s, 後續即時)
- 預設 whisper-base (CPU ~實時 1-1.5x); 若磁碟允許可改 small 提升準確率
- 語言自動偵測; 若前端帶 ?lang=zh-TW 則鎖定 (加速 + 降幻覺)
"""
import sys
import json
import io
import os
import tempfile
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

try:
    from faster_whisper import WhisperModel
except Exception as e:
    print(f"[STT] faster-whisper 載入失敗: {e}", file=sys.stderr)
    sys.exit(1)

MODEL_SIZE = os.environ.get("STT_MODEL", "small")  # 🆕 base→small: 準確率顯著提升, CPU int8 仍近即時
DEVICE = os.environ.get("STT_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("STT_COMPUTE", "int8")  # int8 最快, float32 最準

print(f"[STT] 載入模型 {MODEL_SIZE} ({DEVICE}/{COMPUTE_TYPE}) ...", file=sys.stderr, flush=True)
_model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
print("[STT] 模型就緒, 監聽 :8790", file=sys.stderr, flush=True)

# 語言對映: 前端 zh-TW/zh-CN -> whisper 接受 chinese; ja->japanese 等
_LANG_MAP = {
    "zh": "zh", "zh-cn": "zh", "zh-tw": "zh", "zh-hant": "zh", "chinese": "zh",
    "en": "en", "english": "en",
    "ja": "ja", "japanese": "ja",
    "ko": "ko", "korean": "ko",
    "es": "es", "spanish": "es",
    "fr": "fr", "french": "fr",
}

_model_lock = threading.Lock()


def transcribe(audio_bytes: bytes, lang_hint: str | None = None):
    with tempfile.NamedTemporaryFile(suffix=".bin", delete=False) as f:
        f.write(audio_bytes)
        tmp = f.name
    try:
        kwargs = dict(beam_size=5, best_of=5,
                      temperature=(0.0, 0.4, 0.6),
                      condition_on_previous_text=False,
                      no_speech_threshold=0.3,
                      # 🆕 最新最佳實踐: VAD 濾靜音段, 降幻覺 + 提速 (Silero VAD, faster-whisper 內建)
                      vad_filter=True,
                      vad_parameters=dict(
                          threshold=0.5,          # 語音機率閾值
                          min_speech_duration_ms=250,
                          max_speech_duration_s=30,
                          min_silence_duration_ms=1000,  # 靜默 1s 即切段, 避免拖尾幻覺
                          speech_pad_ms=300,
                      ))
        if lang_hint:
            mapped = _LANG_MAP.get(lang_hint.lower())
            if mapped:
                kwargs["language"] = mapped
        with _model_lock:
            segments, info = _model.transcribe(tmp, **kwargs)
            text = "".join(s.text for s in segments).strip()
        return text, (info.language or lang_hint or "unknown")
    finally:
        try:
            os.unlink(tmp)
        except OSError:
            pass


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, obj):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        if self.path.split("?")[0] != "/transcribe":
            self._send(404, {"error": "not found"})
            return
        length = int(self.headers.get("Content-Length", 0))
        if length <= 0 or length > 25 * 1024 * 1024:  # 上限 25MB
            self._send(413, {"error": "payload too large"})
            return
        # 語言提示從 query 取
        lang = None
        if "?" in self.path:
            from urllib.parse import parse_qs, urlparse
            q = parse_qs(urlparse(self.path).query)
            lang = (q.get("lang") or [None])[0]
        audio = self.rfile.read(length)
        try:
            text, detected = transcribe(audio, lang)
        except Exception as e:
            self._send(500, {"error": str(e)[:200]})
            return
        self._send(200, {"text": text, "language": detected, "bytes": len(audio)})

    def log_message(self, *a):
        pass  # 靜音


if __name__ == "__main__":
    port = int(os.environ.get("STT_PORT", "8790"))
    HTTPServer(("127.0.0.1", port), Handler).serve_forever()
