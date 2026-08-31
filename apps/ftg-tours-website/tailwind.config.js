/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'ftg-forest': '#10243f',
        'ftg-green': '#3c6e47',
        'ftg-orange': '#c9a24b',
        'ftg-sand': '#f3ede1',
        'ftg-cream': '#f9f7f2',
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
