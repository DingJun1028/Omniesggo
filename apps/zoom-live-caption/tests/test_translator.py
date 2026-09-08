"""
tests/test_translator.py — Translator 單元測試
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from zoom_caption.translator import OllamaTranslator


class TestOllamaTranslator:
    """OllamaTranslator 測試"""

    def test_init(self):
        """測試初始化"""
        t = OllamaTranslator(
            model="gemma4:31b",
            base_url="https://ollama.com",
            api_key="test-key",
        )
        assert t.model == "gemma4:31b"
        assert t.base_url == "https://ollama.com"
        assert t.api_key == "test-key"

    def test_translate_zh_to_en(self):
        """測試中文翻英文"""
        t = OllamaTranslator(
            model="gemma4:31b",
            base_url="https://ollama.com",
            api_key="test-key",
        )
        # 模擬翻譯
        result = t.translate("你好世界", "zh", "en")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_translate_en_to_zh(self):
        """測試英文翻中文"""
        t = OllamaTranslator(
            model="gemma4:31b",
            base_url="https://ollama.com",
            api_key="test-key",
        )
        result = t.translate("Hello world", "en", "zh")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_empty_text(self):
        """測試空文字"""
        t = OllamaTranslator(
            model="gemma4:31b",
            base_url="https://ollama.com",
            api_key="test-key",
        )
        result = t.translate("", "zh", "en")
        assert result == ""

    def test_detect_language(self):
        """測試語言偵測"""
        t = OllamaTranslator(
            model="gemma4:31b",
            base_url="https://ollama.com",
            api_key="test-key",
        )
        assert t.detect_language("你好") == "zh"
        assert t.detect_language("Hello") == "en"

