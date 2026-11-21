#!/bin/bash
cd /opt/esggo/esggo-auto-repair/worker
npx wrangler queues info esggo-repair-queue 2>&1
echo "---"
npx wrangler queues info esggo-repair-dlq 2>&1