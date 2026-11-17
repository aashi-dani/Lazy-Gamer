/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        night: '#151528',
        panel: '#22223b',
        ink: '#fff7eb',
        muted: '#c0b9d1',
        gold: '#ffd36b',
        cyan: '#93eee9',
        lime: '#cced8b',
        coral: '#ffac95',
      },
      fontFamily: {
        sans: ['Nunito Variable', 'system-ui', 'sans-serif'],
        display: ['"Press Start 2P"', 'monospace'],
      },
    },
  },
}
