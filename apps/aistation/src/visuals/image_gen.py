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

def generate_brand_gradient(width: int = 1280, height: int = 720) -> str:
    """Generate brand-compliant gradient background."""
    Path("storage/visuals").mkdir(parents=True, exist_ok=True)
    
    img = Image.new("RGB", (width, height), BRAND_COLORS["deep_blue"])
    draw = ImageDraw.Draw(img)
    
    for y in range(height):
        t = y / height
        r = int(BRAND_COLORS["deep_blue"][0] * (1 - t) + BRAND_COLORS["warm_gold"][0] * t)
        g = int(BRAND_COLORS["deep_blue"][1] * (1 - t) + BRAND_COLORS["warm_gold"][1] * t)
        b = int(BRAND_COLORS["deep_blue"][2] * (1 - t) + BRAND_COLORS["warm_gold"][2] * t)
        draw.line([(0, y), (width, y)], fill=(r, g, b))
    
    output_path = Path("storage/visuals/brand_gradient.png")
    img.save(output_path)
    return str(output_path)

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
