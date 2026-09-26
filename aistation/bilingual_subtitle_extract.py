#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bilingual_subtitle_extract.py
雙語字幕擷取 + 翻譯 工具

用途：
  給一個音訊檔（wav/mp3），先用 faster-whisper 逐字轉錄（音源擷取字框），
  再將擷取到的原始文字翻譯成目標語言（翻譯字框），兩層分開呈現。

5T 落實：
  - Traceable  : 所有音檔、模型、輸出均標註 source_origin
  - Trackable  : 每一步寫入 lifecycle 日誌
  - Tangible   : 輸出實際的字框文字與翻譯文字
  - Transparent: 模型名稱、參數、耗時全數揭露
  - Trustworthy: 輸出經 Hash Lock 凍結

用法：
  python bilingual_subtitle_extract.py <音訊檔路徑> [--target-lang zh|en|ja|ko|...] [--model tiny|base|small|medium]
"""

from __future__ import annotations
import argparse
import hashlib
import json
import os
import sys
import time
from pathlib import Path
from typing import Any

# ─────────────────────────────────────────────
# 第三方套件（確認存在後再 import）
# ─────────────────────────────────────────────
try:
    import faster_whisper
except ImportError:
    faster_whisper = None  # type: ignore

# ─────────────────────────────────────────────
# 常數
# ─────────────────────────────────────────────
MODELS = ["tiny", "base", "small", "medium", "large"]
SUPPORTED_EXTS = {".wav", ".mp3", ".m4a", ".flac", ".ogg"}

# ─────────────────────────────────────────────
# 工具函式
# ─────────────────────────────────────────────
def _hash_lock(data: str | bytes) -> str:
    """SHA-256 Hash Lock — 寫入即凍結（Trustworthy）"""
    raw = data.encode("utf-8") if isinstance(data, str) else data
    return hashlib.sha256(raw).hexdigest()


def _lifecycle(event: str, data: dict[str, Any] | None = None) -> dict[str, Any]:
    """Trackable lifecycle hook"""
    return {
        "event": event,
        "timestamp_ms": int(time.time() * 1000),
        "data": data or {},
    }


def _fmt_time(seconds: float) -> str:
    """將秒數格式化為 s 前綴"""
    return f"{seconds:5.1f}s"


# ─────────────────────────────────────────────
# 翻譯層（佔位 — 後續可接 Gemini / GPT / 辭典引擎）
# ─────────────────────────────────────────────
def translate_text(text: str, source_lang: str = "zh", target_lang: str = "en") -> str:
    """
    翻譯層 佔位實作。

    真實環境可換成：
      - LLM API（Gemini / GPT-4o / Claude）
      - 線上翻譯 API（DeepL / Google Translate）
      - 字典 + 句法規則引擎（全離線）

    此處回傳人工校譯基準，確保流程可先跑通。
    """
    # ── 示範基準翻譯（zh → en）─────────────────────────────
    _DEMO_TRANSLATIONS: dict[str, str] = {
        "大家好，歡迎來到 2020-6BB 的液系國際永續策略與創新人材培訓課程初期班":
            "Hello everyone, and welcome to the initial cohort of the "
            "liquid-based International Sustainable Strategy and "
            "Innovative Talent Training Program — 2020-6BB.",
    }
    if text in _DEMO_TRANSLATIONS:
        return _DEMO_TRANSLATIONS[text]

    # ── 未知文字：標註佔位，提醒使用者換真翻譯引擎 ──────────
    return f"[{target_lang} 翻譯尚未接入 — 原文保留] {text}"


# ─────────────────────────────────────────────
# 主流程：音源擷取 + 翻譯
# ─────────────────────────────────────────────
def run_extract_and_translate(
    audio_path: Path,
    model_name: str = "tiny",
    target_language: str = "en",
    source_language: str | None = None,
) -> dict[str, Any]:
    """
    一條完整的雙語字幕擷取 + 翻譯流程。

    回傳 dict:
      {
        "audio_path"        : 音源路徑,
        "source_origin"     : 溯源標籤,
        "lifecycle"        : lifecycle 事件列表,
        "extraction"       : {
            "language"        : 偵測語言,
            "segments"        : [ {start,end,text}, ... ],
            "extracted_text"  : 合併後的擷取字框字符串,
            "word_count"      : 字數,
          },
        "translation"     : {
            "source_lang"     : 原語言,
            "target_lang"     : 目標語言,
            "translated_text" : 翻譯字框字符串,
          },
        "hash_lock"       : 輸出整體 SHA-256 Hash Lock,
      }
    """
    lc: list[dict[str, Any]] = []
    source_origin = f"bilingual_subtitle_extract:whisper+{model_name}"

    # ── 0. 確認音檔存在 ─────────────────────────────────────
    if not audio_path.exists():
        raise FileNotFoundError(f"音訊檔不存在：{audio_path}")
    ext = audio_path.suffix.lower()
    if ext not in SUPPORTED_EXTS:
        raise ValueError(f"不支援的格式 {ext}。支援：{SUPPORTED_EXTS}")
    lc.append(_lifecycle("audio_file_verified", {"path": str(audio_path), "size": audio_path.stat().st_size}))

    # ── 1. faster-whisper 初始化 ────────────────────────────
    if faster_whisper is None:
        raise ImportError("缺少 faster-whisper。執行：pip install faster-whisper")
    lc.append(_lifecycle("whisper_model_load_start", {"model": model_name}))
    t_load0 = time.time()
    model = faster_whisper.WhisperModel(model_name, device="cpu", compute_type="int8")
    t_load = time.time() - t_load0
    lc.append(_lifecycle("whisper_model_load_done", {"model": model_name, "load_time_s": round(t_load, 2)}))

    # ── 2. 音源擷取（逐字轉錄） ─────────────────────────────
    lc.append(_lifecycle("transcription_start"))
    t_trans0 = time.time()
    segments, info = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        language=source_language or info.language if False else None,  # 讓模型自偵測
    )
    # 第一次 iterate 才知道語言，補救：
    segments, info = model.transcribe(
        str(audio_path),
        word_timestamps=True,
        language=source_language,
    )
    t_trans = time.time() - t_trans0

    seg_list = [
        {"start": round(s.start, 2), "end": round(s.end, 2), "text": s.text.strip()}
        for s in segments
        if s.text.strip()
    ]
    extracted_text = " ".join(s["text"] for s in seg_list)
    word_count = sum(len(s["text"]) for s in seg_list)

    lc.append(_lifecycle("transcription_done", {
        "detected_language": info.language,
        "language_prob": round(info.language_probability, 3),
        "duration_s": round(info.duration, 2),
        "transcription_time_s": round(t_trans, 2),
        "segment_count": len(seg_list),
        "word_count": word_count,
    }))

    # ── 3. 翻譯層 ───────────────────────────────────────────
    lc.append(_lifecycle("translation_start", {"source_lang": info.language, "target_lang": target_language}))
    translated_text = translate_text(extracted_text, source_lang=info.language, target_lang=target_language)
    lc.append(_lifecycle("translation_done", {"translated_text_preview": translated_text[:80]}))

    # ── 4. 整體 Hash Lock ───────────────────────────────────
    output_blob = json.dumps({
        "extracted_text": extracted_text,
        "translated_text": translated_text,
        "segments": seg_list,
    }, ensure_ascii=False, indent=2)
    hl = _hash_lock(output_blob)

    return {
        "audio_path": str(audio_path),
        "source_origin": source_origin,
        "lifecycle": lc,
        "extraction": {
            "language": info.language,
            "language_probability": round(info.language_probability, 3),
            "duration_s": round(info.duration, 2),
            "model_load_time_s": round(t_load, 2),
            "transcription_time_s": round(t_trans, 2),
            "segments": seg_list,
            "extracted_text": extracted_text,
            "word_count": word_count,
        },
        "translation": {
            "source_lang": info.language,
            "target_lang": target_language,
            "translated_text": translated_text,
        },
        "hash_lock": hl,
    }


# ─────────────────────────────────────────────
# 輸出呈現（CLI）
# ─────────────────────────────────────────────
def print_bilingual_result(result: dict[str, Any]) -> None:
    """將擷取字框與翻譯字框分開清楚呈現"""
    ex = result["extraction"]
    tr = result["translation"]

    print()
    print("=" * 62)
    print("  【音源擷取字框 — 原始語言】")
    print("=" * 62)
    print(f"  偵測語言          : {ex['language']} (概率 {ex['language_probability']:.2f})")
    print(f"  音長              : {ex['duration_s']}s")
    print(f"  模型載入耗時      : {ex['model_load_time_s']}s")
    print(f"  轉錄耗時          : {ex['transcription_time_s']}s")
    print(f"  語段數 / 字數     : {len(ex['segments'])} 語段 / {ex['word_count']} 字")
    print()
    for seg in ex["segments"]:
        print(f"  [{ _fmt_time(seg['start']) } → { _fmt_time(seg['end']) }]  {seg['text']}")
    print()
    print(f"  擷取字框（合併）  : {ex['extracted_text']}")
    print()

    print("=" * 62)
    print("  【翻譯字框 — 目標語言】")
    print("=" * 62)
    print(f"  來源語言          : {tr['source_lang']}")
    print(f"  目標語言          : {tr['target_lang']}")
    print()
    print(f"  翻譯字框          : {tr['translated_text']}")
    print()
    print("=" * 62)
    print(f"  音源路徑          : {result['audio_path']}")
    print(f"  source_origin     : {result['source_origin']}")
    print(f"  Hash Lock        : {result['hash_lock'][:16]}…")
    print("=" * 62)


# ─────────────────────────────────────────────
# CLI 入口
# ─────────────────────────────────────────────
def main() -> None:
    parser = argparse.ArgumentParser(
        description="雙語字幕擷取工具：音源 → 逐字擷取字框 → 翻譯字框"
    )
    parser.add_argument("audio", type=Path, help="音訊檔路徑（wav/mp3/m4a/flac/ogg）")
    parser.add_argument("--model", "-m", default="tiny",
                        choices=MODELS, help=f" Whisper 模型 (預設: tiny)")
    parser.add_argument("--target-lang", "-t", default="en",
                        help="目標翻譯語言代碼 (預設: en)")
    parser.add_argument("--source-lang", "-s", default=None,
                        help="原語音語言代碼 (省略則自動偵測)")
    parser.add_argument("--json", action="store_true",
                        help="額外輸出 JSON 至 stdout")
    args = parser.parse_args()

    result = run_extract_and_translate(
        audio_path=args.audio,
        model_name=args.model,
        target_language=args.target_lang,
        source_language=args.source_lang,
    )
    print_bilingual_result(result)
    if args.json:
        print()
        print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
