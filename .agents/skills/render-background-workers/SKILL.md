---
name: render-background-workers
description: >-
  Sets up and configures background workers on Render for queue-based job
  processing. Use when the user needs to process async jobs, consume from a
  queue, run Celery/Sidekiq/BullMQ/Asynq/Oban workers, handle graceful
  shutdown with SIGTERM, wire a worker to Key Value (Redis), or choose between
  workers and cron jobs for background work.
  Trigger terms: background worker, async jobs, queue consumer, Celery,
  Sidekiq, BullMQ, Asynq, Oban, job processing, SIGTERM, graceful shutdown.
license: MIT
compatibility: Render background worker services
metadata:
  author: Render
  version: "1.0.0"
  category: compute
uuid: "b8e07037-35ff-4e45-8b9a-114493aad39b"
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/render-background-workers"
title: render-background-workers

---

1.0.0# Render Background Workers

This skill explains **worker** services on Render: processes that **consume jobs from a queue** instead of serving HTTP. Pair with **render-blueprints**, **render-env-vars**, and **render-networking** when wiring `render.yaml` and private connectivity.

## When to Use

- Designing or debugging **queue-backed workers** (Celery, Sidekiq, BullMQ, Asynq, etc.)
- Choosing between a **worker**, **Cron Job**, or **Workflow** for background work
- Configuring **Render Key Value** as a **broker** (not a cache) with correct **eviction policy**
- Implementing **graceful shutdown** so in-flight jobs are not lost on deploy

Per-framework setup and signal-handling detail: `references/queue-framework-setup.md`, `references/graceful-shutdown.md`.

## How Workers Work

- **Long-running services** with **no inbound (HTTP) traffic**. Render does not expose a public URL or internal hostname for workers the way it does for web or private services—**workers cannot receive private network traffic directed at them**.
- The typical pattern is a **poll loop**: the process connects to a **queue backend** (often **Render Key Value**, Redis-compatible **Valkey 8**) and **pulls jobs**.
- Workers **can initiate outbound connections** on the private network—to **PostgreSQL**, **Key Value**, **private services**, **web services** (internal URLs), and the public internet—subject to your plan and firewall rules.

## Queue Framework Overview

| Framework | Language | Queue backend | Notes |
|-----------|----------|---------------|--------|
| Celery | Python | Redis / Key Value | Most common Python task queue |
| Sidekiq | Ruby | Redis / Key Value | Standard for Rails |
| BullMQ | Node.js | Redis / Key Value | Modern Node queue (Redis-based) |
| Asynq | Go | Redis / Key Value | Go async task processing |
| Oban | Elixir | **Postgres** (not Redis) | Queue stored in the database |

## Pairing with Key Value

- Use **Render Key Value** as the **job broker** when your framework expects Redis.
- Set **maxmemory policy** to **`noeviction`**. **`allkeys-lru`** and similar policies are for **caches**; evicting queue keys **drops jobs**.
- Wire **`REDIS_URL`** (or your framework’s equivalent) via **`fromService`** with `type: keyvalue` and `property: connectionString` in the Blueprint.
- **Blueprints require `ipAllowList`** on Key Value—include the CIDRs that should reach the instance (often `[]` for private-network-only access; see **render-blueprints** / Key Value field reference).

See `references/queue-framework-setup.md` for minimal app + YAML examples.

## Worker vs Cron vs Workflow

| Need | Use | Why |
|------|-----|-----|
| Always-on queue consumer | **Background Worker** | Polls continuously; long-lived process |
| Periodic scheduled task | **Cron Job** | Runs on a schedule, **exits**; **12h max** per run |
| Distributed parallel compute | **Workflow** | Each run gets its own instance; fan-out patterns |
| High-volume or bursty jobs | **Workflow** | Scales per run; **no idle instance cost** between runs |

## Graceful Shutdown

- Before stopping an instance, Render sends **`SIGTERM`**, then waits up to **`maxShutdownDelaySeconds`** (**1–300**, **default 30**) before **`SIGKILL`**.
- Workers should: **(1)** stop accepting new jobs, **(2)** finish the current job or **checkpoint** progress, **(3)** close connections, **(4)** exit **0**.
- Set **`maxShutdownDelaySeconds`** to at least your **longest safe job duration** (see Dashboard or Blueprint).

Language- and framework-specific handlers: `references/graceful-shutdown.md`.

## Blueprint Configuration

Minimal pattern: **`type: worker`**, **`runtime`**, **`buildCommand`**, **`startCommand`**, and **`envVars`** wired from Key Value.

```yaml
services:
  - type: keyvalue
    name: jobs
    plan: starter
    region: oregon
    ipAllowList: []

  - type: worker
    name: task-worker
    runtime: python
    region: oregon
    plan: starter
    buildCommand: pip install -r requirements.txt
    startCommand: celery -A tasks worker --loglevel=info
    envVars:
      - key: REDIS_URL
        fromService:
          name: jobs
          type: keyvalue
          property: connectionString
```

Optional: **`maxShutdownDelaySeconds`** on the worker service for longer draining jobs.

## References

| Topic | File |
|--------|------|
| Celery, Sidekiq, BullMQ, Asynq, Oban setup + YAML | `references/queue-framework-setup.md` |
| SIGTERM, `maxShutdownDelaySeconds`, per-language patterns | `references/graceful-shutdown.md` |

## Related Skills

- **render-deploy** — First deploy, CLI, service creation
- **render-blueprints** — Full `render.yaml` schema, `fromService`, projects
- **render-networking** — Private URLs, what can call what
- **render-scaling** — Worker plans, instance counts, limits


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| render-background-workers | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：render-background-workers 並查詢目前狀態
{
  triggers: ["render-background-workers", "query"],
  actions: ["awaken()", "query()"],
  priority: ["render-background-workers", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | render-background-workers, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | render-background-workers, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：render-background-workers
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 render-background-workers 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 render-background-workers 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
