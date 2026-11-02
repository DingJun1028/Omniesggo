---
name: render-mcp
description: >-
  Connects and configures the Render MCP server for AI coding tools—setup per
  tool (Cursor, Claude Code, Codex), authentication, workspace selection, tool
  catalog, and troubleshooting. Use when MCP is not configured, list_services()
  fails, the user asks about Render MCP setup, or an action skill needs MCP
  but it's not connected yet.
  Trigger terms: MCP, Render MCP, list_services, MCP setup, MCP server,
  API key, Bearer token, mcp.render.com, workspace selection.
license: MIT
compatibility: Render MCP server (hosted at mcp.render.com)
metadata:
  author: Render
  version: "1.0.0"
  category: operations
uuid: "96d51ce2-c826-497f-bbb7-98a36efd0fb3"
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/render-mcp"
title: render-mcp

---

1.0.0# Render MCP Server

The Render MCP server lets AI coding tools manage Render services, databases, deploys, logs, and metrics directly. This skill covers **setup**, **authentication**, **workspace selection**, the **tool catalog**, and **troubleshooting**.

Action skills (render-deploy, render-debug, render-monitor) use MCP tools for their workflows. If MCP is not connected, set it up using this skill first.

## When to Use

- `list_services()` fails or MCP tools are unavailable
- First-time Render MCP setup for any AI tool
- User asks how to connect their AI tool to Render
- Switching workspaces or troubleshooting auth errors
- Discovering which MCP tools exist and what they do

## Connection Details

| Property | Value |
|----------|-------|
| URL | `https://mcp.render.com/mcp` |
| Transport | HTTP (streamable) |
| Auth | Bearer token (Render API key) |
| API key page | `https://dashboard.render.com/u/*/settings#api-keys` |
| Docs | `https://render.com/docs/mcp-server` |

## Setup by Tool

### Cursor

1. Get an API key from the [Render Dashboard](https://dashboard.render.com/u/*/settings#api-keys)

2. Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "render": {
      "url": "https://mcp.render.com/mcp",
      "headers": {
        "Authorization": "Bearer <YOUR_API_KEY>"
      }
    }
  }
}
```

3. Restart Cursor, then verify with `list_services()`

### Claude Code

1. Get an API key from the [Render Dashboard](https://dashboard.render.com/u/*/settings#api-keys)

2. Add the MCP server:

```bash
claude mcp add --transport http render https://mcp.render.com/mcp --header "Authorization: Bearer <YOUR_API_KEY>"
```

3. Restart Claude Code, then verify with `list_services()`

### Codex

1. Get an API key from the [Render Dashboard](https://dashboard.render.com/u/*/settings#api-keys)

2. Set the key in your shell:

```bash
export RENDER_API_KEY="<YOUR_API_KEY>"
```

3. Add the MCP server:

```bash
codex mcp add render --url https://mcp.render.com/mcp --bearer-token-env-var RENDER_API_KEY
```

4. Restart Codex, then verify with `list_services()`

### Other Tools

For tools not listed above, use the generic HTTP MCP configuration:

- **URL:** `https://mcp.render.com/mcp`
- **Auth header:** `Authorization: Bearer <YOUR_API_KEY>`
- **Transport:** HTTP (streamable HTTP, not SSE)

See [Render MCP docs](https://render.com/docs/mcp-server) for tool-specific instructions.

## Workspace Selection

After MCP is connected, set the active workspace:

```
Set my Render workspace to [WORKSPACE_NAME]
```

Or programmatically:

```
get_selected_workspace()   # Check current
list_workspaces()          # List available
```

All MCP operations run against the active workspace.

## Tool Catalog

### Service management

| Tool | Purpose |
|------|---------|
| `list_services()` | List all services and datastores |
| `get_service(serviceId)` | Get service details |
| `create_web_service(...)` | Create a web service from Git repo |
| `create_static_site(...)` | Create a static site from Git repo |
| `update_service(serviceId, ...)` | Update service configuration |
| `restart_service(serviceId)` | Restart a service |

### Deploys

| Tool | Purpose |
|------|---------|
| `list_deploys(serviceId, limit)` | List deploys for a service |
| `trigger_deploy(serviceId)` | Trigger a new deploy |

### Logs

| Tool | Purpose |
|------|---------|
| `list_logs(resource, level, type, text, statusCode, limit)` | Query logs with filters |

Key filters: `level` (error, warn, info), `type` (build, deploy), `text` (search string), `statusCode` (HTTP codes).

### Metrics

| Tool | Purpose |
|------|---------|
| `get_metrics(resourceId, metricTypes, ...)` | Get service or database metrics |

Metric types: `cpu_usage`, `memory_usage`, `cpu_limit`, `memory_limit`, `http_latency`, `http_request_count`, `active_connections`.

Optional: `httpLatencyQuantile` (0.5, 0.95, 0.99), `httpPath` (filter by endpoint).

### Databases

| Tool | Purpose |
|------|---------|
| `list_postgres_instances()` | List Postgres databases |
| `get_postgres(postgresId)` | Get database details |
| `query_render_postgres(postgresId, sql)` | Run SQL query |

### Key Value

| Tool | Purpose |
|------|---------|
| `list_key_value()` | List Key Value instances |
| `get_key_value(keyValueId)` | Get Key Value details |

### Environment Variables

| Tool | Purpose |
|------|---------|
| `update_environment_variables(serviceId, envVars)` | Set env vars on a service |

### Workspace

| Tool | Purpose |
|------|---------|
| `list_workspaces()` | List available workspaces |
| `get_selected_workspace()` | Get the active workspace |

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Wrong URL (using SSE endpoint) | Use `https://mcp.render.com/mcp` (not `/sse`) |
| Expired or invalid API key | Generate a new key from Dashboard > Account Settings > API Keys |
| Wrong workspace selected | Run `list_workspaces()` and switch to the correct one |
| Using MCP to create image-backed services | Not supported — use Dashboard or API for prebuilt Docker images |
| Missing `Bearer` prefix in auth header | Header must be `Authorization: Bearer <key>` |

## Troubleshooting

See `references/troubleshooting.md` for connection errors, auth failures, timeout issues, and tool-specific quirks.

## References

| Document | Contents |
|----------|----------|
| `references/troubleshooting.md` | Connection errors, auth failures, tool-specific issues, timeout handling |

## Related Skills

- **render-deploy** — Deploy flows using MCP tools
- **render-debug** — Debug failures using MCP logs and metrics
- **render-monitor** — Monitor health using MCP metrics
- **render-cli** — CLI alternative when MCP is unavailable


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| render-mcp | auto | 觸發本技能 | 5.0 |
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
// 輸入：render-mcp 並查詢目前狀態
{
  triggers: ["render-mcp", "query"],
  actions: ["awaken()", "query()"],
  priority: ["render-mcp", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | render-mcp, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | render-mcp, start | 0.9 |
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

**輸入**：render-mcp
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 render-mcp 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 render-mcp 狀態"
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
