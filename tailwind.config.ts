import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--primary)',
          600: 'var(--primary-600)',
          500: 'var(--primary-500)',
          400: 'var(--primary-400)'
        },
        secondary: {
          DEFAULT: 'var(--secondary)'
        },
        accent: {
          DEFAULT: 'var(--accent)'
        },
        background: 'var(--background)',
        surface: 'var(--surface)',
        elevated: 'var(--elevated)',
        foreground: 'var(--foreground)',
        muted: 'var(--muted)',
        subtle: 'var(--subtle)',
        border: 'var(--border)',
        borderMuted: 'var(--border-muted)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)'
      },
      boxShadow: {
        'soft-sm': 'var(--shadow-sm)',
        'soft-md': 'var(--shadow-md)',
        'soft-lg': 'var(--shadow-lg)',
        'soft-xl': 'var(--shadow-xl)'
      }
    }
  }
}

export default config
