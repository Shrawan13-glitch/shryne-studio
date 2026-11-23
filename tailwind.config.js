/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#08080d', 900: '#0b0b12', 850: '#11111c', 800: '#171724', 700: '#222236' },
        brand: { 300: '#c4b5fd', 400: '#a78bfa', 500: '#8b5cf6', 600: '#7c3aed' },
        mint: { 400: '#6ee7b7', 500: '#34d399' },
      },
    },
  },
  plugins: [],
};
