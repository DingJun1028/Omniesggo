---
name: oa-supabase-query
description: "Use when the user needs to query or inspect the Supabase database. Executes REST API calls against the Supabase Data API to fetch ESG metrics, audit records, user data, or any database table. Use for data inspection, debugging, and verification — NOT for bulk data modification."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [supabase, query, database, rest-api, esggo]
    related_skills: [oa-summon, oa-5t-enforcer, oa-memory-shards]
---

# OA Supabase Query — Supabase 資料查詢器 v2

## Overview

透過 Supabase REST API 查詢資料庫。用於資料檢查、除錯、驗證。嚴禁用於大量資料修改。

## When to Use

- 用戶說「查詢資料」、「查資料庫」、「Supabase 查詢」
- 驗證報告數據來源
- 除錯資料不一致

**Don't use for:** 大量寫入、Schema 變更、Migration

## Core Workflow

### Step 1: 環境變數檢查

```bash
# 必要環境變數
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
```

### Step 2: 執行查詢

```bash
# 範例：查詢 ESG 指標
curl -X GET "$SUPABASE_URL/rest/v1/esg_metrics?company_id=eq.<id>&select=*" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"

# 範例：查詢審計日誌
curl -X GET "$SUPABASE_URL/rest/v1/audit_logs?order=created_at.desc&limit=50" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### Step 3: 格式化輸出

```json
{
  "table": "esg_metrics",
  "count": 42,
  "data": [...],
  "queried_at": "2026-07-01T00:00:00Z"
}
```

## Common Queries

| 用途 | 端點 | 篩選條件 |
|------|------|----------|
| ESG 指標 | `/esg_metrics` | `company_id=eq.<id>` |
| 審計日誌 | `/audit_logs` | `order=created_at.desc` |
| 用戶資料 | `/users` | `email=eq.<email>` |
| 報告記錄 | `/reports` | `status=eq.completed` |
| 記憶碎片 | `/memory_shards` | `skill_id=eq.<id>` |

## Common Pitfalls

1. **使用 anon key** — 查詢敏感資料必須用 service_role_key
2. **未分頁** — 大量資料必須加 `limit` 和 `offset`
3. **暴露金鑰** — 輸出中勿包含 API 金鑰
4. **寫入操作** — 本技能僅供查詢，寫入請用 Supabase Dashboard 或 Migration

## Verification Checklist

- [ ] 環境變數正確
- [ ] 查詢語法正確
- [ ] 結果格式化完整
- [ ] 未洩露敏感資訊
- [ ] 僅執行 SELECT 操作