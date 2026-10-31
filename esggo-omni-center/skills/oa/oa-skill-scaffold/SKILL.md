---
name: oa-skill-scaffold
description: "Use when the user wants to create a new OA skill. Generates the complete skill scaffold: directory, SKILL.md with proper frontmatter, reference files, and test templates. Load when user says '建立技能', '新技能', 'scaffold skill', or 'create OA skill'."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [skill, scaffold, generator, esggo]
    related_skills: [oa-summon, hermes-agent-skill-authoring]
---

# OA Skill Scaffold — 技能腳手架生成器 v2

## Overview

自動生成完整的 OA 技能骨架：目錄結構、SKILL.md（含前置資料）、參考文件、測試模板。

## When to Use

- 用戶說「建立技能」、「新技能」、「scaffold skill」
- 需要快速建立符合規範的新技能

**Don't use for:** 修改現有技能、使用現有技能

## Generated Structure

```
skills/oa/<skill-name>/
├── SKILL.md              # 主技能文件（必填）
├── references/           # 參考文件（選填）
│   ├── api.md
│   ├── config.yaml
│   └── troubleshooting.md
├── templates/            # 模板文件（選填）
│   ├── component.tsx
│   └── config.json
└── scripts/              # 腳本文件（選填）
    ├── validate.js
    └── generate.js
```

## Core Workflow

### Step 1: 解析技能規格

```typescript
{
  name: "oa-new-skill",           // kebab-case，oa- 前綴
  description: "技能用途描述",
  version: "1.0.0",
  author: "ESGGO OmniAgent",
  category: "domain|infrastructure|application",
  tags: ["tag1", "tag2"],
  related_skills: ["oa-summon", "oa-other"],
  when_to_use: "具體觸發場景",
  dont_use_for: "不適用場景"
}
```

### Step 2: 生成 SKILL.md

```yaml
---
name: oa-new-skill
description: "..."
version: 1.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [tag1, tag2]
    related_skills: [oa-summon, oa-other]
---
# OA New Skill — 技能名稱 v1

## Overview
...

## When to Use
...

## Core Workflow
### Step 1: ...
### Step 2: ...
### Step 3: ...

## Common Pitfalls
...

## Verification Checklist
- [ ] ...
```

### Step 3: 生成輔助文件

```bash
# references/api.md - API 端點文件
# templates/*.json - 常用配置模板
# scripts/validate.js - 驗證腳本
```

## Naming Convention

| 層級 | 前綴 | 範例 |
|------|------|------|
| 應用層 | oa- | oa-summon, oa-report-depth |
| 領域層 | oa- | oa-page-builder, oa-5t-enforcer |
| 基礎層 | oa- | oa-deploy, oa-supabase-query |

## Verification Checklist

- [ ] 目錄建立
- [ ] SKILL.md 完整（含前置資料）
- [ ] 參考文件齊全
- [ ] 模板可用
- [ ] 腳本可執行
- [ ] 符合命名規範
- [ ] 關聯技能正確