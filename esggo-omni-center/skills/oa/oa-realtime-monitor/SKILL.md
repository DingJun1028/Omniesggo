---
name: oa-realtime-monitor
description: "Use when the user wants real-time system monitoring via SSE, Redis, or API. Monitors gateway health, agent status, deployment status, and system metrics. Load when user mentions monitoring, real-time, SSE, health check, or observability."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [monitor, realtime, sse, redis, observability, health, esggo]
    related_skills: [oa-summon, oa-vps-gateway, oa-task-orchestrator]
---

# OA Realtime Monitor — 即時監控器 v2

## Overview

即時監控系統健康：Gateway 狀態、代理狀態、部署狀態、系統指標。支援 SSE、Redis Pub/Sub、REST API 多種模式。

## When to Use

- 用戶說「監控」、「即時狀態」、「健康檢查」、「SSE」、「觀測性」
- 需要即時查看系統運行狀態

**Don't use for:** 部署（用 `oa-deploy`）、VPS 管理（用 `oa-vps-gateway`）

## Monitoring Targets

| 目標 | 指標 | 更新頻率 |
|------|------|----------|
| OmniAgent Gateway | 連線數、訊息吞吐、錯誤率 | 即時 (SSE) |
| Hermes Agent | Session 數、工具調用、Token 用量 | 5s |
| VPS 基礎設施 | CPU、Memory、Disk、Network | 10s |
| 部署管線 | Build 狀態、Deploy 狀態、健康檢查 | 事件驅動 |
| Supabase | Query 延遲、連線池、錯誤率 | 30s |

## Core Workflow

### Step 1: 啟動監控

```bash
# Local gateway
curl -N http://127.0.0.1:8642/monitor/stream

# VPS gateway
curl -N https://vps.esggo.org:8443/monitor/stream

# Redis Pub/Sub
redis-cli SUBSCRIBE monitor:gateway monitor:agent monitor:vps
```

### Step 2: 儀表板查看

```bash
# 文字模式
node cli/omni-cli.ts monitor --mode=text

# JSON 輸出（供其他工具消費）
node cli/omni-cli.ts monitor --mode=json
```

### Step 3: 告警規則

```yaml
# .hermes/monitor/alerts.yaml
alerts:
  - name: gateway_down
    condition: "gateway.healthy == false"
    action: "notify_telegram"
  - name: high_error_rate
    condition: "agent.error_rate > 0.1"
    action: "log_and_notify"
  - name: deploy_failed
    condition: "deploy.status == failed"
    action: "notify_telegram"
```

## Data Sources

- **Gateway SSE**: `/monitor/stream` endpoint
- **Redis**: `monitor:*` channels
- **REST API**: `/api/monitor/*` endpoints
- **PM2**: `pm2 jlist` for process metrics

## Common Pitfalls

1. **SSE 連線中斷** — 需自動重連邏輯（指數退避）
2. **Redis 連線數** — 監控不應佔用過多連線
3. **指標爆炸** — 僅收集關鍵指標，避免高基數

## Verification Checklist

- [ ] SSE 串流正常
- [ ] Redis 訂閱正常
- [ ] 關鍵指標皆有資料
- [ ] 告警規則生效
- [ ] 歷史資料可查詢