# OmniTag & Trust Label System

> Universal Tag + Trust Label — the verifiable trust layer for the OA-Team 30-bee swarm.
>
> Version: v1.0 · Aligned with `soul.md §20.7` · Test baseline: **706 passed / 0 failed / 21 skipped**
>
> 5T Protocol: Traceable · Trackable · Tangible · Transparent · Trustworthy

---

## Overview

**OmniTag** is the universal tag contract for every artifact in the esggo workspace.
**Trust Label** (added in §20.7) attaches a *quantified trust level* to every OmniTag, turning an otherwise opaque tag into a measurable trust assertion.

```text
OmniTag (lifecycle, agent, squad, componentId)
   +
TrustLabel (trustLevel, trustScore, hashLock, labels)
   =
Verifiable, gate-able, immutable trust artifact
```

---

## Five Trust Levels

| Level | Score | Default Labels | Typical Use |
|---|---|---|---|
| `low` | 0.70 | `hash-lock` | Internal logs, audit trails |
| `medium` | 0.85 | `third-party-audit` | CI pipelines, integrations |
| `high` ⭐ | **0.95** | `full-5t-pass`, `hash-lock` | Default gate threshold |
| `critical` | 1.00 | `h4-frozen`, `object-freeze`, `full-5t-pass` | Financial, contracts, immutable artifacts |
| `authenticated` | 0.90 | `hmac`, `oauth`, `full-5t-pass` | OAuth / HMAC authenticated calls |

> **Transparent default**: unknown levels return `0`, never a silent fallback.

---

## Quick Start

```ts
import { esggo } from '@/lib/omni-core/omni-function';
import {
  createTrustTag,
  updateLifecycle,
  TRUST_LEVEL_SCORE,
} from '@/lib/omni-base';
import {
  validateTrustLevel,
  enforceFrozenLock,
} from '@/lib/omnitag-contract';
import type { TrustLevel, OmniTagSet } from '@/lib/omni-core/types';

// 1) Look up a score
esggo.trustScore('high');                    // 0.95
esggo.trustScore('critical');                // 1.00
esggo.trustScore('unknown' as any);          // 0   ← transparent

// 2) Gate a request
const gate = esggo.trustGate('high');        // { passed: true, threshold: 0.95, violations: [] }

// 3) Create a frozen trust tag
const tag = createTrustTag({
  agent: 'agent:07',
  trustLevel: 'high',
  lifecycle: 'active',
});
// → Object.freeze({ agent, trustLevel, trustScore: 0.95, hashLock, lifecycle, createdAt })

// 4) Promote lifecycle and trust together
const frozen = updateLifecycle(tag, 'frozen', { trustLevel: 'critical' });

// 5) Verify contracts
validateTrustLevel(tag);                     // { valid: true, violations: [] }
enforceFrozenLock(frozen, { trustLevel: 'low' });
// → { blocked: true, violations: ['H4 frozen: ...'] }
```

---

## API Reference

### Built-in Functions (`esggo.*`)

| Function | Signature | Returns |
|---|---|---|
| `esggo.trustScore` | `(level: string) => number` | `0.7 / 0.85 / 0.95 / 1.0 / 0.9` (or `0` if unknown) |
| `esggo.trustGate` | `(level: string, opts?: { requiredLevel?: string })` | `{ passed, threshold, violations }` |
| `esggo.trustLabel` | `(tag: OmniTagSet, level: TrustLevel) => OmniTagSet` | Tag with trustLevel + trustScore + hashLock |

All three are registered via `omniFn.register(..., { category: 'trust' })` and guarded with `if (!omniFn.has(...))` to prevent double registration.

### Factory Functions (`omni-base`)

```ts
createTrustTag({
  agent: string,
  trustLevel: TrustLevel,
  lifecycle?: TagLifecycleV6,
}): Record<string, unknown>           // Object.freeze

updateLifecycle(
  tag: Record<string, unknown>,
  lifecycle: TagLifecycleV6,
  opts?: { trustLevel?: TrustLevel },
): Record<string, unknown>
```

### Contract APIs (`omnitag-contract`)

```ts
validateTrustLevel(tag: OmniTagSet): ContractCheck

enforceFrozenLock(
  tag: OmniTagSet | Record<string, unknown>,
  second: boolean | Record<string, unknown>,
): ContractCheck | { blocked: boolean; violations: string[] }
```

`enforceFrozenLock` is dual-interface:

| Call | Contract | Returns |
|---|---|---|
| `(tag, true)` | Legacy H4 dual-lock | `ContractCheck` (sealed ∧ restricted) |
| `(tag, false)` | Legacy read-only | `ContractCheck { valid: true }` |
| `(tag, nextPatch)` | §20.7 single-lock | `{ blocked, violations }` (lifecycle === 'frozen') |

---

## Five-Field Enforcement (§20.5 Rule 6)

```ts
import { validateAllContracts, auditContractRate } from '@/lib/omnitag-contract';

const audit = validateAllContracts(tag);
const rate = auditContractRate([tag1, tag2, tag3]);
// → { total: 3, compliant: 3, rate: 1.0 }
```

CI target: **`auditContractRate === 1.0`** on every PR.

---

## Scenarios (top 5 — full 12 in the User Manual)

### 1. CI/CD Deploy Gate

```ts
const tag = createTrustTag({ agent: 'agent:20', trustLevel: 'high' });
const gate = esggo.trustGate(tag.trustLevel as TrustLevel);
if (!gate.passed) throw new Error(`Deploy blocked: ${gate.violations[0]}`);
```

### 2. Authenticated Webhook

```ts
const incoming = { agent: 'agent:18', squad: 'webhook', componentId: 'gateway' };
const labeled = esggo.trustLabel(incoming, 'authenticated');
const frozen = updateLifecycle(labeled, 'frozen');
```

### 3. Batch Audit

```ts
const { total, compliant, rate } = auditContractRate(tags);
if (rate < 1.0) process.exit(1);   // CI gate
```

### 4. H4 vs §20.7

| Need | Use |
|---|---|
| Permanent immutable artifact | Legacy H4 dual-lock |
| End-of-flow freeze | §20.7 single-lock |

### 5. Recovery After Freeze

```ts
const result = enforceFrozenLock(tag, patch);
if (result.blocked) {
  const next = createTrustTag({ agent: tag.agent, trustLevel: patch.trustLevel ?? tag.trustLevel, lifecycle: 'active' });
  await archiveOldTag(tag);
  await publishNewTag(next);
}
```

---

## Integration Examples

### Cloudflare Worker

```ts
import { esggo } from '@/lib/omni-core/omni-function';

export function gateRequest(req: Request): Response | null {
  const auth = req.headers.get('authorization');
  const level = auth?.startsWith('Bearer ') ? 'authenticated' : 'low';
  const gate = esggo.trustGate(level);
  if (!gate.passed) return new Response('Forbidden', { status: 403 });
  return null;
}
```

### Next.js API Route

```ts
import { esggo } from '@/lib/omni-core/omni-function';

export async function POST(req: Request) {
  const { level } = await req.json();
  return Response.json({
    score: esggo.trustScore(level),
    gate: esggo.trustGate(level),
  });
}
```

### Python Cross-Language Alignment

```python
import hashlib

TRUST_LEVEL_SCORE = {
    'low': 0.7, 'medium': 0.85, 'high': 0.95,
    'critical': 1.0, 'authenticated': 0.9,
}

def trust_score(level: str) -> float:
    return TRUST_LEVEL_SCORE.get(level, 0.0)   # transparent default

def hash_lock(agent: str, level: str, ts: int) -> str:
    return hashlib.sha256(f'{agent}:{level}:{ts}'.encode()).hexdigest()
```

---

## 5T Mapping

| Principle | Implementation |
|---|---|
| **T**raceable | `createHash('sha256')` produces `hashLock`, cross-language bit-exact |
| **T**rackable | `lifecycle` field synchronizes with `trustLevel` updates |
| **T**angible | UI badges display `score × 100%` (gold/silver/bronze) |
| **T**ransparent | Unknown levels return `0`; thresholds are public |
| **T**rustworthy | `Object.freeze` + dual-interface `enforceFrozenLock` block all mutation |

---

## Error Reference

| Message | Cause | Fix |
|---|---|---|
| `Invalid trustLevel "X" — must be one of low/medium/high/critical/authenticated` | Illegal string | Use one of the 5 valid levels |
| `Missing required [trustLevel:*]` | Field absent | Add `trustLevel` to the tag |
| `H4 frozen: lifecycle:frozen + restricted artifact is immutable` | Legacy dual-lock violated | Switch to read-only, or use new contract |
| `H4 frozen: lifecycle:frozen artifact is immutable — cannot modify` | §20.7 single-lock violated | Create a new tag, archive the old one |
| `trustScore X < required Y (level)` | Gate failed | Upgrade trustLevel or relax requiredLevel |

---

## Testing

```bash
pnpm vitest run src/lib/__tests__/trust-label.test.ts       # 15/15 ✅
pnpm vitest run src/lib/__tests__/omnitag-contract.test.ts  # 10/10 ✅
pnpm vitest run src/lib/__tests__/five-t-omnitag-gate.test.ts # 13/13 ✅
pnpm vitest run                                              # 706 / 0 / 21 ✅
```

---

## Related Documents

- [`docs/OMNITAG-TRUSTLABEL-USER-MANUAL.md`](./OMNITAG-TRUSTLABEL-USER-MANUAL.md) — full Chinese user manual (578 lines)
- [`docs/OMNITAG-TRUSTLABEL-CHEATSHEET.md`](./OMNITAG-TRUSTLABEL-CHEATSHEET.md) — one-page A4 cheatsheet
- [`docs/OMNITAG-TRUSTLABEL-PROPOSAL-DECK.md`](./OMNITAG-TRUSTLABEL-PROPOSAL-DECK.md) — 12-slide proposal deck outline
- [`soul.md §20.7`](../../soul.md) — canonical specification (45 lines added 2026-09-04)

---

## Changelog

- **v1.0 (2026-09-04)** — Initial public release
  - `TrustLevel` enum, `TrustLabel` interface, `TRUST_LEVEL_SCORE` map
  - `esggo.trustScore / trustGate / trustLabel` built-ins
  - `createTrustTag` + `updateLifecycle` factory functions
  - Dual-interface `enforceFrozenLock` (legacy H4 + §20.7 single-lock)
  - Test baseline 706/0/21, soul.md §20.7 documented
