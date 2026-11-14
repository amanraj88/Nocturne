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
        // Direction B v3 — Colourful Contemporary Brand Palette
        violet: {
          DEFAULT: '#8B5CF6',
          deep: '#7C3AED',
          light: '#DDD6FE',
          subtle: 'rgba(139, 92, 246, 0.15)',
        },
        pink: {
          DEFAULT: '#EC4899',
          subtle: 'rgba(236, 72, 153, 0.15)',
        },
        coral: {
          DEFAULT: '#FF5C8A',
          hover: '#FF477B',
          subtle: 'rgba(255, 92, 138, 0.15)',
        },
        cyan: {
          DEFAULT: '#06B6D4',
          subtle: 'rgba(6, 182, 212, 0.15)',
        },
        emerald: {
          DEFAULT: '#4ADE80',
          subtle: 'rgba(74, 222, 128, 0.15)',
        },
        amber: {
          DEFAULT: '#FBBF24',
          subtle: 'rgba(251, 191, 36, 0.15)',
        },

        // Theme Surfaces & Foundations
        'deep-ink': 'var(--color-deep-ink)',
        carbon: 'var(--color-carbon)',
        graphite: 'var(--color-graphite)',
        'warm-bone': 'var(--color-warm-bone)',
        ash: 'var(--color-ash)',
        mineral: {
          DEFAULT: 'var(--color-mineral)',
          subtle: 'var(--color-mineral-subtle)',
          glow: 'var(--color-mineral-glow)',
        },
        oxide: {
          DEFAULT: 'var(--color-oxide)',
          subtle: 'var(--color-oxide-subtle)',
        },

        // Backward-compatible aliases for existing components
        obsidian: 'var(--color-obsidian)',
        ivory: 'var(--color-ivory)',
        warm: {
          grey: 'var(--color-warm-grey)',
          dim: 'var(--color-dim-grey)',
        },
        lavender: {
          DEFAULT: 'var(--color-lavender)',
          subtle: 'var(--color-lavender-subtle)',
        },
        green: {
          DEFAULT: 'var(--color-green)',
        },
      },
      fontFamily: {
        headline: ['Plus Jakarta Sans', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Syne', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        serif: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        'glow-violet': '0 0 35px -8px rgba(139, 92, 246, 0.35)',
        'glow-coral': '0 0 35px -8px rgba(255, 92, 138, 0.35)',
        'glow-lavender': '0 0 35px -8px rgba(139, 92, 246, 0.20)',
        'glow-album': '0 20px 50px -15px rgba(0, 0, 0, 0.8), 0 0 30px -8px rgba(139, 92, 246, 0.20)',
      },
    },
  },
  plugins: [],
};

export default config;
