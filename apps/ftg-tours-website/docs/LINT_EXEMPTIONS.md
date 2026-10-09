# Lint Exemptions

## `no-undef` on the legacy `*Page.jsx` bundle-lifted files

`.oxlintrc.json` disables `no-undef` for exactly ten files:

```
src/pages/AboutPage.jsx           src/pages/PrivacyPage.jsx
src/pages/ContactPage.jsx         src/pages/TeamDayPage.jsx
src/pages/CorporateTravelPage.jsx src/pages/TermsPage.jsx
src/pages/ExecutivePage.jsx       src/pages/WellbeingPage.jsx
src/pages/FamilyDayPage.jsx
src/pages/ImpactNotePage.jsx
```

### Why they are exempt

These ten files were **lifted out of a production bundle** (minified JSX, e.g.
`function Ci(){let{t:e}=lr();yr({title:e(\`products.executive\`)`). The minifier had
inlined module-scope bindings into short identifiers (`vi`, `yi`, `j`, `Vr`, `kr`, …)
that have no counterpart in the source tree. Several files already carry a partial
repair header, but the full binding set was never recovered, so `no-undef` cannot
pass without **inventing** identifiers — which would be a fabricated change.

### Why they are not deleted

Each is **superseded by the lowercase canonical page for the same route**:

| Legacy (bundle-lifted) | Canonical (current) |
|---|---|
| `AboutPage.jsx` | `About.jsx` |
| `ContactPage.jsx` | `contact.jsx` |
| `CorporateTravelPage.jsx` | `corporate-travel.jsx` |
| `ExecutivePage.jsx` | `executive-retreat.jsx` |
| `FamilyDayPage.jsx` | `family-day.jsx` |
| `ImpactNotePage.jsx` | `esg-impact-note.jsx` |
| `PrivacyPage.jsx` | `Privacy.jsx`, `privacy-policy.jsx` |
| `TeamDayPage.jsx` | `esg-team-day.jsx` |
| `TermsPage.jsx` | `Terms.jsx`, `terms-of-service.jsx` |
| `WellbeingPage.jsx` | `wellbeing-retreat.jsx` |

Verified unreachable: `grep -rl` for each basename across `src/` returns **only the
file itself** — zero importers. They are not routed anywhere.

Removal is an **irreversible operation** and therefore gated on H3 sign-off. Until
that decision, they stay on disk and are lint-exempt rather than silently rewritten.

### Reverting this exemption

Once the files are deleted (H3-approved), drop the second entry from `overrides` in
`.oxlintrc.json`. No other config change is needed — `no-undef` is already `error`
globally.