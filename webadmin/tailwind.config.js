/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',
        secondary: '#14b8a6',
        accent: '#f59e0b',
        darkbg: '#0f172a',
      }
    },
  },
  plugins: [],
}

