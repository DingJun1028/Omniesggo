---
name: oa-audit-scanner
description: "Use when the user wants to run compliance scans: GRI, SASB, TCFD, SDGs, Taiwan FSC. Automated scanning of reports, data, and processes against ESG frameworks. Load when user mentions audit, compliance, scan, GRI, SASB, TCFD, SDGs, FSC."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [audit, compliance, scan, gri, sasb, tcfd, sdgs, fsc, esggo]
    related_skills: [oa-summon, oa-5t-enforcer, oa-data-explorer, oa-report-depth]
---

# OA Audit Scanner — 合規掃描器 v2

## Overview

自動掃描報告、數據、流程是否符合 ESG 框架：GRI 2021、SASB、TCFD、SDGs、台灣金管會 (FSC)。零容忍原則，任一檢查點失敗即判定不合規。

## When to Use

- 用戶說「掃描」、「合規檢查」、「GRI 掃描」、「SASB 對照」、「TCFD 檢查」
- 報告發布前合規閘
- 定期合規巡檢

**Don't use for:** 資料驗證（用 `oa-5t-enforcer`）、研究分析（用 `oa-research-analyzer`）

## Supported Frameworks

| 框架 | 版本 | 檢查點數 | 關鍵要求 |
|------|------|----------|----------|
| GRI | 2021 | ~200 | Universal Standards + Topic Standards |
| SASB | 2023 | ~77 行業 | Industry-specific metrics |
| TCFD | 2021 | 11 推薦揭露 | Governance, Strategy, Risk, Metrics |
| SDGs | 2015 | 17 目標 169 指標 | 映射至業務影響 |
| FSC (台灣) | 113 年版 | 24 章節 | 上市櫃永續報告書編製規範 |

## Core Workflow

### Step 1: 選擇框架與範圍

```typescript
{
  frameworks: ["GRI", "TCFD", "FSC"],
  target: "report",  // report | data | process
  scope: "full"      // full | incremental
}
```

### Step 2: 執行掃描

```bash
# 掃描報告
node scripts/audit-scan.js --target=output/report.html --frameworks=GRI,TCFD,FSC

# 掃描數據
node scripts/audit-scan.js --target=data/esg_metrics --frameworks=SASB

# 掃描流程
node scripts/audit-scan.js --target=process --frameworks=FSC
```

### Step 3: 輸出掃描報告

```json
{
  "framework": "GRI",
  "version": "2021",
  "total_checks": 198,
  "passed": 185,
  "failed": 13,
  "warnings": 5,
  "compliance_rate": 93.4,
  "details": [
    {
      "code": "GRI 2-7",
      "title": "Employees",
      "status": "FAIL",
      "evidence": "缺少非正式員工數據",
      "remediation": "補充 HR 系統數據"
    }
  ]
}
```

### Step 4: 自動生成補正清單

```markdown
# 合規補正清單 (GRI 2021)

## 必修 (FAIL)
- [ ] GRI 2-7: 補充非正式員工統計
- [ ] GRI 303-5: 新增用水量揭露
- [ ] GRI 403-9: 工傷率計算方式說明

## 建議 (WARNING)
- [ ] GRI 2-29: 擴大利害關係人溝通管道
```

## Common Pitfalls

1. **框架版本錯誤** — 必須指定版本（GRI 2021 vs 2016）
2. **行業代碼錯誤** — SASB 需正確 NAICS/SICS 代碼
3. **範圍不清** — 掃描前確認是檢查報告、數據還是流程

## Verification Checklist

- [ ] 框架版本正確
- [ ] 掃描範圍明確
- [ ] 所有檢查點執行
- [ ] 輸出可執行補正清單
- [ ] 5T 驗證通過