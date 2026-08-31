#!/bin/bash
set -euo pipefail
BASE="${1:-https://esggo.co}"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
TMP=$(mktemp)

echo "5T Daily Report | $TIMESTAMP"
echo "Traceable: $(curl -s -o /dev/null -w '%{http_code}' $BASE/api/health) health"
echo "Trackable: $(curl -s -o /dev/null -w '%{http_code}' $BASE/api/agentic-twin) agentic-twin"
echo "Tangible: $(curl -s -o /dev/null -w '%{http_code}' $BASE/api/evidence-upload) evidence-upload"
echo "Transparent: $(curl -s -o /dev/null -w '%{http_code}' $BASE/omni/reports) omni-reports"
echo "Trustworthy: $(curl -s -o /dev/null -w '%{http_code}' $BASE/api/health?format=metrics | head -1) metrics"

# Capture metrics for entropy estimate
curl -s "$BASE/api/health?format=metrics" -H 'Accept: text/plain' > "$TMP" 2>/dev/null || true
if [ -s "$TMP" ]; then
  echo "Metrics snapshot saved to $TMP"
fi

rm -f "$TMP"
