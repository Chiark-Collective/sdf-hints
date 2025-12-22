// ABOUTME: Tailwind CSS configuration
// ABOUTME: Includes custom colors for SDF labeling (solid/empty)

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        slideIn: 'slideIn 150ms ease-out',
        fadeOut: 'fadeOut 100ms ease-in',
        swipeOut: 'swipeOut 100ms ease-out',
        spin: 'spin 1s linear infinite',
      },
      keyframes: {
        slideIn: {
          from: { transform: 'translateX(calc(100% + 1rem))' },
          to: { transform: 'translateX(0)' },
        },
        fadeOut: {
          from: { opacity: '1' },
          to: { opacity: '0' },
        },
        swipeOut: {
          from: { transform: 'translateX(var(--radix-toast-swipe-end-x))' },
          to: { transform: 'translateX(calc(100% + 1rem))' },
        },
      },
      colors: {
        // SDF label colors
        solid: {
          DEFAULT: '#3b82f6',  // blue-500
          light: '#60a5fa',
          dark: '#2563eb',
        },
        empty: {
          DEFAULT: '#f97316',  // orange-500
          light: '#fb923c',
          dark: '#ea580c',
        },
        surface: {
          DEFAULT: '#22c55e',  // green-500
          light: '#4ade80',
          dark: '#16a34a',
        },
        unlabeled: {
          DEFAULT: '#9ca3af',  // gray-400
          light: '#d1d5db',
          dark: '#6b7280',
        },
      },
    },
  },
  plugins: [],
}
