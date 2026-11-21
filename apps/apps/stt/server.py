#!/usr/bin/env python3
"""
萬能即時雙語字幕 - STT 微服務 — 2026-10-12 引擎切換版
終始矩陣: 對應 universal-translator 的 ISpeechToSubtitleRequest
5T: engine 標記 stt:vosk:voxspica (本地 CPU 推理, 零 key, 免費算立)

2026-10-12 引擎切換 (使用者需求): 預設引擎由 faster-whisper 換為
**VoxSpica 模型 (VOSK, Apache-2.0)** — cn (繁中呈現, 內建 s2t) + en-us,
與 VoxSpica 0.1.8 同權重 (alphacephei 註冊表 vosk-model-small-*)。
whisper 保留: 設 STT_ENGINE=whisper 即回舊引擎; VOSK 失敗亦自動 fallback。

端點 (不變):
  POST /transcribe?lang=zh-TW|en       body=audio bytes -> {text, language, words[]}
  POST /transcribe_stream?lang=auto    body=audio bytes -> SSE stream of partial word events
  GET  /transcribe_sse?room=X&lang=auto long-lived SSE, accepts audio via POST to same room
  GET  /health                         回 {status:'ok', engine, model, device}
  GET  /metrics                        回 uptime + counters
"""
import io
import json
import os
import subprocess
import tempfile
import time
import asyncio
import threading
from collections import defaultdict
from typing import Dict, Set

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import uvicorn

START_TIME = time.time()
try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None
try:
    import vosk as _vosk
    _vosk.SetLogLevel(-1)
except ImportError:
    _vosk = None
try:
    from zhconv import convert as _s2t
except ImportError:
    _s2t = None

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE", "int8")
STT_PORT = int(os.environ.get("STT_PORT", "8791"))
# 2026-10-12: 預設引擎切為 VoxSpica(VOSK); whisper 為可回退選項
STT_ENGINE = os.environ.get("STT_ENGINE", "vosk").strip().lower()
VOSK_MODEL_DIR = os.environ.get(
    "VOSK_MODEL_DIR",
    os.path.join(os.path.dirname(os.path.abspath(__file__)), "models"),
)
# VoxSpica 模型對照 (alphacephei 註冊表名)
VOSK_MODELS = {
    "zh": "vosk-model-small-cn-0.22",
    "en": "vosk-model-small-en-us-0.15",
}

app = FastAPI()

_model = None
_counters = {
    "total_words": 0,
    "total_segments": 0,
    "stream_requests": 0,
    "transcribe_requests": 0,
}

# SSE: room -> set of asyncio queues (each subscriber gets its own queue)
_room_subscribers: Dict[str, Set[asyncio.Queue]] = defaultdict(set)
_room_lock = threading.Lock()

# Captured on startup so worker threads can schedule broadcasts
_main_loop: asyncio.AbstractEventLoop | None = None


def get_model():
    """Lazy-load WhisperModel (singleton)."""
    global _model
    if _model is None:
        if WhisperModel is None:
            raise RuntimeError("faster_whisper not installed")
        _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    return _model


def detect_suffix(audio: bytes) -> str:
    """Pick container suffix by magic bytes (avoid mime/extension mismatch)."""
    if audio[:4] == b"RIFF" and audio[8:12] == b"WAVE":
        return ".wav"
    if audio[:4] == b"\x1a\x45\xdf\xa3":
        return ".webm"
    if audio[4:8] == b"ftyp":
        return ".mp4"
    if audio[:3] == b"ID3" or audio[:2] in (b"\xff\xfb", b"\xff\xf3", b"\xff\xf2"):
        return ".mp3"
    if audio[:4] == b"OggS":
        return ".ogg"
    return ".webm"


def resolve_lang_hint(lang: str) -> str | None:
    """Map UI lang (zh-TW/en/auto) to faster-whisper language code."""
    if not lang:
        return None
    s = lang.lower().strip()
    if s.startswith("zh") or s == "tw":
        return "zh"
    if s.startswith("en"):
        return "en"
    if s in ("auto", ""):
        return None
    return s[:2]


# ---------- VOSK (VoxSpica) engine ----------

_vosk_models: dict = {}
_vosk_lock = threading.Lock()


def get_vosk_model(code: str):
    """Lazy-load a VOSK model (singleton per lang)."""
    global _vosk_models
    if _vosk is None:
        raise RuntimeError("vosk not installed")
    if code in _vosk_models:
        return _vosk_models[code]
    with _vosk_lock:
        if code in _vosk_models:
            return _vosk_models[code]
        path = os.path.join(VOSK_MODEL_DIR, VOSK_MODELS[code])
        if not os.path.isdir(path):
            raise RuntimeError(f"VOSK model missing: {path}")
        _vosk_models[code] = _vosk.Model(path)
    return _vosk_models[code]


def _to_wav16k(tmp_path: str) -> str:
    """Convert arbitrary audio container to 16kHz mono PCM WAV (VOSK requirement)."""
    out = tmp_path + ".16k.wav"
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", tmp_path,
         "-ar", "16000", "-ac", "1", "-f", "wav", out],
        check=True, timeout=60,
    )
    return out


def _vosk_transcribe_one(wav_path: str, code: str) -> tuple[str, list[dict], float]:
    """Run one VOSK model over the wav. Returns (text, words, avg_conf)."""
    import wave
    model = get_vosk_model(code)
    rec = _vosk.KaldiRecognizer(model, 16000)
    rec.SetWords(True)
    with wave.open(wav_path, "rb") as wf:
        while True:
            data = wf.readframes(4000)
            if len(data) == 0:
                break
            rec.AcceptWaveform(data)
    final = json.loads(rec.FinalResult() or "{}")
    raw_words = final.get("result") or []
    words = []
    for w in raw_words:
        words.append({
            "text": (w.get("word") or "").strip(),
            "start": float(w.get("start")) if w.get("start") is not None else None,
            "end": float(w.get("end")) if w.get("end") is not None else None,
            "probability": float(w.get("conf")) if w.get("conf") is not None else None,
        })
    text = (final.get("text") or "").strip()
    confs = [w["probability"] for w in words if w["probability"] is not None]
    avg = (sum(confs) / len(confs)) if confs else 0.0
    return text, words, avg


def _transcribe_vosk(tmp_path: str, lang_hint: str | None) -> tuple[str, str, list[dict]]:
    """VoxSpica (VOSK) 引擎: lang=auto 時 cn/en-us 雙模型置信仲裁;
    cn 模型輸出經 zhconv s2t 轉繁體 (繁中介面必要)。"""
    wav_path = _to_wav16k(tmp_path)
    try:
        codes = []
        if lang_hint in ("zh", "tw", None):
            codes.append("zh")
        if lang_hint in ("en", None):
            codes.append("en")
        if not codes:
            codes = ["zh", "en"]

        best = None  # (avg_conf, code, text, words)
        for code in codes:
            try:
                text, words, avg = _vosk_transcribe_one(wav_path, code)
            except Exception:
                continue
            if best is None or avg > best[0]:
                best = (avg, code, text, words)

        if best is None:
            raise RuntimeError("no VOSK model available")

        _, code, text, words = best
        if code == "zh":
            # VOSK cn 模型吐簡體 → 繁體 (每詞各自轉, 讓字級字幕染色仍對齊)
            if _s2t is not None:
                text = _s2t(text, "zh-tw")
                for w in words:
                    w["text"] = _s2t(w["text"], "zh-tw")
            return text, "zh-TW", words
        return text, "en", words
    finally:
        try:
            os.unlink(wav_path)
        except OSError:
            pass


def transcribe_with_words(tmp_path: str, lang_hint: str | None) -> tuple[str, str, list[dict]]:
    """Engine dispatcher: VoxSpica(VOSK) 預設; 失敗或未裝 → whisper fallback."""
    if STT_ENGINE == "vosk" and _vosk is not None:
        try:
            return _transcribe_vosk(tmp_path, lang_hint)
        except Exception:
            if WhisperModel is None:
                raise
            # 落回 whisper (不中斷服務)
    return _transcribe_whisper(tmp_path, lang_hint)


def current_engine_label() -> str:
    if STT_ENGINE == "vosk" and _vosk is not None:
        return "stt:vosk:voxspica"
    return f"stt:whisper:{MODEL_SIZE}"


def _transcribe_whisper(tmp_path: str, lang_hint: str | None) -> tuple[str, str, list[dict]]:
    """Run faster-whisper with word_timestamps=True. Returns (text, lang, words)."""
    model = get_model()
    segments, info = model.transcribe(
        tmp_path,
        language=lang_hint,
        task="transcribe",
        beam_size=5,
        temperature=[0.0, 0.2, 0.4],
        condition_on_previous_text=False,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=300, speech_pad_ms=200, threshold=0.20),
        no_speech_threshold=0.4,
        compression_ratio_threshold=2.4,
        log_prob_threshold=-1.0,
        word_timestamps=True,  # <-- KEY: enables per-word start/end/probability
    )
    text_chunks = []
    words = []
    for seg in segments:
        text_chunks.append(seg.text)
        if seg.words:
            for w in seg.words:
                words.append({
                    "text": w.word.strip(),
                    "start": float(w.start) if w.start is not None else None,
                    "end": float(w.end) if w.end is not None else None,
                    "probability": float(w.probability) if w.probability is not None else None,
                })
    text = "".join(text_chunks).strip()
    detected = info.language or (lang_hint or "en")
    return text, detected, words


# ---------- SSE broadcast helpers ----------

async def _broadcast_to_room(room: str, event: dict):
    """Push event dict (will be JSON-serialized) to all subscribers of a room."""
    with _room_lock:
        queues = list(_room_subscribers.get(room, ()))
    if not queues:
        return
    payload = json.dumps(event, ensure_ascii=False)
    dead = []
    for q in queues:
        try:
            q.put_nowait(payload)
        except asyncio.QueueFull:
            # Slow consumer; drop the oldest, push the new one
            try:
                q.get_nowait()
                q.put_nowait(payload)
            except Exception:
                dead.append(q)
    if dead:
        with _room_lock:
            for q in dead:
                _room_subscribers[room].discard(q)


def broadcast_sync(room: str, event: dict):
    """Thread-safe wrapper to broadcast from sync context (background STT task).

    Uses a module-level loop reference set on the first /stream_push request,
    so worker threads spawned by run_in_executor can schedule broadcasts back
    onto the main asyncio loop.
    """
    global _main_loop
    try:
        loop = _main_loop or asyncio.get_running_loop()
    except RuntimeError:
        return
    loop.create_task(_broadcast_to_room(room, event))


# ---------- Endpoints ----------

@app.get("/health")
async def health():
    return {
        "status": "ok",
        "engine": current_engine_label(),
        "stt_engine_env": STT_ENGINE,
        "vosk_available": _vosk is not None,
        "model": MODEL_SIZE,
        "device": DEVICE,
        "port": STT_PORT,
    }


@app.get("/metrics")
async def metrics():
    return {
        "service": "stt-whisper",  # 服務名沿用 (PM2 app 名)
        "engine": current_engine_label(),
        "model": MODEL_SIZE,
        "device": DEVICE,
        "uptime": time.time() - START_TIME,
        "counters": dict(_counters),
        "active_rooms": len(_room_subscribers),
    }


@app.post("/transcribe")
async def transcribe(req: Request, lang: str = ""):
    """One-shot transcription with word-level timestamps (no streaming).
    2026-10-12: 引擎由 dispatcher 決定 (VoxSpica/VOSK 預設, whisper fallback)。"""
    if _vosk is None and WhisperModel is None:
        raise HTTPException(status_code=503, detail="no STT engine available")
    audio = await req.body()
    if not audio:
        raise HTTPException(status_code=400, detail="empty audio")
    suffix = detect_suffix(audio)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio)
        tmp = f.name
    try:
        _counters["transcribe_requests"] += 1
        hint = resolve_lang_hint(lang)
        text, detected, words = transcribe_with_words(tmp, hint)
        _counters["total_words"] += len(words)
        _counters["total_segments"] += max(1, len(words) // 10)
        return {
            "text": text,
            "language": detected,
            "words": words,
            "engine": current_engine_label(),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"transcribe failed: {e}")
    finally:
        os.unlink(tmp)


async def _stream_word_events(tmp_path: str, lang_hint: str | None, room: str | None):
    """Async generator yielding per-word SSE events with progressive translation."""
    try:
        text, detected, words = transcribe_with_words(tmp_path, lang_hint)
        _counters["total_words"] += len(words)
        _counters["stream_requests"] += 1
        # Emit a header event so clients can render meta
        header = {
            "type": "header",
            "room": room or "",
            "language": detected,
            "text": text,
            "engine": current_engine_label(),
        }
        yield f"event: header\ndata: {json.dumps(header, ensure_ascii=False)}\n\n"
        # Stream each word with timestamp
        for w in words:
            evt = {"type": "word", "room": room or "", **w}
            yield f"event: word\ndata: {json.dumps(evt, ensure_ascii=False)}\n\n"
        # Done marker
        yield f"event: done\ndata: {json.dumps({'type':'done','room':room or ''}, ensure_ascii=False)}\n\n"
    except Exception as e:
        err = {"type": "error", "error": str(e), "room": room or ""}
        yield f"event: error\ndata: {json.dumps(err, ensure_ascii=False)}\n\n"


@app.post("/transcribe_stream")
async def transcribe_stream(req: Request, lang: str = "auto", room: str = ""):
    """SSE stream of per-word events for one uploaded audio chunk."""
    audio = await req.body()
    if not audio:
        raise HTTPException(status_code=400, detail="empty audio")
    suffix = detect_suffix(audio)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio)
        tmp = f.name
    hint = resolve_lang_hint(lang)
    return StreamingResponse(
        _stream_word_events(tmp, hint, room),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------- Long-lived SSE channels ----------

@app.get("/transcribe_sse")
async def transcribe_sse(room: str = "default"):
    """Long-lived SSE. Viewers GET this; they receive events pushed via /stream_push."""
    queue: asyncio.Queue = asyncio.Queue(maxsize=128)
    with _room_lock:
        _room_subscribers[room].add(queue)

    async def event_source():
        try:
            # Initial hello so client knows it's connected
            yield f"event: hello\ndata: {json.dumps({'type':'hello','room':room})}\n\n"
            while True:
                try:
                    payload = await asyncio.wait_for(queue.get(), timeout=15.0)
                    yield f"data: {payload}\n\n"
                except asyncio.TimeoutError:
                    # Keep-alive heartbeat
                    yield f": keep-alive\n\n"
        finally:
            with _room_lock:
                _room_subscribers[room].discard(queue)
                if not _room_subscribers[room]:
                    _room_subscribers.pop(room, None)

    return StreamingResponse(
        event_source(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@app.post("/stream_push")
async def stream_push(req: Request, room: str = "default"):
    """caster pushes audio here; STT runs in a thread, broadcasts per-word events to the room."""
    if _vosk is None and WhisperModel is None:
        raise HTTPException(status_code=503, detail="no STT engine available")
    audio = await req.body()
    if not audio:
        raise HTTPException(status_code=400, detail="empty audio")
    suffix = detect_suffix(audio)
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio)
        tmp = f.name
    # Run transcribe in a worker thread so the event loop stays free
    loop = asyncio.get_running_loop()

    def worker():
        try:
            text, detected, words = transcribe_with_words(tmp, None)
            _counters["total_words"] += len(words)
            broadcast_sync(room, {"type": "header", "room": room, "language": detected,
                                  "text": text, "engine": current_engine_label()})
            for w in words:
                broadcast_sync(room, {"type": "word", "room": room, **w})
            broadcast_sync(room, {"type": "done", "room": room})
        except Exception as e:
            broadcast_sync(room, {"type": "error", "room": room, "error": str(e)})
        finally:
            try:
                os.unlink(tmp)
            except OSError:
                pass

    await loop.run_in_executor(None, worker)
    return {"ok": True, "room": room, "queued": True}


if __name__ == "__main__":
    # uvicorn.run creates its own event loop; we hook it via the startup event
    # inside the app's lifespan so worker threads can use _main_loop.
    from contextlib import asynccontextmanager

    @asynccontextmanager
    async def lifespan(app):
        global _main_loop
        _main_loop = asyncio.get_running_loop()
        yield

    # Replace the app's lifespan with one that captures the loop.
    # FastAPI builds its default lifespan at construction; we rewire it.
    app.router.lifespan_context = lifespan
    uvicorn.run(app, host="127.0.0.1", port=STT_PORT)
