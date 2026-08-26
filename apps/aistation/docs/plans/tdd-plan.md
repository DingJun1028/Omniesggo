# AI Station Development Plan (TDD)

> **Source Origin**: Superpowers Stage 3 — writing-plans
> **Design Baseline**: docs/brainstorming/ai-station-design.md
> **Mode**: subagent-driven-development
> **TDD**: Strict RED-GREEN-REFACTOR

---

## Task List (5 tasks, 2-5 minutes each)

### Task 1: Module 1 Input Layer
- **File**: `src/api/main.py`
- **Test**: `tests/test_input_layer.py`
- **RED**: POST endpoint test → expects `task_id`
- **GREEN**: FastAPI endpoint using `uuid4` + DNA parser
- **VERIFY**: `pytest tests/test_input_layer.py -v`
Hash Lock: `sha256:dna_parser_hash_pending` ← Subagent reported committed `25944a909`

---

### Task 2: Module 2 DNA Parser
- **File**: `src/parsers/dna_parser.py`
- **Test**: `tests/test_dna_parser.py`
- **RED**: Parse `[Scene]...[Conflict]...` → structured JSON
- **GREEN**: Regex-based parser with DNA markers
- **VERIFY**: `pytest tests/test_dna_parser.py -v`
- **Hash Lock**: `sha256:pending`

---

### Task 3: Module 3 TTS Synthesizer
- **File**: `src/synthesizers/speech.py`
- **Test**: `tests/test_speech.py`
- **RED**: `synthesize_tts()` returns `.mp3` path
- **GREEN**: edge-tts async wrapper with ImportError fallback
- **VERIFY**: `pytest tests/test_speech.py -v`
- **Hash Lock**: `sha256:fde4c9dc677a0cae0d101d89279b75b866292c628fa7569f18cbe802a439ec7f`

---

### Task 4: Module 4 Visual Generator
- **File**: `src/visuals/image_gen.py`
- **Test**: `tests/test_visuals.py`
- **RED**: `generate_brand_visual()` returns `.png` path
- **GREEN**: Pillow brand gradient generator with BRAND_COLORS
- **VERIFY**: `pytest tests/test_visuals.py -v`
- **Hash Lock**: `sha256:pending`

---

### Task 5: Module 7 Evidence DB
- **File**: `src/storage/evidence.py`
- **Test**: `tests/test_evidence.py`
- **RED**: `EvidenceDB.create_record()` returns hash-locked record
- **GREEN**: SQLite + freeze_artifact integration
- **VERIFY**: `pytest tests/test_evidence.py -v`
- **Hash Lock**: `sha256:pending`

---

## Execution Order

1. **Parallel Batch 1**: Task 2 (DNA Parser) — foundational dependency
2. **Parallel Batch 2**: Task 1 (Input Layer), Task 3 (TTS), Task 4 (Visual), Task 5 (Evidence)
3. **Integration Test**: End-to-end pipeline test

---

## Dependencies

| Task | Depends On |
|---|---|
| Task 1 | Task 2 (parse_dna import) |
| Task 2 | None |
| Task 3 | None |
| Task 4 | BRAND_COLORS from `src/brand.py` |
| Task 5 | `freeze_artifact` from `src/evidence/hash_lock.py` |

---

## Next Stage: subagent-driven-development (Stage 4)
Will spawn 4 parallel subagents:
- **Subagent A**: Task 1 + Task 2 (Input + Parser, sequential)
- **Subagent B**: Task 3 (TTS)
- **Subagent C**: Task 4 (Visual)
- **Subagent D**: Task 5 (Evidence DB)

---

*Plan Hash Lock: sha256:pending — will be computed after all tests pass*
