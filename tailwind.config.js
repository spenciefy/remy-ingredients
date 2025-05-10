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
        'custom-dark-panel': '#111111',
        'custom-dark-canvas': '#1D1D1D',
      },
    },
  },
  plugins: [],
}