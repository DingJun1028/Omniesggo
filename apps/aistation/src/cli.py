# source_origin: AI Station §9 - Orchestration Layer
"""AI Station app factory.

Creates the FastAPI app without triggering circular imports, so the
OpenAPI schema and TestClient can import it safely.
"""
from __future__ import annotations

from fastapi import FastAPI

from src.brand import get_brand
from src.parsers.dna_parser import parse_dna
from src.visuals.image_gen import generate_image


def create_app() -> FastAPI:
    app = FastAPI(title="AI Station", version="0.1.0")

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok"}

    @app.get("/v1/brand")
    def brand() -> dict:
        return get_brand()

    @app.post("/v1/generate")
    def generate(script: str, series: str | None = None) -> dict:
        brand = get_brand()
        segments = parse_dna(script) or []
        preview = brand.get("intro_line", "") + "\n" + script[:120]
        image_path: str | None = None
        try:
            first_beat = script.split("【")[1].split("】")[1].strip() if "【" in script and "】" in script else script[:60]
            image_path = generate_image(first_beat)
        except Exception as exc:
            return {
                "status": "accepted",
                "preview": preview,
                "segments": segments,
                "beat_count": len(segments),
                "series": brand.get("series") if isinstance(brand, dict) else None,
                "image_error": str(exc),
            }
        return {
            "status": "ok",
            "preview": preview,
            "segments": segments,
            "beat_count": len(segments),
            "series": brand.get("series") if isinstance(brand, dict) else None,
            "visual_path": image_path,
        }

    return app
