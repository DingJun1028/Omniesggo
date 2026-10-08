#!/usr/bin/env bash
# Entropy audit runner for ESG GO (alchemy-entropy role)
# [security:internal][agent:22][squad:煉金熵減][lifecycle:active][p1][platform:esggo][best-practice:结界]
#
# Re-runs the checks behind _analysis/entropy-audit/ENTROPY-AUDIT-2026-08-01.md
# Usage: bash scripts/run-entropy-audit.sh [repo-root]
set -euo pipefail

ROOT="${1:-$(cd "$(dirname "$0")/.." && pwd)}"
cd "$ROOT"

echo "== 1/3 duplicate code (jscpd) =="
if command -v jscpd >/dev/null 2>&1; then
  jscpd src app lib tests --min-lines 10 --min-tokens 80 || true
else
  echo "jscpd not installed locally — run: pnpm dlx jscpd src app lib tests --min-lines 10 --min-tokens 80"
fi

echo
echo "== 2/3 lint (src) =="
npx eslint src/ --max-warnings 50 || true

echo
echo "== 3/3 unused dependency scan =="
echo "Searching for @grpc usage (expected: empty):"
grep -rn "@grpc/grpc-js\|@grpc/proto-loader" src app lib gateway scripts --include="*.ts" --include="*.tsx" --include="*.mjs" --include="*.js" 2>/dev/null | grep -v node_modules || echo "(none)"

echo
echo "== done. Full report: _analysis/entropy-audit/ENTROPY-AUDIT-2026-08-01.md =="
