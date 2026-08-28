# AI Station — Design

> Source of truth for the AI Station core modules. Each module carries a
> `source_origin` tag referencing the section that authorizes its code.

## §1 Scope

AI Station ingests narrative logs written in a lightweight "DNA" markup and
turns them into structured scene graphs. This document defines the design
layers for the core modules implemented under `apps/aistation`.

## §2 Module Map

| Module | Layer | Responsibility |
|--------|-------|----------------|
| 1 | Ingestion | Load raw DNA text |
| 2 | Design Layer | Parse DNA markup into typed segments |
| 3 | Graph Layer | Assemble segments into a scene graph |
| 4 | Render Layer | Emit output artifacts |

## §9 Module 2 — Design Layer (DNA Parser)

The DNA Parser converts a raw DNA string into an ordered list of typed
segments. DNA uses bracketed tags to delimit semantic units:

```
[Scene] A quiet library at midnight.
[Conflict] The only exit is sealed.
[Insight] Silence is a clue, not an absence.
[Method] Follow the hum of the ventilation.
[Reflection] Some doors open inward.
```

### §9.1 Tag vocabulary

`Scene`, `Conflict`, `Insight`, `Method`, `Reflection`.

### §9.2 Matching contract

A segment is a tag followed by its content, extending up to (but not
including) the next tag or the end of the input. The reference matcher:

```
DNA_PATTERN = r'\[(Scene|Conflict|Insight|Method|Reflection)\]\s*(.*?)(?=\[(Scene|Conflict|Insight|Method|Reflection)\]|$)'
```

### §9.3 Public API

`parse_dna(text: str) -> list[dict]` where each dict is
`{"type": <tag>, "content": <trimmed text>}`, in document order.

### §9.4 source_origin tag

Every source file in this module MUST carry:

```
# source_origin: AI Station §9 - Module 2 Design Layer
```
