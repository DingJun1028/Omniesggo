---
name: oa-agent-trainer
description: "Use when the user wants to train or optimize agents: prompt optimization, few-shot examples, model selection, performance benchmarking. Load when user mentions agent training, prompt optimization, model benchmarking, or agent improvement."
version: 2.0.0
author: ESGGO OmniAgent
license: MIT
metadata:
  hermes:
    tags: [agent, training, optimization, prompt, benchmark, esggo]
    related_skills: [oa-summon, oa-memory-shards, oa-task-orchestrator]
---

# OA Agent Trainer — 代理訓練優化器 v2

## Overview

代理訓練與優化：Prompt 優化、Few-shot 範例、模型選擇、效能基準測試。持續改善 OmniAgent 子代理表現。

## When to Use

- 用戶說「訓練代理」、「優化 Prompt」、「模型基準測試」、「代理改善」
- 子代理表現不佳需要調優

**Don't use for:** 一般任務編排（用 `oa-task-orchestrator`）、記憶管理（用 `oa-memory-shards`）

## Optimization Targets

| 目標 | 指標 | 優化手段 |
|------|------|----------|
| Prompt | Token 用量、準確率、一致性 | Prompt engineering、Chain-of-thought |
| Few-shot | 泛化能力、邊界處理 | 精選範例、動態選擇 |
| 模型選擇 | 成本/效能比、延遲 | A/B 測試、路由規則 |
| 工具使用 | 成功率、調用效率 | Tool schema 優化、重試策略 |

## Core Workflow

### Step 1: 基準測試

```bash
# 建立基準測試集
node scripts/benchmark.js --agent=oa-page-builder --cases=50 --models=gpt-4o,claude-3.5-sonnet,gemini-1.5-pro
```

### Step 2: Prompt 優化

```typescript
// DSPy 風格優化
const optimized = await optimizePrompt({
  base_prompt: current_prompt,
  training_examples: few_shot_examples,
  metric: (pred, gold) => accuracy(pred, gold),
  optimizer: "MIPROv2"
});
```

### Step 3: 模型路由

```yaml
# .hermes/agent/router.yaml
routing:
  research: "google/gemini-2.0-flash-exp:free"
  coding: "anthropic/claude-sonnet-4"
  verification: "deepseek/deepseek-v4-flash:free"
  creative: "openrouter/auto"
```

### Step 4: 持續監控

```bash
# 記錄每次執行指標
# 定期重新基準測試
hermes cron create "0 3 * * 0" --prompt="重新基準測試所有代理" --skills=oa-agent-trainer
```

## Common Pitfalls

1. **過度優化** — 在有限測試集上過擬合
2. **忽略成本** — 必須平衡效能與成本
3. **缺乏回歸測試** — 優化後必須跑完整回歸套件

## Verification Checklist

- [ ] 基準測試集完整
- [ ] 優化目標明確
- [ ] A/B 測試設計合理
- [ ] 成本/效能比改善
- [ ] 回歸測試通過