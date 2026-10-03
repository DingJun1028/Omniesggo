---
name: oa-memory-shards
description: "Use when the user wants to manage, query, or inspect the OmniMemory Shards system. Handles memory shard extraction (from conversations, error logs, code reviews, web crawls), skill ultimate synthesis, shard relation management, and shard usage tracking. Load when user mentions memory shards, skill ultimates, or knowledge extraction."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [memory, shards, knowledge, synthesis, esggo]
    related_skills: [oa-summon, oa-5t-enforcer, oa-supabase-query, oa-agent-trainer]
---

# OA Memory Shards — 記憶碎片系統 v2

## Overview

管理 OmniMemory Shards 系統：從對話、錯誤日誌、代碼審查、網頁爬蟲提取記憶碎片；技能終極合成；碎片關係管理；使用追蹤。

## When to Use

- 用戶說「記憶碎片」、「技能終極」、「知識提取」
- 需要將經驗固化為可重用知識

**Don't use for:** 一般資料庫查詢（用 `oa-supabase-query`）

## Core Concepts

| 概念 | 說明 |
|------|------|
| **Shard** | 最小知識單元：錯誤修復、最佳實踐、架構決策、Bug 根因 |
| **Ultimate** | 技能的最高級形態：融合所有相關 shards 的完整知識體 |
| **Relation** | Shard 間關係：因果、依賴、互斥、推廣 |

## Core Workflow

### Step 1: 提取碎片

```bash
# 從對話提取
node scripts/extract-shards.js --source=conversation --session=<id>

# 從錯誤日誌提取
node scripts/extract-shards.js --source=error-log --path=logs/

# 從代碼審查提取
node scripts/extract-shards.js --source=code-review --pr=<number>
```

### Step 2: 合成技能終極

```bash
node scripts/synthesize-ultimate.js --skill=oa-page-builder
```

### Step 3: 管理關係

```bash
# 建立關係
node scripts/shard-relation.js --from=<shard_id> --to=<shard_id> --type=causal

# 查詢關係圖
node scripts/shard-graph.js --skill=oa-page-builder
```

## Storage

- **Supabase 表**: `memory_shards`, `skill_ultimates`, `shard_relations`
- **本地快取**: `.hermes/memory/shards/`

## Common Pitfalls

1. **碎片過碎** — 最小粒度應為「可獨立驗證的知識點」
2. **關係缺失** — 每個 shard 至少應有 1 個關係
3. **終極未更新** — 新增 shard 後必須重新合成 ultimate

## Verification Checklist

- [ ] 碎片提取完整
- [ ] 關係圖連通
- [ ] 技能終極已合成
- [ ] 使用追蹤記錄
- [ ] 5T 驗證通過（`oa-5t-enforcer`）