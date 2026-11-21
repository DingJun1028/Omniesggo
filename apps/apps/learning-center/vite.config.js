import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
  build: {
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        // vite 8 (rolldown) 要求 manualChunks 為 function；物件形式會拋
        // "TypeError: manualChunks is not a function"。維持原本分塊意圖。
        manualChunks(id) {
          if (id.includes('node_modules/firebase/')) return 'firebase';
          if (id.includes('node_modules/lucide-react/')) return 'lucide';
          return undefined;
        },
      },
    },
  },
});
