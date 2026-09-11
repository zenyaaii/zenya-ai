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
  },
  /**
   * The typography plugin, because five pages already depend on it.
   *
   * app/en/{privacy,terms,cookies,refund,subprocessors} are each a long legal
   * document wrapped in `prose prose-neutral`. Without the plugin those two
   * classes compile to nothing at all - no error, no warning - and the pages
   * render as bare Preflight: every heading the same size as body text, no
   * paragraph spacing, no list markers. They have been shipping that way.
   *
   * The Arabic documents do not need it. They are rendered by
   * components/zenya/legal/LegalShell, which carries its own typography.
   */
  plugins: [require('@tailwindcss/typography')]
}

export default config
