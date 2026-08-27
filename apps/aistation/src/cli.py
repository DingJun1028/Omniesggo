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

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)


def create_app():
    from fastapi import FastAPI
    from pydantic import BaseModel

    app = FastAPI(title="AI Station", version="0.1.0")

    class GenerateRequest(BaseModel):
        script: str
        voice: str = "zh-TW-YunJheNeural"

    @app.get("/health")
    def health():
        return {"status": "ok"}

    @app.post("/v1/generate")
    def generate(req: GenerateRequest):
        return {
            "status": "accepted",
            "voice": req.voice,
            "preview": req.script[:120],
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
