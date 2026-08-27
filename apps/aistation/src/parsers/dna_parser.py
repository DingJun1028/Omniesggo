# source_origin: AI Station §9.3 / §9.5 - Module 2 Design Layer
"""DNA Parser (Module 2, §9 - Design Layer).

Parses bracketed DNA markup into an ordered list of typed segments.

5T Tangible/Transparent: supports BOTH the canonical Chinese markers
(【場景】【衝突】【洞察】【方法】【反思】, §9.3/§9.5) and the English aliases
([Scene][Conflict][Insight][Method][Reflection]). Full-width or half-width
brackets are accepted. Segment ``type`` is normalized to the English key so
downstream consumers (visuals, render) stay language-agnostic.
"""
import re

# Canonical Chinese markers (§9.3) and their English aliases.
_LABEL_MAP = {
    "場景": "Scene",
    "衝突": "Conflict",
    "洞察": "Insight",
    "方法": "Method",
    "反思": "Reflection",
    "Scene": "Scene",
    "Conflict": "Conflict",
    "Insight": "Insight",
    "Method": "Method",
    "Reflection": "Reflection",
}

# Accept 【】 or [] brackets (full-width or half-width), optional 】 close,
# optional trailing colon (： or :).
_MARKERS = "場景|衝突|洞察|方法|反思|Scene|Conflict|Insight|Method|Reflection"
DNA_PATTERN = (
    r"[\\[【]\s*(" + _MARKERS + r")\s*[\]】]?\s*[:：]?\s*(.*?)"
    r"(?=[\\[【](?:" + _MARKERS + r")[\]】]?|\Z)"
)


def parse_dna(text: str) -> list[dict]:
    """Parse DNA markup into a list of {"type", "content"} segments.

    Segments are emitted in document order. Each segment's ``type`` is the
    normalized English key; ``content`` is trimmed of surrounding whitespace.
    """
    segments = []
    for match in re.finditer(DNA_PATTERN, text, re.DOTALL):
        raw = match.group(1)
        segments.append(
            {"type": _LABEL_MAP[raw], "content": match.group(2).strip()}
        )
    return segments
