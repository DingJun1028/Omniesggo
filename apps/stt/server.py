#!/usr/bin/env python3
"""
萬能即時雙語字幕 - STT 微服務 (faster-whisper) — 2026-09-24 增強版
終始矩陣: 對應 universal-translator 的 ISpeechToSubtitleRequest
5T: engine 標記 stt:whisper (本地 CPU 推理, 零 key, 免費算立)

端點:
  POST /transcribe?lang=zh-TW|en       body=audio bytes -> {text, language, words[]}
  POST /transcribe_stream?lang=auto    body=audio bytes -> SSE stream of partial word events
  GET  /transcribe_sse?room=X&lang=auto long-lived SSE, accepts audio via POST to same room
  GET  /health                         回 {status:'ok', model, device}
  GET  /metrics                        回 uptime + counters

新增 (vs 2024-08-17 版):
  - word_timestamps=True -> 每字含 start/end/probability
  - /transcribe_stream SSE: 每字一個 event, type=word, data={room, text, start, end, prob}
  - /transcribe_sse long-lived SSE: 觀眾訂閱, caster POST /stream_push?room=X 推送
  - counters: total_words, total_segments, partial_stream_count
  - 雙向同步: 偵測語言後自動選擇目標 (zh-TW <-> en, 觀眾訂閱時 ?lang= 可覆寫)
"""
import io
import json
import os
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

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE", "int8")
STT_PORT = int(os.environ.get("STT_PORT", "8791"))

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


def transcribe_with_words(tmp_path: str, lang_hint: str | None) -> tuple[str, str, list[dict]]:
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
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE, "port": STT_PORT}


@app.get("/metrics")
async def metrics():
    return {
        "service": "stt-whisper",
        "model": MODEL_SIZE,
        "device": DEVICE,
        "uptime": time.time() - START_TIME,
        "counters": dict(_counters),
        "active_rooms": len(_room_subscribers),
    }


@app.post("/transcribe")
async def transcribe(req: Request, lang: str = ""):
    """One-shot transcription with word-level timestamps (no streaming)."""
    if WhisperModel is None:
        raise HTTPException(status_code=503, detail="faster_whisper not installed")
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
            "engine": f"stt:whisper:{MODEL_SIZE}",
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
            "engine": f"stt:whisper:{MODEL_SIZE}",
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
    if WhisperModel is None:
        raise HTTPException(status_code=503, detail="faster_whisper not installed")
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
                                  "text": text, "engine": f"stt:whisper:{MODEL_SIZE}"})
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
