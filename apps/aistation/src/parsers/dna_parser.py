# source_origin: AI Station §9 - Module 2 Design Layer
"""DNA Parser (Module 2, §9 - Design Layer).

Parses bracketed DNA markup into an ordered list of typed segments.
"""
import re

DNA_PATTERN = r'\[(Scene|Conflict|Insight|Method|Reflection)\]\s*(.*?)(?=\[(Scene|Conflict|Insight|Method|Reflection)\]|$)'


def parse_dna(text: str) -> list[dict]:
    """Parse DNA markup into a list of {"type", "content"} segments.

    Segments are emitted in document order. Each segment's content is
    trimmed of surrounding whitespace.
    """
    segments = []
    for match in re.finditer(DNA_PATTERN, text, re.DOTALL):
        segments.append(
            {"type": match.group(1), "content": match.group(2).strip()}
        )
    return segments
