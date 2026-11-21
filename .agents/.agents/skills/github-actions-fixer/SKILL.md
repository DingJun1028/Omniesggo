---
name: github-actions-fixer
description: Diagnose and fix GitHub Actions CI/CD workflow failures. Covers ESLint, pytest, ruff, TypeScript, pnpm, Node.js, Python dependency issues, and deploy pipeline debugging. Use when CI fails, workflows error, or deployments break.
uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
version: 1.0.0
title: GitHub Actions 修復
category: github-actions-fixer
title: GitHub Actions 修復
category: github-actions-fixer
---

1.0.0# GitHub Actions Fixer Skill

Systematically diagnose and fix GitHub Actions workflow failures.

## Workflow

### 1. Identify the Failure
```bash
gh run list --limit 5                    # Find failed runs
gh run view <RUN_ID> --log               # Get detailed logs
gh run view <RUN_ID> --log-failed        # Only failed steps
```

### 2. Common Failure Categories

#### A. ESLint Failures
- **0 errors required** — warnings are OK, errors fail CI
- Check `pnpm lint` exit code (exit 1 = errors exist)
- Common error types:
  - `react-hooks/rules-of-hooks` — hooks called conditionally or after early return
  - `react-hooks/set-state-in-effect` — React Compiler strict rule (disable it)
  - `@typescript-eslint/no-require-imports` — require() in .cjs files (add to ignores)
  - `react-hooks/purity` — Math.random() during render (use useMemo/useRef)
  - `react-hooks/refs` — ref access during render (use state instead)
  - `react-hooks/immutability` — variable reassignment during render (use useMemo)

#### B. Python Test Failures
- Missing module: create `esggo/__init__.py` + `esggo/config.py`
- Import errors: check `pyproject.toml` build-backend
- `setuptools.backends._legacy` → use `setuptools.build_meta` for Python 3.14+

#### C. TypeScript Failures
- `npx tsc --noEmit` — check tsconfig.json strictness
- Missing types: add to `types` array in tsconfig

#### D. pnpm / Node.js Failures
- `pnpm install --frozen-lockfile` — lockfile out of sync
- Node version mismatch — check `actions/setup-node` version

### 3. Fix Strategy

```
CI Failure → Categorize → Fix Root Cause → Local Verify → Commit → Push → Re-check
```

For each fix:
1. Reproduce locally first (`pnpm lint`, `pytest`, `tsc --noEmit`)
2. Fix the root cause, not symptoms
3. Verify locally before committing
4. Push and watch CI with `gh run watch <ID> --exit-status`

### 4. ESLint Quick Fix Reference

| Error | Fix |
|-------|-----|
| `rules-of-hooks` | Move hooks before early returns |
| `set-state-in-effect` | Disable rule: `'react-hooks/set-state-in-effect': 'off'` |
| `no-require-imports` in .cjs | Add `**/*.cjs` to ignores |
| `purity` (Math.random) | Use `useMemo` or `crypto.createHash` |
| `refs` during render | Convert `useRef` to `useState` |
| `immutability` | Use `useMemo` to precompute values |

### 5. Verification Checklist

```bash
# All must pass before push:
pnpm lint              # ESLint (0 errors)
npx tsc --noEmit       # TypeScript
ruff check .           # Python linter
python -m pytest tests/ -v  # Python tests
pnpm run build         # Next.js build
```


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| github-actions-fixer | auto | 觸發本技能 | 5.0 |
| 觸發 | trigger | 觸發工具使用 | 4.5 |
| 自動 | auto | 自動執行 | 4.0 |
| 幫助 | help | 顯示說明 | 3.0 |
| 查詢 | query | 查詢資訊 | 3.0 |
| 記錄 | record | 記錄數據 | 2.5 |
| 執行 | run | 執行操作 | 3.0 |
| 檢查 | check | 檢查狀態 | 2.5 |
| 初始化 | init | 初始化系統 | 3.0 |

#### 進階觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| 指令 | command | 執行指令 | 4.0 |
| 工具 | tool | 使用工具 | 3.5 |
| 自動 | auto | 自動執行 | 3.0 |
| 查詢 | query | 查詢 | 2.5 |
| 記錄 | record | 記錄 | 2.0 |
| 反思 | reflect | 反思 | 2.5 |
| 重啟 | restart | 重啟 | 2.5 |
| 關閉 | shutdown | 關閉 | 2.5 |

---

### 2. 觸發規則

#### 2.1 預設觸發機率

| 模式 | 權重 | 說明 |
|------|------|------|
| 核心關鍵字 | 100% | 必然觸發 |
| 進階關鍵字 | 70% | 單一關鍵字即觸發 |
| 其他自然語 | 30% | 隨機匹配 |
| 歧義命中 | 15% | 需要確認 |

#### 2.2 機率加權

觸發機率 = (關鍵字分數 × 頻率) + (上下文相似度 × 0.3) + 隨機種子 (0-0.2)

- 單一高權重關鍵字：自動觸發 (1.0)
- 多關鍵字組合：權重加總，上限 1.0
- 低權重 (< 0.3)：記錄，不自動執行

#### 2.3 自然語解析範例

```typescript
// 輸入：github-actions-fixer 並查詢目前狀態
{
  triggers: ["github-actions-fixer", "query"],
  actions: ["awaken()", "query()"],
  priority: ["github-actions-fixer", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | github-actions-fixer, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | github-actions-fixer, start | 0.9 |
| 協作 | share, 協作 | 0.65 |
| 結界 | inherit, 繼承 | 0.5 |

---

### 4. 信心分數與反饋

| 信心分數 | 處理方式 |
|----------|----------|
| >= 0.9 | 自動執行 |
| 0.7 - 0.9 | 記錄後自動執行 |
| 0.4 - 0.7 | 詢問用戶 |
| < 0.4 | 記錄不執行 |

---

### 5. 實際示例

#### 5.1 單一自然語

**輸入**：github-actions-fixer
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 github-actions-fixer 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 github-actions-fixer 狀態"
**解析**：檢查
**輸出**：`doctor()`, `backend()`

---

### 6. 參數一致性

此技能的默認配置：
- **doctor／backend 與 awaken 必須用同一組參數**
- **所有憑證來源 = `secret-vault/ENV20230818.env`**
- **絕不在代碼中硬編碼憑證**
- **NCBDB 為主，local 為備份**
- **所有成長記錄必須帶 `agent_id`、`timestamp`、`source_origin`**
