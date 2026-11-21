# source_origin: AI Station §9 - Module 2 Design Layer
"""Tests for DNA Parser — strict TDD verification.

The parser is wired as the flat list-of-beat-dicts contract used across the
§12 pipeline and the CLI (/v1/generate). A single script marker = one beat.
"""
import pytest

from src.parsers.dna_parser import parse_dna


class TestDNAParser:
    """Test DNA marker parsing per soul.md §9.2"""

    def test_parse_single_scene(self):
        """Single script with 5 markers should parse to 5 beats."""
        result = parse_dna(
            "[Scene] Opening [Conflict] Problem [Insight] Solution "
            "[Method] How [Reflection] Lesson"
        )
        assert len(result) == 5
        assert result[0] == {"type": "Scene", "content": "Opening"}
        assert result[1] == {"type": "Conflict", "content": "Problem"}
        assert result[2] == {"type": "Insight", "content": "Solution"}
        assert result[3] == {"type": "Method", "content": "How"}
        assert result[4] == {"type": "Reflection", "content": "Lesson"}

    def test_parse_multiple_scenes(self):
        """Multiple Scene markers should parse into separate beats."""
        result = parse_dna("[Scene] First [Scene] Second")
        assert len(result) == 2
        assert result[0] == {"type": "Scene", "content": "First"}
        assert result[1] == {"type": "Scene", "content": "Second"}

    def test_parse_empty_string(self):
        """Empty input should return empty beat list."""
        result = parse_dna("")
        assert result == []

    def test_parse_no_markers(self):
        """Plain text without markers should return empty beat list."""
        result = parse_dna("This is just plain text without markers.")
        assert result == []


# Hash Lock: sha256:test_dna_parser_pending

