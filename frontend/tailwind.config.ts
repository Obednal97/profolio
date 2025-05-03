// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0b0b0c',
        foreground: '#ffffff',
        neon: '#39ff14',
        neonPink: '#ff00c8',
        neonPurple: '#bf00ff',
        card: '#1a1a1d',
      },
      boxShadow: {
        neon: '0 0 10px #39ff14, 0 0 20px #39ff14',
        pinkGlow: '0 0 10px #ff00c8, 0 0 20px #ff00c8',
      },
      transitionProperty: {
        height: 'height',
        spacing: 'margin, padding',
      },
    },
  },
  plugins: [],
};

export default config;