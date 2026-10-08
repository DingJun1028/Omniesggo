/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        htb: {
          deepSea: '#0a2a4a',
          ocean: '#1f5fa3',
          seaweed: '#2d8a4e',
          sand: '#f5f0e8',
          sprout: '#4caf50',
          charcoal: '#333333',
          paper: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Noto Sans TC', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
