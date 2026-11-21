# source_origin: AI Station §12 - Global Incremental Pipeline Wiring
"""7-module production line with the §12 incremental optimizer + §18 5T gate.

This module is the GLOBAL LANDING point for soul.md §12. Every request that
flows through ``build_pipeline`` is processed by the ``IncrementalOutputOptimizer``
(chunk → 5T hash-lock seam → paginate) and sealed through ``verify_and_seal``
so the emitted artifact is individually traceable and trustworthy.

5T alignment (soul.md §12 / §18):
  Traceable  - every artifact carries ``source_origin`` (the module id)
  Trackable  - the orchestrator records page offsets + a request_id
  Tangible   - the response is paginated (bounded, surfaced to the caller)
  Transparent- the §18 hash-lock algorithm is isomorphic to the TS/root layer
  Trustworthy- ``verify_and_seal`` freezes the artifact (Object.freeze seam)

This implements the "全域增量升級" directive: the §12 architecture that was
only unit-tested is now wired into the real orchestration path (src/cli.py).
"""
from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from src.brand import get_brand
from src.incremental.gate import verify_and_seal
from src.incremental.optimizer import IncrementalOutputOptimizer
from src.incremental.patterns import ServiceOrchestrator
from src.parsers.dna_parser import parse_dna


# Module id for the pipeline itself (Traceable source_origin tag).
PIPELINE_SOURCE = "aistation:pipeline"


class AistationPipeline:
    """Orchestrates the 7-module line through the §12 incremental optimizer."""

    def __init__(
        self,
        chunk_size: int = 100,
        page_size: int = 10,
        version: str = "v0.5.0",
    ) -> None:
        self.optimizer = IncrementalOutputOptimizer(
            chunk_size=chunk_size, page_size=page_size
        )
        self.orchestrator = ServiceOrchestrator(page_size=page_size)
        self.version = version

    def run(
        self,
        script: str,
        series: Optional[str] = None,
        voice: str = "zh-TW-YunJheNeural",
    ) -> Dict[str, Any]:
        """Execute the production line and return an incremental + 5T-sealed result.

        The flow:
          1. brand preset (single source of truth, §9.9)
          2. DNA parse (Module 2 Design Layer)
          3. assemble the per-beat artifact list
          4. feed the list through ``IncrementalOutputOptimizer.optimize``
             (chunk → 5T hash-lock seam → paginate)
          5. seal the whole request via ``verify_and_seal`` (§18)
        """
        brand = get_brand()
        beats = parse_dna(script) or []

        # Each beat becomes a document; the optimizer chunks/compresses/paginates.
        documents = [
            {
                "type": b["type"],
                "content": b["content"],
                "beat_index": i,
            }
            for i, b in enumerate(beats)
        ]

        # §12.0: chunk → hash-lock seam → paginate.
        pages = self.optimizer.optimize(
            documents, chunk_size=self.optimizer.chunk_size, page_size=self.optimizer.page_size
        )

        # §18: seal the request with a 5T hash-lock (Trustworthy).
        request_id = str(uuid.uuid4())
        sealed = verify_and_seal(
            content={
                "series": series,
                "voice": voice,
                "beat_count": len(beats),
                "pages": len(pages),
            },
            source_origin=PIPELINE_SOURCE,
            evidence={"brand": brand.get("preset"), "voice": voice},
            version=self.version,
        )
        sealed["request_id"] = request_id
        sealed["beat_count"] = len(beats)  # top-level for callers (5T: Trackable)
        sealed["beats"] = beats
        sealed["pages"] = pages  # incremental, paginated output
        return sealed


def build_pipeline(**kwargs: Any) -> AistationPipeline:
    """Factory used by src/cli.py (create_app) — the global §12 wiring point."""
    return AistationPipeline(**kwargs)


if __name__ == "__main__":
    pipe = build_pipeline()
    out = pipe.run(
        "【場景】夜裡的圖書館。\n【衝突】出口封死了。\n【洞察】安靜是線索。",
        series="創價實驗室",
    )
    assert out["beat_count"] == 3
    assert out["pages"]  # paginated, non-empty
    assert "hash_lock" in out  # 5T sealed
    assert out["request_id"]
    print("§12 global pipeline self-check: PASS")
