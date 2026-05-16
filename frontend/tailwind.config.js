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
          black: '#0A0A0A',
          dark: '#111111',
          gold: '#C9A84C',
          goldLight: '#D4AF37',
          teal: '#00CCBB',
        }
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hero': "linear-gradient(to bottom, rgba(10, 10, 10, 0.5), rgba(10, 10, 10, 1))",
      }
    },
  },
  plugins: [],
}
