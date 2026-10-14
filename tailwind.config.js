/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
      },
      colors: {
        ink: '#070810',
        paper: '#F0EDE8',
        stroke: '#D4622A',
        trace: '#39C9A8',
      },
    },
  },
  plugins: [],
}

