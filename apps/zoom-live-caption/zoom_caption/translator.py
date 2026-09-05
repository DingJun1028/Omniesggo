"""
translator.py — Gemini 翻譯引擎 (gemini-3.6-flash)
免費、快速、支援繁體中文 ↔ 英文雙向翻譯
"""
import os
import json
import urllib.request
import urllib.error
from typing import Optional


class GeminiTranslator:
    """Gemini 3.6 Flash 翻譯器 — 免費額度充足，適合即時字幕翻譯"""

    def __init__(self, model: str = "gemini-3.6-flash",
                 api_key: Optional[str] = None,
                 temperature: float = 0.1,
                 max_tokens: int = 200):
        self.model = model
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")
        self.temperature = temperature
        self.max_tokens = max_tokens
        self._endpoint = (
            f"https://generativelanguage.googleapis.com/v1beta/"
            f"models/{self.model}:generateContent?key={self.api_key}"
        )

    def translate(self, text: str, source_lang: str, target_lang: str) -> str:
        """
        翻譯文字
        source_lang: zh / en / auto
        target_lang: zh / en
        """
        if not text.strip():
            return ""

        lang_map = {"zh": "繁體中文", "en": "English"}
        target_name = lang_map.get(target_lang, target_lang)
        source_name = lang_map.get(source_lang, source_lang) if source_lang != "auto" else "自動偵測"

        prompt = (
            f"翻譯為{target_name}，只輸出翻譯結果，不要加引號或說明。\n"
            f"原文：{text}\n"
            f"翻譯："
        )

        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": self.temperature,
                "maxOutputTokens": self.max_tokens,
            }
        }

        req = urllib.request.Request(
            self._endpoint,
            data=json.dumps(payload).encode('utf-8'),
            headers={"Content-Type": "application/json"},
            method='POST'
        )

        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read().decode('utf-8'))
                if "candidates" in result:
                    translated = result["candidates"][0]["content"]["parts"][0]["text"].strip()
                    return translated
                else:
                    return f"[翻譯錯誤: 無回應]"
        except urllib.error.HTTPError as e:
            body = e.read().decode()[:200]
            print(f"[Translator] HTTP {e.code}: {body}", flush=True)
            return f"[翻譯錯誤 {e.code}]"
        except Exception as e:
            print(f"[Translator] Error: {e}", flush=True)
            return f"[翻譯錯誤]"

    def detect_language(self, text: str) -> str:
        """簡易語言偵測 (zh/en)"""
        for ch in text:
            if '\u4e00' <= ch <= '\u9fff':
                return "zh"
        return "en"
