
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', '-apple-system', 'BlinkMacSystemFont', '"SF Pro Text"', '"Noto Sans SC"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"SF Mono"', '"Noto Sans SC"', 'monospace'],
      },
      colors: {
        sidebar: 'var(--color-sidebar)', 
        canvas: 'var(--color-canvas)',
        panel: 'var(--color-panel)',
        accent: '#007AFF',
      },
      animation: {
        'aurora': 'aurora 20s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        aurora: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    }
  },
  plugins: [],
}
