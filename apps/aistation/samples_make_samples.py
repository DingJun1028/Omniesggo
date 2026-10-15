# source_origin: AI Station §9 - P0 試營運 3 支樣片
"""Generate 3 sample videos from the same mother topic (2026 Berkeley ESG)
with different DNA scene compositions, to confirm the brand tone.

Run with the project interpreter (not the Hermes-agent default python):
    C:/Project/esggo/apps/aistation/.venv-test/Scripts/python.exe samples_make_samples.py
"""
import sys
from pathlib import Path

# Add the project root (apps/aistation) to sys.path so `src` package resolves.
_THIS = Path(__file__).resolve()
if str(_THIS.parent) not in sys.path:
    sys.path.insert(0, str(_THIS.parent))

from src.main import produce_pipeline  # noqa: E402

# (label, DNA-script) — 3 支樣片, same mother topic, different scene composition
SAMPLES = [
    (
        "sample_a",
        "【場景】大家好，我是壽司博士。2026 Berkeley ESG 國際永續策略與創新人才培訓課程秋季班。【反思】品牌調性：深藍暖金，混圍即封禁。",
    ),
    (
        "sample_b",
        "【場景】課程特色。理論 × 實戰 × 國際視野。【衝突】內容多但不聚焦。【洞察】樣片要讓品牌調性可感知。【方法】用 Pillow 品牌漸層套色。【反思】3 支樣片已產出。",
    ),
    (
        "sample_c",
        "【場景】五大核心模組。【衝突】開課網絡不夠曝光。【洞察】線上渠道要自動化。【方法】FastAPI + 背景執行緒。【反思】管線已落地，準備上線。",
    ),
]

def main() -> int:
    for index, (label, script) in enumerate(SAMPLES, start=1):
        result = produce_pipeline(
            script=script,
            voice="zh-TW-YunJheNeural",
            brand="sushi-doctor",
            video_id=f"aistation_3sample_{index}",
        )
        print(
            f"[OK] {label}  video_id={result['video_id']} "
            f"beats={result['beat_count']} visuals={result['visuals_count']} "
            f"subtitles_len={len(result['subtitles'])} "
            f"audio={result['audio_path']} "
            f"video={result['video_path']} "
            f"timestamp={result['timestamp']}"
        )
    print("3 samples produced.")

    # list produced artifacts for verification
    out = Path("storage/output")
    if out.exists():
        print("--- storage/output ---")
        for f in sorted(out.iterdir()):
            print(f"  {f.name}  ({f.stat().st_size} bytes)")

    aud = Path("storage")
    if aud.exists():
        print("--- storage (.mp3) ---")
        for f in sorted(aud.iterdir()):
            if f.is_file() and f.suffix == ".mp3":
                print(f"  {f.name}  ({f.stat().st_size} bytes)")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
