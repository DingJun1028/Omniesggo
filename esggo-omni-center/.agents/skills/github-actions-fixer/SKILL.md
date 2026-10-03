---
name: github-actions-fixer
description: Diagnose and fix GitHub Actions CI/CD workflow failures. Covers ESLint, pytest, ruff, TypeScript, pnpm, Node.js, Python dependency issues, and deploy pipeline debugging. Use when CI fails, workflows error, or deployments break.
uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
version: "1.0.0"
---

# GitHub Actions Fixer Skill

Systematically diagnose and fix GitHub Actions workflow failures.

## Workflow

### 1. Identify the Failure
```bash
gh run list --limit 5                    # Find failed runs
gh run view <RUN_ID> --log               # Get detailed logs
gh run view <RUN_ID> --log-failed        # Only failed steps
```

### 2. Common Failure Categories

#### A. ESLint Failures
- **0 errors required** — warnings are OK, errors fail CI
- Check `pnpm lint` exit code (exit 1 = errors exist)
- Common error types:
  - `react-hooks/rules-of-hooks` — hooks called conditionally or after early return
  - `react-hooks/set-state-in-effect` — React Compiler strict rule (disable it)
  - `@typescript-eslint/no-require-imports` — require() in .cjs files (add to ignores)
  - `react-hooks/purity` — Math.random() during render (use useMemo/useRef)
  - `react-hooks/refs` — ref access during render (use state instead)
  - `react-hooks/immutability` — variable reassignment during render (use useMemo)

#### B. Python Test Failures
- Missing module: create `esggo/__init__.py` + `esggo/config.py`
- Import errors: check `pyproject.toml` build-backend
- `setuptools.backends._legacy` → use `setuptools.build_meta` for Python 3.14+

#### C. TypeScript Failures
- `npx tsc --noEmit` — check tsconfig.json strictness
- Missing types: add to `types` array in tsconfig

#### D. pnpm / Node.js Failures
- `pnpm install --frozen-lockfile` — lockfile out of sync
- Node version mismatch — check `actions/setup-node` version

### 3. Fix Strategy

```
CI Failure → Categorize → Fix Root Cause → Local Verify → Commit → Push → Re-check
```

For each fix:
1. Reproduce locally first (`pnpm lint`, `pytest`, `tsc --noEmit`)
2. Fix the root cause, not symptoms
3. Verify locally before committing
4. Push and watch CI with `gh run watch <ID> --exit-status`

### 4. ESLint Quick Fix Reference

| Error | Fix |
|-------|-----|
| `rules-of-hooks` | Move hooks before early returns |
| `set-state-in-effect` | Disable rule: `'react-hooks/set-state-in-effect': 'off'` |
| `no-require-imports` in .cjs | Add `**/*.cjs` to ignores |
| `purity` (Math.random) | Use `useMemo` or `crypto.createHash` |
| `refs` during render | Convert `useRef` to `useState` |
| `immutability` | Use `useMemo` to precompute values |

### 5. Verification Checklist

```bash
# All must pass before push:
pnpm lint              # ESLint (0 errors)
npx tsc --noEmit       # TypeScript
ruff check .           # Python linter
python -m pytest tests/ -v  # Python tests
pnpm run build         # Next.js build
```
