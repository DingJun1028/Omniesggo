# source_origin: AI Station §9 - Module 2 Design Layer
"""RED tests for the DNA Parser (Module 2, §9).

Run with:  pytest apps/aistation/tests/test_dna_parser.py
"""
import os
import sys

# Make the aistation project root importable regardless of CWD.
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if ROOT not in sys.path:
    sys.path.insert(0, ROOT)

from src.parsers.dna_parser import parse_dna


def test_parse_single_scene():
    text = "[Scene] A quiet library at midnight."
    result = parse_dna(text)
    assert len(result) == 1
    assert result[0] == {"type": "Scene", "content": "A quiet library at midnight."}


def test_parse_multiple_scenes():
    text = (
        "[Scene] A quiet library at midnight.\n"
        "[Conflict] The only exit is sealed.\n"
        "[Insight] Silence is a clue, not an absence.\n"
        "[Method] Follow the hum of the ventilation.\n"
        "[Reflection] Some doors open inward."
    )
    result = parse_dna(text)
    assert [seg["type"] for seg in result] == [
        "Scene",
        "Conflict",
        "Insight",
        "Method",
        "Reflection",
    ]
    assert result[0]["content"] == "A quiet library at midnight."
    assert result[1]["content"] == "The only exit is sealed."
    assert result[4]["content"] == "Some doors open inward."
