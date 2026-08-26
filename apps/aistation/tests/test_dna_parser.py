# source_origin: AI Station §9 - Module 2 Design Layer
"""Tests for DNA Parser — strict TDD verification."""
import pytest
from src.parsers.dna_parser import parse_dna


class TestDNAParser:
    """Test DNA marker parsing per soul.md §9.2"""

    def test_parse_single_scene(self):
        """Single scene with all 5 markers should parse correctly."""
        result = parse_dna("[Scene] Opening [Conflict] Problem [Insight] Solution [Method] How [Reflection] Lesson")
        assert len(result["scenes"]) == 1
        scene = result["scenes"][0]
        assert scene["scene"] == "Opening"
        assert scene["conflict"] == "Problem"
        assert scene["insight"] == "Solution"
        assert scene["method"] == "How"
        assert scene["reflection"] == "Lesson"

    def test_parse_multiple_scenes(self):
        """Multiple scenes should be parsed into separate dicts."""
        result = parse_dna("[Scene] First [Scene] Second")
        assert len(result["scenes"]) == 2
        assert result["scenes"][0]["scene"] == "First"
        assert result["scenes"][1]["scene"] == "Second"

    def test_parse_empty_string(self):
        """Empty input should return empty scenes list."""
        result = parse_dna("")
        assert result["scenes"] == []

    def test_parse_no_markers(self):
        """Text with no markers should return empty scenes."""
        result = parse_dna("This is just plain text without markers.")
        assert result["scenes"] == []


# Hash Lock: sha256:test_dna_parser_pending
