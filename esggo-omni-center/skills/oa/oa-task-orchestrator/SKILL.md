---
name: oa-task-orchestrator
description: "Use when the user wants to orchestrate multiple sub-agent tasks, manage delegate_task workflows, monitor agent status, or coordinate parallel work. Handles task decomposition, assignment to sub-agents, progress tracking, failure retry, and result aggregation. Load when user mentions task orchestration, sub-agents, parallel work, or delegate."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [orchestrator, tasks, delegate, sub-agent, parallel, coordination, esggo]
    related_skills: [oa-summon, oa-deploy, oa-page-builder]
---

# OA Task Orchestrator — 子代理任務編排器 v2

## Overview

管理 OmniAgent 的子代理任務編排。負責分解複雜任務、分配給 delegate_task 子代理、追蹤進度、處理失敗重試、匯總結果。

ESGGO 技能組三層架構：
- **應用層** (Application): summon, orchestrator, report-assembler, audit-scanner, realtime-monitor, data-explorer
- **領域層** (Domain): page-builder, design-fix, 5t-enforcer, research-analyzer, memory-shards, agent-trainer
- **基礎層** (Infrastructure): deploy, supabase-query, vps-gateway, cron-scheduler, ui-design-system, skill-scaffold

## When to Use

- 用戶說「編排任務」、「同時跑」、「一起做」、「子代理」
- 需要平行執行多個獨立任務
- 需要分解複雜工作為子任務
- 需要監控子代理進度和狀態
- 用戶說「建立 X 項技能」（跨技能批次建立）

**Don't use for:** 單一簡單任務（直接做）、部署（用 `oa-deploy`）

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                OmniAgent (總代理)                    │
│                     ↓                               │
│              Task Orchestrator                       │
│         ┌─────────┼─────────┐                       │
│         ↓         ↓         ↓                       │
│     Agent A    Agent B    Agent C                   │
│     (研究)     (建置)     (驗證)                      │
│         ↓         ↓         ↓                       │
│         └─────────┼─────────┘                       │
│                   ↓                                 │
│            Result Aggregator                        │
└─────────────────────────────────────────────────────┘
```

## Core Workflow

### Step 1: 任務分解

分析用戶請求，拆解為獨立子任務：

```
用戶: "建立頁面 + 部署 + 驗證"
  → Task A: 建立頁面 (delegate_task)
  → Task B: 部署 (oa-deploy)
  → Task C: 驗證 (oa-5t-enforcer)
```

### Step 2: 分層判斷

判斷任務屬於哪一層，選擇正確的技能：

| 層級 | 適用場景 | 典型技能 |
|------|---------|---------|
| 應用層 | 需要協調、監控、匯總 | summon, orchestrator, report-assembler |
| 領域層 | 專業領域操作 | page-builder, 5t-enforcer, memory-shards |
| 基礎層 | 基礎設施、外部系統 | deploy, supabase-query, vps-gateway |

### Step 3: 平行分派

使用 `delegate_task` 的 `tasks` 陣列同時啟動：

```typescript
delegate_task(
  tasks: [
    { goal: "建立 X 頁面", toolsets: ["terminal", "file"] },
    { goal: "修復 Y 樣式", toolsets: ["terminal", "file"] },
    { goal: "執行 Z 測試", toolsets: ["terminal"] },
  ]
)
```

### Step 4: 結果匯總

子代理完成後，匯總結果並回報用戶。

## Task Decomposition Rules

### 可並行（無依賴）
- 多個頁面建置
- 多個檔案修改
- 研究 + 建置
- 驗證 + 測試

### 必須串行（有依賴）
- 建置 → 部署 → 驗證
- 查詢 → 分析 → 報告
- 安裝 → 設定 → 測試

### 混合模式
```
Phase 1: 平行 [研究A, 研究B, 研究C]
         ↓
Phase 2: 串行 [分析研究結果]
         ↓
Phase 3: 平行 [建置X, 建置Y, 建置Z]
```

## Failure Handling

### 自動重試
- 子代理失敗 → 重試 1 次（換 context）
- 仍然失敗 → 回報用戶，提供錯誤詳情

### 降級策略
- AI 生成失敗 → 使用預寫範本
- 遠端 API 失敗 → 使用本地快取
- 子代理超時 → 簡化任務重試

## Status Display

```
📋 任務編排狀態
━━━━━━━━━━━━━━━━━━━━━━
🔄 Agent A: 研究中... (2m 30s)
✅ Agent B: 建置完成 (1m 15s)
⏳ Agent C: 等待中...
━━━━━━━━━━━━━━━━━━━━━━
進度: 2/3 | 預計剩餘: 30s
```

## User Workflow Preferences

- **"都是" = 全部並行** — 用戶說「都是」或「全部」時，同時執行所有任務，不要問優先順序
- **"不要出錯第一"** — 正確性優先於速度，每個步驟都要驗證
- **"繼續" / "go"** — 立即執行下一步，不要問
- **"或全部一起進行"** — 用戶明確要求並行時，用 delegate_task 的 tasks 陣列同時啟動

## Windows Port 衝突處理

當啟動 dev server（vite/next）遇到 `Port X is already in use` 時：

1. 先查佔用進程：`netstat -ano | grep :PORT`
2. 嘗試 kill：`cmd /c "taskkill /F /PID XXXX"`（注意：Windows git-bash 的 taskkill 可能無效，必須用 `cmd /c` 前綴）
3. 如果 kill 無效（zombie process）：換一個冷門端口（9000+ 或 19000+）
4. 預先掃描可用端口：`for port in 8081 8082 9000 9001 19876; do result=$(netstat -ano | grep ":$port" | head -1); if [ -z "$result" ]; then echo "PORT $port: FREE"; fi; done`
5. 啟動時用 `cmd /c "PORT=XXXX npx vite dev"` 而非直接 `pnpm dev`（避免 git-bash 的 stdout buffer 問題）

**注意**：不要嘗試 kill 未知 PID 的 LISTENING 進程（可能是系統服務或另一個應用）。直接換端口更安全。

## Hermes Workspace 啟動標準流程

```bash
# 1. Clone
git clone --depth 1 --single-branch --branch main https://github.com/outsourc-e/hermes-workspace.git

# 2. Install
cd hermes-workspace && pnpm install --frozen-lockfile

# 3. Env
cp .env.example .env
echo 'HERMES_API_URL=http://127.0.0.1:8642' >> .env
echo 'HERMES_DASHBOARD_URL=http://127.0.0.1:9119' >> .env
echo 'HERMES_AGENT_PATH=C:\\Users\\Administrator\\AppData\\Local\\hermes\\hermes-agent' >> .env

# 4. 找可用端口並啟動
netstat -ano | grep ":19876"
cmd /c "PORT=19876 npx vite dev --host 0.0.0.0"

# 5. 驗證
curl -s http://127.0.0.1:19876 | head -5
curl -s http://127.0.0.1:8642/health
```

**注意**：
- 不要同時跑多個 vite dev server（會互相佔用端口）
- 啟動後用 `curl` 驗證 server 有回應，而非依賴 background process 的 stdout
- Windows 上 vite dev 的 stdout 在 git-bash background 模式下會被 buffer，無法看到輸出

## Common Pitfalls

1. **太多並行子代理** — 最多 3 個同時執行（delegate_task 限制）
2. **任務依賴未處理** — 有依賴的任務必須串行
3. **子代理 context 不足** — 提供完整的 goal + context，不要假設子代理知道背景
4. **忘記匯總結果** — 子代理完成後主動匯總，不要等用戶問
5. **超時未處理** — 子代理可能卡住，設定合理等待時間
6. **Windows git-bash stdout buffer** — background 模式下 terminal output 被 buffer，用 `cmd /c` 前綴或 PTY 模式啟動
6. **忽略已有技能** — 開始新任務前，先 `skills_list` 檢查是否已有對應技能（如用戶說 VPS → 用 `oa-vps-gateway`，不要重做）

## Verification Checklist

- [ ] 任務已正確分解
- [ ] 依賴關係已識別
- [ ] 子代理已啟動
- [ ] 結果已匯總
- [ ] 錯誤已處理或回報
- [ ] 未重複建立已有技能