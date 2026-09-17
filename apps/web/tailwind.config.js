/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
        colors: {
        canvas: 'var(--bg-canvas)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        muted: 'var(--bg-muted)',
        ink: 'var(--ink)',
        forest: 'var(--forest)',
        mist: 'var(--mist)',
        fg: {
          DEFAULT: 'var(--fg)',
          soft: 'var(--fg-soft)',
          muted: 'var(--fg-muted)',
          invert: 'var(--fg-invert)',
        },
        line: 'var(--border)',
        accent: {
          DEFAULT: 'var(--accent)',
          soft: 'var(--accent-soft)',
          fg: 'var(--accent-fg)',
        },
        warn: {
          DEFAULT: 'var(--warn)',
          soft: 'var(--warn-soft)',
        },
        live: {
          DEFAULT: 'var(--live)',
          soft: 'var(--live-soft)',
        },
        chrome: {
          DEFAULT: 'var(--chrome)',
          fg: 'var(--chrome-fg)',
          muted: 'var(--chrome-muted)',
        },
      },
      fontFamily: {
        display: ['Syne', 'Manrope', 'system-ui', 'sans-serif'],
        sans: ['Syne', 'Manrope', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'monospace'],
      },
      boxShadow: {
        soft: 'var(--shadow-soft)',
        lift: 'var(--shadow-lift)',
        glow: 'var(--shadow-glow)',
      },
      borderRadius: {
        panel: '0.5rem',
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-scale': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        orbit: {
          to: { transform: 'rotate(360deg)' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.45', transform: 'scale(0.85)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) both',
        'rise-delay': 'rise-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both',
        'rise-late': 'rise-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
        'fade-scale': 'fade-scale 0.35s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 8s linear infinite',
        orbit: 'orbit 60s linear infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
