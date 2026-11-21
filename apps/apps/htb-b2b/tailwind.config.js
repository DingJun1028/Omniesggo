/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        htb: {
          green: '#84C341',
          'green-hover': '#73AB37',
          'green-light': '#F0F8E9',
          blue: '#4280BD',
          'blue-hover': '#366DA4',
          'blue-light': '#EBF3FA',
          gray: '#707070',
          dark: '#0E1B2E',
          gold: '#C9A24B'
        }
      }
    },
  },
  plugins: [],
}