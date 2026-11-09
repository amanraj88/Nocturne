import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        obsidian: 'var(--color-obsidian)',
        plum: {
          base: 'var(--color-plum-base)',
          surface: 'var(--color-plum-surface)',
          subtle: 'var(--color-plum-subtle)',
          950: '#09080E',
          900: '#12101A',
          850: '#151320',
          800: '#191624',
          700: '#242033',
          600: '#322C46',
          500: '#463E60',
        },
        ivory: 'var(--color-ivory)',
        warm: {
          grey: 'var(--color-warm-grey)',
          dim: 'var(--color-dim-grey)',
        },
        lavender: {
          DEFAULT: 'var(--color-lavender)',
          subtle: 'var(--color-lavender-subtle)',
          400: '#B99AFF',
          500: '#9B72F7',
          300: '#D4C2FF',
        },
        coral: {
          DEFAULT: 'var(--color-coral)',
          subtle: 'var(--color-coral-subtle)',
          400: '#FF9582',
          500: '#FF806B',
        },
        green: {
          DEFAULT: 'var(--color-green)',
          400: '#38D39F',
        },
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'serif'],
        sans: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-telemetry)', 'monospace'],
      },
      boxShadow: {
        'glow-lavender': '0 0 35px -8px rgba(185, 154, 255, 0.25)',
        'glow-album': '0 20px 50px -15px rgba(0, 0, 0, 0.8), 0 0 30px -8px rgba(185, 154, 255, 0.15)',
      },
    },
  },
  plugins: [],
};

export default config;
