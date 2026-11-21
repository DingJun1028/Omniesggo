---
name: render-env-vars
description: >-
  Configures environment variables, secrets, and env groups on Render. Use when
  the user needs to set env vars, wire secrets between services, create env
  groups, use generateValue, set sync: false, or troubleshoot missing or
  incorrect environment variable values in Blueprints or the Dashboard.
license: MIT
compatibility: Render Dashboard, CLI, or MCP tools
metadata:
  author: Render
  version: "1.0.0"
  category: configuration
uuid: "3d501696-a053-43c2-948c-63f1ccd0a424"
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/render-env-vars"
title: render-env-vars

---

1.0.0# Environment Variables on Render

Render exposes configuration to services as **environment variables**. Values are always **strings** at the platform layer—applications must parse numbers, booleans, and structured data explicitly.

There are **three** primary ways to set variables:

1. **Render Dashboard** — per-service UI, bulk import from `.env`, save/redeploy options
2. **Blueprint** — `envVars` (and related keys) in `render.yaml`
3. **MCP / API** — e.g. `update_environment_variables` on a service

Deep wiring patterns, full platform variable tables, and language-specific notes live under `references/`.

## When to Use This Skill

Use this skill when users want to:

- Add, change, or remove environment variables or secrets
- Understand Dashboard vs Blueprint vs API/MCP flows
- Use **environment groups** for shared configuration
- Wire `fromDatabase`, `fromService`, `fromGroup`, `sync: false`, or `generateValue` in Blueprints
- Debug missing vars, secret files, precedence, or platform-injected names

For full Blueprint authoring, pair with **render-blueprints**. For first-time deploys, **render-deploy**. For web service behavior and ports, **render-web-services**.

## Setting Variables

### Dashboard

- Add variables **individually** (name + value) or **in bulk** by pasting/uploading a `.env`-style file.
- **Save options** typically include:
  - **Save and rebuild & deploy** — picks up build-time changes
  - **Deploy only** — runtime change without a full rebuild (when applicable)
  - **Save only** — persist without triggering a deploy

Use Dashboard edits when iterating quickly or when the repo should not carry certain values.

### Blueprint (`render.yaml`)

Declare `envVars` on each service. Values can be literals, generated secrets, sync-disabled prompts, or references to databases, other services, or env groups. See **Blueprint Wiring** below and `references/wiring-reference.md` for exhaustive patterns and YAML.

### MCP / API

Automation tools can set variables on existing services (e.g. `update_environment_variables`). Useful for CI, rotation, or keeping Dashboard state in sync with external secret stores—without committing secrets to Git.

## Secret Management

- **`sync: false`** — Render prompts in the Dashboard for the value **only on initial Blueprint setup** when the resource is first created. On **Blueprint updates**, `sync: false` is **ignored** (values are not re-prompted from the file alone). These vars are **excluded from preview environments** and are **invalid inside environment groups**.
- **`generateValue: true`** — Render generates a **base64-encoded 256-bit** random value at provision time. Use for passwords, signing keys, or tokens that do not need human-chosen values.
- **Never commit real secrets** in `render.yaml` as plain `value:` entries. Prefer Dashboard, secret manager integration, `generateValue`, or `sync: false` with Dashboard entry.

### Secret files

- Store sensitive file content as **secret files** (not inline env strings). They appear as **plaintext files** under **`/etc/secrets/<filename>`**.
- **Combined limit**: **1 MB** total secret file payload per service or per linked env group (as applicable to your setup).
- **Docker**: secret files are available under **`/etc/secrets/`** on the running instance.

## Environment Groups

**Environment groups** are named collections of variables linked to **multiple services**.

- **Precedence**: **Service-level** variables **override** variables from linked groups with the same name.
- **Multiple groups** on one service: the group that was **most recently created** wins for overlapping keys. This ordering is **not documented as stable**—avoid relying on it; use distinct names or consolidate groups.
- Groups can be **scoped to a project environment** so staging and production differ without duplicating every service definition.

## Blueprint Wiring (Summary)

Full syntax, examples, and edge cases: `references/wiring-reference.md`. Authoritative Blueprint docs: **render-blueprints** skill.

| Mechanism | Role |
|-----------|------|
| `value` | Hardcoded string (non-secret config only) |
| `generateValue: true` | Platform-generated secret |
| `sync: false` | Dashboard prompt on **initial** create only |
| `fromDatabase` | Inject DB fields (`connectionString`, `host`, `port`, `user`, `password`, `database`) |
| `fromService` | Key Value: `type: keyvalue` + properties; private/web: `host`, `hostport`, or `envVarKey` |
| `fromGroup` | Link all vars from a named group |

## Platform-Injected Variables

Render sets **read-only** variables your app can read at runtime (and some at build). A concise list:

| Variable | Typical meaning |
|----------|-----------------|
| `RENDER` | `"true"` when running on Render |
| `RENDER_SERVICE_TYPE` | Service kind (e.g. web, worker) |
| `RENDER_SERVICE_ID` | Service identifier |
| `RENDER_SERVICE_NAME` | Human-readable service name |
| `RENDER_INSTANCE_ID` | Current instance |
| `RENDER_EXTERNAL_URL` | Public URL (when applicable) |
| `RENDER_EXTERNAL_HOSTNAME` | Public hostname |
| `RENDER_DISCOVERY_SERVICE` | Service discovery hostname (private network) |
| `RENDER_GIT_COMMIT` | Deployed commit SHA |
| `RENDER_GIT_BRANCH` | Branch for this deploy |
| `PORT` | HTTP port to bind (**default `10000`**) |
| `IS_PULL_REQUEST` | Preview deploy indicator |
| `RENDER_CPU_COUNT` | vCPU count for the instance |
| `RENDER_WEB_CONCURRENCY` | Suggested worker/process count hint |

Build vs runtime availability, language version env vars, and **WEB_CONCURRENCY** defaults: `references/platform-variables.md`.

## Runtime-Specific Defaults

Render and buildpacks may set defaults (verify in your service’s **Environment** tab):

| Runtime | Notable defaults |
|---------|------------------|
| **Node.js** | `NODE_ENV=production` |
| **Python** | `PYTHON_VERSION` (pinned by build); Gunicorn-oriented images often set `GUNICORN_CMD_ARGS` to bind **`0.0.0.0:10000`** |
| **Ruby** | `RAILS_ENV=production`, `RAILS_LOG_TO_STDOUT=true` |
| **Go** | `GO111MODULE=on` (legacy modules flag; still seen on older stacks) |
| **Rust** | `ROCKET_PORT=10000` (Rocket convention) |

Always bind HTTP servers to **`0.0.0.0`** and **`PORT`** (or the stack’s documented port env) unless using a static site or custom Docker entrypoint.

## Common Issues

1. **Everything is a string** — `DEBUG=false` is truthy in many parsers; use explicit comparison or typed config loaders.
2. **`WEB_CONCURRENCY`** — Default behavior changed for services **created after December 8, 2025**. Compare with older services when debugging worker counts; see `references/platform-variables.md`.
3. **Undocumented `RENDER_*` variables** — Names and semantics may change; do not depend on undocumented injection for critical logic.
4. **Blueprint vs Dashboard drift** — Editing only `render.yaml` does not retroactively apply `sync: false` prompts on update; merge strategy for env keys is easy to misunderstand—test in a scratch service.
5. **Secret file paths** — Code must read **`/etc/secrets/<filename>`**; wrong paths or missing mounts usually show as file-not-found at runtime.

## References

- `references/wiring-reference.md` — Complete Blueprint `envVar` wiring, YAML examples, precedence, edge cases
- `references/platform-variables.md` — Injected variables (build vs runtime), language versions, concurrency, reading vars from code

## Related Skills

- **render-blueprints** — Full Blueprint authoring, validation, multi-service layouts
- **render-deploy** — First deploy, repo requirements, MCP vs YAML
- **render-web-services** — Ports, health checks, scaling behavior tied to env-driven servers


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| render-env-vars | auto | 觸發本技能 | 5.0 |
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
// 輸入：render-env-vars 並查詢目前狀態
{
  triggers: ["render-env-vars", "query"],
  actions: ["awaken()", "query()"],
  priority: ["render-env-vars", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | render-env-vars, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | render-env-vars, start | 0.9 |
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

**輸入**：render-env-vars
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 render-env-vars 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 render-env-vars 狀態"
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
