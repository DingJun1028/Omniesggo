---
name: oa-5t-enforcer
description: "Use when verifying data compliance with the 5T Integrity Protocol (真善美信通). Checks all five dimensions: Truth (可感知), Goodness (可溯源), Beauty (可追蹤), Trust (不可篡改), Transferful (可透明驗算). Load when user mentions 5T verification, data integrity, or audit checks."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [5t, verification, integrity, audit, compliance, esggo]
    related_skills: [oa-summon, oa-page-builder, oa-design-fix, oa-report-depth, oa-audit-scanner]
---

# OA 5T Enforcer — 5T 完整性驗證器 v2

## Overview

驗證 ESGGO 數據與報告是否符合 5T 完整性協議：真、善、美、信、通。零容忍原則，任一維度失敗即判定不合規。

## When to Use

- 用戶說「5T 驗證」、「數據完整性」、「合規檢查」
- 報告生成前驗證
- 部署前質量閘

**Don't use for:** 頁面建置、設計修復、部署

## 5T Dimensions

| 維度 | 中文 | 驗證重點 | 工具 |
|------|------|----------|------|
| **Truth** | 真 (可感知) | 數據來源可追溯、原始證據存在 | `oa-supabase-query` + 憑證鏈 |
| **Goodness** | 善 (可溯源) | 流程透明、決策可回溯、利益相關者可見 | 審計日誌、版本控制 |
| **Beauty** | 美 (可追蹤) | 格式一致、結構優雅、閱讀體驗良好 | 格式驗證、Schema 驗證 |
| **Trust** | 信 (不可篡改) | 不可變存儲、簽名驗證、防竄改 | ZKP 封印、Merkle Root |
| **Transferful** | 通 (可透明驗算) | 計算可重現、公式公開、參數透明 | 開源算法、參數註冊表 |

## Core Workflow

### Step 1: 數據蒐集

```bash
cd /c/var/www/esggo
# 查詢相關數據
node cli/omni-cli.ts query --table=esg_metrics --company=<id>
```

### Step 2: 五維驗證

```typescript
// Truth: 每個數據點必須有 source_id 指向原始憑證
// Goodness: 每個變更必須有 audit_log 記錄
// Beauty: 報告結構符合 schema（28 章 × 28 萬字）
// Trust: ZKP proof 驗證通過、Merkle root 匹配
// Transferful: 計算腳本開源、參數在 registry 中
```

### Step 3: 生成驗證報告

```json
{
  "truth": "PASS",
  "goodness": "PASS",
  "beauty": "PASS",
  "trust": "PASS",
  "transferful": "PASS",
  "overall": "COMPLIANT",
  "evidence": [...]
}
```

## ZKP 封印驗證

```bash
# 驗證 ZKP 證明
node scripts/verify-zkp.js --proof=<proof> --public=<public>
# 檢查 Merkle Root
node scripts/check-merkle.js --root=<expected>
```

## Common Pitfalls

1. **只驗證表層** — 必須追溯到原始數據源頭
2. **忽略版本控制** — 每次驗證必須記錄 Git commit hash
3. **ZKP 驗證跳過** — Trust 維度核心，不可省略
4. **參數未登記** — Transferful 要求所有計算參數在 registry

## Verification Checklist

- [ ] Truth: 所有數據點有來源憑證
- [ ] Goodness: 完整審計日誌
- [ ] Beauty: 報告結構符合 Schema
- [ ] Trust: ZKP 驗證通過、Merkle Root 匹配
- [ ] Transferful: 算法開源、參數登記
- [ ] 整體判定: COMPLIANT
- [ ] 驗證報告生成並存檔