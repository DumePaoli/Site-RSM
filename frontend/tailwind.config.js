/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        rust: {
          50:  '#fdf2f2',
          100: '#fce4e4',
          200: '#f9c8c8',
          300: '#f49f9f',
          400: '#ec6666',
          500: '#c12814',
          600: '#a82010',
          700: '#8e1a0d',
          800: '#701510',
          900: '#5c120f',
        },
        surface: {
          950: '#090a0b',
          900: '#0d0f10',
          850: '#111416',
          800: '#161a1c',
          750: '#1b2022',
          700: '#222729',
          600: '#2e3336',
          500: '#4c4c4d',
          400: '#8a8a8b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
