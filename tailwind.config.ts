import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#080c14',
          card: '#0d1320',
          elevated: '#131b2e',
          accent: '#162032',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        wish: ['var(--font-wish)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
