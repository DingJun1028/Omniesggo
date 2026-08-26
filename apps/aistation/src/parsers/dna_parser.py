# source_origin: AI Station §9 - Module 2 Design Layer
"""Script DNA Parser with 5-section markers per soul.md §9.2.

Parses script text containing [Scene][Conflict][Insight][Method][Reflection]
markers into structured JSON for downstream modules.

Hash Lock: sha256:dna_parser_final_pending
"""
import re

DNA_PATTERN = r'\[(Scene|Conflict|Insight|Method|Reflection)\]\s*(.*?)(?=\[(Scene|Conflict|Insight|Method|Reflection)\]|$)'
DNA_MARKERS = ["Scene", "Conflict", "Insight", "Method", "Reflection"]

def parse_dna(script_text: str) -> dict:
    """
    Parse script text into structured scene data.
    
    Input:  "[Scene] Opening [Conflict] Problem [Insight] Solution"
    Output: {"scenes": [{"scene": "Opening", "conflict": "Problem", ...}]}
    
    Args:
        script_text: Raw script with [Marker] content format
        
    Returns:
        Dict with "scenes" list of parsed scene dicts
    """
    segments = []
    for match in re.finditer(DNA_PATTERN, script_text, re.DOTALL):
        segments.append({
            "type": match.group(1),
            "content": match.group(2).strip()
        })
    
    # Group segments into scenes (a new Scene marker starts a new scene)
    scenes = []
    current_scene = {}
    
    for seg in segments:
        if seg["type"] == "Scene":
            if current_scene:
                scenes.append(current_scene)
            current_scene = {"scene": seg["content"]}
        else:
            current_scene[seg["type"].lower()] = seg["content"]
    
    if current_scene:
        scenes.append(current_scene)
    
    return {"scenes": scenes}


def parse_script_dna(script: str) -> dict:
    """
    Legacy alias for parse_dna — maintained for backward compatibility
    with src/main.py imports.
    """
    return parse_dna(script)


def generate_subtitles(scenes_data: dict) -> str:
    """Generate SRT subtitle content from parsed scenes."""
    srt = []
    idx = 1
    for scene in scenes_data.get("scenes", []):
        for key, content in scene.items():
            if content and key != "scene":
                srt.append(f"{idx}")
                srt.append("00:00:00,000 --> 00:00:05,000")
                srt.append(content[:100])
                srt.append("")
                idx += 1
    return "\n".join(srt)
