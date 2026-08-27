# source_origin: AI Station §2 - Module 4 Render Layer (Visual Generator)
"""RED/GREEN tests for the Visual Generator (Module 4, §9).

Run with:  pytest apps/aistation/tests/test_visuals.py
"""
import os
import sys

# Make the aistation project root importable regardless of CWD.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from PIL import Image

from src.visuals.image_gen import BRAND_COLORS, generate_image


def test_generate_image_returns_path(tmp_path):
    """generate_image must return a filesystem path to a real PNG it created."""
    out = tmp_path / "viz.png"
    result = generate_image("A quiet library at midnight", output_path=str(out))

    # Returns a path string (not None / not an object)
    assert isinstance(result, str)
    # The returned path equals the requested output path
    assert result == str(out)
    # The file physically exists
    assert os.path.isfile(result)
    # And it is a valid, non-empty PNG image
    with Image.open(result) as img:
        assert img.format == "PNG"
        assert img.size[0] > 0 and img.size[1] > 0


def test_generate_image_uses_brand_colors():
    """The module must expose the four AI Station BRAND_COLORS."""
    assert set(BRAND_COLORS) == {
        "deep_blue",
        "warm_gold",
        "ivory_white",
        "forest_green",
    }
    # Every brand color is a 3-tuple of 0-255 RGB ints
    for rgb in BRAND_COLORS.values():
        assert isinstance(rgb, tuple) and len(rgb) == 3
        assert all(isinstance(c, int) and 0 <= c <= 255 for c in rgb)


def test_brand_colors_match_single_source_of_truth():
    """5T Tangible: RGB values must equal the verified palette in src/brand.py (§9.9)."""
    from src.brand import PALETTE

    expected = {
        "deep_blue": (0x10, 0x24, 0x3F),  # #10243f
        "warm_gold": (0xC9, 0xA2, 0x4B),  # #c9a24b
        "ivory_white": (0xF3, 0xED, 0xE1),  # #f3ede1 (rice_white)
        "forest_green": (0x3C, 0x6E, 0x47),  # #3c6e47
    }
    for name, rgb in expected.items():
        assert BRAND_COLORS[name] == rgb, f"{name} drifted from src/brand.py"
    # Sanity: the single source of truth carries the same hex.
    assert PALETTE["deep_blue"] == "#10243f"
    assert PALETTE["warm_gold"] == "#c9a24b"
