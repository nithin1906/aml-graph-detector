/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        'bg-primary': '#0a0a0a',
        'bg-secondary': '#0f0f0f',
        'bg-tertiary': '#111111',
      },
    },
  },
  plugins: [],
}
