/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B0E11',
          surface: '#12161B',
          raised: '#181D24',
          border: '#232933'
        },
        parchment: {
          DEFAULT: '#EDEAE3',
          muted: '#9BA1AC',
          faint: '#6B7280'
        },
        brass: {
          DEFAULT: '#C9A227',
          light: '#E0BE52',
          dark: '#8F721A'
        },
        ledger: {
          teal: '#2DD4BF',
          red: '#DC5B4D'
        }
      },
      fontFamily: {
        display: ['"Fraunces"', 'Georgia', 'serif'],
        sans: ['"Public Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace']
      },
      keyframes: {
        tickIn: {
          '0%': { transform: 'scale(0) rotate(-20deg)', opacity: '0' },
          '60%': { transform: 'scale(1.2) rotate(4deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' }
        },
        rowRise: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        fadeUp: {
          '0%': { transform: 'translateY(16px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.5' },
          '50%': { opacity: '1' }
        }
      },
      animation: {
        tickIn: 'tickIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
        rowRise: 'rowRise 0.5s ease-out forwards',
        fadeUp: 'fadeUp 0.7s ease-out forwards',
        glowPulse: 'glowPulse 3s ease-in-out infinite'
      }
    }
  },
  plugins: []
}
