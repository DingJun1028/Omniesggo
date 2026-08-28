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


def test_parse_chinese_dna_markers(section="9.3"):
    """§9.3/§9.5: canonical Chinese markers must parse and normalize to EN keys."""
    text = (
        "【場景】夜裡的圖書館一片寂靜。\n"
        "【衝突】唯一的出口被封死了。\n"
        "【洞察】安靜是線索，不是空白。\n"
        "【方法】跟著通風口的嗡鳴走。\n"
        "【反思】有些門向內開。"
    )
    result = parse_dna(text)
    assert [seg["type"] for seg in result] == [
        "Scene",
        "Conflict",
        "Insight",
        "Method",
        "Reflection",
    ]
    assert result[0]["content"] == "夜裡的圖書館一片寂靜。"
    assert result[4]["content"] == "有些門向內開。"


def test_parse_chinese_markers_with_colon():
    """§9.3 markers may carry a trailing full-width colon (：)."""
    text = "【場景】：深夜的圖書館。【洞察】：安靜即線索。"
    result = parse_dna(text)
    assert result[0] == {"type": "Scene", "content": "深夜的圖書館。"}
    assert result[1] == {"type": "Insight", "content": "安靜即線索。"}


def test_parse_mixed_brackets_and_aliases():
    """Half-width [Conflict] and full-width 【方法】 may coexist; both normalize."""
    text = "[Conflict] exit sealed.【方法】follow the hum."
    result = parse_dna(text)
    assert [seg["type"] for seg in result] == ["Conflict", "Method"]
    assert result[0]["content"] == "exit sealed."
    assert result[1]["content"] == "follow the hum."
