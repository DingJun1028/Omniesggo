"""
AI Station — main entry point.

Usage:
  python -m aistation                    # Start API server on :8788
  python -m aistation.process "..."      # Process single video (CLI)

Aligned with soul.md §8 AI Station 生產線.
"""

from __future__ import annotations

import argparse
import json
import sys
import uvicorn

from .orchestrator import AISTationOrchestrator
from .types import VideoRequest


def main_cli():
    """CLI entry point for processing single videos."""
    parser = argparse.ArgumentParser(
        description="AI Station — 7-module video production line",
    )
    parser.add_argument("prompt", nargs="?", help="Video script prompt")
    parser.add_argument("--title", "-t", default=None, help="Video title")
    parser.add_argument("--voice", default="zh-TW-HsinyiNeural", help="TTS voice")
    parser.add_argument("--width", type=int, default=1920, help="Video width")
    parser.add_argument("--height", type=int, default=1080, help="Video height")
    parser.add_argument("--fps", type=int, default=24, help="Frame rate")
    parser.add_argument("--duration", type=float, default=30.0, help="Duration seconds")
    parser.add_argument("--cloud", action="store_true", help="Use cloud services")
    parser.add_argument("--server", action="store_true", help="Start API server")
    parser.add_argument("--port", type=int, default=8788, help="API server port")
    parser.add_argument("--host", default="0.0.0.0", help="API server host")

    args = parser.parse_args()

    if args.server:
        # Start API server
        from .api import app
        uvicorn.run(app, host=args.host, port=args.port)
        return

    if not args.prompt:
        parser.print_help()
        sys.exit(1)

    # Process single video
    request = VideoRequest(
        prompt=args.prompt,
        title=args.title,
        voice=args.voice,
        width=args.width,
        height=args.height,
        fps=args.fps,
        duration=args.duration,
        cloud_enhance=args.cloud,
    )

    orchestrator = AISTationOrchestrator()
    result, metadata = orchestrator.process(request)

    print(f"\n{'='*60}")
    print(f"  AI Station — Pipeline Complete")
    print(f"{'='*60}")
    print(f"  UUID:     {result.uuid}")
    print(f"  Title:    {result.title}")
    print(f"  Status:   {metadata['report'].split(chr(10))[0]}")
    print(f"  5T Gate:  {'PASS' if metadata['t5_pass'] else 'FAIL'}")
    print(f"  Video:    {result.video_path}")
    if result.storage_url:
        print(f"  Storage:  {result.storage_url}")
    print(f"  Hash:     {metadata['hash_lock'][:32]}...")
    if metadata['errors']:
        print(f"  Errors:   {metadata['errors']}")
    print(f"{'='*60}")
    print(f"\nFull Report:\n{metadata['report']}")


if __name__ == "__main__":
    main_cli()
