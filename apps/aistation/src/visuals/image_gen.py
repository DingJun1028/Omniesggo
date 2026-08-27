# source_origin: AI Station §9.4 / §9.9 - Module 4 Render Layer (Visual Generator)
"""Visual Generator (Module 4, §9 - Visual Layer).

Renders a branded visual asset from a text prompt using Pillow and the
AI Station brand palette. The generator is deterministic: the same
prompt and size always produce the same composition, so the output is
reproducible and hash-lockable.

5T Tangible: brand colors are imported from ``src.brand.PALETTE`` (the single
source of truth, §9.9) so the visual layer can never drift from the verified
壽司博士 brand identity (#10243f / #c9a24b / #f3ede1 / #3c6e47).
"""
import os
import re
import textwrap
from typing import Dict, Tuple

from PIL import Image, ImageDraw, ImageFont

from src.brand import PALETTE


def _hex_to_rgb(hex_str: str) -> Tuple[int, int, int]:
    """Convert a ``#rrggbb`` string to a 0-255 RGB tuple (5T: Trustworthy)."""
    h = hex_str.lstrip("#")
    return tuple(int(h[i : i + 2], 16) for i in (0, 2, 4))  # type: ignore[return-value]


# ── AI Station brand palette (RGB tuples, 0-255) ────────────────────────────
# Sourced from src.brand.PALETTE (§9.4): single source of truth.
# deep_blue   #10243f  — 思考與專業 (primary)
# warm_gold   #c9a24b  — 智慧與善意 (accent)
# ivory_white #f3ede1  — 人性與留白 (canvas)
# forest_green#3c6e47  — 生命與永續 (secondary)
BRAND_COLORS: Dict[str, Tuple[int, int, int]] = {
    "deep_blue": _hex_to_rgb(PALETTE["deep_blue"]),
    "warm_gold": _hex_to_rgb(PALETTE["warm_gold"]),
    "ivory_white": _hex_to_rgb(PALETTE["rice_white"]),
    "forest_green": _hex_to_rgb(PALETTE["green"]),
}


def _slugify(text: str) -> str:
    """Reduce arbitrary prompt text to a filesystem-safe slug."""
    cleaned = re.sub(r"[^\w\s-]", "", text.strip().lower())
    cleaned = re.sub(r"[\s_-]+", "-", cleaned).strip("-")
    return cleaned[:48] or "visual"


def _wrap(text: str, draw, font, max_width: int):
    """Greedy word-wrap of `text` so each line fits `max_width` pixels."""
    lines: list = []
    for paragraph in text.split("\n"):
        if not paragraph:
            lines.append("")
            continue
        wrapped = textwrap.wrap(paragraph, width=max(8, int(max_width / 9)))
        lines.extend(wrapped or [""])
    return lines


def generate_image(
    prompt: str,
    output_path: str | None = None,
    size: Tuple[int, int] = (1024, 1024),
    brand_colors: Dict[str, Tuple[int, int, int]] = BRAND_COLORS,
) -> str:
    """Generate a branded visual from `prompt` and return its file path.

    The composition is a clean editorial card: an ivory_white canvas, a
    deep_blue header band carrying the (wrapped) prompt, a warm_gold
    emblem in the center, and a forest_green footer band. Output is a PNG.

    Args:
        prompt: Source text rendered onto the visual.
        output_path: Destination PNG path. When None a default path under
            the current working directory's ``generated/`` folder is used.
        size: (width, height) in pixels.
        brand_colors: Palette override; defaults to BRAND_COLORS.

    Returns:
        The absolute path of the written PNG file.
    """
    if output_path is None:
        out_dir = os.path.join(os.getcwd(), "generated")
        os.makedirs(out_dir, exist_ok=True)
        output_path = os.path.join(out_dir, f"{_slugify(prompt)}.png")
    else:
        parent = os.path.dirname(os.path.abspath(output_path))
        os.makedirs(parent, exist_ok=True)

    width, height = size
    deep_blue = brand_colors["deep_blue"]
    warm_gold = brand_colors["warm_gold"]
    ivory_white = brand_colors["ivory_white"]
    forest_green = brand_colors["forest_green"]

    img = Image.new("RGB", (width, height), ivory_white)
    draw = ImageDraw.Draw(img)

    header_h = int(height * 0.20)
    footer_h = int(height * 0.12)

    # Header band (deep_blue) + footer band (forest_green)
    draw.rectangle([0, 0, width, header_h], fill=deep_blue)
    draw.rectangle([0, height - footer_h, width, height], fill=forest_green)

    # Central emblem: warm_gold ring + filled core
    cx, cy = width // 2, int((header_h + (height - footer_h)) / 2)
    radius = int(min(width, height) * 0.18)
    draw.ellipse(
        [cx - radius, cy - radius, cx + radius, cy + radius],
        outline=warm_gold,
        width=max(6, radius // 8),
    )
    draw.ellipse(
        [cx - radius // 2, cy - radius // 2, cx + radius // 2, cy + radius // 2],
        fill=warm_gold,
    )

    # Prompt text on the header band (ivory_white, wrapped, centered)
    try:
        font = ImageFont.load_default()
    except Exception:
        font = ImageFont.load_default()  # guaranteed to exist
    lines = _wrap(prompt, draw, font, max_width=int(width * 0.86))
    line_h = 14
    block_h = line_h * len(lines)
    y = max(8, header_h // 2 - block_h // 2)
    for line in lines:
        draw.text((width // 2, y), line, fill=ivory_white, font=font, anchor="mm")
        y += line_h

    # Footer label
    draw.text(
        (width // 2, height - footer_h // 2),
        "AI STATION",
        fill=ivory_white,
        font=font,
        anchor="mm",
    )

    img.save(output_path, format="PNG")
    return os.path.abspath(output_path)
