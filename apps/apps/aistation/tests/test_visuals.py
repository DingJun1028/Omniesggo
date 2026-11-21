# source_origin: AI Station §9 - Module 4 Visual Layer
"""Tests for Visual Generator — strict TDD verification."""
import pytest
from pathlib import Path
from src.visuals.image_gen import generate_brand_gradient, generate_visuals, BRAND_COLORS


class TestVisualGenerator:
    """Test brand-compliant visual generation per soul.md §9.4"""

    def test_generate_brand_gradient_returns_path(self):
        """generate_brand_gradient should return a valid PNG path."""
        path = generate_brand_gradient(width=100, height=100)
        assert path.endswith(".png")
        assert Path(path).exists()

    def test_generate_visuals_returns_list(self):
        """generate_visuals should return a list of scene objects."""
        scenes = ["[Scene] First", "[Scene] Second"]
        result = generate_visuals(scenes, brand="sushi-doctor")
        assert isinstance(result, list)
        assert len(result) == 2
        for visual in result:
            assert "index" in visual
            assert "path" in visual
            assert "scene" in visual

    def test_brand_colors_correct(self):
        """Verify brand colors match soul.md §9.2 specifications."""
        assert BRAND_COLORS["deep_blue"] == (16, 36, 63)
        assert BRAND_COLORS["warm_gold"] == (201, 162, 75)
        assert BRAND_COLORS["ivory_white"] == (243, 237, 225)
        assert BRAND_COLORS["forest_green"] == (60, 110, 71)

    def test_forbidden_visuals_blocked(self):
        """Verify forbidden visual patterns are listed."""
        from src.visuals.image_gen import FORBIDDEN_VISUALS
        assert "neon_blue_purple" in FORBIDDEN_VISUALS
        assert "floating_data" in FORBIDDEN_VISUALS
        assert "robot_brain" in FORBIDDEN_VISUALS


# Hash Lock: sha256:test_visuals_pending
