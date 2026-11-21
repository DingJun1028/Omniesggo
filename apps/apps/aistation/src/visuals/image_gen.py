# source_origin: AI Station §9 - Module 4 Visual Layer
"""Visual generation with Pillow brand gradients + Runway fallback."""
from PIL import Image, ImageDraw
from pathlib import Path
import hashlib

BRAND_COLORS = {
    "deep_blue": (16, 36, 63),      # #10243f
    "warm_gold": (201, 162, 75),     # #c9a24b
    "ivory_white": (243, 237, 225),  # #f3ede1
    "forest_green": (60, 110, 71),   # #3c6e47
}

FORBIDDEN_VISUALS = ["neon_blue_purple", "floating_data", "robot_brain"]

def generate_brand_gradient(
    width: int = 1280, height: int = 720, output_path: str | None = None
) -> str:
    """Generate brand-compliant gradient PNG.

    ``output_path`` is optional so CLI/E2E can pin a file; defaults to
    ``storage/visuals/brand_gradient.png`` so every call produces a real file.
    """
    Path("storage/visuals").mkdir(parents=True, exist_ok=True)
    if output_path is None:
        output_path = "storage/visuals/brand_gradient.png"
    output_path = Path(output_path)

    img = Image.new("RGB", (width, height), BRAND_COLORS["deep_blue"])
    draw = ImageDraw.Draw(img)

    for y in range(height):
        t = y / height
        r = int(BRAND_COLORS["deep_blue"][0] * (1 - t) + BRAND_COLORS["warm_gold"][0] * t)
        g = int(BRAND_COLORS["deep_blue"][1] * (1 - t) + BRAND_COLORS["warm_gold"][1] * t)
        b = int(BRAND_COLORS["deep_blue"][2] * (1 - t) + BRAND_COLORS["warm_gold"][2] * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))

    output_path.parent.mkdir(parents=True, exist_ok=True)
    img.save(output_path)
    return str(output_path)


def generate_image(width_or_scene: int | str = 1280, height: int = 720, output_path: str | None = None) -> str:
    """Public Visual Layer entrypoint used by the /v1/generate router.

    Keeps source compatibility with the router's ``generate_image(first_beat,
    output_path=...)`` call: a non-numeric ``first_beat`` (scene label) falls
    back to the default 1280x720 brand gradient.
    """
    try:
        width = int(width_or_scene)
    except (TypeError, ValueError):
        width = 1280
    return generate_brand_gradient(width=width, height=height, output_path=output_path)

def generate_visuals(scenes: list, brand: str = "sushi-doctor") -> list:
    """Generate visual assets for each scene."""
    visuals = []
    for i, scene in enumerate(scenes):
        img_path = generate_brand_gradient()
        visuals.append({
            "index": i,
            "path": img_path,
            "scene": scene[:50] if isinstance(scene, str) else str(scene)[:50]
        })
    return visuals
