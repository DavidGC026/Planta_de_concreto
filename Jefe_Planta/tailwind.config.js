/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0055A5',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#002D72',
          foreground: '#ffffff',
        },
      },
    },
  },
  plugins: [],
};