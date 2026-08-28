/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'system-ui', 'sans-serif'],
      },
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
