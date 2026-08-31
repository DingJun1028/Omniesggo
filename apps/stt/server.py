#!/usr/bin/env python3
"""
萬能即時雙語字幕 — STT 微服務 (faster-whisper)
終始矩陣: 對應 universal-translator 的 ISpeechToSubtitleRequest
5T: engine 標記 stt:whisper (本地 CPU 推理, 零 key, 免費算立)

端點:
  POST /transcribe?lang=zh-TW|en   body=audio bytes (webm/ogg/wav)
  GET  /health                     回 {status:'ok'}
  
依賴: pip install fastapi uvicorn faster-whisper
模型: base (CPU ~ 30s/段) 或 small (更準但更慢)
"""
import io
import os
import tempfile
import time
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
import uvicorn

START_TIME = time.time()
try:
    from faster_whisper import WhisperModel
except ImportError:
    WhisperModel = None

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "base")
DEVICE = os.environ.get("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.environ.get("WHISPER_COMPUTE", "int8")

app = FastAPI()

_model = None

def get_model():
    global _model
    if _model is None:
        if WhisperModel is None:
            raise RuntimeError("faster_whisper not installed")
        _model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
    return _model

@app.get("/health")
async def health():
    return {"status": "ok", "model": MODEL_SIZE, "device": DEVICE}

@app.get("/metrics")
async def metrics():
    return {
        "service": "stt-whisper",
        "model": MODEL_SIZE,
        "device": DEVICE,
        "status": "ok",
        "uptime": time.time() - START_TIME,
    }

@app.post("/transcribe")
async def transcribe(req: Request, lang: str = ""):
    if WhisperModel is None:
        raise HTTPException(status_code=503, detail="faster_whisper not installed")
    audio = await req.body()
    if not audio:
        raise HTTPException(status_code=400, detail="empty audio")
    # whisper 依副檔名選容器解析器; 依 body 魔數判斷真實格式, 避免「前端送 WAV 卻存成 .webm」導致 whisper 讀不到音
    if audio[:4] == b"RIFF" and audio[8:12] == b"WAVE":
        suffix = ".wav"
    elif audio[:4] == b"\x1a\x45\xdf\xa3":
        suffix = ".webm"
    elif audio[:3] == b"ID3" or audio[:2] == b"\xff\xfb" or audio[:2] == b"\xff\xf3" or audio[:2] == b"\xff\xf2":
        suffix = ".mp3"
    elif audio[:4] == b"OggS":
        suffix = ".ogg"
    else:
        suffix = ".webm"  # 未知: 退回 webm 探測
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as f:
        f.write(audio)
        tmp = f.name
    try:
        model = get_model()
        lang_hint = None
        if lang.lower().startswith("zh"):
            lang_hint = "zh"
        elif lang.lower().startswith("en"):
            lang_hint = "en"
        segments, info = model.transcribe(
            tmp,
            language=lang_hint,
            task="transcribe",
            beam_size=5,
            temperature=[0.0, 0.2, 0.4],
            condition_on_previous_text=False,
            vad_filter=True,
            vad_parameters=dict(min_silence_duration_ms=500, speech_pad_ms=200, threshold=0.35),
            no_speech_threshold=0.8,
            compression_ratio_threshold=2.2,
            log_prob_threshold=-0.8,
        )
        text = "".join(s.text for s in segments)
        detected = info.language or (lang_hint or "en")
        return {
            "text": text.strip(),
            "language": detected,
            "engine": f"stt:whisper:{MODEL_SIZE}",
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"transcribe failed: {e}")
    finally:
        os.unlink(tmp)

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ.get("STT_PORT", 8791)))
