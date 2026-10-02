---
name: oa-report-depth
description: "ESGGO 280K字深度永續報告生成引擎。使用 answer-database 真實數據 + 專家模板 + 5T協議 + ZKP封印。當用戶要求生成完整永續報告、擴展報告深度、或修復報告品質問題時使用。"
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [report, depth, esg, sustainability, 280k, zkp, esggo]
    related_skills: [oa-summon, oa-report-assembler, oa-5t-enforcer, oa-memory-shards]
---

# OA Report Depth — 280K字深度永續報告引擎 v2

## Overview

生成 28 萬字深度永續報告（v5 萬能系統版）。結合 answer-database 真實數據、專家模板、5T 協議、ZKP 封印。支援 28 章 × 28 萬字，符合台灣金管會、GRI 2021、IFRS S1/S2、TCFD、SASB。

## When to Use

- 用戶說「深度報告」、「28 萬字」、「280K 字」、「v5 萬能系統版」
- 需要最高品質、最完整的永續報告
- 客戶要求完整合規報告

**Don't use for:** 快速組裝（用 `oa-report-assembler`）、部署（用 `oa-deploy`）

## Architecture

```
answer-database (Excel/JSON)
       ↓
專家模板庫 (28 章 × 子模板)
       ↓
5T 協議驗證管線
       ↓
ZKP 封印
       ↓
輸出：HTML + ZKP Proof + Merkle Root
```

## Core Workflow

### Step 1: 載入完整數據集

```bash
# v5_full_data.json (1.1MB) + v5_chapter_data.json (950KB) + v5_answers.json (880KB)
# tmp_answers.xlsx (227KB) — 高保真 Excel 答案庫
```

### Step 2: 逐章生成

```typescript
// 每章獨立生成，可並行
for (chapter of 28_chapters) {
  const template = loadExpertTemplate(chapter);
  const data = extractChapterData(chapter);
  const rendered = renderWith5T(template, data);
  const sealed = zkpSeal(rendered);
  output[chapter] = sealed;
}
```

### Step 3: 5T 全維度驗證

```bash
pnpm oa:5t-enforce --report=output/full-report.html --full
```

### Step 4: ZKP 封印

```bash
node scripts/zkp-seal.js --input=output/full-report.html --output=output/sealed/
# 生成：report.html, proof.json, merkle-root.txt, verification-key.json
```

## 28 Chapters (v5 Universal)

| 章節範圍 | 面向 | 子章節數 |
|----------|------|----------|
| 1-4 | 治理 | 4 |
| 5-12 | 策略 | 8 |
| 13-20 | 風險 | 8 |
| 21-28 | 指標 | 8 |

## Output Artifacts

```
output/
├── report.html           # 完整 HTML 報告（~280K 字）
├── proof.json            # ZKP 證明
├── merkle-root.txt       # Merkle Root
├── verification-key.json # 驗證金鑰
├── 5t-report.json        # 5T 驗證報告
└── chapters/             # 各章獨立 HTML
```

## Common Pitfalls

1. **數據版本不一致** — 必須用同一版本的 v5_* 檔案組
2. **ZKP 失敗** — 通常是輸入過大，需分章封印再合併
3. **模板版本漂移** — 專家模板必須版本控制
4. **生成時間過長** — 28 章並行生成約 10-15 分鐘

## Verification Checklist

- [ ] 28 章全部生成
- [ ] 總字數 ≥ 280,000
- [ ] 5T 驗證全部 PASS
- [ ] ZKP 封印驗證通過
- [ ] Merkle Root 匹配
- [ ] GRI/IFRS/TCFD/SASB 索引完整
- [ ] Git 提交（輸出檔案）