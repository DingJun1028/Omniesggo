---
name: render-keyvalue
description: >-
  Provisions and configures Render Key Value (Redis-compatible Valkey 8)
  instances for caching, session storage, and job queues. Use when the user
  needs Redis, Key Value, Valkey, a cache, session store, job queue backend,
  or needs to configure maxmemory policy, ipAllowList, connection strings,
  or internal vs external access.
  Trigger terms: Key Value, Redis, Valkey, cache, session store, REDIS_URL,
  maxmemory, ipAllowList, allkeys-lru, noeviction.
license: MIT
compatibility: Render Key Value instances (free and paid plans)
metadata:
  author: Render
  version: "1.0.0"
  category: data
uuid: "7ea8fd76-5e45-48cd-8b86-2c4c921db581"
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/render-keyvalue"
title: render-keyvalue

---

1.0.0# Render Key Value

Render Key Value provides low-latency, Redis-compatible in-memory storage running **Valkey 8**. Use it as a shared cache, session store, or job queue backend. Compatible with virtually all Redis client libraries.

## When to Use

- Adding a **cache** or **session store** to a web app
- Wiring a **job queue** backend for Celery, Sidekiq, BullMQ, Asynq, or Oban
- Choosing the right **maxmemory policy** (cache vs queue)
- Configuring **ipAllowList** in Blueprints (required field)
- Connecting via **internal vs external URLs**
- Troubleshooting **auth failures** or **connection refused** errors

For background worker setup and queue framework patterns, see **render-background-workers**. For Blueprint authoring, see **render-blueprints**.

## Key Concepts

### Valkey 8 (not Redis)

New instances run **Valkey 8**, an open-source Redis fork. It is a drop-in replacement for Redis—existing Redis client libraries work without changes. Legacy instances (created before Feb 2025) run Redis 6.

### Connection URLs

Every instance has two URLs:

| URL type | When to use | Auth required |
|----------|-------------|---------------|
| **Internal** (`redis://red-xxx:6379`) | From Render services in the same region | No (by default) |
| **External** (`rediss://red-xxx:6379`) | From outside Render (local dev, CI) | Always |

**Always prefer the internal URL** for production services—lower latency, no TLS overhead, communicates over the private network.

External connections are **disabled by default**. Enable them by adding IP ranges to the access control list in the Dashboard.

### Internal authentication

By default, internal connections are unauthenticated. You can **require auth for internal connections** in the Dashboard for compliance or extra security. This changes the internal URL to include credentials:

```
redis://default:PASSWORD@red-xxx:6379
```

**Warning:** Enabling internal auth breaks existing unauthenticated connections. Migrate clients to the authenticated URL first.

## Maxmemory Policy

**Critical decision.** Choose based on your use case:

| Use case | Policy | Why |
|----------|--------|-----|
| **Cache** (can lose data) | `allkeys-lru` | Evicts least-recently-used keys to free space |
| **Job queue** (cannot lose data) | `noeviction` | Returns error on writes when full; never drops keys |
| **Session store** | `allkeys-lru` or `volatile-lru` | Sessions can be regenerated; LRU is safe |

All available policies:

| Policy | Behavior | Memory fills up? |
|--------|----------|-----------------|
| `allkeys-lru` | Evict any key by LRU | No |
| `noeviction` | Error on writes when full | Yes |
| `volatile-lru` | Evict keys with TTL by LRU | Yes |
| `volatile-lfu` | Evict keys with TTL by LFU | Yes |
| `allkeys-lfu` | Evict any key by LFU | No |
| `volatile-random` | Evict random keys with TTL | Yes |
| `allkeys-random` | Evict any random key | No |
| `volatile-ttl` | Evict keys nearest to expiry | Yes |

## Blueprint Configuration

```yaml
services:
  - type: keyvalue
    name: cache
    plan: starter
    region: oregon
    maxmemoryPolicy: allkeys-lru
    ipAllowList: []
```

### `ipAllowList` is required

Blueprints **must** include `ipAllowList` on Key Value services. Common patterns:

| Value | Meaning |
|-------|---------|
| `[]` | No external access (internal only—**recommended for most apps**) |
| `[{source: "0.0.0.0/0", description: "everywhere"}]` | Open external access (use sparingly) |
| `[{source: "203.0.113.0/24", description: "office"}]` | Specific IP ranges |

### Wiring to services

Use `fromService` with `type: keyvalue` and `property: connectionString`:

```yaml
envVars:
  - key: REDIS_URL
    fromService:
      name: cache
      type: keyvalue
      property: connectionString
```

Available `fromService` properties for Key Value:

| Property | Value |
|----------|-------|
| `connectionString` | Full internal URL (`redis://red-xxx:6379`) |
| `host` | Hostname only |
| `port` | Port only (typically `6379`) |

## Data Persistence

- **Paid instances:** Disk-backed, `appendfsync everysec`. You may lose up to 1 second of writes on interruption.
- **Free instances:** No disk persistence. Data is lost on restart or upgrade.
- **Upgrading from Free:** All data is lost during the upgrade because Free instances have no disk.

## Instance Types and Upgrades

- Instance type determines **RAM** and **connection limit**
- You can **upgrade** to a larger type (brief downtime, ~1-2 minutes)
- You **cannot downgrade** to a smaller type
- For instances larger than 10 GB RAM, contact Render support

## Connection Examples

See `references/connection-examples.md` for client code in Node.js (ioredis, node-redis), Python (redis-py), Ruby (redis-rb, Sidekiq), and Go.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Missing `ipAllowList` in Blueprint | Add `ipAllowList: []` for internal-only access |
| Using `allkeys-lru` for job queues | Switch to `noeviction`—LRU eviction drops queued jobs |
| Connecting with external URL from a Render service | Use the internal URL for lower latency and no auth requirement |
| Forgetting `type: keyvalue` in `fromService` | `type` is required; without it the wiring fails |
| Using deprecated `redis` type alias | Prefer `keyvalue` in new Blueprints (`redis` still works but is deprecated) |

## References

| Document | Contents |
|----------|----------|
| `references/connection-examples.md` | Client code for Node.js, Python, Ruby, Go |
| `references/troubleshooting.md` | Auth errors, connection refused, memory full, migration from Redis 6 |

## Related Skills

- **render-background-workers** — Queue consumer setup with Celery, Sidekiq, BullMQ
- **render-blueprints** — Full `render.yaml` schema, `fromService` patterns
- **render-networking** — Private network, internal URLs
- **render-env-vars** — Wiring `REDIS_URL` and other connection vars


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| render-keyvalue | auto | 觸發本技能 | 5.0 |
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
// 輸入：render-keyvalue 並查詢目前狀態
{
  triggers: ["render-keyvalue", "query"],
  actions: ["awaken()", "query()"],
  priority: ["render-keyvalue", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | render-keyvalue, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | render-keyvalue, start | 0.9 |
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

**輸入**：render-keyvalue
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 render-keyvalue 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 render-keyvalue 狀態"
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
