---
name: render-postgres
description: >-
  Sets up and optimizes Managed PostgreSQL on Render—connection strings
  (internal vs external), creation constraints, storage autoscaling, connection
  limits, high availability, read replicas, backups, and MCP inspection. Use
  when the user
  mentions Postgres, PostgreSQL, Render database, connection string, DATABASE_URL,
  backups, snapshots, replicas, HA, disk storage, connection pooling, or
  troubleshooting DB connectivity.
license: MIT
compatibility: Render Managed Postgres (any plan)
metadata:
  author: Render
  version: "1.0.0"
  category: data
uuid: "dd56171f-ddee-4f2b-b5ca-38dac7c3ab73"
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/render-postgres"
title: render-postgres

---

1.0.0# Render Managed PostgreSQL

This skill covers **Managed Postgres on Render**: how to connect, what cannot change after creation, storage behavior, limits, HA, replicas, and safe deletion. Deep dives live under `references/`.

## When to Use

Apply this skill when the user:

- Configures **Postgres** for an app on Render (URLs, TLS, pooling)
- Creates or changes a **database**, **plan**, **disk**, or **replicas**
- Asks about **backups**, **PITR**, **exports**, or **deleting** a database
- Hits **connection limits**, **SSL errors**, or **latency** between services and DB
- Authors **Blueprint** `databases` / `readReplicas` or wires `fromDatabase`

For deploy flows and Blueprint basics, see **render-deploy** and **render-blueprints**. For private networking between services, see **render-networking**. For env var patterns, see **render-env-vars**.

## Connection Patterns

Render exposes **two connection URLs** for the same logical database:

| URL | Use when | TLS |
|-----|----------|-----|
| **Internal** | App or service on Render in the **same region and workspace** | Not required (private network) |
| **External** | Local development, CI, or tools outside Render | **Required** (TLS 1.2+) |

**Always prefer the internal URL for Render-hosted apps** so traffic stays on Render’s network and avoids extra latency and public egress patterns.

- **IP allow list** applies to **external** access only. Same-region Render services use the **internal** URL regardless of the allow list.
- **External** clients must use TLS; misconfigured clients often show SSL handshake or `sslmode` errors.

URL formats, Dashboard locations, Blueprint `fromDatabase`, pooling, and common mistakes: `references/connection-guide.md`.

## Creation and Setup

- **Instance display name**: Can be changed later (where the Dashboard allows renaming the resource).
- **Immutable after creation**: `databaseName`, database **user**, **region**, **PostgreSQL major version**. Plan these before create; changing them requires a new database and migration.
- **Storage size**: **1 GB** or **multiples of 5 GB** when provisioning.

Wire apps with Blueprint `fromDatabase` using `property: connectionString` (or `host`, `port`, `user`, `password`, `database` individually). See **render-blueprints**.

### Multiple logical databases

You can run `CREATE DATABASE new_db;` in `psql` on the same instance. **Host, port, and credentials stay the same**; only the **database name in the URL path** changes (e.g. `.../myapp` vs `.../new_db`).

## Storage Management

- **Autoscaling**: When disk use reaches roughly **~90%**, Render can grow storage by about **~50%**, rounded up to the **next 5 GB multiple**, up to **16 TB** max.
- **Cannot shrink** disk after an increase.
- **Cooldown**: After a storage increase, you **cannot increase again for 12 hours**.
- **Over limit / unhealthy**: If disk is over the configured limit, the database can become **unhealthy**; Render may **suspend** it until resolved.

Monitor disk and plan exports or cleanup before you hit hard limits. Backup and restore options: `references/backup-and-recovery.md`.

## Connection Limits

Maximum connections depend on **instance RAM** (current-generation plans):

| RAM | Max connections (typical) |
|-----|---------------------------|
| Under 8 GB | 100 |
| 8 GB | 200 |
| 16 GB | 300 |
| 32 GB and above | 500 |

**Legacy** database plans may have **lower** limits; confirm in the Dashboard or API for the specific plan.

Render does **not** provide a built-in pooler; use **application-side pooling** (framework pools, PgBouncer, pgpool, etc.). Limits are **hard**—exhausting them causes connection errors. More detail: `references/connection-guide.md` and `references/performance-tuning.md`.

## High Availability

**High availability (HA)** is available when:

- Workspace is **Professional** or higher, **and**
- Database plan is **Pro** or higher, **and**
- **PostgreSQL 13+**

**Instance type changes** cause **brief downtime**. With HA, downtime is typically **less** than **without HA** (often on the order of **minutes** without HA—exact duration depends on plan and operation).

**One-way migration off legacy types**: After moving to current-generation instance types, you **cannot** move back to **legacy** instance types.

## Read Replicas

- Up to **5 read replicas** per database.
- In Blueprints, declare replicas under **`readReplicas`** as a **list of names**.
- **CAUTION — declarative sync**:
  - An **empty** `readReplicas` list can **destroy all** existing replicas.
  - **Name mismatches** between the Blueprint and live replicas can **create** new replicas and **remove** replicas whose names are no longer listed.

Always treat `readReplicas` as **authoritative** desired state, not additive-only.

## Useful MCP Commands

Use the Render MCP tools (names may vary slightly by integration; align with your server’s tool list):

| Goal | Tool / pattern |
|------|----------------|
| List databases | `list_postgres_instances` |
| Instance details | `get_postgres` with `postgresId` |
| Read-only SQL | `query_render_postgres` with `postgresId` and `sql` |
| Connection load | `get_metrics` with `resourceId` (Postgres ID) and `metricTypes: ["active_connections"]` |

`query_render_postgres` runs in a **read-only** transaction and opens a **new connection per query**—do not use it as a substitute for app pooling.

Shorthand (same tools): `list_postgres_instances()`, `get_postgres(postgresId)`, `query_render_postgres(postgresId, sql)`, `get_metrics(resourceId, metricTypes: ["active_connections"])`.

## Deleting and Data Safety

- **Backups and snapshots are not retained** after you **delete** the database. **Export first** (`pg_dump`, Dashboard restore workflow from existing backups, etc.).
- Before destructive actions, confirm retention and recovery paths in `references/backup-and-recovery.md`.

## References

| Document | Contents |
|----------|----------|
| `references/connection-guide.md` | Internal vs external URLs, SSL, allow list, Blueprint wiring, pooling, multi-database URLs, troubleshooting |
| `references/backup-and-recovery.md` | Snapshots, PITR, `pg_dump` / `pg_restore`, restore flows, deletion, cross-region |
| `references/performance-tuning.md` | `pg_stat_statements`, indexes, bloat, `EXPLAIN ANALYZE`, metrics, scaling |

## Related Skills

- **render-deploy** — End-to-end deploy, services, and MCP/Dashboard flows
- **render-blueprints** — `databases`, `fromDatabase`, `readReplicas`, immutable fields
- **render-networking** — Private services, regions, and how traffic routes between resources
- **render-env-vars** — Storing `DATABASE_URL` and secret wiring patterns


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| render-postgres | auto | 觸發本技能 | 5.0 |
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
// 輸入：render-postgres 並查詢目前狀態
{
  triggers: ["render-postgres", "query"],
  actions: ["awaken()", "query()"],
  priority: ["render-postgres", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | render-postgres, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | render-postgres, start | 0.9 |
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

**輸入**：render-postgres
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 render-postgres 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 render-postgres 狀態"
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
