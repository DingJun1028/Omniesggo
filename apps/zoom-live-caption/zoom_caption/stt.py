"""
stt.py — faster-whisper 語音轉文字
"""
import numpy as np
from faster_whisper import WhisperModel
from typing import Optional, Tuple


class SpeechToText:
    """faster-whisper 語音轉文字引擎"""

    def __init__(self, model_size: str = "base", device: str = "cpu",
                 compute_type: str = "int8", language: Optional[str] = None):
        self.model_size = model_size
        self.device = device
        self.compute_type = compute_type
        self.language = language
        print(f"[STT] 載入模型 {model_size} ({device}/{compute_type}) ...", flush=True)
        self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
        print("[STT] 模型就緒", flush=True)

    def transcribe(self, audio: np.ndarray, language: Optional[str] = None) -> Tuple[str, str]:
        """
        轉錄音訊為文字
        回傳: (轉錄文字, 偵測語言)
        """
        # float32 -> float32 (whisper 接受 float32)
        audio = audio.astype(np.float32)
        
        # 確保音訊是一維的
        if audio.ndim > 1:
            audio = audio.flatten()

        lang = language or self.language
        segments, info = self.model.transcribe(
            audio,
            language=lang,
            beam_size=5,
            best_of=5,
            temperature=(0.0, 0.4, 0.6),
            condition_on_previous_text=False,
            no_speech_threshold=0.3,
            vad_filter=True,
            vad_parameters=dict(
                threshold=0.5,
                min_speech_duration_ms=250,
                max_speech_duration_s=30,
                min_silence_duration_ms=1000,
                speech_pad_ms=300,
            )
        )
        text = "".join(s.text for s in segments).strip()
        return text, (info.language or lang or "unknown")
