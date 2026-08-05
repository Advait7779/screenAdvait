/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        heading: ['"Inter"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"Inter"', 'ui-monospace', 'monospace'],
      },
      colors: {
        dark: {
          DEFAULT: '#070C18',
          card: '#0F172A',
          border: '#1E2D45',
        },
        amber: {
          DEFAULT: '#F59E0B',
          light: '#FBBF24',
          dark: '#D97706',
        },
      },
    },
  },
  plugins: [],
};
