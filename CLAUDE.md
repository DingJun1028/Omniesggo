# CLAUDE.md — ESG GO Engineering Conventions & Enforcement Rules

> Version: 1.1.0
> Classification: Internal Standard
> Language: English Standard, Traditional Chinese Broad (英標繁博)
> Tags: [security:internal][agent:07][squad:符文契約][lifecycle:active][p1][platform:esggo][best-practice:awakened]
> Last Updated: 2026-08-01 (rune-contract audit)

---

## Purpose (目的)

This file is the **single source of truth** for engineering conventions in the ESG GO
platform. It codifies enforceable rules for TypeScript strictness, API route conventions,
test coverage, and OmniTag artifact tagging — derived from a codebase audit (2026-08-01).

Rules marked **MUST** are enforced by CI or pre-commit and block merge if violated.
Rules marked **SHOULD** are conventions reviewed during code review.

---

## 0. OmniTag Requirements (萬能標籤規範)

Every artifact (PR, task, commit, issue, design doc) must carry OmniTag tags.
Required tags — each artifact must have **at least** `agent:*` + `lifecycle:*` + `p*`:

| Dimension | Key | Values |
|---|---|---|
| Security | `security:` | public / internal / confidential / restricted |
| Agent | `agent:` | 01–30 (Agent 07 = 符文契約 / API+TS+ZKP) |
| Squad | `squad:` | 智庫聖所 / 符文契約 / 光之羽翼 / 煉金熵減 / 5T驗算 |
| Lifecycle | `lifecycle:` | draft / active / frozen / archived |
| Priority | `p0`–`p3` | p0=blocking, p1=high, p2=normal, p3=noise |
| Platform | `platform:` | esggo / omni / vps / firebase / vercel / github |
| Best-practice | `best-practice:` | awakened / 结界 / draft |

**Syntax**: `[security:internal][agent:07][squad:符文契約][lifecycle:active][p1][platform:esggo][best-practice:awakened]`

**Forbidden combinations** (auto-reject):
- `lifecycle:frozen` + `lifecycle:active` · `security:public` + `security:restricted`
- `p0` + `p3` · `best-practice:awakened` + `lifecycle:draft`

Reference: `.agents/skills/omnitag/SKILL.md`.

**Contract enforcement (§20.5 / §6.2)**: OmniTag 合約率必須達 **100%**（`agent`+`lifecycle`+`p` 三枚必備，且值合法）。
驗證入口：`pnpm oa:audit`（掃描 `src/lib` + `cli/oa-cli/src`，違規即非零退出）。
CI 閘：`.github/workflows/ci.yml` 的 `omnitag-audit` job 強制此門檻，未達 100% 合約率 PR 不予合併。
自動補標：`npx tsx cli/oa-cli/src/index.ts tag --init --write --dir <dirs>` 為無標頭 .ts 自動補合規 OmniTag 標頭（§6.2 預設即合規）。

---

## 1. TypeScript Strictness (型別嚴格度)

### MUST rules

1. **strict mode**: `tsconfig.json` MUST keep `"strict": true`. Do not weaken to satisfy
   a single file — fix the file instead.
2. **No `any` in production code** (`src/lib/**`, `src/core/**`, `src/agents/**`,
   `src/impl/**`, `packages/*/src/**`, `app/api/**/route.ts`).
   - `: any`, `as any`, `any[]`, `<any>` are forbidden outside `*.test.ts` / `__tests__/`.
   - Tests MAY use `as any` to reach private members, but prefer `vi.mocked` / helper fns.
3. **No `@ts-ignore` / `@ts-nocheck`**. `@ts-expect-error` is allowed only with a
   comment explaining the false positive.
4. **Explicit types on shared I/O**: function parameters and return types MUST be
   explicit on public functions exported from `src/lib`, `src/core`, `packages/*`.
   Use `interface`/`type` aliases, never inline `object` literals for contracts.
5. **RouteContext typing**: dynamic route handlers MUST type params as
   `{ params }: { params: Promise<{ id: string }> }`. Never regex-parse the pathname.
6. **Import alias discipline**:
   - App/business code imports from `@/*` (`@/lib/api-utils`, `@/types/...`).
   - Shared contracts import from `@esggo/shared`, `@esggo/errors`, `@esggo/ui`.
   - Relative deep imports into `src/` from `app/` (e.g. `../../../../src/...`) are forbidden.
7. **Single source of truth**: error codes come from `@esggo/errors` only
   (`ERROR_CODES`, `ErrorCodeKey`). `src/lib/errors.ts` is a compat re-export — do not add
   new definitions there.

### Verification

```bash
pnpm typecheck                                  # tsc -p tsconfig.core.json (CI gate)
pnpm lint:full                                  # eslint src/ --max-warnings 50
grep -rn ": any\|as any\|<any>" src app packages --include="*.ts" --include="*.tsx" \
  | grep -v "__tests__\|.test.ts" || true      # expect empty
grep -rn "@ts-ignore\|@ts-nocheck" src app packages || true  # expect empty
```

---

## 2. API Route Conventions (API 路由慣例)

### MUST rules

1. **Response envelope**: every non-streaming route returns
   `jsonResponse<T>(data, status)` → `{ success: true, data }` or
   `jsonError(errorKey, message?, status?)` → `{ success: false, error, code }`.
   - NEVER pass `{ success: true, ... }` INTO `jsonResponse` (double-envelope bug:
     `{ success: true, data: { success: true, ... } }`).
   - Raw `NextResponse.json(...)` / `Response.json(...)` in business routes is forbidden
     (only `app/api/healthz`, SSE stream routes, and binary/PDF download handlers are exempt).
2. **Error codes**: use `ErrorCodeKey` from `@esggo/errors`. Do not invent ad-hoc code
   strings (e.g. `LOCAL_AI_DISABLED`, `BAD_REQUEST`). All keys — including
   `UNKNOWN_TOOL`, `ALERT_NOT_FOUND` — come from `@esggo/errors`.
3. **Never leak internal errors**: catch blocks MUST return a generic message
   (`jsonError('INTERNAL_ERROR', 'Internal server error')`). Do NOT interpolate
   `error.message` / `err.message` into responses.
4. **Authentication on mutating routes**: every POST/PUT/DELETE route that writes data
   MUST authenticate the request. Patterns:
   - Internal/service: `X-Omni-Token` header compared to `OMNI_KEY || GATEWAY_API_KEY`
     (see `app/api/omni/sync/route.ts`).
   - User-facing: verify Firebase ID token server-side (`firebase-admin` `verifyIdToken`).
   - Insecure mutators (`app/api/cron/route.ts`, `app/api/memory/route.ts`,
     `app/api/rag/ingest/route.ts`, `app/api/sonnar/crawl/route.ts`,
     `app/api/tags/{universal,pair}/route.ts`, `app/api/village/*`) MUST be gated before merge.
5. **Input validation**: validate request bodies before use — `validateParams` /
   `validatePositiveNumber` from `@/lib/api-utils` as minimum; Zod
   (`src/lib/zod-validation.ts`) or manual type-guards for complex bodies.
6. **Method handling**: export ONLY the supported HTTP methods. No `OPTIONS` handlers;
   rely on Next.js auto-405. GET handlers MUST NOT perform writes or trigger jobs
   (`app/api/cron/route.ts` GET runs jobs — move to POST + auth).
7. **Runtime exports** on heavy/streaming routes: `export const runtime = 'nodejs'`,
   `export const dynamic = 'force-dynamic'`, `export const maxDuration = <seconds>`.
8. **File header comment**: each route file starts with a banner comment
   (purpose, methods, auth note) — see `app/api/omni/sync/route.ts`.

### Verification

```bash
# Double-envelope + error leaks (expect empty)
grep -rn "jsonResponse({ success: true" app/api --include="route.ts"
grep -rn "error.message\|err.message\|error instanceof Error" app/api --include="route.ts"
# Ad-hoc codes (expect only @esggo/errors keys)
grep -rn "jsonError('" app/api --include="route.ts" | grep -vE "ERROR_CODES|'INVALID_PARAMS'|'NOT_FOUND'|'INTERNAL_ERROR'|'UNAUTHORIZED'|'FORBIDDEN'|'SKILL_NOT_FOUND'|'PROJECT_NOT_FOUND'|'MEMBER_NOT_FOUND'|'INSUFFICIENT_POINTS'|'RATE_LIMITED'|'EMBEDDING_FAILED'|'RAG_QUERY_FAILED'|'SOURCE_NOT_FOUND'|'CRAWL_ERROR'|'TASK_NOT_FOUND'|'COMPANY_NOT_FOUND'|'INVALID_ACTION'|'UNKNOWN_ERROR'|'METHOD_NOT_ALLOWED'|'INVALID_ACTION'|'UNKNOWN_TOOL'|'ALERT_NOT_FOUND'" || true
```

---

## 3. Test Coverage (測試覆蓋)

### MUST rules

1. **New modules MUST ship with tests**: any new module under `src/lib/**`,
   `src/core/**`, `src/agents/**`, `src/impl/**`, or `packages/*/src/**` MUST include a
   co-located `__tests__/*.test.ts` covering core behaviors. A PR adding an untested
   module will be blocked.
2. **Test runner**: Vitest (`vitest.config.ts`, `globals: true`, `environment: node`,
   alias `@` → `./src`). Use `describe`/`it`/`expect` globals.
3. **Critical paths** (already covered — do not regress): ZKP service, 5T protocol,
   hash-lock, OmniTag/OmniBase, bus & omni-agent-bus, OmniGateway v2, omni-core ecosystem,
   omni-todo engine, AI skills registry, esg-analysis, esg-report, universal-tag-service,
   complete-delegation.
4. **Known coverage gaps** (currently untested — new code in these areas MUST add tests):
   `src/lib/{api-utils,safe-api,zod-validation,rate-limit,report-service,storage-service,vector-search,resource-library,ncb-client,user-profile,village-seeder,embedding-generator,cron-jobs,omni-core}.ts`,
   `src/lib/{omni-tag,omni-seed}/index.ts`, all `packages/*/src` (errors, shared, ui, cli),
   `src/core/services/*`, `src/core/ai/skills/*` (12 skills),
   `src/agents/twelve-omni/omni-tag.ts`, `src/impl/omni-*.ts`.
5. **Stale tests**: when renaming/deleting a module, update or remove its tests. CI runs
   the FULL suite (`vitest run`) — a stale test file that references missing modules fails
   the build.

### Commands

```bash
pnpm check           # fast gate: typecheck + core + twelve-omni suites
pnpm test            # full Vitest suite (CI runs this)
pnpm test:coverage   # coverage report
```

---

## 4. Commit & PR Rules (提交與 PR 規範)

- Conventional commits: `feat(scope):`, `fix(scope):`, `test(scope):`, `docs(scope):`,
  `refactor(scope):`, `chore(scope):`.
- Pre-commit hooks (`.githooks/pre-commit`) enforce: UTF-8 encoding check
  (`scripts/encoding-check.mjs`) and pnpm-lock.yaml sync. Do not bypass hooks.
- Never commit secrets. CI hard-fails on AWS/GitHub/Firebase key patterns.
- PR description MUST include the OmniTag block (see §0) and list verification commands run.
- English for code/technical naming; Traditional Chinese for user-facing copy (英標繁博).

---

## 5. Enforcement Matrix (執行矩陣)

| Rule | Gate | Command |
|---|---|---|
| TS strict + no `any` | CI `typecheck` + `eslint` | `pnpm typecheck` / `pnpm lint:full` |
| No `@ts-ignore` | review | grep (see §1) |
| API envelope & error codes | review + grep | see §2 verification |
| Auth on mutators | review + CI security-scan | manual audit |
| Tests for new modules | review | `pnpm test` |
| Encoding + lockfile | pre-commit | `node .githooks/pre-commit` |
| Secrets | CI `secret-scan` | grep credential patterns |
| Full regression | CI `test` (vitest run) | `pnpm test` |
| Build | CI `build` + `docker` | `pnpm build` |

---

## 6. Current Audit Findings (2026-08-01) — Reference

High-value cleanup targets identified during the audit (fixing these is a follow-up task,
not required for this file):

### 6.1 API Routes (76 total)

- **Double-envelope**: 10 occurrences across 7 route files wrap `{ success: true, ... }`
  inside `jsonResponse()`: `daily-report` (3×), `user/growth` (2×), `daily-report/generate`,
  `user/leaderboard`, `user/subscription`, `user/growth/xp`, `user/tasks` (1× each).
- **Error message leaks**: 21 leak sites across 18 routes interpolate `error.message` /
  `err.message` in catch blocks. Key offenders: `sustain-write/v5/preview`,
  `sustain-write/v5/download`, `data/export`, `daily-report`, `daily-report/generate`,
  `user/*` routes, `nexus`, `village/*`, `omni/plugins`, `omni-agent/console`,
  `omni-user-registry`, `omni-core/status`.
- **Missing auth on mutators**: `cron`, `memory`, `rag/ingest`, `sonnar/crawl` POST
  handlers lack authentication checks (`X-Omni-Token` / `verifyIdToken`).
- **Raw Response.json**: 6 routes bypass `jsonResponse()`/`jsonError()`:
  `surveys`, `local-ai/chat`, `sustain-center/dashboard`, `sustain-write/c-version`,
  `data/export`, `omni-core/status`.
- **Ad-hoc error codes**: `local-ai/chat` uses `LOCAL_AI_DISABLED`, `BAD_REQUEST`,
  `EMPTY_PROMPT`, `OLLAMA_ERR` — not from `@esggo/errors`.
- **No OPTIONS handlers**: Clean — all routes rely on Next.js auto-405.
- **Runtime exports**: 39 routes export `dynamic = 'force-dynamic'`; 14 export
  `runtime = 'nodejs'`.

### 6.2 TypeScript Strictness

- **strict mode**: `tsconfig.json` has `"strict": true` — compliant.
- **`any` usage in production code** (20 occurrences, non-test):
  - `src/impl/core.ts`: 7 occurrences (chaos injection, event mutation).
  - `src/lib/omni-core/omni-function.ts`: 1 occurrence (`FnImpl` type).
  - `app/api/ai-notes/search/route.ts`: 4 occurrences (vector result mapping).
  - `app/api/village/trends/route.ts`: 3 occurrences (interaction parsing).
  - `app/api/agent/[id]/thought/stream/route.ts`: 1 occurrence (bus event).
  - `app/omni-center/omni-note-crud.tsx`: 1 occurrence (note mapping).
  - `app/omni-agent/page.tsx`: 1 occurrence (data prop).
  - `packages/omni-agent/src/types.ts`: 2 occurrences (`result?: any`).
- **`@ts-ignore` / `@ts-nocheck`**: 0 occurrences — compliant.
- **`@ts-expect-error`**: 1 occurrence in `src/agents/omni-agent.ts:239` with comment.
- **Relative deep imports**: 3 routes import directly into `src/` via
  `../../../../src/` style paths: `sustain-write/v5/async`, `ai/generate`, `pdf/parse`.
- **tsconfig.core.json scope**: Only covers `src/impl`, `src/lib/omni-core`,
  `src/lib/cloudflare` — does not typecheck `src/core`, `src/agents`, `src/lib` main.

### 6.3 Test Coverage

- **Source files**: 227 `.ts` files in `src/` (excluding tests).
- **Test files**: 18 test files in `src/` (8% coverage by file count) + 19 in `tests/`
  + 2 in `worker/`+`apps/` — 39 total repo-wide.
- **Packages**: 0 test files across all 5 packages (`errors`, `shared`, `ui`, `cli`,
  `omni-agent`).
- **Critical paths covered**: ZKP service, 5T protocol, OmniTag factory, omni-soul,
  omni-user-registry, omni-api, omni-bus-v2, omni-gateway-v2, core processor,
  report generator, AI skills registry, engine.
- **Key gaps**:
  - `src/lib/` — only `omni-core/omni-function.test.ts` exists; no tests for
    `api-utils`, `safe-api`, `zod-validation`, `firebase`, `auth`, `storage-service`,
    `pgvector`, `esg-sonnar`, `zkp-service` (has test in `src/__tests__/`).
  - `src/core/services/*` — zero tests.
  - `src/core/ai/skills/*` — only 3 of 12 skills tested.
  - `packages/*` — zero tests despite `omni-agent` having test infrastructure.
- **CI test command**: `pnpm vitest run --reporter=verbose` in `ci.yml`.
- **Fast gate**: `pnpm check` runs typecheck + core + twelve-omni suites only.

### 6.4 Error Codes

- **Single source of truth**: `packages/errors/src/index.ts` (335 lines).
- **31 error codes** across 8 domain categories (GEN, AUTH, ESG, AI, VLG, CRAWL, GATEWAY, BRIDGE).
- **Compat layer**: `src/lib/errors.ts` re-exports types only — no new definitions.
- **Usage**: `src/lib/api-utils.ts` imports `ERROR_CODES` and `ErrorCodeKey` from
  `@esggo/errors`. Zero API routes import directly from `@esggo/errors`.

### 6.5 OmniTag System

- **Core implementation**: `src/lib/sustain-write/omni-tag.ts` (350 lines).
  - `OmniTagFactory` — create, entangle, sync, get paired tags.
  - `FiveTReportEngine` — assemble 5T-compliant reports.
  - `ReportChapter`, `GeneratedReport` interfaces.
- **5T Protocol**: Traceable, Transparent, Tangible, Trustworthy, Trackable.
- **Agent implementation**: `src/agents/twelve-omni/omni-tag.ts` — separate `OmniTag` class
  with IOmniTag interface.
- **No tests** for `src/lib/sustain-write/omni-tag.ts` or `src/agents/twelve-omni/omni-tag.ts`.

### 6.6 Enforcement Gaps

| Rule | Current State | Gap |
|---|---|---|
| No `any` in prod code | 20 occurrences in 8 files | Need cleanup in `src/impl/core.ts`, route files, `packages/omni-agent` |
| No `@ts-ignore` | 0 | Compliant |
| API envelope | 10 double-wraps across 7 routes | Fix `daily-report`, `user/*` routes |
| Error message leaks | 21 sites across 18 routes | Replace with `jsonError('INTERNAL_ERROR', 'Internal server error')` |
| Auth on mutators | 4 routes missing | Add auth to `cron`, `memory`, `rag/ingest`, `sonnar/crawl` |
| Complex-body validation | 1 route — `omni/sync` uses manual type-guards (Zod itself is unused in `app/api`) | Expand to all POST routes with complex bodies |
| Tests for new modules | 18/227 files in `src/` | Need ~200 more test files |
| Package tests | 0/5 packages | Add tests to `errors`, `shared`, `ui`, `omni-agent` |
| tsconfig.core.json scope | 3 directories | Broaden to `src/core`, `src/agents`, `src/lib` |

---

ESG GO Engineering Conventions v1.1.0 · License: AGPL-3.0
