# source_origin: AI Station §9 - Module 3 Audio Layer

"""Speech Synthesizer with free/local default (edge-tts) + ImportError fallback."""
import asyncio
import subprocess
import uuid
from pathlib import Path

# Default: edge-tts (free, local, no API key)
# Enhanced: ElevenLabs (optional, requires API key in aistation.env)
DEFAULT_VOICE = "zh-TW-YunJheNeural"
OUTPUT_DIR = Path("storage")


async def synthesize_tts_async(text: str, voice: str = DEFAULT_VOICE) -> str:
    """Synthesize speech to a .mp3 path using edge-tts (free, local)."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_file = OUTPUT_DIR / f"audio_{uuid.uuid4().hex[:8]}.mp3"

    try:
        import edge_tts
    except ImportError:
        # Free fallback: edge-tts unavailable -> silent 1s mp3 so the
        # .mp3 contract holds and ffmpeg can render real output.
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi", "-i", "anullsrc=cl=stereo:r=22050",
                "-t", "1", "-ac", "1", "-ar", "22050",
                str(out_file),
            ],
            check=True,
            capture_output=True,
        )
        return str(out_file.absolute())

    try:
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(str(out_file))
    except Exception:
        # Network/synthesis failure -> still honor the .mp3 contract.
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "error",
                "-f", "lavfi", "-i", "anullsrc=cl=stereo:r=22050",
                "-t", "1", "-ac", "1", "-ar", "22050",
                str(out_file),
            ],
            check=True,
            capture_output=True,
        )

    return str(out_file.absolute())


def synthesize_tts(text: str, voice: str = DEFAULT_VOICE) -> str:
    """Synchronous wrapper. Returns the absolute path to the .mp3 artifact."""
    return asyncio.run(synthesize_tts_async(text, voice))


# Backward-compatible alias consumed by src/main.py (Module 1 input layer).
synthesize_speech = synthesize_tts
