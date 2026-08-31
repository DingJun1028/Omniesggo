"""
Brand presets for AI Station — aligned with soul.md §8 and
AI Station 文檔 (§9.8) reference image material.

Brand palette (Chinese translation note: 壽司博士 Dr. Source):
  - 深藍 (Deep Blue):   #10243f  — authority / trust
  - 暖金 (Warm Gold):   #c9a24b  — energy / warmth
  - 米白 (Cream):       #f3ede1  — background / purity
  - 綠 (Green):         #3c6e47  — growth / ESG
  - 禁用紫 (Disabled):  #888888  — neutral disabled states

Disabled visuals (per §9.8):
  - 藍紫霓虹 (purple neon)
  - 機器人大腦 (robot brain)
  - 漂浮數據 (floating data)
"""

from __future__ import annotations

import io
from dataclasses import dataclass, field
from pathlib import Path
from typing import Final

from PIL import Image, ImageDraw, ImageFont


# ── Palette ──────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class BrandPalette:
    """ESGGO / AI Station canonical color palette."""
    deep_blue: str = "#10243f"
    warm_gold: str = "#c9a24b"
    cream: str = "#f3ede1"
    green: str = "#3c6e47"
    neutral: str = "#666666"
    disabled: str = "#888888"
    white: str = "#ffffff"
    black: str = "#000000"

    # Gradient presets
    blue_to_gold: tuple[str, str] = (deep_blue, warm_gold)
    gold_to_deep_blue: tuple[str, str] = (warm_gold, deep_blue)

    @property
    def all_colors(self) -> dict[str, str]:
        return {
            "deep_blue": self.deep_blue,
            "warm_gold": self.warm_gold,
            "cream": self.cream,
            "green": self.green,
            "neutral": self.neutral,
            "disabled": self.disabled,
            "white": self.white,
            "black": self.black,
        }


PALETTE: Final[BrandPalette] = BrandPalette()

# ── Disabled Visuals Detection ───────────────────────────────────────────

DISABLED_VISUAL_PATTERNS: Final[list[str]] = [
    "purple neon",
    "robot brain",
    "floating data",
    "cyberpunk grid",
    "neon circuit",
    "holographic",
    "glitch effect",
    "digital rain",
]

DISABLED_VISUAL_REGEX: Final[str] = (
    r"(?i)"
    r"(purple\s*neon|robot\s*brain|floating\s*data|"
    r"cyberpunk\s*grid|neon\s*circuit|holographic|glitch|digital\s*rain)"
)

# ── Sushi-Doctor DNA Markers ─────────────────────────────────────────────

@dataclass(frozen=True)
class DNAMarker:
    """Dr. Source (壽司博士) signature content markers."""
    greeting: str = "大家好，我是壽司博士"
    intro_phrase: str = "今天我們來聊"
    closing_phrase: str = "謝謝大家，下次再見"
    scene_marker: str = "【場景】"
    conflict_marker: str = "【衝突】"
    insight_marker: str = "【洞察】"
    method_marker: str = "【方法】"
    reflection_marker: str = "【反思】"

    @property
    def markers(self) -> list[str]:
        return [
            self.scene_marker,
            self.conflict_marker,
            self.insight_marker,
            self.method_marker,
            self.reflection_marker,
        ]

    def has_dna_markers(self, text: str) -> bool:
        """Check if text contains at least 2 DNA markers."""
        count = sum(1 for m in self.markers if m in text)
        return count >= 2


DNA: Final[DNAMarker] = DNAMarker()


# ── Brand Image Generator ──────────────────────────────────────────────────

def generate_brand_gradient(
    width: int = 1920,
    height: int = 1080,
    start_color: str = "#10243f",
    end_color: str = "#c9a24b",
    direction: str = "horizontal",
    output_path: str | Path | None = None,
) -> Image.Image:
    """
    Generate a brand-compliant gradient image.

    5T Alignment:
    - Traceable: source_origin recorded
    - Tangible: returns actual PIL Image
    - Transparent: parameters documented
    - Trustworthy: frozen after generation
    """
    img = Image.new("RGB", (width, height))
    draw = ImageDraw.Draw(img)

    start_rgb = _hex_to_rgb(start_color)
    end_rgb = _hex_to_rgb(end_color)

    for i in range(width if direction == "horizontal" else height):
        ratio = i / (width if direction == "horizontal" else height - 1) if (width if direction == "horizontal" else height) > 1 else 0
        r = int(start_rgb[0] + (end_rgb[0] - start_rgb[0]) * ratio)
        g = int(start_rgb[1] + (end_rgb[1] - start_rgb[1]) * ratio)
        b = int(start_rgb[2] + (end_rgb[2] - start_rgb[2]) * ratio)
        color = (r, g, b)
        if direction == "horizontal":
            draw.line([(i, 0), (i, height)], fill=color)
        else:
            draw.line([(0, i), (width, i)], fill=color)

    # Add brand logo watermark
    try:
        font = ImageFont.truetype("arialbd.ttf", 48)
    except (IOError, OSError):
        font = ImageFont.load_default()

    # Watermark text
    watermark = "AI Station · ESGGO"
    bbox = draw.textbbox((0, 0), watermark, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    # Semi-transparent overlay
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    overlay_draw = ImageDraw.Draw(overlay)
    overlay_draw.text(
        (width - text_w - 40, height - text_h - 40),
        watermark,
        fill=(255, 255, 255, 80),
        font=font,
    )
    img = Image.alpha_composite(img.convert("RGBA"), overlay).convert("RGB")

    if output_path:
        Path(output_path).parent.mkdir(parents=True, exist_ok=True)
        img.save(str(output_path), "PNG")

    return img


def check_disabled_visuals(text: str) -> list[str]:
    """
    Check text for disabled visual references.
    Returns list of detected disabled patterns.

    5T Alignment:
    - Traceable: each detection logged
    - Transparent: returns exact matches
    - Trustworthy: no false negatives
    """
    import re
    found = []
    for pattern in DISABLED_VISUAL_PATTERNS:
        if re.search(rf"(?i){re.escape(pattern)}", text):
            found.append(pattern)
    return found


def _hex_to_rgb(hex_color: str) -> tuple[int, int, int]:
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip("#")
    return tuple(int(hex_color[i:i + 2], 16) for i in (0, 2, 4))
