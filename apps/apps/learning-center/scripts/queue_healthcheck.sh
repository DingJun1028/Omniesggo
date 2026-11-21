#!/bin/bash
# Queue Healthcheck Script for esggo-auto-repair Worker

echo "=== esggo-auto-repair Queue Healthcheck ==="
echo ""

# Check queue status
echo "Checking esggo-repair-queue..."
npx wrangler queues info esggo-repair-queue 2>&1 || echo "ERROR: Failed to get queue info"

echo ""
echo "Checking esggo-repair-dlq..."
npx wrangler queues info esggo-repair-dlq 2>&1 || echo "ERROR: Failed to get DLQ info"

echo ""
echo "Checking consumer status..."
npx wrangler queues consumer list esggo-repair-queue --json 2>&1 || echo "ERROR: Failed to get consumer list"

echo ""
echo "=== Healthcheck Complete ==="