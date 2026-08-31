import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/archive/**',
      'archive/**',
      // 腳本式驗證（頂層 console.log + assert + process.exit），非 vitest 套件，不應被抓取執行
      '**/__test__/**',
      'apps/gateway/sync/__test__/**',
      'apps/gateway/sync/dist/__test__/**',
      // 隔離 .kilo 下的舊 worktree 測試，它們引用已不存在的 @/lib/* 路徑，會污染本分支 CI
      '**/.kilo/**',
      // esggo-omni-center 是獨立子專案（自帶 vitest.config.ts 與 test script，非 workspace 成員），
      // 由它自己的 node_modules 解析依賴；被根 vitest 抓取時 firebase ESM 出口解析失敗。
      // 於其目錄執行 `pnpm install && pnpm test` 驗證。
      'esggo-omni-center/**',
      // 萬能即時翻譯 UT 測試以 Node 內建 test runner (node:test) 撰寫，非 vitest 套件；
      // 被根 vitest 抓取時會報 "No test suite found in file"。
      // 該套件由 ci.yml 的 "UT API Tests (node --test)" job 執行，覆蓋率不減。
      'apps/universal-translator/test/**',
      // e2e-k1 是自帶 package.json + playwright.config.mjs 的獨立 Playwright 套件，
      // 且不在 pnpm-workspace packages 清單內（@playwright/test 從未安裝），
      // 被根 vitest 抓取時會報 "Cannot find package '@playwright/test'" (ERR_MODULE_NOT_FOUND)。
      // 該套件應由 Playwright 自身執行，非 vitest。
      'e2e-k1/**',
      // ftg-tools 測試以 Node 內建 test runner (node:test) 撰寫，非 vitest 套件：
      //   - fal-images.test.mjs      → 根 vitest 報 "No test suite found in file"
      //   - ftg-mcp/server.test.mjs  → 以 process.cwd() 解析 ftg-gen.js / ftg-mcp/server.js，
      //                                 被根 vitest 從倉庫根執行時報 MODULE_NOT_FOUND
      // 該套件由 ci.yml 的 "FTG-Tools test suite (node --test)" 步驟以 working-directory
      // apps/ftg-tools 執行（本機實測 5/5 pass），覆蓋率不減。
      'apps/ftg-tools/**/*.test.mjs',
      // OmniLive 萬能即時轉譯字幕測試以 Node 內建 test runner (node:test) 撰寫，非 vitest 套件：
      //   - server.test.mjs   → 根 vitest 報 "No test suite found in file"
      //   - subtitle.test.mjs → 同上
      // 兩者皆 import { test } from 'node:test'，由 apps/omnilive 自身的
      // `pnpm test` (= node --test test/*.test.mjs) 執行，覆蓋率不減。
      'apps/omnilive/test/**',
      // Self-Healing Engine 測試以 Node 內建 test runner (node:test) 撰寫，非 vitest 套件：
      //   - server.test.mjs → import { test } from 'node:test'，根 vitest 抓取時報
      //                       "No test suite found in file"
      // 由 apps/self-healing 自身的 `pnpm test` (= node --test test/*.test.mjs) 執行，
      // 該套件 dependencies 為空，純 Node 即可跑，覆蓋率不減。
      'apps/self-healing/test/**',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
});
