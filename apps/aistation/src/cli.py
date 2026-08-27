# source_origin: AI Station §9 - Orchestration Layer
"""AI Station CLI / app entrypoint.

Exposes:
- `create_app()` for FastAPI/uvicorn
- `main()` for CLI: `aistation`
"""
from __future__ import annotations

import argparse
import os
import sys
from typing import Optional

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


def create_app():
    from fastapi import FastAPI
    from pydantic import BaseModel

    from src.brand import BRAND, PALETTE, get_brand
    from src.parsers.dna_parser import parse_dna
    from src.visuals.image_gen import generate_image

    app = FastAPI(title="AI Station", version="0.1.0")

    class GenerateRequest(BaseModel):
        script: str
        voice: str = "zh-TW-YunJheNeural"
        output_path: Optional[str] = None

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.get("/v1/brand")
    def brand():
        return get_brand()

    @app.post("/v1/generate")
    def generate(req: GenerateRequest):
        brand = get_brand()
        segments = parse_dna(req.script) or []
        preview = brand.get("intro_line", "") + "\n" + req.script[:120]
        image_path = None
        try:
            first_beat = req.script.split("【")[1].split("】")[1].strip() if "【" in req.script and "】" in req.script else req.script[:60]
            image_path = generate_image(first_beat, output_path=req.output_path)
        except Exception as exc:
            return {
                "status": "accepted",
                "voice": req.voice,
                "preview": preview,
                "segments": segments,
                "image_error": str(exc),
            }
        return {
            "status": "ok",
            "voice": req.voice,
            "preview": preview,
            "segments": segments,
            "image": image_path,
        }

    return app


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="aistation")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--reload", action="store_true")
    args = parser.parse_args(argv)

    app = create_app()
    try:
        import uvicorn
    except Exception as exc:
        print(f"[aistation] uvicorn not available: {exc}")
        return 1

    uvicorn.run(app, host=args.host, port=args.port, reload=args.reload)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
