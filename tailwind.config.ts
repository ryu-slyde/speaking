import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        base: '#0b1116',
        card: '#13202b',
        accent: '#5dd39e'
      }
    }
  },
  plugins: []
};

export default config;
