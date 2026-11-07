---
name: render-docker
description: >-
  Builds and deploys Docker containers on Render—Dockerfiles, multi-stage
  builds, Blueprint Docker fields, private registries, layer caching, and
  platform constraints. Use when the user mentions Docker,
  Dockerfile, container images, multi-stage builds, container registry,
  GHCR, ECR, BuildKit, dockerContext, runtime docker or image, or
  optimizing Docker builds on Render.
license: MIT
compatibility: >-
  Any Render compute service (web, private, worker, cron) with runtime: docker
  or runtime: image.
metadata:
  author: Render
  version: "1.0.0"
  category: deployment
uuid: "96ac8945-d127-41b2-9dee-8d5d2307120d"
version: 1.0.0
timestamp: 1780748189000
evidence:
  protocol: "ISO-14064-1-compliant-emulation"
  verification: "Zero-Hallucination-Validated"
  source_origin: "infoone://skills/render-docker"
title: render-docker

---

1.0.0# Render Docker Deployments

Render uses **BuildKit** for Docker builds. All compute service types that support custom runtimes can use **`runtime: docker`** (build from a Dockerfile in the repo) or **`runtime: image`** (pull a prebuilt image; no Dockerfile build on Render). Deeper patterns and copy-paste templates live under `references/`.

## When to Use

- Authoring or debugging a **Dockerfile** for a Render service
- Choosing **`runtime: docker`** vs **`runtime: image`** in a Blueprint
- Wiring **private base images** or **prebuilt images** with registry credentials
- **Multi-stage builds**, **build args**, **secrets**, and **layer caching**
- **Performance** and **security** hardening of container images on Render

For full Blueprint authoring, see **render-blueprints**. For end-to-end deploy flows, see **render-deploy**.

## Render Docker Builds

- **BuildKit** is used for Docker builds on Render.
- **`runtime: docker`**: Render builds an image from your repo using `dockerfilePath`, `dockerContext`, and optional `dockerCommand` (overrides image `CMD`).
- **`runtime: image`**: Render pulls **`image.url`**; no repo-based image build. Pair with **`registryCredential`** when the registry is private.

## Blueprint Configuration

| Field | Role |
|-------|------|
| `dockerfilePath` | Path to the Dockerfile (default `./Dockerfile`) |
| `dockerContext` | Build context directory (what is sent to the daemon) |
| `dockerCommand` | Overrides the container `CMD` after the image is built |
| `image.url` | Image reference for `runtime: image` (registry/repo:tag or digest) |
| `registryCredential` | Auth for private pulls; often `fromRegistryCreds` → Dashboard-stored credential |

Example sketch (values illustrative):

```yaml
services:
  - type: web
    name: api
    runtime: docker
    region: oregon
    plan: starter
    dockerfilePath: ./Dockerfile
    dockerContext: .
    dockerCommand: node server.js
    envVars:
      - key: PORT
        value: 10000
```

For `runtime: image`, set `image.url` and, if needed, `registryCredential` per **Registry Configuration** below.

## Multi-Stage Builds

**Recommended for production.** Use a **builder** stage for compilation and dependency installation, and a minimal **runner** stage that only copies artifacts and runtime files. Benefits:

- Smaller images and faster pulls
- Fewer tools and secrets in the final image (smaller attack surface)
- Clear separation between build-time and run-time dependencies

See `references/dockerfile-patterns.md` for language-specific templates.

## Build Args vs Secrets

**Critical:** **Never pass secrets via `ARG`.** Build arguments are stored in image **layers** and can be recovered from the image history or intermediate layers.

- Prefer **runtime environment variables** (Render **env vars** / secret files) for application secrets.
- For **build-time** secrets (e.g. private package feeds), use **Docker BuildKit secret mounts** (`RUN --mount=type=secret,...`) rather than `ARG`.

Treat anything sensitive as **runtime** or **BuildKit secret mount**, not as a build arg.

## Registry Configuration

Private **base images** (for `runtime: docker`) or **prebuilt images** (`runtime: image`) need authentication:

- Store credentials in the Render Dashboard under **Registry Credentials**.
- In Blueprint, reference them with **`registryCredential.fromRegistryCreds.name`** (match the Dashboard name).

Supports common registries (Docker Hub, GHCR, ECR, Google Artifact Registry, and others). Step-by-step per provider: `references/registry-setup.md`.

**Prebuilt image services** do **not** auto-deploy when the tag moves in the registry; trigger a **manual redeploy** or use a **deploy hook** when you publish a new image.

## Layer Caching

- Render **caches Docker layers** between builds; **order Dockerfile instructions** so that frequently unchanged layers stay early (see `references/optimization-guide.md`).
- **Tags and caching:** mutable tags like **`latest`** can resolve to **stale cached** images. Prefer **immutable** references: **digest** (`repo/image@sha256:...`) or **version pins** (`v1.2.3`).

## Platform Specifics

- Render builds **linux/amd64**. Avoid assumptions about other architectures in production images.
- **Port binding** matches native services: bind HTTP to **`0.0.0.0:$PORT`** (Render sets `PORT`).
- **Health checks** behave like non-Docker web services (`healthCheckPath`, etc.).
- **Secret files** from Render appear under **`/etc/secrets/`** — do not rely on repo-root secret paths inside the container unless you copy or mount them explicitly in the image.

## `.dockerignore` and Start Commands

- Always maintain a **`.dockerignore`** that excludes **`node_modules`**, **`.git`**, **`.env`**, build artifacts, logs, and OS junk. This shrinks context upload time and avoids leaking local files into layers. Lists and rationale: `references/optimization-guide.md`.
- **Custom start command:** if you need multiple shell steps, use a single shell form, e.g. **`/bin/sh -c 'set -e; ./migrate && exec node server.js'`** (prefer **`exec`** so your app receives signals for graceful shutdown).

## References

| Document | Contents |
|----------|----------|
| `references/dockerfile-patterns.md` | Multi-stage templates (Node, Python, Go, Ruby, Rust, static sites) |
| `references/registry-setup.md` | Docker Hub, GHCR, ECR, Artifact Registry + Blueprint wiring |
| `references/optimization-guide.md` | Layer order, `.dockerignore`, BuildKit cache mounts, debugging |

## Related Skills

- **render-deploy** — Deploy flows, Blueprint vs Dashboard, operational steps
- **render-blueprints** — Full `render.yaml` schema, wiring, and validation
- **render-web-services** — Web service behavior, health checks, and HTTP edge cases


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| render-docker | auto | 觸發本技能 | 5.0 |
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
// 輸入：render-docker 並查詢目前狀態
{
  triggers: ["render-docker", "query"],
  actions: ["awaken()", "query()"],
  priority: ["render-docker", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | render-docker, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | render-docker, start | 0.9 |
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

**輸入**：render-docker
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 render-docker 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 render-docker 狀態"
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
