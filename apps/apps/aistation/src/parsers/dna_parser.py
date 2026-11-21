# source_origin: AI Station §9 - Module 2 Design Layer
"""Script DNA Parser with 5-section markers per soul.md §9.2.

Parses script text into an ordered flat list of beat dicts.  Markers accept
BOTH the ASCII style "[Scene]"..." and the full-width brand style
"【場景】"...  One marker delimits exactly one beat.

Hash Lock: sha256:dna_parser_final_pending
"""
import re

DNA_PATTERN = re.compile(
    r'\[(?:Scene|Conflict|Insight|Method|Reflection)\]'                      # ASCII style
    r'|\【(?:場景|衝突|洞察|方法|反思)】'                                    # Full-width brand style
    , re.DOTALL
)
_ASCII_MARKER = re.compile(r'\[(Scene|Conflict|Insight|Method|Reflection)\]')
_FULL_MARKER = re.compile(r'【(?:場景|衝突|洞察|方法|反思)】')
_TYPE_FROM_TOKEN = {
    "Scene": "Scene", "Conflict": "Conflict", "Insight": "Insight",
    "Method": "Method", "Reflection": "Reflection",
    "場景": "Scene", "衝突": "Conflict", "洞察": "Insight",
    "方法": "Method", "反思": "Reflection",
}


def parse_dna(script_text: str) -> list:
    """
    Parse marker-delimited script into a flat list of beat dicts.

    Each beat is ``{"type": "<Scene|Conflict|Insight|Method|Reflection>",
    "content": "<text>"}`` so downstream consumers (``src/pipeline.py``,
    the CLI segments) can iterate directly.  Markers may be ASCII
    ("[Scene]") or full-width ("【場景】").  Returns an empty list when no
    markers are present (never ``None``, so ``or []`` guards stay safe and
    the hash-lock path always receives a list).

    Input:  "[Scene] Opening [Conflict] Problem"
    Output: [{"type": "Scene", "content": "Opening"},
             {"type": "Conflict", "content": "Problem"}]

    Input:  "【場景】夜裡的圖書館。【衝突】出口封死。"
    Output: [{"type": "Scene", "content": "夜裡的圖書館。"},
             {"type": "Conflict", "content": "出口封死。"}]
    """
    events = []  # (start, end, type_name)
    for m in _ASCII_MARKER.finditer(script_text):
        events.append((m.start(), m.end(), _TYPE_FROM_TOKEN.get(m.group(1), "Scene")))
    for m in _FULL_MARKER.finditer(script_text):
        token = m.group(0)[1:-1]  # strip the full-width brackets
        events.append((m.start(), m.end(), _TYPE_FROM_TOKEN.get(token, "Scene")))
    events.sort()

    beats = []
    for i, (start, end, type_name) in enumerate(events):
        nxt = events[i + 1][0] if i + 1 < len(events) else len(script_text)
        content = script_text[end:nxt].strip()
        beats.append({"type": type_name, "content": content})
    return beats


def parse_script_dna(script: str) -> list:
    """
    Legacy alias for parse_dna — maintained for backward compatibility
    with src/main.py imports.
    """
    return parse_dna(script)


def generate_subtitles(beats: list) -> str:
    """Generate SRT subtitle content from a list of parsed beats."""
    srt = []
    idx = 1
    for beat in beats:
        content = beat.get("content", "") if isinstance(beat, dict) else str(beat)
        if content:
            srt.append(str(idx))
            srt.append("00:00:00,000 --> 00:00:05,000")
            srt.append(content[:100])
            srt.append("")
            idx += 1
    return "\n".join(srt)
