---
name: oa-data-explorer
description: "Use when the user wants interactive data exploration via natural language queries against Supabase. Translates natural language to SQL/REST queries, executes them, and presents results. Load when user mentions data exploration, natural language query, or Supabase exploration."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [data, explorer, nlp, supabase, query, esggo]
    related_skills: [oa-summon, oa-supabase-query, oa-memory-shards]
---

# OA Data Explorer — 互動式資料探索器 v2

## Overview

自然語言查詢 Supabase 資料庫。將用戶問題轉為 SQL/REST 查詢，執行並呈現結果。支援 ESG 指標、審計日誌、用戶行為、報告數據探索。

## When to Use

- 用戶說「探索資料」、「自然語言查詢」、「資料分析」
- 需要快速回答資料問題而不寫 SQL

**Don't use for:** 批量資料修改、Schema 變更、固定報表

## Core Workflow

### Step 1: 解析自然語言

```typescript
// 用戶: "這季哪家公司碳排放最高？"
// 解析為：
{
  table: "esg_metrics",
  metric: "carbon_emission",
  period: "Q2 2026",
  aggregation: "max",
  groupBy: "company_id"
}
```

### Step 2: 執行查詢

```bash
# 透過 oa-supabase-query 執行
curl -X GET "$SUPABASE_URL/rest/v1/esg_metrics?metric=eq.carbon_emission&period=eq.Q2_2026&order=value.desc&limit=1" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY"
```

### Step 3: 格式化呈現

```markdown
## 查詢結果

**問題**: 這季哪家公司碳排放最高？

**答案**: 台積電 (2330.TW) — 1,250,000 tCO2e

**明細**:
| 公司 | 碳排放 | 佔比 |
|------|--------|------|
| 台積電 | 1,250,000 | 34.2% |
| 聯發科 | 480,000 | 13.1% |
| ... | ... | ... |

**資料來源**: esg_metrics, 更新於 2026-06-30
```

## Supported Query Types

| 類型 | 範例 |
|------|------|
| 聚合查詢 | "各產業平均碳強度" |
| 趨勢查詢 | "過去 4 季用水量趨勢" |
| 排名查詢 | "前 10 大再生能源使用率" |
| 關聯查詢 | "治理分數高的公司財報表現" |
| 合規查詢 | "缺少 GRI 303-5 揭露的公司" |

## Common Pitfalls

1. **查詢過大** — 自動加上 `limit 100` 防止超時
2. **模糊意圖** — 要求用戶澄清時間範圍、篩選條件
3. **敏感資料** — 自動過濾 PII、金鑰、內部 ID

## Verification Checklist

- [ ] 自然語言解析正確
- [ ] SQL/REST 查詢執行成功
- [ ] 結果格式化易讀
- [ ] 資料來源標註清楚
- [ ] 無敏感資料洩露