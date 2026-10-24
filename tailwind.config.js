/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dungeon: {
          darkest: '#08090c',
          bg: '#0d0e12',
          surface: '#15171e',
          card: '#1c1f28',
          border: '#2a2e3b',
          gold: '#d4af37',
          copper: '#c87d55',
          ember: '#ff6b35',
          flame: '#ff9233',
        }
      },
      fontFamily: {
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
