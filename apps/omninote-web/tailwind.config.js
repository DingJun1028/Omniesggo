/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        omni: {
          alpha: "#00A896",
          sigma: "#0056B3",
          omega: "#D4AF37",
          omegaGlow: "#EEB21B",
          abyss: "#0F172A",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Segoe UI", "Noto Sans TC", "sans-serif"],
      },
    },
  },
  plugins: [],
};
