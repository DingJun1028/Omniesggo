"""
AI Station — 七模生產線 (Seven-Module Production Line)

A 7-module video production pipeline that turns a text prompt into a
distributable video artifact, with optional cloud enhancements and
graceful fallbacks to free/local tools at every stage.

Modules (aligned with soul.md §8):
  1. 編排中心 (Input / Orchestrator)         -> FastAPI entry point + ThreadPoolExecutor
  2. 文字解析 (Script Parsing)                -> LLM or rule-based + Sushi-Doctor DNA markers
  3. 語音合成 (TTS)                           -> edge-tts (free) or ElevenLabs
  4. 視覺生成 (Visual Generation)            -> Pillow brand gradients + Runway (optional)
  5. 渲染引擎 (Render Engine)                 -> ffmpeg + OpenSLOsubtitle
  6. 雲端儲存 (Cloud Storage)                 -> local /storage (free) or S3
  7. 溯源庫 (Provenance / Metadata Archive)   -> SQLite + SHA-256 hash lock

All modules enforce the 5T Protocol (Traceable, Trackable, Tangible,
Transparent, Trustworthy) per soul.md §1.1.
"""

__version__ = "1.0.0"
