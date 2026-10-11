import { defineConfig } from 'vitest/config';

// oneringai 套件自己的 vitest 設定。
// 只收 tests/unit/ 的 vitest 套件；tests/index.test.ts 是自製 harness
// （逐項呼叫 + TestResult，無 describe/it），不被 vitest 執行。
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    testTimeout: 30_000,
  },
});
