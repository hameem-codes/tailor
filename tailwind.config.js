/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#1DA84A',
          accent: '#4ADE80',
          rulerGreen: '#34C759',
          amber: '#FBBF24',
          red: '#F87171',
          redMuted: '#FCA5A5',
          darkBg: '#0a0a0b',
          midBg: '#141517',
          lightBg: '#454b52',
          card: 'rgba(32,32,35,0.82)',
          cardBorder: 'rgba(255,255,255,0.12)',
          secText: '#D6D6DC',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        condensed: ['"Barlow Condensed"', 'sans-serif'],
      },
      borderRadius: {
        'card': '28px',
        'pill': '22px',
      },
      keyframes: {
        fd: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        gr: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        sl: {
          '0%': { left: '0' },
        },
        sm: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        pg: {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        }
      },
      animation: {
        'fade-in': 'fd 0.5s both',
        'grow': 'gr 0.8s 0.2s both',
        'slide-dot': 'sl 0.9s 0.2s both',
        'shimmer': 'sm 1.4s linear infinite',
        'progress': 'pg 2.2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}

