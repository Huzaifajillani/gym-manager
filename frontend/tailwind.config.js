/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gym: {
          dark: '#0a0d14',
          card: '#111622',
          border: '#1e293b',
          hover: '#1b2333',
          accent: '#eab308', // gold/yellow
          neon: '#22c55e',   // high-vis neon green
          red: '#ef4444',    // crimson warning
          cyan: '#06b6d4',   // electric cyan
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
