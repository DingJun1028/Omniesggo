/** @type {import('tailwindcss').Config} */

// 設計代幣（htb 色票、字體）已上移至 @esggo/tailwind-preset 之 htbPreset
// （單一真相來源，Phase 2）。本站以 presets 引用，行為與原站內定義完全等價。
import { htbPreset } from '@esggo/tailwind-preset';

export default {
  presets: [htbPreset],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  plugins: [],
};
