module.exports = {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'deep-sea': '#073B4C',
        'ocean-cyan': '#159A9C',
        'coral-red': '#C64B3C',
        'pasture-green': '#5F8463',
        'sand-white': '#F4F1E8',
        'tech-blue': '#2878B5',
        'evidence-gold': '#AE7B24',
        'ink-gray': '#172A32',
        // 傳統中文品牌
        'deep-blue': '#10243f',
        'warm-gold': '#c9a24b',
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        'lg': '12px',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
  // 禁用瀏覽器預設樣式
  corePlugins: {
    preflight: true,
  },
}