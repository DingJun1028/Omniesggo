/** @type {import('tailwindcss').Config} */

// ── 品牌色票（單一真相來源）──────────────────────────────────────────
// 別名以「引用」而非「複製 hex」定義：改 sand，sunlight 自動跟著變。
// 複製 hex 會產生漂移風險 —— 設計改色時漏改別名，畫面就會分裂。
const ftgPalette = {
  green: '#2d4a3e',
  forest: '#1a3c34',
  leaf: '#4a7c59',
  sand: '#f5f0e8',
  cream: '#faf7f2',
  orange: '#e07a3d',
};

// 語意別名：程式語意名稱，對應到既有色票。
// 設計稿未給獨立色相，故不新增色值；若日後確認需要獨立色相，
// 只要在下方改成自己的 hex 即可，所有呼叫端不需任何修改。
const ftgAliases = {
  sunlight: ftgPalette.sand,     // Hero 暖白遮罩、手機卡片底
  deepgreen: ftgPalette.forest,  // streams 深綠底
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ftg: { ...ftgPalette, ...ftgAliases },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif TC', 'serif'],
      }
    },
  },
  plugins: [],
};
