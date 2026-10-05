---
name: eslint-optimizer
description: Configure ESLint for Next.js/React/TypeScript projects with optimal rule settings. Balances strictness with CI pass rate. Use when setting up ESLint, tuning rules, or reducing lint noise while keeping code quality.
uuid: "b2c3d4e5-f6a7-8901-bcde-f12345678901"
version: "1.0.0"
---

# ESLint Optimizer Skill

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
