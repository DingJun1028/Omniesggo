// ── @esggo/tailwind-preset：ESGGO 設計代幣單一真相來源（Phase 2：三站收斂）─────
// 品牌色票（單一真相來源）
// 別名以「引用」而非「複製 hex」定義：改 sand，sunlight 自動跟著變。
// 複製 hex 會產生漂移風險，設計改色時漏改別名，畫面就會分裂。
export const ftgPalette = {
  green: '#2d4a3e',
  forest: '#1a3c34',
  leaf: '#4a7c59',
  sand: '#f5f0e8',
  cream: '#faf7f2',
  orange: '#e07a3d',
};

// 語意別名：程式語意名稱，對應到既有色票。
// 設計稿未給獨立色相，故不新增色值；若日後確認需要獨立色相，
// 只要改成自己的 hex 即可，所有呼叫端不需任何修改。
export const ftgAliases = {
  sunlight: ftgPalette.sand,     // Hero 暖白遮罩、手機卡片底
  deepgreen: ftgPalette.forest,  // streams 深綠底
};

// ── ESGGO 平台品牌代幣（ftg-journey-web 站內定義逐字照搬上移，2026-11-23）──
export const esggoPalette = {
  primary: {
    DEFAULT: '#10243f',
    50: '#f0f5fa',
    100: '#dce8f3',
    200: '#b8d0e6',
    300: '#8ab3d4',
    400: '#5a92be',
    500: '#3a74a3',
    600: '#2a5a82',
    700: '#1e4466',
    800: '#163350',
    900: '#10243f',
  },
  accent: {
    DEFAULT: '#c9a24b',
    50: '#fefce8',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    light: '#e0c87a',
    dark: '#a07f30',
  },
  warm: {
    50: '#f9f7f2',
    100: '#f3ede1',
    200: '#e8dfc9',
  },
};

// ── HTB 高科海藻品牌代幣（htb-esggo-co 站內定義逐字照搬上移，2026-11-23）──
// 註：htbPalette.sand 與 ftgPalette.sand 目前同值纯属巧合，兩品牌各自獨立演進，不做引用耦合。
export const htbPalette = {
  deepSea: '#0a2a4a',
  ocean: '#1f5fa3',
  seaweed: '#2d8a4e',
  sand: '#f5f0e8',
  sprout: '#4caf50',
  charcoal: '#333333',
  paper: '#ffffff',
};

/** @type {import('tailwindcss').Config} */
export const ftgPreset = {
  content: [],
  theme: {
    extend: {
      colors: {
        ftg: { ...ftgPalette, ...ftgAliases },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Noto Serif TC', 'serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export const esggoPreset = {
  content: [],
  theme: {
    extend: {
      colors: {
        primary: esggoPalette.primary,
        accent: esggoPalette.accent,
        warm: esggoPalette.warm,
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export const htbPreset = {
  content: [],
  theme: {
    extend: {
      colors: {
        htb: { ...htbPalette },
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default ftgPreset;
