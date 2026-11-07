---
name: render-debug
description: Debug failed Render deployments by analyzing logs, metrics, and database state. Identifies errors (missing env vars, port binding, OOM, etc.) and suggests fixes. Use when deployments fail, services won't start, or users mention errors, logs, or debugging.
license: MIT
compatibility: Requires Render MCP tools or CLI
metadata:
  author: Render
  version: "1.1.0"
  category: debugging
uuid: "d8b3388e-d402-4873-806b-c2b82c9da747"
version: 1.1.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/render-debug"
title: render-debug

---

1.1.0# Debug Render Deployments

Analyze deployment failures using logs, metrics, and database queries. Identify root causes and apply fixes.

## When to Use This Skill

Activate this skill when:
- Deployment fails on Render
- Service won't start or keeps crashing
- User mentions errors, logs, or debugging
- Health checks are timing out
- Application errors in production
- Performance issues (slow responses)
- Database connection problems

## Prerequisites

**MCP tools (preferred):** Test with `list_services()` - provides structured data

**CLI (fallback):** `render --version` - use if MCP tools unavailable

**Authentication:** For MCP, use an API key (set in the MCP config or via the `RENDER_API_KEY` env var, depending on tool). For CLI, verify with `render whoami -o json`.

**Workspace:** `get_selected_workspace()` or `render workspace current -o json`

> **Note:** MCP tools require the Render MCP server. If unavailable, use the CLI for logs and deploy status; metrics and structured database queries require MCP.

## MCP Setup

If `list_services()` fails, set up the Render MCP server. For detailed per-tool walkthroughs, see **render-mcp**.

**Quick setup:** Add the Render MCP server to your AI tool's MCP config:
- **URL:** `https://mcp.render.com/mcp`
- **Auth header:** `Authorization: Bearer <YOUR_API_KEY>`
- **API key:** `https://dashboard.render.com/u/*/settings#api-keys`

After configuring, restart your tool and retry `list_services()`. Then set your workspace with `list_workspaces()` / `get_selected_workspace()`.

---

## Debugging Workflow

### Step 1: Identify Failed Service

```
list_services()
```

If MCP isn't configured, ask whether to set it up (preferred) or continue with CLI. Then proceed.

Look for services with failed status. Get details:

```
get_service(serviceId: "<id>")
```

### Step 2: Retrieve Logs

**Build/Deploy Logs (most failures):**
```
list_logs(resource: ["<service-id>"], type: ["build"], limit: 200)
```

**Runtime Error Logs:**
```
list_logs(resource: ["<service-id>"], level: ["error"], limit: 100)
```

**Search for Specific Errors:**
```
list_logs(resource: ["<service-id>"], text: ["KeyError", "ECONNREFUSED"], limit: 50)
```

**HTTP Error Logs:**
```
list_logs(resource: ["<service-id>"], statusCode: ["500", "502", "503"], limit: 50)
```

### Step 3: Analyze Error Patterns

Match log errors against known patterns:

| Error | Log Pattern | Common Fix |
|-------|-------------|------------|
| **MISSING_ENV_VAR** | `KeyError`, `not defined` | Add to render.yaml or `update_environment_variables` |
| **PORT_BINDING** | `EADDRINUSE` | Use `0.0.0.0:$PORT` |
| **MISSING_DEPENDENCY** | `Cannot find module` | Add to package.json/requirements.txt |
| **DATABASE_CONNECTION** | `ECONNREFUSED :5432` | Check DATABASE_URL, DB status |
| **HEALTH_CHECK** | `Health check timeout` | Add /health endpoint, check port binding |
| **OUT_OF_MEMORY** | `heap out of memory`, exit 137 | Optimize memory or upgrade plan |
| **BUILD_FAILURE** | `Command failed` | Fix build command or dependencies |

Full error catalog: [references/error-patterns.md](references/error-patterns.md)

**If errors repeat across deploys:** Switch from incremental fixes to a broader sweep. Scan the codebase/config for all likely causes in that error class (related env vars, build config, dependencies, or type errors) and address them together before the next redeploy.

### Step 4: Check Metrics (Performance Issues)

For crashes, slow responses, or resource issues:

```
get_metrics(
  resourceId: "<service-id>",
  metricTypes: ["cpu_usage", "memory_usage", "memory_limit"]
)
```

```
get_metrics(
  resourceId: "<service-id>",
  metricTypes: ["http_latency"],
  httpLatencyQuantile: 0.95
)
```

Detailed metrics guide: [references/metrics-debugging.md](references/metrics-debugging.md)

### Step 5: Debug Database Issues

For database-related errors:

```
# Check database status
list_postgres_instances()

# Check connections
get_metrics(resourceId: "<postgres-id>", metricTypes: ["active_connections"])

# Query directly
query_render_postgres(
  postgresId: "<postgres-id>",
  sql: "SELECT state, count(*) FROM pg_stat_activity GROUP BY state"
)
```

Detailed database guide: [references/database-debugging.md](references/database-debugging.md)

### Step 6: Apply Fix

**For environment variables:**
```
update_environment_variables(
  serviceId: "<service-id>",
  envVars: [{"key": "MISSING_VAR", "value": "value"}]
)
```

**For code changes:**
1. Edit the source file
2. Commit and push
3. Deploy triggers automatically (if auto-deploy enabled)

### Step 7: Verify Fix

```
# Check deploy status
list_deploys(serviceId: "<service-id>", limit: 1)

# Check for new errors
list_logs(resource: ["<service-id>"], level: ["error"], limit: 20)

# Check metrics
get_metrics(resourceId: "<service-id>", metricTypes: ["http_request_count"])
```

---

## Quick Workflows

Pre-built debugging sequences for common scenarios:

| Scenario | Workflow |
|----------|----------|
| Deploy failed | `list_deploys` → `list_logs(type: build)` → fix → redeploy |
| App crashing | `list_logs(level: error)` → `get_metrics(memory)` → fix |
| App slow | `get_metrics(http_latency)` → `get_metrics(cpu)` → `query_postgres` |
| DB connection | `list_postgres` → `get_metrics(connections)` → `query_postgres` |
| Post-deploy check | `list_deploys` → `list_logs(error)` → `get_metrics` |

Detailed workflows: [references/quick-workflows.md](references/quick-workflows.md)

---

## Quick Reference

### MCP Tools

```
# Service Discovery
list_services()
get_service(serviceId: "<id>")
list_postgres_instances()

# Logs
list_logs(resource: ["<id>"], level: ["error"], limit: 100)
list_logs(resource: ["<id>"], type: ["build"], limit: 200)
list_logs(resource: ["<id>"], text: ["search"], limit: 50)

# Metrics
get_metrics(resourceId: "<id>", metricTypes: ["cpu_usage", "memory_usage"])
get_metrics(resourceId: "<id>", metricTypes: ["http_latency"], httpLatencyQuantile: 0.95)

# Database
query_render_postgres(postgresId: "<id>", sql: "SELECT ...")

# Deployments
list_deploys(serviceId: "<id>", limit: 5)

# Environment Variables
update_environment_variables(serviceId: "<id>", envVars: [{key, value}])
```

### CLI Commands (Fallback)

```bash
render services -o json
render logs -r <service-id> --level error -o json
render logs -r <service-id> --tail -o text
render deploys create <service-id> --wait
```

---

## References

- **Error patterns:** [references/error-patterns.md](references/error-patterns.md)
- **Metrics debugging:** [references/metrics-debugging.md](references/metrics-debugging.md)
- **Database debugging:** [references/database-debugging.md](references/database-debugging.md)
- **Quick workflows:** [references/quick-workflows.md](references/quick-workflows.md)
- **Log analysis:** [references/log-analysis.md](references/log-analysis.md)
- **Troubleshooting:** [references/troubleshooting.md](references/troubleshooting.md)

## Related Skills

- **render-deploy** — Deploy new applications to Render
- **render-monitor** — Ongoing service health monitoring
- **render-mcp** — MCP server setup and tool catalog


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| render-debug | auto | 觸發本技能 | 5.0 |
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
// 輸入：render-debug 並查詢目前狀態
{
  triggers: ["render-debug", "query"],
  actions: ["awaken()", "query()"],
  priority: ["render-debug", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | render-debug, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | render-debug, start | 0.9 |
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

**輸入**：render-debug
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 render-debug 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 render-debug 狀態"
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
