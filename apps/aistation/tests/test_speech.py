# source_origin: AI Station §9 - Module 3 Audio Layer (test)
"""RED-GREEN-REFACTOR tests for the TTS Synthesizer (Module 3)."""
from pathlib import Path

from src.synthesizers.speech import synthesize_tts


def test_synthesize_returns_path():
    """synthesize_tts() must return an existing path to a .mp3 artifact."""
    out = synthesize_tts("你好，這是一個 AI Station 測試語音。")

    assert isinstance(out, str), "synthesize_tts() should return a path string"
    assert out.endswith(".mp3"), "synthesize_tts() should return a .mp3 path"
    assert Path(out).exists(), "the returned .mp3 path should point to a real file"
