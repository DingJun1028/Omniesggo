---
source_origin: oa-knowledge-avatar
created: 2026-08-29
modified: 2026-08-29
co_authors: [oa-team, hermes]
lifecycle: active
access: public-research
tags: [cloudflare, cache, debugging, d1, worker]
related: [[WebsiteGapAudit]] [[OracleAlwaysFreeResearch]]
---

# Cloudflare 快取 404 陷阱 · 知識分身

> 檔案已上傳 GitHub Pages 卻仍 404？可能是 Cloudflare 邊緣快取了舊的 404 回應。

## 症狀
- `curl https://domain/og-image.svg` → `404`（content-type: text/html）
- 但帶 cache-bust `?v=2` → `200`（image/svg+xml）
- 回應頭含 `cf-cache-status: HIT` + `x-github-request-id`（來自 GitHub Pages）

## 根因
Cloudflare 在檔案存在**之前**就收到請求並快取了 404 回應（預設 Cache Everything 或 Edge Cache TTL）。之後檔案上傳了，但邊緣節點仍回舊 404。

## 解決（5T Transparent 驗證閉環）
1. 確認源站真的有檔：`curl 'https://domain/file?v=2'` 得 200 → 源站 OK，是快取問題
2. 清 Cloudflare 快取（需 Zone 權限，非 DNS-only token）：
   - API Key 認證：`X-Auth-Email` + `X-Auth-Key`（非 Bearer）
   - `POST /zones/{zone}/purge_cache` body `{"files":["https://domain/file"]}`
   - 帳號全域 Key 在 `secret-vault/cloudflare_global_key.env`（CF_KEY=cfk_...）
3. 清後再驗證 → 200

## 預防
- 部署新靜態資源後主動 purge 該檔案
- 或設 Page Rule / Cache Rule 對 `/public-assets/*` 設 `Cache Level: Bypass` 開發期

## 關聯
- [[WebsiteGapAudit]] — og-image.svg 404 即此陷阱
- [[OracleAlwaysFreeResearch]] — VPS/Worker 部署鏈路
