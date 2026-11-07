---
name: eslint-optimizer
description: Configure ESLint for Next.js/React/TypeScript projects with optimal rule settings. Balances strictness with CI pass rate. Use when setting up ESLint, tuning rules, or reducing lint noise while keeping code quality.
uuid: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
version: 1.0.0
title: ESLint 優化
category: eslint-optimizer
title: ESLint 優化
category: eslint-optimizer
---

1.0.0# ESLint Optimizer Skill

Configure ESLint for maximum CI pass rate with minimum code quality loss.

## Flat Config Template (eslint.config.js)

```js
const nextPlugin = require('@next/eslint-plugin-next');
const typescriptEslint = require('typescript-eslint');
const reactPlugin = require('eslint-plugin-react');
const reactHooksPlugin = require('eslint-plugin-react-hooks');
const importPlugin = require('eslint-plugin-import');
const jsxA11yPlugin = require('eslint-plugin-jsx-a11y');
const globals = require('globals');

module.exports = [
  ...typescriptEslint.configs.recommended,
  {
    ignores: [
      '.next/**', 'out/**', 'build/**', 'node_modules/', 'dist/',
      '**/*.cjs', '**/*.mjs',    // ← use ** for subdirectory match
      'assets/vendor/', 'esggo/', 'apps/', 'packages/',
    ],
  },
  {
    files: ['**/*.{js,jsx,mjs,ts,tsx,mts,cts}'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
      import: importPlugin,
      'jsx-a11y': jsxA11yPlugin,
      '@next/next': nextPlugin,
    },
    languageOptions: {
      parser: typescriptEslint.parser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: 'module',
        allowImportExportEverywhere: true,
        ecmaVersion: 2022,
        ecmaFeatures: { jsx: true },
      },
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // ── Base configs ──
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,

      // ── Relaxed rules (reduce noise) ──
      'import/no-anonymous-default-export': 'warn',
      'react/no-unknown-property': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-target-blank': 'off',
      'react/no-unescaped-entities': 'off',
      '@next/next/no-img-element': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',

      // ── React Compiler rules (too strict for existing code) ──
      'react-hooks/set-state-in-effect': 'off',     // fetch-in-useEffect is standard
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
];
```

## Key Decisions

### Why `**/*.cjs` instead of `*.cjs`?
ESLint flat config `*.cjs` only matches root-level files. Use `**/*.cjs` to match files in subdirectories (e.g., `scripts/gen-gallery-index.cjs`).

### Why disable `set-state-in-effect`?
The React Compiler rule flags the standard pattern of calling `fetchData()` inside `useEffect`, which internally calls `setState`. This is the recommended React pattern for data fetching. The rule creates false positives.

### Why warn instead of error for `no-explicit-any`?
In large codebases, converting all `any` to proper types in one PR is impractical. Set to `warn` to track technical debt without blocking CI.

## Tuning Workflow

1. **Start strict** — use recommended configs
2. **Run `pnpm lint`** — count errors vs warnings
3. **Downgrade to warn** — for rules that flag valid patterns
4. **Disable** — only for rules that are fundamentally wrong for your codebase
5. **Never suppress per-file** — prefer project-wide rule config


## 自然語觸發自動工具使用的機率 (Natural Language Auto-Tool Trigger)

### 1. 觸發關鍵字清單 (Trigger Keywords)

> 系統會自動識別輸入中的自然語觸發詞，觸發對應的工具/技能/代理。

#### 核心觸發詞

| 關鍵字 | 英文 | 觸發功能 | 機率權重 |
|--------|------|---------|----------|
| eslint-optimizer | auto | 觸發本技能 | 5.0 |
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
// 輸入：eslint-optimizer 並查詢目前狀態
{
  triggers: ["eslint-optimizer", "query"],
  actions: ["awaken()", "query()"],
  priority: ["eslint-optimizer", "query"],
  probability: 1.0
}
```

---

### 3. 工具選擇權重

| 工具類別 | 關鍵字 | 權重 |
|----------|--------|------|
| 記憶查詢 | query, 查詢, 讀取 | 0.8 |
| 技能成長 | eslint-optimizer, grow | 0.7 |
| 反思 | reflect, 學習 | 0.75 |
| 系統初始化 | eslint-optimizer, start | 0.9 |
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

**輸入**：eslint-optimizer
**解析**：核心關鍵字
**輸出**：`awaken()`

**輸入**："查詢 eslint-optimizer 狀態"
**解析**：查詢 + 技能
**輸出**：`query()`, `doctor()`

#### 5.2 複雜自然語

**輸入**："我今天學到新東西，幫我記住並分享"
**解析**：
- 關鍵字：`growth`, `share`, `memory`
- 行動：`recordLearning()`, `recordMemory()`, `cross-agent sync`
- 權重：0.75
- 輸出：`growSkill()`, `remember()`, `tagSkill("share:active")`

**輸入**："讓我檢查一下 eslint-optimizer 狀態"
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
