---
name: oa-report-assembler
description: "Use when the user wants to assemble or generate sustainability/ESG reports. Automated assembly of 24-section sustainability reports using zero-compute pre-written templates. Load when user mentions report assembly, ESG report generation, or 24-section report."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [report, assembly, esg, sustainability, zero-compute, esggo]
    related_skills: [oa-summon, oa-report-depth, oa-5t-enforcer, oa-deploy]
---

# OA Report Assembler — 永續報告自動組裝器 v2

## Overview

零算力組裝 24 段永續報告書。使用預寫範本骨架 + 真實資料填充，產出符合金管會、GRI 2021、IFRS S1/S2、TCFD、SASB 標準的 HTML 格式報告。

## When to Use

- 用戶說「組裝報告」、「生成報告」、「24 萬字報告」
- 需要快速產出完整永續報告
- 用戶提供 answer-database 真實數據

**Don't use for:** 深度報告生成（用 `oa-report-depth`）、部署（用 `oa-deploy`）、驗證（用 `oa-5t-enforcer`）

## Core Workflow

### Step 1: 驗證輸入資料

```bash
# 檢查 answer-database 完整性
# 必需：公司基本資料、治理架構、策略管理、風險管理、指標目標
```

### Step 2: 選擇範本骨架

```
templates/
├── v5-universal/           # v5 萬能系統版（28 章）
│   ├── 01-governance/
│   ├── 02-strategy/
│   ├── 03-risk/
│   └── 04-metrics/
├── fsc-standard/           # 金管會標準版（24 章）
└── custom/                 # 客製化版
```

### Step 3: 零算力組裝

```python
# 邏輯：Template + Data = Report
# 無 LLM 推理，純字串替換與結構組合
for section in template.sections:
    rendered = section.template.render(data[section.key])
    report.sections.append(rendered)
```

### Step 4: 輸出與驗證

```bash
# 輸出 HTML
# 執行 5T 驗證
pnpm oa:5t-enforce --report output/report.html
```

## Report Structure (v5 Universal - 28 Chapters)

| 章節 | 內容 | 資料來源 |
|------|------|----------|
| 1-4 | 治理面 | Governance DB |
| 5-12 | 策略面 | Strategy DB |
| 13-20 | 風險面 | Risk DB |
| 21-28 | 指標面 | Metrics DB |

## Data Mapping

```json
{
  "company": "answer_database.company",
  "governance": "answer_database.governance",
  "strategy": "answer_database.strategy",
  "risk": "answer_database.risk",
  "metrics": "answer_database.metrics",
  "gri_index": "answer_database.gri",
  "assurance": "answer_database.assurance"
}
```

## Common Pitfalls

1. **資料缺漏** — 必須先跑 `oa-data-explorer` 確認資料完整
2. **範本版本錯誤** — 確認使用 v5-universal 或 fsc-standard
3. **輸出格式** — 僅輸出 HTML，不支援 PDF（需瀏覽器列印）
4. **5T 未驗證** — 組裝完成必須跑 `oa-5t-enforcer`

## Verification Checklist

- [ ] answer-database 完整性檢查通過
- [ ] 範本版本正確
- [ ] 24/28 章節全部渲染
- [ ] GRI 內容索引正確
- [ ] 第三方確信聲明佔位
- [ ] `oa-5t-enforcer` 驗證通過
- [ ] Git 提交