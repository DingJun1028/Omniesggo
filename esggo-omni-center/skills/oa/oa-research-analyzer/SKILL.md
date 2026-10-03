---
name: oa-research-analyzer
description: "Use when the user wants ESG research analysis: policy tracking, regulation comparison, best practice benchmarking, trend analysis. Load when user mentions research, analysis, policy, regulation, benchmarking, trends."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [research, analysis, policy, regulation, benchmark, trend, esggo]
    related_skills: [oa-summon, oa-data-explorer, oa-memory-shards, oa-audit-scanner]
---

# OA Research Analyzer — ESG 研究分析器 v2

## Overview

ESG 領域研究分析：政策追蹤、法規比對、最佳實踐基準、趨勢分析。結合網頁搜尋、資料庫查詢、記憶碎片綜合分析。

## When to Use

- 用戶說「研究」、「分析」、「政策追蹤」、「法規比對」、「趨勢分析」
- 需要深度 ESG 知識支援決策

**Don't use for:** 資料探索（用 `oa-data-explorer`）、合規掃描（用 `oa-audit-scanner`）

## Research Types

| 類型 | 說明 | 輸出 |
|------|------|------|
| 政策追蹤 | 監控全球/台灣 ESG 政策變化 | 週報、變更日誌 |
| 法規比對 | 比較不同司法管轄區要求 | 比對表、缺口分析 |
| 基準研究 | 行業最佳實踐、領先者案例 | 基準報告、關鍵指標 |
| 趨勢分析 | 識別新興議題、技術、標準 | 趨勢雷達、影響評估 |

## Core Workflow

### Step 1: 定義研究問題

```typescript
{
  question: "2025 年台灣製造業碳邊境調整機制 (CBAM) 應對策略",
  scope: ["Taiwan", "Manufacturing", "CBAM", "Carbon"],
  depth: "comprehensive",  // quick | standard | comprehensive
  sources: ["gov", "ngo", "academic", "industry", "news"]
}
```

### Step 2: 多源蒐集

```bash
# 網頁搜尋
web_search "CBAM Taiwan manufacturing 2025"

# 學術搜尋
arxiv_search "carbon border adjustment mechanism"

# 政府文件
search_files "CBAM" --path=/data/policy-docs

# 記憶碎片
oa-memory-shards query "CBAM"
```

### Step 3: 綜合分析

```typescript
// 結構化分析框架
{
  executive_summary: "...",
  regulatory_landscape: { taiwan: [], eu: [], us: [], global: [] },
  industry_impact: { high: [], medium: [], low: [] },
  best_practices: { company: [], action: [], result: [] },
  recommendations: { immediate: [], short_term: [], long_term: [] },
  risk_assessment: { financial: [], operational: [], reputational: [] },
  sources: [...]
}
```

### Step 4: 輸出交付物

- **快速版**: 1 頁摘要 + 關鍵來源
- **標準版**: 5-10 頁報告 + 比對表
- **完整版**: 20+ 頁深度報告 + 附錄

## Data Sources

| 來源 | 類型 | 更新頻率 |
|------|------|----------|
| 環保署、經貿談判辦公室 | 政府文件 | 即時 |
| GRI, SASB, TCFD, ISSB | 標準制定 | 季度 |
| CDP, SBTi, TNFD | 框架組織 | 月度 |
| 產業技術研究院 (ITRI) | 智庫報告 | 月度 |
| 國際能源署 (IEA) | 數據與分析 | 年度 |

## Common Pitfalls

1. **來源偏單一** — 必須三角驗證（政府+學術+產業）
2. **時效性** — ESG 政策變動快，必須標註查證日期
3. **在地化缺失** — 國際趨勢必須轉譯為台灣情境

## Verification Checklist

- [ ] 研究問題明確
- [ ] 多源蒐集完成
- [ ] 三角驗證關鍵論點
- [ ] 結構化輸出
- [ ] 來源完整引用
- [ ] 5T 驗證通過