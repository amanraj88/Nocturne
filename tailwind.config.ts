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
        // NOCTURNE Creative Direction v1.0 — Mineral / Oxide Palette
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
        coral: {
          DEFAULT: 'var(--color-coral)',
          subtle: 'var(--color-coral-subtle)',
        },
        green: {
          DEFAULT: 'var(--color-green)',
        },
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        // Backward-compatible alias for existing components
        serif: ['Syne', 'sans-serif'],
      },
      boxShadow: {
        'glow-lavender': '0 0 35px -8px rgba(160, 183, 168, 0.20)',
        'glow-album': '0 20px 50px -15px rgba(0, 0, 0, 0.8), 0 0 30px -8px rgba(160, 183, 168, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
