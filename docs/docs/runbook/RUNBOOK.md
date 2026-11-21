# Operations Runbook

## Service Overview
Smart AI Router 2.0.0-beta.1 - ESG AI Model Routing Platform

## Critical Endpoints
- **Health**: `GET /healthz` - Basic liveness
- **Detailed Health**: `GET /healthz?detail=true` - Component status
- **Metrics**: `GET /metrics` - Prometheus metrics
- **Routing**: `POST /api/route` - AI model routing
- **Debug**: `POST /debug/time-travel` - Time-travel debugging

## Common Issues & Solutions

### Issue: Model API Rate Limit (429)
**Symptoms**: HTTP 429 from provider APIs
**Resolution**:
1. Check rate limit headers in response
2. Automatic fallback should trigger (Groq → OpenRouter → HF)
3. If all exhausted: return mock response, log alert
4. Monitor: `rate_limit_exceeded_total` metric

### Issue: High Latency (>5s)
**Symptoms**: Slow AI responses
**Resolution**:
1. Check `/healthz?detail=true` for component status
2. Verify event store latency (should be <50ms)
3. Check provider status pages
4. Consider enabling shadow test for faster model

### Issue: Event Store Lag
**Symptoms**: Time-travel queries slow, replay delayed
**Resolution**:
1. Check PostgreSQL/EventStoreDB connection pool
2. Run `VACUUM ANALYZE` on events table
3. Check disk I/O and memory
4. Consider partition by date for large datasets

### Issue: Hash Lock Verification Failed
**Symptoms**: OAG rejecting requests, `contract_verification_failed` metric
**Resolution**:
1. Check evidence payload structure
2. Verify SHA-256 implementation matches
3. Ensure timestamp is within acceptable window (±5 min)
4. Check for evidence tampering

## Monitoring & Alerts

### Critical Alerts
| Alert | Condition | Action |
|-------|-----------|--------|
| `service_down` | healthz != 200 for 2 min | Page on-call |
| `rate_limit_all` | All providers rate limited | Page on-call |
| `event_store_lag` | > 1000 events behind | Investigate DB |
| `contract_failures` | > 5/min | Security review |

### Key Metrics to Watch
- `router_request_duration_seconds` - p50 < 1s, p99 < 5s
- `model_fallback_total` - Should be near 0
- `shadow_test_pass_rate` - Target > 90%
- `contract_verification_duration_seconds` - < 100ms

## Deployment Procedures

### Rolling Update
```bash
# 1. Build new image
docker build -t smart-ai-router:v2.0.1 .

# 2. Push to registry
docker push ghcr.io/.../smart-ai-router:v2.0.1

# 3. Update deployment (K8s example)
kubectl set image deployment/smart-ai-router smart-ai-router=ghcr.io/.../v2.0.1

# 4. Monitor rollout
kubectl rollout status deployment/smart-ai-router
```

### Rollback
```bash
kubectl rollout undo deployment/smart-ai-router
```

## Disaster Recovery

### Event Store Backup
```bash
# Daily automated backup (cron)
pg_dump -h $PGHOST -U $PGUSER -d esggo_events > backup_$(date +%Y%m%d).sql
```

### Restore Procedure
```bash
# 1. Stop services
kubectl scale deployment smart-ai-router --replicas=0

# 2. Restore database
psql -h $PGHOST -U $PGUSER -d esggo_events < backup_20240115.sql

# 3. Start services
kubectl scale deployment smart-ai-router --replicas=3
```

## Security Incidents

### Suspicious Activity
1. Check `/healthz?detail=true` for contract failures
2. Review OAG logs for rejected requests
3. Check for unusual traffic patterns in metrics
4. If confirmed: rotate API keys, review access logs

### Key Rotation
```bash
# Rotate API keys
# 1. Generate new keys in provider consoles
# 2. Update Kubernetes secrets
kubectl create secret generic api-keys \
  --from-literal=OPENROUTER_API_KEY=$NEW_KEY \
  --dry-run=client -o yaml | kubectl apply -f -

# 3. Rolling restart
kubectl rollout restart deployment/smart-ai-router
```

## Contact Information
- **On-call**: Check PagerDuty schedule
- **Slack**: #smart-ai-router-ops
- **GitHub**: Issues in DingJun1028/esggo