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
        htb: {
          deepSea: 'var(--htb-deep-sea)',
          sprout: 'var(--htb-sprout)',
          charcoal: 'var(--htb-charcoal)',
          seaweed: 'var(--htb-seaweed)',
          paper: 'var(--htb-paper)',
        },
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
