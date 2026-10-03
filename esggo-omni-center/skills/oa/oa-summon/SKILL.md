---
name: oa-summon
description: "Use as the primary entry point for OmniAgent operations. Spawns and coordinates other OA skills based on user intent. Load when user says 'OA', 'OmniAgent', '召喚', or starts any OA workflow. Routes to appropriate skills: page-builder, design-fix, 5t-enforcer, deploy, report-depth, etc."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [summon, entry-point, router, orchestrator, esggo]
    related_skills: [oa-page-builder, oa-design-fix, oa-5t-enforcer, oa-deploy, oa-report-depth, oa-task-orchestrator]
---

# OA Summon — 萬能召喚器 v2

## Overview

OmniAgent (OA) 系統的統一入口。根據用戶意圖路由到正確技能，協調多技能工作流。

## When to Use

- 用戶說「OA」、「OmniAgent」、「召喚」、「開始」
- 任何 OA 工作流的起點
- 需要判斷使用哪個/哪些技能

**Don't use for:** 具體執行任務（由下游技能處理）

## Intent → Skill Mapping

| 用戶意圖 | 關鍵字 | 目標技能 |
|----------|--------|----------|
| 建立頁面 | 建立頁面、依規格建頁、spec table | `oa-page-builder` |
| 修復設計 | 修復設計、樣式錯誤、深色主題 | `oa-design-fix` |
| 5T 驗證 | 5T 驗證、合規檢查、數據完整性 | `oa-5t-enforcer` |
| 部署上線 | 部署、deploy、上線、推上去 | `oa-deploy` |
| 深度報告 | 深度報告、28 萬字、280K、v5 萬能 | `oa-report-depth` |
| 快速組裝 | 組裝報告、快速報告、24 章 | `oa-report-assembler` |
| 編排任務 | 編排、同時跑、一起做、子代理 | `oa-task-orchestrator` |
| 資料查詢 | 查資料、Supabase、資料庫 | `oa-supabase-query` |
| 記憶管理 | 記憶碎片、技能終極、知識提取 | `oa-memory-shards` |
| 即時監控 | 監控、即時狀態、健康檢查 | `oa-realtime-monitor` |
| 資料探索 | 探索資料、自然語言查詢 | `oa-data-explorer` |
| 研究分析 | 研究、政策、法規、趨勢、基準 | `oa-research-analyzer` |
| 合規掃描 | 掃描、缺口、GRI、SASB、TCFD | `oa-audit-scanner` |
| 排程任務 | 排程、定時、cron、自動化 | `oa-cron-scheduler` |
| 代理訓練 | 訓練、優化、基準測試 | `oa-agent-trainer` |
| VPS 閘道 | VPS、閘道、Telegram、Nginx | `oa-vps-gateway` |
| UI 設計系統 | 設計系統、OmniBase、OmniTheme | `oa-ui-design-system` |
| 技能建立 | 建立技能、新技能、scaffold | `oa-skill-scaffold` |

## Routing Logic

```typescript
function route(userInput: string): Skill[] {
  const intents = detectIntents(userInput);
  return intents.map(intent => SKILL_MAP[intent]);
}

// 多意圖 → 並行編排
// 單意圖 → 直接委派
// 不明確 → 詢問澄清
```

## Workflow Patterns

### Pattern 1: 單一技能
```
用戶: "OA 部署"
→ oa-summon 路由 → oa-deploy
```

### Pattern 2: 串行工作流
```
用戶: "OA 建立頁面並部署"
→ oa-summon → oa-task-orchestrator
  → Phase 1: oa-page-builder
  → Phase 2: oa-deploy
  → Phase 3: oa-5t-enforcer (驗證)
```

### Pattern 3: 並行工作流
```
用戶: "OA 都是：建立頁面、修復設計、驗證、部署"
→ oa-summon → oa-task-orchestrator (並行)
  → oa-page-builder
  → oa-design-fix
  → oa-5t-enforcer
  → oa-deploy
```

## User Preferences (ESGGO)

- **"都是" = 全部並行** — 同時執行所有相關任務
- **"不要出錯第一"** — 正確性優先，每步驗證
- **"繼續" / "go"** — 立即執行下一步
- **"或全部一起進行"** — 明確要求並行

## Verification Checklist

- [ ] 意圖識別正確
- [ ] 技能路由正確
- [ ] 工作流模式選擇正確
- [ ] 用戶偏好已套用