---
name: oa-cron-scheduler
description: "Use when the user wants to schedule recurring tasks, manage cron jobs, or set up automated workflows. Handles cron job creation, scheduling, monitoring, and management via Hermes cron system. Load when user mentions cron, schedule, recurring, automation, or scheduled tasks."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [cron, scheduler, automation, recurring, esggo]
    related_skills: [oa-summon, oa-vps-gateway, oa-task-orchestrator]
---

# OA Cron Scheduler — 排程任務管理器 v2

## Overview

管理 Hermes Cron 系統：建立、排程、監控、管理定期任務。支援 duration、cron expression、ISO timestamp 多種排程格式。

## When to Use

- 用戶說「排程」、「定時任務」、「cron」、「自動化」
- 需要定期執行：報告生成、資料同步、健康檢查、部署

**Don't use for:** 一次性任務、即時執行

## Core Workflow

### Step 1: 定義任務

```typescript
{
  name: "daily-esg-report",
  schedule: "0 2 * * *",        // 每天 02:00
  // 或 "every 24h" / "2026-07-01T02:00:00"
  prompt: "生成每日 ESG 指標快照並推送至 Telegram",
  skills: ["oa-data-explorer", "oa-report-assembler"],
  delivery: "telegram",
  workdir: "/c/var/www/esggo"
}
```

### Step 2: 建立 Cron Job

```bash
# Via Hermes CLI
hermes cron create "0 2 * * *" --prompt="..." --skills=oa-data-explorer,oa-report-assembler --delivery=telegram

# 或使用 cronjob tool
cronjob(action="create", schedule="0 2 * * *", prompt="...", skills=["oa-data-explorer"], delivery="telegram")
```

### Step 3: 監控與管理

```bash
# 列出所有任務
hermes cron list

# 查看狀態
hermes cron status

# 手動觸發
hermes cron run <job_id>

# 暫停/恢復
hermes cron pause <job_id>
hermes cron resume <job_id>

# 刪除
hermes cron remove <job_id>
```

## Common Schedules

| 描述 | Cron Expression | Duration |
|------|-----------------|----------|
| 每小時 | `0 * * * *` | `1h` |
| 每天 02:00 | `0 2 * * *` | `24h` |
| 每週一 09:00 | `0 9 * * 1` | `every monday 9am` |
| 每月 1 號 | `0 0 1 * *` | `every month 1st` |
| 每 30 分鐘 | `*/30 * * * *` | `30m` |

## Pre-defined ESGGO Jobs

```yaml
# .hermes/cron/jobs.yaml
jobs:
  - id: daily-metrics-snapshot
    schedule: "0 2 * * *"
    prompt: "抓取所有公司最新 ESG 指標生成快照"
    skills: ["oa-data-explorer"]
    delivery: "telegram"
  
  - id: weekly-compliance-scan
    schedule: "0 3 * * 1"
    prompt: "執行全量合規掃描"
    skills: ["oa-audit-scanner"]
    delivery: "telegram"
  
  - id: monthly-report-assembly
    schedule: "0 4 1 * *"
    prompt: "組裝月度永續報告"
    skills: ["oa-report-assembler"]
    delivery: "telegram"
  
  - id: gateway-health-check
    schedule: "*/5 * * * *"
    prompt: "檢查 Gateway 健康狀態"
    skills: ["oa-realtime-monitor"]
    delivery: "telegram"
```

## Common Pitfalls

1. **時區問題** — Cron 使用 UTC，需換算本地時間
2. **重複執行** — `.tick.lock` 防重複，但需注意長跑任務
3. **技能載入失敗** — 確認 skills 存在且名稱正確
4. **工作目錄** — `workdir` 必須存在且有 AGENTS.md

## Verification Checklist

- [ ] 排程表達式正確
- [ ] Prompt 自包含（無外部依賴）
- [ ] Skills 存在且相關
- [ ] Delivery 目標可達
- [ ] 手動執行測試通過