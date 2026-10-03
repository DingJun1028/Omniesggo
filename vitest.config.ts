import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import path from 'path';
import fs from 'node:fs';

/**
 * 5T Trackable — 補齊 tsconfig `paths` 的順位 fallback 語意。
 *
 * 根因（2026-10-02 實測）: tsconfig.json 宣告
 *     "@lib/*": ["./src/lib/*", "./lib/*"]
 * 是「依序 fallback」陣列 —— `@lib/redis` 在 src/lib/ 找不到時，改解析到根目錄
 * `lib/redis/`（真實存在）。Next.js build 讀 tsconfig，故 production build 通過；
 * 舊的 resolve.alias 是單一映射（'@lib' → ./src/lib），Vite alias「先符合者勝」
 * 而非「不存在就往下一順位」，於是 @lib/redis 解析失敗：
 *     Error: Cannot find package '@lib/redis' imported from
 *     src/core/services/async-task-manager.ts
 * 症狀：任何 transitively import @lib/redis 的測試整檔載入失敗（0 test），
 * 與測試內容無關 —— 基礎設施脆弱性，會隨每個新測試復發。
 *
 * 修法取捨（全部實測過，勿走回頭路）:
 *   1. resolve.tsconfigPaths: true（Vite 8 原生）   → 無效，@/ 與 @lib/ 全滅
 *   2. vite-tsconfig-paths 套件                      → 被載入但未解析，同樣全滅
 *   3. 保留 resolve.alias 的 '@'，'@lib' 交由此 plugin → 本行
 * 關鍵：Vite 內建 alias plugin 先於一般 pre-plugin 執行，故 '@lib' 必須
 * 從 alias 移除才輪得到本 resolver；'@' 則維持 alias（既有數百測試依賴）。
 */
function tsconfigPathsFallback(): Plugin {
  const roots = [path.resolve(__dirname, './src/lib'), path.resolve(__dirname, './lib')];
  const candidates = (base: string): string[] => [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    `${base}.mts`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
  ];
  return {
    name: 'esggo:tsconfig-paths-fallback',
    enforce: 'pre',
    resolveId(source) {
      if (source !== '@lib' && !source.startsWith('@lib/')) return null;
      const sub = source === '@lib' ? '' : source.slice('@lib/'.length);
      if (!sub) return null;
      for (const root of roots) {
        for (const candidate of candidates(path.join(root, sub))) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
        }
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [tsconfigPathsFallback()],
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
      // 根目錄 e2e/ 是 Playwright 套件（playwright.config.ts 的 testDir: './e2e'），
      // 檔名 *.spec.ts 命中 vitest 預設 include 會被誤抓，報
      // "Cannot find package '@playwright/test'" (ERR_MODULE_NOT_FOUND)。
      // 該套件由 `pnpm run test:e2e`（playwright test）執行，非 vitest。
      'e2e/**',
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
      // 保留 '@'：既有數百測試依賴此映射。
      // 不得宣告 '@lib' —— Vite 內建 alias plugin 優先於一般 pre-plugin，
      // 會擋掉 tsconfigPathsFallback() 的順位 fallback（實測）。
      '@': path.resolve(__dirname, './src'),
    },
  },
});
