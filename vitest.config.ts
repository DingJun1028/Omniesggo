import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // 5T-Trackable: 全域 testTimeout 由 5s（預設）放寬至 30s。
    //
    // 根因（2026-09-28 實測，非本機環境問題）: 多支測試以 top-level import
    // 載入 Next.js route / 掃描真實檔案系統 / 跑完整 delegation 生命週期，
    // 需 transpile + 初始化 Next runtime 或磁碟 I/O。在全量並行負載下
    // 實測需 5-17 秒，遠超 5s 預設 → 隨機失敗（flaky）。
    //
    // 證據: 完全相同的 `npx vitest run` 連跑，失敗數在 5 → 1 → 0 間跳動
    // （同一個 commit）。已排除回歸可能 —— git stash 隔離改動後同樣失敗。
    // 實測最慢者: api-health-tags 17.3s / audit-logger 9.9s /
    //              complete-delegation 9.4s / audit.test.ts 15.9s
    //
    // 為何全域而非逐檔加: 受影響檔案散落 6 檔 9 個 describe，逐檔補會漏，
    // 且下次新增測試又會踩。全域設定一次涵蓋（含未來新增的測試）。
    //
    // 為何不是無限放寬: 30s 已遠高於任何測試的合理執行時間（正常情況
    // 全部測試 < 1s），真正的 hang 仍會在此時限內被抓出，不至於讓 CI 掛死。
    testTimeout: 30_000,
    hookTimeout: 30_000,
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
      // Gateway WS 認證整合測試以腳本形式撰寫（頂層 await + record() + process.exit），
      // 非 vitest 套件：根 vitest 抓取時報 "No test suite found in file"，
      // 使整個 Vitest Tests job exit 1（本分支 2026-09-28 CI 紅燈根因）。
      // 由 ci.yml 的 "Run Gateway WS auth test (node script)" 步驟直接
      // `node apps/gateway/ws-auth.test.mjs` 執行（spawn 真 server + raw handshake），
      // 25/25 斷言覆蓋不減。
      'apps/gateway/ws-auth.test.mjs',
      // avatar-metrics 假 PASS 回歸測試以腳本形式撰寫（頂層 console.log + process.exit），
      // 非 vitest 套件：根 vitest 抓取時報 "No test suite found in file"，
      // 使 Vitest Tests job exit 1（2026-09-29 main 紅燈根因）。
      // 由 ci.yml 的 "Run avatar-metrics regression (node script)" 步驟直接執行。
      // 該測試具真實 gate（失敗時 process.exit(1)），已於沙箱注入缺陷實測可失敗，
      // 非永遠綠的假測試，覆蓋率不減。
      'scripts/avatar-metrics.reg.test.mjs',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@lib': path.resolve(__dirname, './src/lib'),
    },
  },
});
