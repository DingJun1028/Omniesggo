"""
AI Station data types and models.
Aligned with soul.md §8 and OA-Team 5T Protocol.
"""

from __future__ import annotations

import uuid as _uuid
from dataclasses import dataclass, field
from enum import Enum
from typing import Any


class ModuleType(str, Enum):
    """7-Module Production Line identifiers (soul.md §8)."""
    ORCHESTRATOR = "orchestrator"      # 1. 編排中心
    SCRIPT_PARSER = "script_parser"    # 2. 文字解析
    TTS = "tts"                        # 3. 語音合成
    VISUAL_GEN = "visual_gen"          # 4. 視覺生成
    RENDERER = "renderer"              # 5. 渲染引擎
    STORAGE = "storage"                # 6. 雲端儲存
    PROVENANCE = "provenance"          # 7. 溯源庫


class EngineType(str, Enum):
    """Available engines with graceful fallback (soul.md §9.3)."""
    # Free / local defaults
    EDGE_TTS = "edge_tts"
    PILLOW = "pillow"
    FFMPEG = "ffmpeg"
    LOCAL_FS = "local_fs"
    SQLITE = "sqlite"

    # Cloud enhancements (optional)
    ELEVENLABS = "elevenlabs"
    RUNWAY = "runway"
    S3 = "s3"


@dataclass
class LifeCycleEvent:
    """Trackable lifecycle hook — soul.md §1.1 Trackable."""
    module: str
    action: str
    timestamp: int
    data: dict[str, Any] = field(default_factory=dict)


@dataclass
class VideoRequest:
    """Input request for the 7-module production line."""
    prompt: str
    title: str | None = None
    voice: str = "zh-TW-HsinyiNeural"  # edge-tts default
    voice_rate: float = 1.0
    voice_pitch: str = "+0Hz"
    width: int = 1920
    height: int = 1080
    fps: int = 24
    duration: float = 30.0
    brand_theme: str = "default"
    cloud_enhance: bool = False  # True = use ElevenLabs/Runway/S3
    source_origin: str = "aistation-api"
    output_dir: str | None = None  # Override output directory
    evidence: dict[str, Any] = field(default_factory=dict)

    def __post_init__(self):
        if self.title is None:
            self.title = f"AI-Station-{_uuid.uuid4().hex[:8]}"


@dataclass
class VideoArtifact:
    """Final video artifact with 5T compliance metadata."""
    uuid: str
    title: str
    video_path: str
    audio_path: str | None
    script_text: str
    provenance: dict[str, Any]
    hash_lock: str
    t5_pass: bool
    lifecycle: list[LifeCycleEvent]
    evidence: dict[str, Any] = field(default_factory=dict)
    storage_url: str | None = None  # S3 URL if cloud_enhance

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "uuid": self.uuid,
            "title": self.title,
            "video_path": self.video_path,
            "audio_path": self.audio_path,
            "script_text": self.script_text,
            "provenance": self.provenance,
            "hash_lock": self.hash_lock,
            "t5_pass": self.t5_pass,
            "lifecycle": [{"module": e.module, "action": e.action,
                            "timestamp": e.timestamp, "data": e.data} for e in self.lifecycle],
            "evidence": self.evidence,
            "storage_url": self.storage_url,
        }


@dataclass
class ModuleOutput:
    """Standard output from each module — includes 5T metadata."""
    module: str = ""
    engine: str = ""
    output: str = ""
    data: dict[str, Any] = field(default_factory=dict)
    source_origin: str = ""
    hash_lock: str = ""
    lifecycle: list[str] = field(default_factory=list)
    evidence: dict[str, Any] = field(default_factory=dict)
    t5_tags: list[str] = field(default_factory=list)
    status: str = "pending"

    def to_dict(self) -> dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "module": self.module,
            "engine": self.engine,
            "output": self.output,
            "data": self.data,
            "source_origin": self.source_origin,
            "hash_lock": self.hash_lock,
            "lifecycle": self.lifecycle,
            "evidence": self.evidence,
            "t5_tags": self.t5_tags,
            "status": self.status,
        }
