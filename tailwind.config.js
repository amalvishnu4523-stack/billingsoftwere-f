/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eef2f8',
          100: '#d5e0ef',
          200: '#abc1df',
          300: '#81a2cf',
          400: '#5783bf',
          500: '#2d64af',
          600: '#1a3a5c',
          700: '#152e49',
          800: '#102336',
          900: '#0b1723',
          DEFAULT: '#1a3a5c',
          light: '#2a5080',
          dark:  '#102336',
        },
        secondary: {
          DEFAULT: '#e67e22',
          light:   '#f39c12',
          dark:    '#d35400',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    require('@tailwindcss/forms'),
  ],
};
