import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    include: ['vendor/**/*.test.{ts,js,mjs,tsx,jsx}'],
    exclude: ['**/node_modules/**'],
  },
});
