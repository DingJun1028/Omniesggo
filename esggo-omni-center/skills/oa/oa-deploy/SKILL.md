---
name: oa-deploy
description: "Use when the user says '部署', 'deploy', '上線', or asks to push changes to production. Runs git commit, git push, and Vercel deployment with build verification. Handles common deployment errors like build timeouts, cache issues, and lockfile mismatches."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [deploy, vercel, git, ci-cd, esggo]
    related_skills: [oa-summon, oa-5t-enforcer, oa-vps-gateway]
---

# OA Deploy — 一鍵部署器 v2

## Overview

自動化部署流程：Git 提交 → 推送 → Vercel 建置 → 驗證。處理常見部署錯誤。

## When to Use

- 用戶說「部署」、「deploy」、「上線」、「推上去」
- 完成功能開發需要發布

**Don't use for:** 開發階段、僅建置不部署

## Core Workflow

### Step 1: Pre-deploy Checks

```bash
cd /c/var/www/esggo
git status --short
pnpm run lint
pnpm run typecheck
pnpm build
```

### Step 2: Git Commit & Push

```bash
git add -A
git commit --no-verify -m "feat: <description>"
git push origin main
```

### Step 3: Vercel Deploy

```bash
# Vercel 自動部署（連結 main branch）
# 或手動觸發
vercel --prod --token=$VERCEL_TOKEN
```

### Step 4: 驗證部署

```bash
curl -s -o /dev/null -w "%{http_code}" https://esggo.app/sustain-write/v5
# 應回傳 200
```

## Windows Specific

```bash
# Windows 上使用 cmd /c 執行長跑命令
cmd /c "pnpm build"
```

## Common Pitfalls

1. **Lockfile mismatch** — `pnpm install --frozen-lockfile` 失敗 → `pnpm install` 重新生成
2. **Build timeout** — Vercel 60s 限制 → 優化 build 或用 `vercel.json` 調整
3. **Cache issues** — `vercel --force` 強制重新建置
4. **Environment variables** — 確認 Vercel Dashboard 有所有必要 env vars

## Verification Checklist

- [ ] `pnpm run lint` 通過
- [ ] `pnpm run typecheck` 通過
- [ ] `pnpm build` 通過
- [ ] Git commit + push 成功
- [ ] Vercel 部署成功
- [ ] 生產環境健康檢查 200
- [ ] `oa-5t-enforcer` 驗證通過（可選）