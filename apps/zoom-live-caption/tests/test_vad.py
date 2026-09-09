"""
tests/test_vad.py — VAD 單元測試
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import numpy as np
import pytest
from zoom_caption.vad import VoiceActivityDetector


class TestVoiceActivityDetector:
    def setup_method(self):
        self.vad = VoiceActivityDetector(sample_rate=16000)

    def test_silence_detection(self):
        """靜音應回傳 False"""
        silence = np.zeros(4000, dtype=np.float32)
        assert self.vad.is_speech(silence) == False

    def test_speech_detection(self):
        """模擬語音 (正弦波) 應回傳 True"""
        t = np.linspace(0, 0.25, 4000, dtype=np.float32)
        speech = 0.5 * np.sin(2 * np.pi * 440 * t)
        # 需要多幀觸發
        for _ in range(5):
            result = self.vad.is_speech(speech)
        assert result == True

    def test_reset(self):
        """重置後狀態應清除"""
        self.vad._is_speaking = True
        self.vad.reset()
        assert self.vad.speaking == False

    def test_silent_method(self):
        """is_silent 應正確判斷靜音"""
        silence = np.zeros(4000, dtype=np.float32)
        assert self.vad.is_silent(silence) == True


class TestLanguageDetection:
    def test_chinese_detection(self):
        from zoom_caption.translator import OllamaTranslator
        t = OllamaTranslator(api_key="test")
        assert t.detect_language("你好世界") == "zh"

    def test_english_detection(self):
        from zoom_caption.translator import OllamaTranslator
        t = OllamaTranslator(api_key="test")
        assert t.detect_language("Hello world") == "en"

    def test_empty_text(self):
        from zoom_caption.translator import OllamaTranslator
        t = OllamaTranslator(api_key="test")
        assert t.detect_language("") == "en"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
