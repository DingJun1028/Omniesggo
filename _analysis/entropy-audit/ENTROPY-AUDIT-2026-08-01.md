# Entropy Audit — ESG GO (2026-08-01)

> [security:internal][agent:22][squad:煉金熵減][lifecycle:active][p1][platform:esggo][best-practice:結界][entropy-target:<0.1]
>
> Auditor: `alchemy-entropy` factory teammate (esggo-swarm)
> Scope: duplicate code, dead files, bundle bloat, lint drift
> Baseline: `origin/main` @ `a1913274` (fetched 2026-08-01)

---

## 1. Executive Summary

The repository is a Next.js 15 + TypeScript (strict) monorepo with ~157k LOC of
tracked TS/TSX plus a legacy `lib/` tree. The audit found:

| Category | Finding | Severity | Est. impact |
|---|---|---|---|
| Duplicate code | 31 clones in `src/`, 24 in `app`+`lib`+`tests` (jscpd) | MED | ~0.9–1.4% dup lines |
| Duplicate files | `src/impl/celestial-core-processor.ts` ≈ copy of `src/lib/omni-core/` | HIGH | stale + type-confusing |
| Duplicate files | `src/types/esg-charts.ts` == `packages/shared/src/types/esg-charts.ts` (identical) | MED | two sources of truth |
| Dead app tree | `src/app/` (14 files incl. 10 API routes) never built (Next.js uses root `app/`) | HIGH | shadowed routes, ~180K |
| Dead root lib | ~20 root `lib/` files unreferenced (legacy parallel tree) | MED-HIGH | ~2.8M bytes, 2.5MB single data file |
| Dead components | 5 tracked components with zero importers | MED | ~40KB |
| Dead modules | `src/lib/types/esg-charts.ts`, `src/impl/*` shadow modules | MED | type drift |
| **Build-break** | 7 routes import root `lib/` via broken `@/lib/...` paths (resolve to `src/lib/`, missing) | **HIGH** | `pnpm build` fails — 11× Module not found on `origin/main` |
| Bundle bloat | 750KB server chunk from `sustain-write-answer-database.ts` | HIGH | largest non-vendor chunk |
| Unused deps | `@grpc/grpc-js`, `@grpc/proto-loader` in `package.json` with no source usage | LOW | install/bloat |
| Boilerplate | 11/13 route `layout.tsx` files are identical | LOW | cleanup |

Recommended next step: **do not delete files in this audit**; convert this report
into a `feat/entropy-cleanup` task list and delete via separate refactor PRs so CI
and teammates can review each removal.

---

## 2. Duplicate Code

jscpd (strict, ≥10 lines / ≥60 tokens) on `src/`:

- **31 clones** in 292 analyzed files → 422 duplicated lines (0.92%).
- **24 clones** in `app/`+`lib/`+`tests` → 471 duplicated lines (1.44%).

### 2.1 Whole-file duplicates

| File A | File B | Notes |
|---|---|---|
| `src/impl/celestial-core-processor.ts` | `src/lib/omni-core/celestial-core-processor.ts` | 99% identical; only diff is import path + `_payload` vs `payload`. Only the `lib/` copy is imported (`src/lib/omni-agent-bus.ts`, tests). The `impl/` copy is **dead**. |
| `src/types/esg-charts.ts` | `packages/shared/src/types/esg-charts.ts` | Byte-identical. All consumers import `@/types/esg-charts` (`src/components/...`). Should re-export from `@esggo/shared` and keep a single source of truth. |

### 2.2 Near-duplicate classes (shadowed implementations)

| `src/impl/omni-time.ts` | `src/agents/twelve-omni/omni-time.ts` |
|---|---|
| `src/impl/omni-memory.ts` | `src/agents/twelve-omni/omni-memory.ts` |
| `src/impl/omni-evidence.ts` | `src/agents/twelve-omni/omni-evidence.ts` |
| `src/impl/omni-user-registry.ts` | `src/agents/omni-user-registry.ts` |

The `src/impl/*` copies are smaller, type-different variants used only by
`src/impl/core.ts` + the `celestial-gate.ts` lint script. The twelve-omni / agents
copies are used by real consumers. **Refactor target**: unify on one implementation
per domain, re-export the canonical one, and delete the shadow.

### 2.3 Internal clones (top hits)

- `src/impl/core.ts` — near-identical blocks at [185-205] and [217-237].
- `src/lib/report-brand-theme.ts` — duplicated color-construction blocks [77-102] and [123-148].
- `src/agents/twelve-omni/omni-bus.ts` [155-172] ≈ `src/agents/twelve-omni/omni-time.ts` [61-77].
- `src/components/zkp-verify.tsx` — duplicated render branches [24-36] / [56-68].
- Chart components (`omni-line-chart.tsx` / `omni-pie-chart.tsx` / `omni-bar-chart.tsx`)
  share repeated SVG legend/tooltip scaffolding.
- Page-level clones: `app/export/page.tsx` (internal), `app/emm/page.tsx` ≈
  `app/resources/page.tsx` (30 lines), `app/daily/page.tsx` ≈ `app/export/page.tsx` (52 lines).

### 2.4 Refactor suggestion

Extract:
1. `src/impl/core.ts` duplicated blocks → private helper.
2. `report-brand-theme` color tokens → `packages/ui` theme tokens.
3. chart legend/tooltip → `src/components/charts/ChartShell.tsx`.
4. page-level "company picker + export" scaffolding → shared `app/export` components.

---

## 3. Dead Files

Method: relative + alias import resolution across all tracked TS/TSX; Next.js route
conventions (`page/layout/route/error/...`) and script entry points excluded.

### 3.1 Dead app tree: `src/app/` (HIGH)

- 14 tracked files including **10 API routes** (`delegation/*`, `esg-report`,
  `healthz`) and 4 pages (`delegation/events`, `demo/*`, `design-system`).
- The running app uses root `app/` — `.next/app-path-routes-manifest.json` contains
  **none** of the `src/app` routes (`delegation`, `demo`, `design-system` absent).
- `src/app/api/healthz/route.ts` differs from root `app/api/healthz/route.ts`; the
  root one is the built one.
- Recommendation: either move delegation routes to root `app/` (if still needed) or
  delete the whole `src/app/` tree.

### 3.2 Dead root `lib/` tree (MED-HIGH)

Root `lib/` is a legacy parallel tree. `@lib/*` alias points there but only
`lib/redis*` is actually used (8 import sites). These are **unreferenced**:

- `lib/api-utils.ts`, `lib/esggo.ts`, `lib/firebase.ts`, `lib/ncb-utils.ts`
- `lib/omni-agent/index.ts`, `lib/omni-tag/index.ts`, `lib/omni-theme/design-system.ts`
- `lib/sustain-write/answer-database.ts` (**2.5 MB!**), `lib/sustain-write/question-bank.ts`,
  `lib/sustain-write/omni-tag.ts`, `lib/sustain-write/index.ts`
- `lib/types/oab-types.ts`, `lib/types/oag-types.ts`
- `lib/agents/*.js`, `lib/agents/omni-agent-bus.ts`
- `lib/api/cache.ts`, `lib/core/services/report-generator-v5*.ts`, `lib/redis/state.ts`

Active counterparts exist under `src/lib/` (`api-utils`, `esggo`, `firebase`,
`ncb-utils`, `omni-agent`, `omni-tag`, `omni-theme`, `sustain-write`).

### 3.3 Dead components (tracked, zero importers)

- `src/components/esg-assessment-dashboard.tsx`
- `src/components/esg-skills-panel.tsx`
- `src/components/mece-best-practices-view.tsx`
- `src/components/omni-grammar-editor.tsx`
- `src/components/zkp-verify.tsx`

(These form an isolated group: they only import `OmniBaseCard` from each other.)

### 3.4 Dead modules

- `src/lib/types/esg-charts.ts` — no importer; the src/types + shared version wins.
- `src/impl/celestial-core-processor.ts` — no importer (see §2.1).

### 3.5 Probable-dead (verify before deleting)

- `src/core/repositories/answers-1.ts` (780KB) — only imported by `answers-2.ts`,
  which itself has no importers.
- `src/core/services/report-templates.ts` — imported by nothing under `core/services`
  (the active template lives at `src/core/ai/skills/report-templates.ts`).
- `lib/adk/*`, `lib/services/*`, `lib/core/5t-protocol.ts` — **NOT dead** (correction,
  2026-08-01 audit verification). They ARE imported by 7 live route files under root
  `app/api/*`, but only via **broken `@/lib/...` paths** that resolve against `src/lib/`
  (where the files don't exist). This is the root cause of the `Build Check` CI failure
  on `origin/main` (11× `Module not found`). These routes must either be fixed to use the
  `@lib/*` alias (→ root `lib/`) or the referenced modules migrated into `src/lib/`
  before any `lib/` deletion is considered.

### 3.6 Build-breaking broken imports (verified 2026-08-01, HIGH)

The alias `@/*` → `./src/*` (tsconfig.json), while root `lib/` is only reachable via
`@lib/*` → `./lib/*`. Seven live route files import from root `lib/` using the **wrong
alias** `@/lib/...`, so the build fails on `origin/main`:

| Route file | Broken import (fix: use `@lib/`) |
|---|---|
| `app/api/awaken/ritual/route.ts` | `@/lib/adk/ten-wings-agents`, `@/lib/adk/arvo-wings-agents`, `@/lib/services/adk/apostle-squad-manager` |
| `app/api/awaken/pulse/route.ts` | `@/lib/services/adk/apostle-dispatcher-server`, `@/lib/services/adk/apostle-squad-manager` |
| `app/api/esg/go/route.ts` | `@/lib/services/esg/DataOrchestratorServer` |
| `app/api/esg/verify/route.ts` | `@/lib/services/esg/DataOrchestratorServer` |
| `app/api/esg/report/route.ts` | `@/lib/services/esg/ReportGeneratorServer` |
| `app/api/library/download/route.ts` | `@/lib/services/google-drive`, `@/lib/services/ncbdb` |
| `app/api/reconnaissance/gateway/route.ts` | `@/lib/core/5t-protocol` |

All targets exist at root `lib/{adk,services,core}/...`. Fix is a 1-line alias swap per
import; verify with `pnpm build`. Tracked separately as `fix-broken-lib-imports`
(esggo-swarm bugfix teammate, PR to follow).

---

## 4. Bundle Bloat

### 4.1 Measured chunks (`.next` build, 2026-07-22)

| Chunk | Size | Driver |
|---|---|---|
| `server/chunks/node_modules__pnpm_*.js` | 3.9 MB | vendor |
| `server/chunks/src_core_repositories_sustain-write-answer-database_ts_*.js` | **750 KB** | `sustain-write-answer-database.ts` (827KB source) |
| largest client chunk (`static/chunks/3rph7m55-64oz.js`) | 590 KB | shared client bundle |

### 4.2 Duplicated data files (≈5.9 MB on disk)

| File | Bytes |
|---|---|
| `lib/sustain-write/answer-database.ts` | 2,542,282 |
| `src/core/repositories/answer-database.ts` | 872,196 |
| `src/core/repositories/sustain-write-answer-database.ts` | 827,209 |
| `src/core/repositories/answers-1.ts` | 780,911 |
| `src/core/repositories/answers-2.ts` | 780,286 |
| `src/core/repositories/question-bank.ts` + `lib/sustain-write/question-bank.ts` | 323,639 |

Refactor targets:
- Keep ONE canonical answer DB module; delete the other four copies.
- Move data into JSON (`public/` or server-only `prisma`-seeded) so it is not part of
  the server chunk graph, or lazy-load it via dynamic import only on the routes that
  need it.

### 4.3 Unused / low-usage dependencies (`package.json`)

- `@grpc/grpc-js`, `@grpc/proto-loader` — declared; **no source usage** anywhere in
  `src/`, `app/`, `lib/`, `gateway/`, `scripts/`. Safe to drop.
- `ioredis` — used only via root `lib/redis` (3 files). Keep while redis layer exists.
- `@notionhq/client` — used in `notion-sync-service.ts`. Keep.
- `react-markdown` — used in `app/wiki/[slug]/page.tsx`. Keep.

### 4.4 Tooling note

- `node_modules/` ≈ 961 MB; `.next/` ≈ 87 MB (includes source maps). Consider
  `.next` source-map pruning in CI.

---

## 5. Lint Status & Fixes

- `npx eslint src/ --max-warnings 50` currently passes on baseline (`0 problems`).
- `.eslintignore` is deprecated under ESLint 9 flat config — migrate ignores into
  `eslint.config.js` (warning appears on every lint run).
- `pnpm lint` runs `scripts/celestial-gate.ts` which shell-execs `eslint --fix`;
  keep `--max-warnings` under control as refactors land.
- Suggested additions (after dedupe): no-duplicate-exports per file, import/no-duplicates
  across `@esggo/shared`, and a `knip`/`ts-prune` CI gate for unused exports.

---

## 6. Prioritized Action Plan

| # | Action | Risk | Est. saving |
|---|---|---|---|
| **0** | **Fix 11 broken `@/lib/...` imports in 7 routes → `@lib/...`** (unblocks `pnpm build`) | LOW (1-line alias swap) | restores CI Build Check |
| 1 | Delete `src/app/` dead tree (or migrate delegation routes) | LOW-MED (routes currently shadowed) | ~180K src + confusion |
| 2 | Remove root `lib/` legacy files (keep `lib/redis`, `lib/adk`, `lib/services`, `lib/core/5t-protocol` until #0 is merged) | LOW (after #0) | ~2.8 MB on disk |
| 3 | Consolidate 5 answer-database files → 1 canonical + JSON | MED (API surface) | up to 750KB chunk + 4MB disk |
| 4 | Delete `src/impl/celestial-core-processor.ts` + shadow `src/impl/omni-*` | LOW | removes type drift |
| 5 | `src/types/esg-charts.ts` re-export from `@esggo/shared` | LOW | single source of truth |
| 6 | Drop `@grpc/*` deps | LOW | install time |
| 7 | Extract duplicated chart/page scaffolding | MED | ~1% dup lines |
| 8 | Add `knip` CI gate + flat-config ignores | LOW | prevents regressions |

---

*Generated by `alchemy-entropy` — re-run: `npx jscpd src app lib tests --min-lines 10 --min-tokens 80`*
