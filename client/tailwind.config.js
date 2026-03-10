/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#FF6B6B',
        secondary: '#4ECDC4',
        dark: '#1A1A2E',
      },
      fontFamily: {
        urdu: ['Noto Nastaliq Urdu', 'serif'],
      }
    },
  },
  plugins: [],
}