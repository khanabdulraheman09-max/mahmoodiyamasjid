/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        islamic: {
          green: '#075B3A',
          dark: '#043A25',
          light: '#0D7B50',
          container: '#E4F3EC',
        },
        gold: {
          DEFAULT: '#D4AF37',
          dark: '#AA8A22',
          light: '#F7E7A9',
          container: '#FFF9E6',
        },
        charcoal: '#1A2420',
        muted: '#55655E',
        surface: {
          DEFAULT: '#FFFFFF',
          border: '#E2EBE5',
          background: '#F8FAF8',
        }
      },
      fontFamily: {
        arabic: ['Traditional Arabic', 'Scheherazade New', 'Amiri', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
