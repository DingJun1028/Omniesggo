import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30_000,
    hookTimeout: 30_000,
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/archive/**',
      'archive/**',
      '**/__test__/**',
      '**/.kilo/**',
      '**/node_modules/**',
    ],
  },
});
