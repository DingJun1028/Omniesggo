---
source_origin: oa-knowledge-avatar
created: 2026-08-29
modified: 2026-08-29
co_authors: [oa-team, hermes]
lifecycle: active
access: public-research
tags: [cloudflare, cache, debugging, d1, worker]
related: [[WebsiteGapAudit]] [[FTGJourneyAppArchitecture]]
---

# Cloudflare 快取 404 陷阱 · 知識分身

> 部署新資源（如 og-image.svg）後線上仍 404，實際是 Cloudflare 邊緣快取了舊的 404 回應。實戰診斷法。

## 症狀
- GitHub Pages 檔案實際已上線（`curl .../og-image.svg?v=2` → 200）
- 但標準網址回 404 + `cf-cache-status: HIT`（命中舊快取）
- `x-github-request-id` 出現（源站是 GitHub Pages，非 Cloudflare 源）

## 診斷步驟（5T Traceable）
```bash
# 1. 帶 cache-bust query 驗證源站是否有檔
curl -s -o /dev/null -w "%{http_code}" "https://ftgtours.esggo.co/og-image.svg?v=2"
# → 200 表示檔在，只是快取舊

# 2. 查回應頭確認快取命中
curl -s -I "https://ftgtours.esggo.co/og-image.svg" | grep -iE "cf-cache-status|x-github"
# → cf-cache-status: HIT + x-github-request-id 出現

# 3. 清 Cloudflare 快取（用全域 API Key，非 Bearer）
curl -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE/purge_cache" \
  -H "X-Auth-Email: $CF_EMAIL" -H "X-Auth-Key: $CF_KEY" \
  -H "Content-Type: application/json" \
  -d '{"files":["https://ftgtours.esggo.co/og-image.svg"]}'
# → {"success":true}
```

## 關鍵知識
- Cloudflare API：**全域 API Key** 用 `X-Auth-Email` + `X-Auth-Key` header（不是 `Bearer $TOKEN`）
- Bearer token 若報 `code:10000 Authentication error` → 改用全域 Key
- Zone ID：`8dda3653e490290412f7be84a84e0dc9`（ftgtours.esggo.co）
- Account ID：`d9d7ecd92cbad6d858fba3e529b9cb7b`

## 反模式（避免）
- ⚠️ 用 DNS token（`cfut_...`）清快取 → 權限不足 code:9109
- ⚠️ 用 `cfk_...` 當 Bearer → 401/10000

## 關聯
- [[WebsiteGapAudit]] — og-image 是這次補齊的資源之一
- [[FTGJourneyAppArchitecture]] — 子域部署同套 Cloudflare 邏輯
