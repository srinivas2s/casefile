/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        panel: '#111827',
        panelAlt: '#0f172a',
        border: '#1f2937',
        accent: '#34d399',
        accentSoft: '#0f766e',
        text: '#f8fafc',
        muted: '#94a3b8',
      },
      boxShadow: {
        soft: '0 10px 30px rgba(15, 23, 42, 0.25)',
      },
    },
  },
  plugins: [],
};
