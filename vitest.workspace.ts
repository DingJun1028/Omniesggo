import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'vitest.config.ts',
  'apps/learning-center/vitest.config.js',
  // ftg-tours-website 自帶 happy-dom 測試環境（vite.config.js 的 test 區段：
  // environment、setupFiles、localStorage origin、長 timeout、備份目錄排除）。
  // 不掛進 workspace 時，其 UI 測試會被根 project（environment: 'node'）撈走，
  // 造成 window/document undefined（12 個）與 CWD 相對路徑 'src' 掃到倉庫根
  // 的舊 Dashboard 源碼（tap-targets 2 個）。
  'apps/ftg-tours-website/vite.config.js',
]);
