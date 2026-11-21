/** @type {import('tailwindcss').Config} */

// 設計代幣（品牌色票、字體）已上移至 @esggo/tailwind-preset 單一真相來源。
// 各站 tailwind.config.js 以 presets 引用，行為與原站內定義完全等價。
import tailwindPreset from '@esggo/tailwind-preset';

export default {
  presets: [tailwindPreset],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
};
