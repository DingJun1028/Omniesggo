/** @type {import('tailwindcss').Config} */

// 設計代幣（primary/accent/warm 色票、字體）已上移至 @esggo/tailwind-preset
// 之 esggoPreset（單一真相來源，Phase 2）。本站以 presets 引用，行為與原站內定義完全等價。
import { esggoPreset } from '@esggo/tailwind-preset';

export default {
  presets: [esggoPreset],
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      borderRadius: {
        xl: '1rem',
        '2xl': '1.5rem',
        card: '1rem',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.05)',
        'card-hover': '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
      },
    },
  },
  plugins: [],
};
