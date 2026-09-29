import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // Windows 上 vitest 預設 forks pool 的子行程啟動會逾時
    // （[vitest-pool]: Failed to start forks worker / Timeout waiting for worker to respond），
    // 導致 Test Files: no tests。threads pool 共用主執行緒，無此問題。
    pool: 'threads',
  },
});
