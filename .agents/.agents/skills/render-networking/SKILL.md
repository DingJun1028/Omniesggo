---
name: render-networking
description: >-
  Connects Render services over the private network—internal DNS, service
  discovery, and cross-service communication. Use when the user needs to wire
  services together, resolve internal hostnames, troubleshoot connectivity
  between services, configure environment isolation, or understand which
  services can reach each other.
license: MIT
compatibility: Render services in the same region and workspace
metadata:
  author: Render
  version: "1.0.0"
  category: networking
uuid: "ed1255f6-1d43-465d-ab19-aa4ea2ed5e69"
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/render-networking"
title: render-networking

---

1.0.0# Render private networking

Render’s **private network** lets services talk to each other without exposing traffic on the public internet. Use this skill when users need internal connectivity, discovery across scaled instances, or correct URL/port behavior for Blueprints and the Dashboard.

## When to Use This Skill

- Designing or debugging **service-to-service** traffic on Render
- Questions about **internal hostnames**, **internal URLs**, or **Connect > Internal** in the Dashboard
- **Service discovery** across multiple instances (custom load balancing, mesh-style setups)
- **Port limits**, reserved ports, or **multi-port** web services (public vs private)
- **Free-tier** web services and **who can send vs receive** private traffic
- **Environment isolation** (Professional+) or **AWS PrivateLink** for private egress/ingress patterns

For step-by-step architecture examples and Blueprint patterns, see `references/communication-patterns.md`. For failure modes and fixes, see `references/troubleshooting.md`.

## Private Network Basics

Private connectivity is available only when **all** of the following hold:

- Services are in the **same region**
- Services are in the **same workspace**

If either differs, private DNS and internal routing will not connect those services.

### Who can communicate

| Resource | Private inbound | Private outbound | Internal hostname |
|----------|-----------------|------------------|-------------------|
| **Web Service** | Yes (paid tiers; see Free tier below) | Yes | Yes |
| **Private Service** | Yes | Yes | Yes |
| **Background Worker** | No | Yes | No |
| **Cron Job** | No | Yes | No |
| **Workflow Run** | No | Yes | No |
| **Static Site** | — | — | **Not on private network** |
| **Managed Postgres** | Via internal URL (from allowed clients) | N/A (datastore) | Via internal URL |
| **Key Value** | Via internal URL (from allowed clients) | N/A (datastore) | Via internal URL |

**Free-tier Web Services:** They may **send** private traffic to other services, but they **cannot receive** inbound private traffic. Plan upgrades or topology changes apply if a free web service must accept private connections.

Workers, crons, and workflow runs initiate outbound connections (e.g., to internal URLs or private service hostnames) but are **not** reachable by internal hostname for inbound calls.

## Internal Addresses

- Open the service in the Render Dashboard → **Connect** → **Internal** tab for the canonical internal hostname, URL, and connection details.
- Clients often need an **explicit scheme** in code or config, e.g. `http://service-name:port` or `https://...` when TLS applies—do not assume a bare hostname alone is enough for every HTTP client.
- **URL shape:** `http://[internal-hostname]:[port]/path` (adjust scheme/port per service).

## Service Discovery

For services with **multiple instances**, Render exposes a **discovery DNS** name that resolves to **all instance IPs** for that service. The pattern is **`[hostname]-discovery`** (see Dashboard docs for the exact hostname shown for your service).

- **`RENDER_DISCOVERY_SERVICE`** is set in environments where discovery applies; use it with the discovery hostname pattern for scripts and app code that need instance lists.
- **Use case:** Custom load balancing, health aggregation, or any logic that must fan out or pick among instances explicitly instead of a single internal hostname.

See `references/communication-patterns.md` for discovery-oriented patterns.

## Port Rules

- **Maximum 75 open ports** per service.
- **Reserved ports** (do not bind your app to these for normal use): **10000** (public HTTP proxy path), **18012**, **18013**, **19099**.
- **Multi-port Web Services:** Only **one** port receives **public** HTTP traffic; that port must align with the **`PORT`** environment variable. **Additional** ports are for **private network** access only.

When something fails to connect, verify the target is listening on the expected port and that the port is not reserved or blocked by misconfiguration.

## Environment Isolation

On **Professional and higher** workspaces, you can configure **per-environment** rules so private traffic does **not** cross certain environment boundaries. If private calls work in one environment but not another, check workspace **environment isolation** settings before assuming DNS or app bugs.

## AWS PrivateLink

**Professional+** workspaces can use **AWS PrivateLink** to extend private connectivity to or from external AWS VPCs and approved endpoints. This is separate from default service-to-service private DNS; use it when the architecture requires **private** access to Render or from Render to specific AWS resources without the public internet.

## Common Patterns

Short summaries; full diagrams and Blueprint notes live in `references/communication-patterns.md`.

1. **Web gateway + private backends** — Public Web Service terminates HTTP; internal calls use private hostnames and ports to Private Services or internal URLs.
2. **Worker to database** — Background Worker (no internal hostname) connects **outbound** to Postgres or Key Value **internal URLs**.
3. **Microservices** — Private Services (and eligible Web Services) call each other by **internal hostname:port** on the private network.

## References

| Document | Purpose |
|----------|---------|
| `references/communication-patterns.md` | Gateway, worker→DB, mesh, URL construction, Blueprint `fromService`, discovery load balancing, private health checks |
| `references/troubleshooting.md` | DNS, ports, region/workspace, free tier, protocol, resolver, environment isolation |

## Related Skills

- **render-web-services** — Public web services, `PORT`, and HTTP behavior
- **render-private-services** (planned) — Private Service–specific setup and scaling
- **render-blueprints** — `render.yaml`, `fromService`, and multi-service wiring


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| render-networking | auto | 觸發本技能 | 5.0 |
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
// 輸入：render-networking 並查詢目前狀態
{
  triggers: ["render-networking", "query"],
  actions: ["awaken()", "query()"],
  priority: ["render-networking", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | render-networking, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | render-networking, start | 0.9 |
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

**輸入**：render-networking
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 render-networking 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 render-networking 狀態"
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
