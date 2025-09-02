/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        usogui: {
          red: '#e11d48',
          black: '#0a0a0a',
          purple: '#7c3aed',
          white: '#ffffff',
        },
        primary: '#e11d48',
        secondary: '#7c3aed',
        background: '#0a0a0a',
        foreground: '#ffffff',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-opti-goudy-text)', 'serif'],
        'opti-goudy-text': ['var(--font-opti-goudy-text)', 'serif'],
        'noto-sans': ['var(--font-noto-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}