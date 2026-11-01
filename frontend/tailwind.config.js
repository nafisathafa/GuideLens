/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        safety: {
          clear: '#10b981',    // Emerald-500
          caution: '#f59e0b',  // Amber-500
          warning: '#f97316',  // Orange-500
          danger: '#ef4444',   // Red-500
          offline: '#6b7280',  // Gray-500
        }
      },
      keyframes: {
        dangerPulse: {
          '0%, 100%': { opacity: 1, transform: 'scale(1)' },
          '50%': { opacity: 0.85, transform: 'scale(1.02)' },
        }
      },
      animation: {
        'danger-pulse': 'dangerPulse 1s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
