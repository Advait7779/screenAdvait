/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Montserrat"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['"Montserrat"', 'sans-serif'],
        heading: ['"Montserrat"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        /* ── Exact SuperAdmin / Company Admin palette ── */
        brand: {
          green:    '#15803d', /* green-700 — primary CTAs, active nav */
          greenDark:'#166534', /* green-800 — gradient end */
          greenLight:'#16a34a',/* green-600 — icons, links */
          greenXl:  '#22c55e', /* green-500 — vivid highlights */
          greenMuted:'#dcfce7',/* green-100 — pill / badge bg */
          greenBorder:'#bbf7d0',/* green-200 — pill border */
          greenText: '#14532d', /* green-900 — dark text on light bg */
          glow:     '#4ade80', /* green-400 — sidebar icon, live dot */
        },
        sidebar: {
          from: '#1a2e24',  /* dark forest green */
          to:   '#2d3748',  /* slate-700 */
        },
        surface: {
          body: '#f0f2f5',  /* page background */
          card: '#ffffff',  /* card / panel background */
          header:'#ffffff', /* top header bar */
          input: '#f9fafb', /* gray-50 — input fields */
          border:'#e5e7eb', /* gray-200 — borders */
          muted: '#6b7280', /* gray-500 — muted text */
          sub:   '#9ca3af', /* gray-400 — sub-labels */
        },
        text: {
          primary: '#111827', /* gray-900 */
          secondary:'#374151',/* gray-700 */
          muted:   '#6b7280', /* gray-500 */
          subtle:  '#9ca3af', /* gray-400 */
        },
      },
      backgroundImage: {
        'sidebar-gradient': 'linear-gradient(180deg, #1a2e24 0%, #2d3748 100%)',
        'sidebar-gradient-alt':'linear-gradient(180deg, #1e2d1e 0%, #2d3748 100%)',
        'green-gradient': 'linear-gradient(135deg, #15803d, #166534)',
        'green-gradient-soft': 'linear-gradient(135deg, #16a34a, #15803d)',
        'hero-gradient': 'linear-gradient(135deg, #1a2e24 0%, #15803d 45%, #166534 100%)',
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.07), 0 1px 2px -1px rgba(0,0,0,0.07)',
        'card-lg': '0 4px 16px -2px rgba(0,0,0,0.10), 0 2px 6px -2px rgba(0,0,0,0.06)',
        'green-glow': '0 4px 20px -4px rgba(21, 128, 61, 0.35)',
        'green-glow-lg': '0 8px 30px -6px rgba(21, 128, 61, 0.45)',
      },
      animation: {
        'fade-up': 'fadeUp 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
