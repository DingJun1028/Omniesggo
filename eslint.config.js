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
      '.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'node_modules/', 'dist/',
      '*.cjs', '*.mjs', 'assets/vendor/', 'esggo/', 'apps/',
      'scripts/*.cjs', '.agents/**',
      'test/', '_analysis/**', 'temp/**', 'my-worker/**', 'gateway/**',
      // lib/agents/** 原本整目錄忽略，這讓 lib/agents/omni-agent-bus.js 的
      // 「兩份實作拼接」結構缺陷（ESM export 與 CJS module.exports 混用）
      // 完全逃過 lint。現只忽略目錄內其餘檔案，OAB 正典實作與其型別薄層
      // 重新納入檢查。實測（見 README/ERROR-LEDGER）：解除後 0 errors，
      // 僅剩 8 個 @typescript-eslint/no-require-imports/no-var-requires warning，
      // 屬 CJS 模組格式的固有結果，非缺陷。
      'lib/agents/!(omni-agent-bus).*', 'lib/api/**', 'sdks/**', 'chapter-templates/**',
      'examples/**', 'vps/**', 'scripts/**',
      'src/lib/omni-component/**', 'src/impl/__tests__/**'
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
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.mts', '.cts', '.tsx', '.d.ts'],
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx', '.ts', '.tsx'],
        },
        typescript: {
          alwaysTryTypes: true,
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      'import/no-anonymous-default-export': 'warn',
      'react/no-unknown-property': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'jsx-a11y/alt-text': ['warn', { elements: ['img'], img: ['Image'] }],
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'warn',
      'jsx-a11y/aria-unsupported-elements': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'warn',
      'jsx-a11y/role-supports-aria-props': 'warn',
      'react/jsx-no-target-blank': 'off',
      '@next/next/no-img-element': 'off',
      'react/no-unescaped-entities': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      '@typescript-eslint/no-var-requires': 'warn',
      // ── React Compiler rules (too strict for existing patterns) ──
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/purity': 'warn',
    },
  },
  // Test files: relax strict type rules
  {
    files: ['tests/**/*.ts', 'tests/**/*.tsx', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', 'src/**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Declaration files (.d.ts): ambient type declarations legitimately use `any`
  // and `require` — suppressing these keeps the warning gate meaningful for real code.
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
];