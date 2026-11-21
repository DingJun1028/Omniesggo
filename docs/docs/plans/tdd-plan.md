# AI Station — TDD Plan

Test-driven development cadence for the AI Station core modules.

## Rules

1. Write the failing test first (RED).
2. Run it and confirm it fails for the right reason.
3. Write the minimal code to make it pass (GREEN).
4. Run it and confirm it passes.
5. Refactor only with tests green.
6. Every source file carries its `source_origin` tag.

## Tasks

| Task | Module | Deliverable | Status |
|------|--------|-------------|--------|
| 1 | Design | `docs/brainstorming/ai-station-design.md` | done |
| 2 | DNA Parser (§9) | `tests/test_dna_parser.py` + `src/parsers/dna_parser.py` | in progress |
| 3 | Graph Layer | `tests/test_scene_graph.py` + `src/graph/scene_graph.py` | pending |
| 4 | Render Layer | `tests/test_renderer.py` + `src/render/renderer.py` | pending |

## Task 2 — DNA Parser

- RED: `test_parse_single_scene`, `test_parse_multiple_scenes`.
- GREEN: `parse_dna` using `DNA_PATTERN` from §9.2.
- Hash Lock: sha256 of `src/parsers/dna_parser.py`.
