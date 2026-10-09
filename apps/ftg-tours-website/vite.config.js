import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'happy-dom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    // 5T-Trustworthy: 給 happy-dom 一個真實 origin。
    //
    // 實測事故：happy-dom 預設 URL 是 'about:blank'，屬 opaque origin，
    // window.localStorage 會是 undefined（不是空物件）。而本專案的
    // LanguageContext 與 ErrorBoundary 都要讀 localStorage（'ftg_lang'），
    // 於是 home.test.jsx 6 個測試在 beforeEach 的 localStorage.clear()
    // 直接 TypeError 全滅 —— 測試紅燈跟產品行為無關，純粹是測試環境
    // 缺了一個瀏覽器本來就有的 API。
    //
    // 修法是補齊環境，不是改測試去 mock 掉：給一個 https origin，
    // localStorage/sessionStorage 就會照規格運作，日後要測語系持久化
    // 也不用再 special-case。
    environmentOptions: {
      happyDOM: {
        url: 'https://ftgtours.esggo.co',
      },
    },
    // 5T-Trustworthy: 測試必須 fail-closed，不能靠「運氣好」通過。
    //
    // 實測事故（本輪調整）：連續 8 次 pnpm run test:run 耗時落在
    // 12.4s – 73s，波動 6 倍。此時若沿用 vitest 預設 5s testTimeout，
    // 冷啟動那幾次會整批報紅 —— 紅燈與產品行為無關，純粹是 CI/本機
    // 負載尖峰。這種 flaky 閘比沒有閘更危險：開發者會學會重跑，
    // 於是真正的迴歸也被一起重跑掉。
    //
    // 30s 是實測上界的 2.5 倍餘裕：足以吸收負載尖峰，又仍會抓到真正
    // 死結（無限期等待），不會把 hang 變成通過。
    testTimeout: 30000,
    hookTimeout: 30000,
    teardownTimeout: 10000,
    // 實測事故：專案根目錄有 .src-backup-*/ .src-pregradient-*/ .img-backup-*/
    // 這類備份時，vitest 的預設 glob 會把它們裡的 *.test.js 一併收進來，
    // 導致「10 failed | 5 passed」的紅燈，而這些測試壓根沒有跟本次改動有關。
    // 備份目錄只是改動前的快照，不該參與驗證。
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/out/**',
      '**/coverage/**',
      '**/.git/**',
      // 本專案的備份/暫存目錄（以點開頭 + 時間戳結尾）
      '**/.src-backup-*/**',
      '**/.src-pregradient-*/**',
      '**/.img-backup-*/**',
      '**/.deploy-stage/**',
      '**/.font-cache/**',
      '**/.fontenv/**',
      '**/__pycache__/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
})