/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
          950: '#052E16',
        },
        ink: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
          950: '#020617',
        }
      },
      fontFamily: {
        sans:    ['var(--font-plus-jakarta)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-jetbrains)', 'monospace'],
      },
      boxShadow: {
        'card':   '0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)',
        'card-md':'0 4px 16px -2px rgb(0 0 0 / 0.08), 0 2px 6px -2px rgb(0 0 0 / 0.05)',
        'green':  '0 4px 14px -2px rgb(22 163 74 / 0.35)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      }
    },
  },
  plugins: [],
}
