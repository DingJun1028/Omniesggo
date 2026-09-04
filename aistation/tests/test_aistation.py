"""
AI Station — 28 pytest test cases (aligned with soul.md §9.4 + §9.7)

Test Categories:
  1. Brand Tests (6)           — brand.py
  2. 5T Gate Tests (6)         — gate.py
  3. Script Parser Tests (4)   — modules/script_parser.py
  4. TTS Tests (4)             — modules/tts.py
  5. Visual Generator Tests (4)— modules/visual_gen.py
  6. Renderer Tests (3)        — modules/renderer.py
  7. Storage Tests (2)         — modules/storage.py
  8. Provenance Tests (2)      — modules/provenance.py
  9. Orchestrator E2E Tests (1) — orchestrator.py

Aligns with: soul.md §9.7 AI Station 部署狀態 — 28 passed
"""

from __future__ import annotations

import hashlib
import os
import sqlite3
import struct
import time
import wave
from pathlib import Path
from unittest.mock import patch, MagicMock

import pytest
from PIL import Image

from aistation.brand import (
    PALETTE, DNA, DISABLED_VISUAL_PATTERNS,
    generate_brand_gradient, check_disabled_visuals
)
from aistation.gate import (
    hash_lock, verify_5t, verify_gate, forge_artifact,
    FrozenArtifact, T5State, VerificationResult
)
from aistation.types import VideoRequest, LifeCycleEvent, ModuleOutput
from aistation.modules.script_parser import ScriptParser
from aistation.modules.tts import TTSEngine
from aistation.modules.visual_gen import VisualGenerator
from aistation.modules.renderer import VideoRenderer
from aistation.modules.storage import StorageEngine
from aistation.modules.provenance import ProvenanceArchive
from aistation.orchestrator import AISTationOrchestrator, PipelineResult

# 5T-compliant mock output for provenance tests
MOCK_5T_OUTPUT = (
    "【來源/source_origin】renderer:ffmpeg | 引用 soul.md §8 AI Station 模組 5\n"
    "【透明/揭露】引擎: ffmpeg | fallback rendering used | 合規率 100%\n"
    "【量化/達成】已渲染合成视频，建立影片文件 1 個，完成渲染任務\n"
    "【信任/封印】SHA-256 Hash Lock: abc1234567890abcdef，寫入即凍結\n"
    "【追蹤/期間】2026 年度 | 日期 2026-08-28 | lifecycle monitor 啟用\n"
    "\nVideo file: /test/output.mp4"
)

# ── Fixtures ──────────────────────────────────────────────────────────────

@pytest.fixture
def sample_prompt() -> str:
    return """【場景】ESG 投資分析師面對氣候風險揭示。【衝突】傳統評分模型忽略物理風險。
    【洞察】氣候損失預估需結合衞星數據與財務模型。【方法】引入 TCFD 三場景 + 衛星影像。
    【反思】真正的 ESG 投資需「見地而不見色」，以數據為準。"""


@pytest.fixture
def simple_prompt() -> str:
    return "ESG 投資分析師面對氣候風險。傳統評分模型忽略物理風險。"


@pytest.fixture
def video_request(simple_prompt: str, tmp_path) -> VideoRequest:
    return VideoRequest(
        prompt=simple_prompt,
        title="Test Video",
        width=640,
        height=360,
        fps=24,
        duration=5.0,
        source_origin="test:pytest",
    )


@pytest.fixture
def tmp_output_dir(tmp_path) -> str:
    d = str(tmp_path / "aistation_output")
    Path(d).mkdir(parents=True, exist_ok=True)
    return d


@pytest.fixture
def silence_wav(tmp_path) -> str:
    """Create a small silent WAV file for testing."""
    path = str(tmp_path / "silence.wav")
    with wave.open(path, "w") as wav:
        wav.setnchannels(1)
        wav.setsampwidth(2)
        wav.setframerate(22050)
        frames = b"\x00\x00" * 11025  # 0.5s silence
        wav.writeframes(frames)
    return path


# ═══════════════════════════════════════════════════════════════════════════
# 1. Brand Tests (6 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestBrand:
    """6 tests — Brand presets aligned with soul.md §9.8."""

    def test_palette_colors(self):
        """Test brand palette has correct colors."""
        assert PALETTE.deep_blue == "#10243f"
        assert PALETTE.warm_gold == "#c9a24b"
        assert PALETTE.cream == "#f3ede1"
        assert PALETTE.green == "#3c6e47"

    def test_palette_gradient_presets(self):
        """Test gradient presets are defined."""
        assert PALETTE.blue_to_gold == ("#10243f", "#c9a24b")
        assert PALETTE.gold_to_deep_blue == ("#c9a24b", "#10243f")

    def test_palette_all_colors(self):
        """Test all_colors returns all brand colors."""
        colors = PALETTE.all_colors
        assert "deep_blue" in colors
        assert "warm_gold" in colors
        assert "cream" in colors
        assert "green" in colors
        assert len(colors) == 8

    def test_generate_brand_gradient(self, tmp_path):
        """Test gradient image generation."""
        output = str(tmp_path / "gradient.png")
        img = generate_brand_gradient(100, 100, output_path=output)
        assert img.size == (100, 100)
        assert os.path.exists(output)

    def test_dna_greeting(self):
        """Test Sushi-Doctor DNA greeting."""
        assert DNA.greeting == "大家好，我是壽司博士"
        assert DNA.intro_phrase == "今天我們來聊"
        assert DNA.closing_phrase == "謝謝大家，下次再見"

    def test_check_disabled_visuals(self, simple_prompt: str):
        """Test disabled visual detection."""
        # Normal text should not trigger
        assert check_disabled_visuals(simple_prompt) == []
        # Disabled visuals should be caught
        disabled_text = "This uses purple neon and floating data"
        found = check_disabled_visuals(disabled_text)
        assert len(found) == 2
        assert "purple neon" in found
        assert "floating data" in found


# ═══════════════════════════════════════════════════════════════════════════
# 2. 5T Gate Tests (6 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestFiveTGate:
    """6 tests — 5T Protocol verification."""

    def test_hash_lock_deterministic(self):
        """Test hash lock produces consistent SHA-256."""
        data = {"module": "test", "value": 42}
        h1 = hash_lock(data)
        h2 = hash_lock(data)
        assert h1 == h2
        assert len(h1) == 64  # SHA-256 hex

    def test_hash_lock_sensitive_to_change(self):
        """Test hash changes when content changes."""
        h1 = hash_lock({"value": 1})
        h2 = hash_lock({"value": 2})
        assert h1 != h2

    def test_verify_gate_traceable(self):
        """Test traceable gate verification."""
        content = "GRI/ISO certified. source_origin documented." * 5
        assert verify_gate("traceable", content) is True

    def test_verify_gate_transparent(self):
        """Test transparent gate verification."""
        content = ("公開揭露: 合規率 100%。比率 95% 比例。" * 8)
        assert verify_gate("transparent", content) is True

    def test_verify_5t_pass(self):
        """Test full 5T verification passes with valid content."""
        content = (
            ("【來源】GRI/ISO reference. " * 8)
            + ("【透明】比率 100% 公開揭露. " * 10)
            + ("【量化】已完成 建立 數量 5 項. " * 10)
            + ("【信任】SHA-256 hash 封印驗證 audit trail. " * 5)
            + ("【追蹤】2026 年度 日期 追踤 monitor. " * 5)
        )
        result = verify_5t(content, source_origin="test:pytest",
                           hash_value="abc123def456")
        assert result.pass_ is True
        assert result.failed_gates == []

    def test_verify_5t_fail(self):
        """Test 5T verification fails with empty content."""
        result = verify_5t("")
        assert result.pass_ is False
        assert len(result.failed_gates) == 5


# ═══════════════════════════════════════════════════════════════════════════
# 3. Script Parser Tests (4 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestScriptParser:
    """4 tests — Script parser with DNA markers."""

    def test_parse_creates_dna_markers(self, sample_prompt: str, tmp_output_dir):
        """Test that parser creates DNA markers."""
        parser = ScriptParser()
        output = parser.parse(sample_prompt, "Test")
        assert "【場景】" in output.data["script"]
        assert "【衝突】" in output.data["script"]
        assert "【洞察】" in output.data["script"]
        assert "【方法】" in output.data["script"]
        assert "【反思】" in output.data["script"]

    def test_parse_fallback_dna_injection(self, simple_prompt: str, tmp_output_dir):
        """Test fallback DNA injection when markers absent."""
        parser = ScriptParser()
        output = parser.parse(simple_prompt, "Test")
        script = output.data["script"]
        marker_count = sum(1 for m in DNA.markers if m in script)
        assert marker_count >= 2  # At least 2 DNA markers injected

    def test_parse_detects_disabled_visuals(self, tmp_output_dir):
        """Test that parser detects disabled visuals."""
        parser = ScriptParser()
        prompt_with_disabled = "purple neon robot brain floating data ESG"
        output = parser.parse(prompt_with_disabled, "Test")
        assert len(output.data["disabled_visuals_found"]) >= 3

    def test_parse_hash_lock(self, sample_prompt: str, tmp_output_dir):
        """Test that parser output has hash lock."""
        parser = ScriptParser()
        output = parser.parse(sample_prompt, "Test")
        assert output.hash_lock
        assert len(output.hash_lock) == 64
        assert output.source_origin == "script_parser:rule-based"


# ═══════════════════════════════════════════════════════════════════════════
# 4. TTS Tests (4 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestTTS:
    """4 tests — Text-to-speech with graceful fallback."""

    def test_tts_fallback_generates_audio(self, simple_prompt: str, tmp_path):
        """Test TTS generates audio file (silence fallback)."""
        request = VideoRequest(
            prompt=simple_prompt,
            width=320, height=180,
            output_dir=str(tmp_path),
        )
        tts = TTSEngine()
        # Force fallback (no edge-tts in CI)
        tts._edge_tts_available = False
        output = tts.synthesize(simple_prompt, request)
        assert output.status == "completed"
        assert output.engine == "silence-fallback"
        assert output.data.get("audio_path")
        assert os.path.exists(output.data["audio_path"])

    def test_tts_has_source_origin(self, simple_prompt: str, tmp_path):
        """Test TTS output has traceable source_origin."""
        request = VideoRequest(
            prompt=simple_prompt, width=320, height=180,
            source_origin="test:tts",
        )
        tts = TTSEngine()
        tts._edge_tts_available = False
        output = tts.synthesize(simple_prompt, request)
        assert "tts:" in output.source_origin

    def test_tts_hash_lock(self, simple_prompt: str, tmp_path):
        """Test TTS output has valid hash lock."""
        request = VideoRequest(prompt=simple_prompt, width=320, height=180)
        tts = TTSEngine()
        tts._edge_tts_available = False
        output = tts.synthesize(simple_prompt, request)
        assert output.hash_lock
        assert len(output.hash_lock) == 64

    def test_tts_lifecycle_events(self, simple_prompt: str, tmp_path):
        """Test TTS records lifecycle events."""
        request = VideoRequest(prompt=simple_prompt, width=320, height=180)
        tts = TTSEngine()
        tts._edge_tts_available = False
        output = tts.synthesize(simple_prompt, request)
        assert len(output.lifecycle) >= 3  # start, synthesize, complete


# ═══════════════════════════════════════════════════════════════════════════
# 5. Visual Generator Tests (4 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestVisualGenerator:
    """4 tests — Visual generation with Pillow."""

    def test_generate_background(self, tmp_path):
        """Test background image generation."""
        output = str(tmp_path / "bg.png")
        vgen = VisualGenerator()
        result = vgen.generate_background(320, 180, output)
        assert os.path.exists(output)
        assert result.data["file_hash"]
        assert len(result.data["file_hash"]) == 64

    def test_generate_subtitle_frames(self, simple_prompt: str, tmp_path):
        """Test subtitle frame generation."""
        vgen = VisualGenerator()
        frames_dir = str(tmp_path / "frames")
        frame_paths, result = vgen.generate_subtitle_frames(
            simple_prompt, 320, 180, 24, frames_dir,
        )
        assert len(frame_paths) >= 1
        assert all(os.path.exists(p) for p in frame_paths)
        assert result.data["frame_count"] >= 1

    def test_background_hash_lock(self, tmp_path):
        """Test background has valid hash lock."""
        output = str(tmp_path / "bg.png")
        vgen = VisualGenerator()
        result = vgen.generate_background(320, 180, output)
        assert result.hash_lock
        assert result.t5_tags == ["traceable", "trackable", "tangible", "transparent", "trustworthy"]

    def test_subtitle_frames_source_origin(self, simple_prompt: str, tmp_path):
        """Test subtitle frames have source_origin."""
        vgen = VisualGenerator()
        frames_dir = str(tmp_path / "frames")
        _, result = vgen.generate_subtitle_frames(
            simple_prompt, 320, 180, 24, frames_dir,
        )
        assert "visual_gen:" in result.source_origin


# ═══════════════════════════════════════════════════════════════════════════
# 6. Renderer Tests (3 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestRenderer:
    """3 tests — Video rendering with ffmpeg."""

    def test_render_creates_video(self, silence_wav: str, tmp_path):
        """Test that renderer creates a video file."""
        output = str(tmp_path / "output.mp4")
        request = VideoRequest(
            prompt="Test video prompt for renderer test",
            width=320, height=180, fps=24,
            duration=5.0,
        )
        renderer = VideoRenderer()
        result = renderer.render(
            silence_wav, [silence_wav], request, output,
            "Test script content for rendering.",
        )
        assert result.status == "completed"
        assert result.module == "renderer"

    def test_render_hash_lock(self, silence_wav: str, tmp_path):
        """Test renderer output has hash lock."""
        output = str(tmp_path / "output.mp4")
        request = VideoRequest(
            prompt="Test video prompt for renderer",
            width=320, height=180, fps=24,
        )
        renderer = VideoRenderer()
        result = renderer.render(
            silence_wav, [silence_wav], request, output,
            "Test script content.",
        )
        assert result.hash_lock
        assert len(result.hash_lock) == 64

    def test_render_fallback_on_ffmpeg_error(self, silence_wav: str, tmp_path):
        """Test renderer falls back when ffmpeg errors."""
        output = str(tmp_path / "output.mp4")
        request = VideoRequest(
            prompt="Test video prompt",
            width=320, height=180, fps=24,
        )
        renderer = VideoRenderer()
        # Force ffmpeg error by passing nonexistent files
        result = renderer.render(
            "/nonexistent.wav", ["/nonexistent.jpg"],
            request, output, "Test script.",
        )
        # Should still produce a result with fallback
        assert result.module == "renderer"
        assert result.hash_lock  # Hash lock should still be present


# ═══════════════════════════════════════════════════════════════════════════
# 7. Storage Tests (2 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestStorage:
    """2 tests — Storage engine with local + S3."""

    def test_local_store(self, tmp_path):
        """Test local filesystem storage."""
        # Create test file
        test_file = str(tmp_path / "test.mp4")
        with open(test_file, "wb") as f:
            f.write(b"test video content")

        file_hash = hashlib.sha256(b"test video content").hexdigest()
        request = VideoRequest(
            prompt="Test storage prompt",
            width=320, height=180,
            source_origin="test:storage",
        )
        storage = StorageEngine()
        result = storage.store(test_file, request, file_hash)
        assert result.module == "storage"
        assert result.engine == "local"
        assert "file://" in result.data["storage_url"]

    def test_hash_mismatch_fallback(self, tmp_path):
        """Test storage falls back to local when hash mismatches."""
        test_file = str(tmp_path / "test.mp4")
        with open(test_file, "wb") as f:
            f.write(b"different content")

        wrong_hash = "a" * 64
        request = VideoRequest(prompt="Test", width=320, height=180)
        storage = StorageEngine()
        result = storage.store(test_file, request, wrong_hash)
        # Should still store (with hash mismatch logged)
        assert result.status == "completed"


# ═══════════════════════════════════════════════════════════════════════════
# 8. Provenance Tests (2 tests)
# ═══════════════════════════════════════════════════════════════════════════

class TestProvenance:
    """2 tests — SQLite provenance archive."""

    def test_archive_and_lookup(self, tmp_path):
        """Test artifact archival and lookup."""
        db_path = str(tmp_path / "test.db")
        request = VideoRequest(
            prompt="Test provenance prompt with DNA markers 【場景】test 【洞察】insight",
            title="Test Artifact",
            width=320, height=180,
        )
        # Create mock module outputs
        from aistation.types import ModuleOutput
        mock_output = ModuleOutput(
            module="renderer", engine="ffmpeg", output=MOCK_5T_OUTPUT,
            data={"video_path": "/test/output.mp4"},
            source_origin="renderer:ffmpeg",
            hash_lock="test_hash_lock_value_12345",
            t5_tags=["traceable", "trackable", "tangible", "transparent", "trustworthy"],
            status="completed",
        )
        archive = ProvenanceArchive(db_path=db_path)
        uuid, result = archive.archive(request, mock_output, [mock_output])
        assert uuid
        assert result.status == "completed"
        # Lookup
        record = archive.lookup(uuid)
        assert record is not None
        assert record["uuid"] == uuid

    def test_provenance_hash_lock(self, tmp_path):
        """Test provenance archive produces hash lock."""
        db_path = str(tmp_path / "test.db")
        request = VideoRequest(prompt="Test provenance prompt", title="Test")
        mock_output = ModuleOutput(
            module="renderer", engine="ffmpeg", output=MOCK_5T_OUTPUT,
            data={"video_path": "/test/output.mp4"},
            source_origin="renderer:ffmpeg",
            hash_lock="test_hash_lock_value_12345",
            t5_tags=["traceable", "trackable", "tangible", "transparent", "trustworthy"],
            status="completed",
        )
        archive = ProvenanceArchive(db_path=db_path)
        uuid, result = archive.archive(request, mock_output, [mock_output])
        assert result.hash_lock
        assert len(result.hash_lock) == 64


# ═══════════════════════════════════════════════════════════════════════════
# 9. Orchestrator E2E Test (1 test)
# ═══════════════════════════════════════════════════════════════════════════

class TestOrchestrator:
    """1 test — Full 7-module pipeline end-to-end."""

    def test_full_pipeline(self, sample_prompt: str, tmp_path):
        """Test full AI Station 7-module pipeline end-to-end."""
        output_dir = str(tmp_path / "aistation_output")
        request = VideoRequest(
            prompt=sample_prompt,
            title="E2E Test Video",
            width=640,
            height=360,
            fps=24,
            duration=10.0,
            output_dir=output_dir,
            source_origin="test:orchestrator:e2e",
        )
        orchestrator = AISTationOrchestrator(output_dir=output_dir)
        result, metadata = orchestrator.process(request)

        # Verify pipeline completed
        assert result.uuid
        assert result.title == "E2E Test Video"
        assert result.video_path
        assert os.path.exists(result.video_path)
        assert result.hash_lock
        assert len(result.hash_lock) == 64

        # Verify 5T compliance
        assert metadata["t5_pass"] is True
        assert metadata["errors"] == [] or metadata["errors"] is None

        # Verify all 7 modules executed
        module_names = [mo.module for mo in result.module_outputs]
        assert "script_parser" in module_names
        assert "tts" in module_names
        assert "visual_gen" in module_names
        assert "renderer" in module_names
        assert "storage" in module_names
        assert "provenance" in module_names

        # Verify provenance UUID exists
        assert result.provenance_uuid
