/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  // El legacy arma las clases como literales completos: hay que escanearlo.
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#eff6ff', 100: '#dbeafe', 200: '#bfdbfe', 300: '#93c5fd',
          400: '#60a5fa', 500: '#3b82f6', 600: '#2563eb', 700: '#1d4ed8',
          800: '#1e40af', 900: '#1e3a8a'
        },
        dark: {
          bg: '#0f172a', surface: '#1e293b', card: '#334155',
          border: '#475569', text: '#f8fafc', muted: '#94a3b8'
        }
      }
    }
  },
  plugins: []
};
