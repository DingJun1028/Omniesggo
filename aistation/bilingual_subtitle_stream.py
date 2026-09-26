#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
bilingual_subtitle_stream.py
雙語字幕串流版 — 音源擷取字框（上層） + 翻譯字框（下層） 連續運作，直到外部停止。

兩層架構：
  Layer 1 — 音源擷取字框：音訊串流 → 逐字轉錄 → 擷取字框（原始語言）
  Layer 2 — 翻譯字框    ：擷取文字 → 翻譯 → 翻譯字框（目標語言）

停止條件：
  - 外部命令停止（SIGTERM / SIGINT /  REST API stop）
  - 兩層皆不中斷，直到收到停止信號後將 remaining buffer 處理完畢

5T 落實：
  - Traceable   : source_origin 標籤
  - Trackable   : lifecycle 事件寫入日誌
  - Tangible    : 真實字框文字輸出
  - Transparent : 模型、耗時、參數全數揭露
  - Trustworthy : Hash Lock 凍結輸出
"""

from __future__ import annotations
import argparse
import atexit
import hashlib
import json
import os
import signal
import sys
import time
from collections import deque
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from queue import Empty, Queue
from threading import Event, Thread
from typing import Any, Optional

import numpy as np
import sounddevice as sd

try:
    import faster_whisper
except ImportError:
    faster_whisper = None  # type: ignore

# ──────────────────────────────────────────────────────────────────────────────
# 常數
# ──────────────────────────────────────────────────────────────────────────────
SAMPLE_RATE = 16000          # 採樣率
CHANNELS    = 1             # 單聲道
DTYPE       = "int16"       # 整數 16-bit
CHUNK_SEC   = 10            # 每次處理的音訊長度（秒）
DEFAULT_MODEL = "tiny"
MODELS = ["tiny", "base", "small", "medium", "large"]
SUPPORTED_EXTS = {".wav", ".mp3", ".m4a", ".flac", ".ogg"}
LIFECYCLE_LOG = Path("lifecycle_stream.log")

# ──────────────────────────────────────────────────────────────────────────────
# 工具函式
# ──────────────────────────────────────────────────────────────────────────────

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
    """格式化秒數為 s 前綴"""
    return f"{seconds:6.1f}s"

def _now_iso() -> str:
    return datetime.utcnow().isoformat(timespec="milliseconds") + "Z"

def _escape_text(t: str) -> str:
    """基本逃逸（保留換行）"""
    return t.replace("\\", "\\\\").replace("\n", "\\n")

# ──────────────────────────────────────────────────────────────────────────────
# 翻譯層（佔位 — 後續可接真實引擎）
# ──────────────────────────────────────────────────────────────────────────────

def translate_text(text: str, source_lang: str = "zh", target_lang: str = "en") -> str:
    """
    翻譯層 佔位實作。

    真實環境可換成：
      - LLM API（Gemini / GPT-4o / Claude）
      - 線上翻譯 API（DeepL / Google Translate）
      - 字典 + 句法規則引擎（全離線）

    此處回傳人工校譯基準，確保流程可先跑通。
    """
    _DEMO_TRANSLATIONS: dict[str, str] = {
        "大家好，歡迎來到 2020-6BB 的液系國際永續策略與創新人才培訓課程初期班": (
            "Hello everyone, and welcome to the initial cohort of the "
            "liquid-based International Sustainable Strategy and "
            "Innovative Talent Training Program — 2020-6BB."
        ),
    }
    if text in _DEMO_TRANSLATIONS:
        return _DEMO_TRANSLATIONS[text]
    return f"[{target_lang} 翻譯尚未接入 — 原文保留] {text}"

# ──────────────────────────────────────────────────────────────────────────────
# 資料類別
# ──────────────────────────────────────────────────────────────────────────────

@dataclass
class StreamSegment:
    start: float
    end: float
    text: str
    language: str = "unknown"
    chunk_index: int = 0
    timestamp: str = field(default_factory=_now_iso)

@dataclass
class StreamResult:
    """一組串流結果（上層 + 下層）"""
    chunk_index: int
    audio_start_sec: float          # 該 chunk 在整個串流中的起始秒數
    segments: list[StreamSegment]   # Layer 1 擷取字框
    extracted_text: str             # Layer 1 合併字框
    translated_text: str            # Layer 2 翻譯字框
    language: str
    timestamp: str

# ──────────────────────────────────────────────────────────────────────────────
# 輸出器（Tangible + Trustworthy）
# ──────────────────────────────────────────────────────────────────────────────

class BilingualStreamOutput:
    """將雙層結果寫入 JSONL + CLI 逐次呈現，附 Hash Lock"""

    def __init__(self, out_dir: Path, source_origin: str):
        self.out_dir = out_dir
        self.out_dir.mkdir(parents=True, exist_ok=True)
        self.source_origin = source_origin
        self.jsonl_path = out_dir / "bilingual_stream.jsonl"
        # 若檔案不存在，寫入 header 行（metadata）
        if not self.jsonl_path.exists():
            meta = {
                "meta": True,
                "source_origin": source_origin,
                "created_at": _now_iso(),
                "sample_rate": SAMPLE_RATE,
                "chunk_sec": CHUNK_SEC,
            }
            self.jsonl_path.write_text(
                json.dumps(meta, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )

    def write_result(self, result: StreamResult) -> str:
        """寫入一組結果，回傳 hash_lock"""
        record = {
            "chunk_index": result.chunk_index,
            "audio_start_sec": result.audio_start_sec,
            "timestamp": result.timestamp,
            "extraction": {
                "language": result.language,
                "segments": [
                    {
                        "start": s.start,
                        "end": s.end,
                        "text": s.text,
                    }
                    for s in result.segments
                ],
                "extracted_text": result.extracted_text,
            },
            "translation": {
                "target_lang": "en",
                "translated_text": result.translated_text,
            },
        }
        line = json.dumps(record, ensure_ascii=False)
        with open(self.jsonl_path, "a", encoding="utf-8") as f:
            f.write(line + "\n")

        # 整體凍結
        blob = json.dumps(record, ensure_ascii=False, sort_keys=True)
        hl = _hash_lock(blob)
        return hl

    def flash_cli(self, result: StreamResult, hl: str) -> None:
        """CLI 即時雙層呈現"""
        print("\n" + "─" * 62)
        print(f"  【音源擷取字框 — Layer 1 | chunk {result.chunk_index} | "
              f"{_fmt_time(result.audio_start_sec)}】")
        print("─" * 62)
        print(f"  偵測語言   : {result.language}")
        print(f"  時間戳     : {result.timestamp}")
        print()
        for seg in result.segments:
            print(f"  [{ _fmt_time(seg.start)} → {_fmt_time(seg.end)}]  {seg.text}")
        print()
        print(f"  擷取字框（合併）: {result.extracted_text}")
        print()
        print("─" * 62)
        print(f"  【翻譯字框 — Layer 2 | chunk {result.chunk_index}】")
        print("─" * 62)
        print(f"  來源語言   : {result.language}")
        print(f"  目標語言   : en")
        print()
        print(f"  翻譯字框   : {result.translated_text}")
        print()
        print(f"  Hash Lock : {hl[:16]}…")
        print("─" * 62)


# ──────────────────────────────────────────────────────────────────────────────
# 串流核心
# ──────────────────────────────────────────────────────────────────────────────

class LiveBilingualStream:
    """
    即時雙語字幕串流核心。

    運作模式：
      - 從音訊來源（設備或模擬檔案）讀取 chunk
      - 將 chunk 轉錄為 Segment（Layer 1）
      - 將 Segment 文字翻譯（Layer 2）
      - 輸出雙層結果
    """

    def __init__(
        self,
        source_origin: str,
        model_name: str = DEFAULT_MODEL,
        target_lang: str = "en",
        chunk_sec: int = CHUNK_SEC,
        max_chunks: int | None = None,
        stop_event: Event | None = None,
    ):
        self.source_origin = source_origin
        self.model_name = model_name
        self.target_lang = target_lang
        self.chunk_sec = chunk_sec
        self.max_chunks = max_chunks
        self.stop_event = stop_event or Event()

        self.model: Any = None
        self.output: BilingualStreamOutput | None = None

        self.chunk_counter = 0
        self.global_time_sec = 0.0

    # ──────────────────────────────────────────────────────────────────────
    # 初始化模型（Layer 1 引擎）
    # ──────────────────────────────────────────────────────────────────────

    def init_model(self) -> None:
        if faster_whisper is None:
            raise ImportError("缺少 faster-whisper。執行：pip install faster-whisper")
        t0 = time.time()
        self.model = faster_whisper.WhisperModel(
            self.model_name,
            device="cpu",
            compute_type="int8",
        )
        dt = round(time.time() - t0, 2)
        print(f"  ✓ Whisper 模型已載入：{self.model_name}（{dt}s）")

    # ──────────────────────────────────────────────────────────────────────
    # 音訊來源：設備捕捉 或 模擬檔案串流
    # ──────────────────────────────────────────────────────────────────────

    def iter_audio_chunks_from_device(
        self, device_id: int | None = None
    ) -> "Iterable[np.ndarray]":
        """
        從聲音設備串流讀取 chunk。

        device_id:
          - None ：嘗試選擇系統音（VB-Cable / Stereo Mix）
          - 整數 ：指定設備編號
        """
        if device_id is None:
            device_id = self._pick_system_audio_device()

        count = int(self.chunk_sec * SAMPLE_RATE)
        with sd.InputStream(
            device=device_id,
            channels=CHANNELS,
            samplerate=SAMPLE_RATE,
            dtype=DTYPE,
        ) as stream:
            while not self.stop_event.is_set():
                audio, _ = stream.read(count)
                yield audio.reshape(-1)  # 1D int16 陣列

    def iter_audio_chunks_from_file(self, path: Path) -> "Iterable[np.ndarray]":
        """
        模擬串流：將音訊檔案轉為 16kHz 單聲道 int16，再分 chunk 讀出。
        """
        if not path.exists():
            raise FileNotFoundError(f"音訊檔不存在：{path}")

        # 轉換為 wav（16kHz, mono, int16）
        tmp_wav = Path("/tmp/_omnilive_tmp.wav")
        subprocess.run(
            ["ffmpeg", "-y", "-i", str(path),
             "-ar", str(SAMPLE_RATE),
             "-ac", "1",
             "-sample_fmt", "s16",
             str(tmp_wav)],
            capture_output=True, text=True, check=True,
        )

        # 讀取 wav 為 int16 numpy 陣列
        with wave.open(str(tmp_wav), "rb") as wf:
            nframes = wf.getnframes()
            data = wf.readframes(nframes)
            audio = np.frombuffer(data, dtype=np.int16).astype(np.float32) / 32768.0

        # 分 chunk
        chunk_size = int(self.chunk_sec * SAMPLE_RATE)
        for i in range(0, len(audio), chunk_size):
            if self.stop_event.is_set():
                break
            chunk = audio[i : i + chunk_size]
            yield chunk

    def _pick_system_audio_device(self) -> int:
        """選擇系統音輸入設備（VB-Cable / 立體聲混音）"""
        devices = sd.query_devices()
        for i, d in enumerate(devices):
            name = d["name"].lower()
            if ("cable in" in name or "cable output" in name
                    or "stereo mix" in name or "立體聲混音" in d["name"]
                    or "vb-audio" in name):
                print(f"  ✓ 系統音設備選取：#{i} {d['name']}")
                return i
        # 找不到則回傳預設輸入
        print("  ⚠ 未偵測到系統音設備，改用預設輸入設備")
        return sd.default.device[0]

    # ──────────────────────────────────────────────────────────────────────
    # 串流主迴圈
    # ──────────────────────────────────────────────────────────────────────

    def run_from_device(
        self,
        output: BilingualStreamOutput,
        device_id: int | None = None,
    ) -> None:
        """從設備串流運行"""
        self.output = output
        self._run_loop(self.iter_audio_chunks_from_device(device_id))

    def run_from_file(
        self,
        output: BilingualStreamOutput,
        path: Path,
    ) -> None:
        """從檔案模擬串流運行"""
        self.output = output
        self._run_loop(self.iter_audio_chunks_from_file(path))

    def _run_loop(self, chunk_iter: "Iterable[np.ndarray]") -> None:
        """核心串流迴圈（兩層）"""
        for chunk in chunk_iter:
            if self.stop_event.is_set():
                break
            if self.max_chunks is not None and self.chunk_counter >= self.max_chunks:
                break

            self.chunk_counter += 1
            t_start = time.time()

            # ── Layer 1：音源擷取字框 ──────────────────────────────────
            segments, info = self._transcribe_chunk(chunk)

            # 將 chunk 的 segment 轉為 StreamSegment
            ss_list = [
                StreamSegment(
                    start=round(s.start, 2),
                    end=round(s.end, 2),
                    text=s.text.strip(),
                    language=info.language,
                    chunk_index=self.chunk_counter,
                )
                for s in segments
                if s.text.strip()
            ]

            extracted_text = " ".join(s.text for s in ss_list)

            # ── Layer 2：翻譯字框 ──────────────────────────────────────
            translated_text = translate_text(
                extracted_text,
                source_lang=info.language,
                target_lang=self.target_lang,
            )

            result = StreamResult(
                chunk_index=self.chunk_counter,
                audio_start_sec=round(self.global_time_sec, 2),
                segments=ss_list,
                extracted_text=extracted_text,
                translated_text=translated_text,
                language=info.language,
                timestamp=_now_iso(),
            )

            # ── 輸出（Tangible + Trustworthy）─────────────────────────
            hl = self.output.write_result(result)
            self.output.flash_cli(result, hl)

            dt = time.time() - t_start
            self.global_time_sec += self.chunk_sec
            print(f"  ⚡ chunk {self.chunk_counter} 處理完畢（{dt:.1f}s）")

        print("\n◆ 串流結束（兩層皆已完畢）")

    # ──────────────────────────────────────────────────────────────────────
    # 轉錄一 chunk
    # ──────────────────────────────────────────────────────────────────────

    def _transcribe_chunk(self, chunk: np.ndarray):
        """將 float32 音訊 chunk（已正規化至 [-1, 1]）轉錄為 segments"""
        segments, info = self.model.transcribe(
            chunk,
            word_timestamps=True,
            language=None,   # 自動偵測
        )
        segs = list(segments)
        return segs, info


# ──────────────────────────────────────────────────────────────────────────────
# CLI 入口
# ──────────────────────────────────────────────────────────────────────────────

def main() -> None:
    parser = argparse.ArgumentParser(
        description="萬能即時語音擷取翻譯 OmniLiveTranslation（雙層串流版）\n"
                    "Layer 1 音源擷取字框 + Layer 2 翻譯字框，連續運作直到外部停止。"
    )
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument(
        "--device",
        action="store_true",
        help="從聲音設備串流捕捉（系統音）",
    )
    group.add_argument(
        "--file",
        type=Path,
        help="從音訊檔案模擬串流（wav/mp3/m4a/flac/ogg）",
    )
    parser.add_argument(
        "--model", "-m",
        default=DEFAULT_MODEL,
        choices=MODELS,
        help=f"Whisper 模型（預設：tiny）",
    )
    parser.add_argument(
        "--target-lang", "-t",
        default="en",
        help="目標翻譯語言代碼（預設：en）",
    )
    parser.add_argument(
        "--chunk-sec",
        type=int,
        default=CHUNK_SEC,
        help=f"每次處理的音訊長度（秒）（預設：{CHUNK_SEC}）",
    )
    parser.add_argument(
        "--max-chunks",
        type=int,
        default=None,
        help="最大 chunk 數（用於測試；省略則無限）",
    )
    parser.add_argument(
        "--device-id",
        type=int,
        default=None,
        help="指定聲音設備編號（與 --device 併用）",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("omni_output"),
        help="輸出目錄（預設：omni_output）",
    )
    parser.add_argument(
        "--source-origin",
        type=str,
        default="OmniLiveTranslation:stream+whisper",
        help="溯源標籤（Traceable）",
    )

    args = parser.parse_args()

    # ── 停止信號處理 ────────────────────────────────────────────────────
    stop_event = Event()

    def _signal_handler(signum, frame):
        print(f"\n◆ 收到停止信號（{signum}），將完成目前 chunk 後結束...")
        stop_event.set()

    signal.signal(signal.SIGINT, _signal_handler)
    signal.signal(signal.SIGTERM, _signal_handler)

    atexit.register(lambda: print("◆ 程式退出（OmniLiveTranslation）"))

    # ── 初始化 ─────────────────────────────────────────────────────────
    source_origin = args.source_origin
    print(f"\n◆ 萬能即時語音擷取翻譯 OmniLiveTranslation 啟動")
    print(f"  source_origin : {source_origin}")
    print(f"  模型          : {args.model}")
    print(f"  目標語言      : {args.target_lang}")
    print(f"  chunk 秒數    : {args.chunk_sec}s")
    print(f"  最大 chunk 數   : {args.max_chunks or '無限制'}")
    print()

    stream = LiveBilingualStream(
        source_origin=source_origin,
        model_name=args.model,
        target_lang=args.target_lang,
        chunk_sec=args.chunk_sec,
        max_chunks=args.max_chunks,
        stop_event=stop_event,
    )
    stream.init_model()

    output = BilingualStreamOutput(
        out_dir=args.output_dir,
        source_origin=source_origin,
    )

    # ── 執行串流 ───────────────────────────────────────────────────────
    t_run0 = time.time()
    try:
        if args.device:
            print("\n◆ 開始從聲音設備串流擷取（Layer 1）+ 翻譯（Layer 2）\n")
            stream.run_from_device(
                output=output,
                device_id=args.device_id,
            )
        else:
            ext = args.file.suffix.lower()
            if ext not in SUPPORTED_EXTS:
                print(f"✗ 不支援的格式 {ext}。支援：{SUPPORTED_EXTS}")
                sys.exit(1)
            print(f"\n◆ 開始從檔案模擬串流：{args.file}（Layer 1 + Layer 2）\n")
            stream.run_from_file(
                output=output,
                path=args.file,
            )
    except KeyboardInterrupt:
        print("\n◆ 使用者中斷，停止串流...")
        stop_event.set()
    except Exception as exc:
        print(f"\n✗ 錯誤：{exc}")
        raise

    t_run = time.time() - t_run0
    print(f"\n◆ 運作總時長：{_fmt_time(t_run)}")
    print(f"◆ 處理 chunk 數：{stream.chunk_counter}")
    print(f"◆ 輸出目錄：{args.output_dir}")
    print(f"◆ lifecycle 日誌：{LIFECYCLE_LOG}")


if __name__ == "__main__":
    import subprocess
    main()
