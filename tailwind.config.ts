import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        midnight: {
          950: '#06050A',
          900: '#0B0A10',
          850: '#100E17',
          800: '#13111C',
        },
        plum: {
          900: '#171521',
          800: '#211D2B',
          700: '#2B2538',
          600: '#3A324C',
          500: '#52486C',
        },
        lavender: {
          300: '#D6C7FF',
          400: '#B99AFF',
          500: '#9B72F7',
          600: '#7F4DE8',
        },
        coral: {
          400: '#FF9E8D',
          500: '#FF806B',
          600: '#F25E46',
        },
        lime: {
          300: '#E2F988',
          400: '#D4F36A',
          500: '#B8DB42',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
        'subtle-drift': 'drift 12s ease-in-out infinite alternate',
        'equalizer': 'equalize 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        pulseSlow: {
          '0%, 100%': { transform: 'scale(1)', opacity: '0.9' },
          '50%': { transform: 'scale(1.025)', opacity: '1' },
        },
        drift: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '100%': { transform: 'translate(12px, -8px) scale(1.04)' },
        },
        equalize: {
          '0%': { height: '15%' },
          '50%': { height: '85%' },
          '100%': { height: '40%' },
        },
      },
      boxShadow: {
        'glow-lavender': '0 0 50px -10px rgba(185, 154, 255, 0.3)',
        'glow-coral': '0 0 50px -10px rgba(255, 128, 107, 0.25)',
        'glow-album': '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 45px -10px rgba(185, 154, 255, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
