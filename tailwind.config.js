/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: 'var(--bg-primary)',
        secondary: 'var(--bg-secondary)',
        textPrimary: 'var(--text-primary)',
        textSecondary: 'var(--text-secondary)',
        borderColor: 'var(--border-color)',
        accentTeal: 'var(--accent-teal)',
        accentGold: 'var(--accent-gold)',
        accentBlue: 'var(--accent-blue)',
        accentPurple: 'var(--accent-purple)',
        accentCyan: 'var(--accent-cyan)',
        accentGreen: 'var(--accent-green)',
        htb: {
          deepSea: 'var(--htb-deep-sea)',
          sprout: 'var(--htb-sprout-green)',
          charcoal: 'var(--htb-charcoal)',
          seaweed: 'var(--htb-seaweed-red)',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#009EB0',
          600: '#008596',
          700: '#006b7b',
        },
        amber: {
          50: '#fffbeb',
          100: '#fef3c7',
          400: '#D4AF37',
          500: '#f59e0b',
          600: '#d97706',
        },
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(34, 211, 238, 0.4), 0 0 40px rgba(34, 211, 238, 0.1)',
        'neon-emerald': '0 0 20px rgba(52, 211, 153, 0.4), 0 0 40px rgba(52, 211, 153, 0.1)',
        'neon-amber': '0 0 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(251, 191, 36, 0.1)',
      },
      animation: {
        'spin-slow': 'spin 8s linear infinite',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '.7', filter: 'brightness(1.2)' },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
};
