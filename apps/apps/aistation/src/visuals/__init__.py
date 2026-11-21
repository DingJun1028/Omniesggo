# source_origin: AI Station §2 - Module 4 Render Layer (Visual Generator)
"""Visual Generator package (Module 4, §9).

Exposes the Pillow-based image generator and the AI Station brand palette.
"""
from src.visuals.image_gen import BRAND_COLORS, generate_image

__all__ = ["BRAND_COLORS", "generate_image"]
