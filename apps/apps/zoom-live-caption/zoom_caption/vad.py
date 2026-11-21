"""
vad.py — 語音活動偵測 (Voice Activity Detection)
簡易能量式 VAD，判斷音訊區塊是否包含語音
"""
import numpy as np
from collections import deque
from typing import Optional


class VoiceActivityDetector:
    """簡易能量式 VAD"""

    def __init__(self, sample_rate: int = 16000, 
                 frame_duration_ms: int = 30,
                 energy_threshold: float = 0.001,
                 silence_frames: int = 10,
                 speech_frames: int = 3):
        self.sample_rate = sample_rate
        self.frame_size = int(sample_rate * frame_duration_ms / 1000)
        self.energy_threshold = energy_threshold
        self.silence_frames = silence_frames
        self.speech_frames = speech_frames
        self._silence_count = 0
        self._speech_count = 0
        self._is_speaking = False
        self._buffer = deque(maxlen=100)

    def is_speech(self, audio: np.ndarray) -> bool:
        """判斷音訊區塊是否包含語音"""
        # 計算能量 (RMS)
        energy = np.sqrt(np.mean(audio ** 2))

        if energy > self.energy_threshold:
            self._speech_count += 1
            self._silence_count = 0
            if self._speech_count >= self.speech_frames:
                self._is_speaking = True
        else:
            self._silence_count += 1
            self._speech_count = 0
            if self._silence_count >= self.silence_frames:
                self._is_speaking = False

        return self._is_speaking

    def is_silent(self, audio: np.ndarray) -> bool:
        """判斷是否為靜音"""
        energy = np.sqrt(np.mean(audio ** 2))
        return energy < self.energy_threshold * 0.5

    def reset(self):
        """重置狀態"""
        self._silence_count = 0
        self._speech_count = 0
        self._is_speaking = False
        self._buffer.clear()

    @property
    def speaking(self) -> bool:
        return self._is_speaking
