MERGED=unresolvable
DIRTY=0

## git status (porcelain)
```
(clean)
```

## Unresolved conflicts
```
.github/workflows/ci-check.yml
.hermes/auto-repair/ci-gate.sh
docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md
oa-swarm/src/server.ts
scripts/sonar-quality-gate.mjs
```

## Full sync log
```
=== fetch main ===
From https://github.com/DingJun1028/Omniesggo
 * branch              main       -> FETCH_HEAD
=== ensure .gitattributes from main ===
=== renormalize ===
[vibe/hermes-connect-page-016227 d0acc03b] chore: normalize line endings to LF per .gitattributes
 2 files changed, 427 insertions(+), 427 deletions(-)
=== hard refresh worktree ===
Your branch is ahead of 'origin/vibe/hermes-connect-page-016227' by 1 commit.
  (use "git push" to publish your local commits)
=== status ===
=== merge ===
Auto-merging .github/workflows/ci-check.yml
CONFLICT (content): Merge conflict in .github/workflows/ci-check.yml
Auto-merging .hermes/auto-repair/ci-gate.sh
CONFLICT (content): Merge conflict in .hermes/auto-repair/ci-gate.sh
Auto-merging docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md
CONFLICT (content): Merge conflict in docs/vault-canon/OMN-PRD-001-SCHEMA-TRACEABILITY.md
Auto-merging oa-swarm/src/server.ts
CONFLICT (content): Merge conflict in oa-swarm/src/server.ts
Auto-merging pnpm-lock.yaml
CONFLICT (content): Merge conflict in pnpm-lock.yaml
Auto-merging scripts/sonar-quality-gate.mjs
CONFLICT (content): Merge conflict in scripts/sonar-quality-gate.mjs
Automatic merge failed; fix conflicts and then commit the result.
Updated 1 path from the index
error: pathspec 'uv.lock' did not match any file(s) known to git
fatal: pathspec 'uv.lock' did not match any files
warning: in the working copy of 'oa-swarm/src/server.ts', CRLF will be replaced by LF the next time Git touches it
```
