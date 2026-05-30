'use client'

import { cn } from '@/lib/utils'

type StackItem = { name: string; icon: React.ReactNode }

const STACK: StackItem[] = [
  {
    name: 'Shopify',
    icon: (
      <svg viewBox="0 0 109 124" className="h-4 w-4" fill="currentColor">
        <path d="M74.7 14.8s-.3-1.2-1.5-1.2c0 0-11.4-.7-11.4-.7s-7.6-7.4-8.4-8.1c-.8-.7-2.3-.5-2.9-.3l-4 1.2C45.1 3.6 43 3 40.7 3c-7.2 0-10.7 9-11.8 13.6-2.8.9-4.8 1.5-5.1 1.6-1.6.5-1.6.5-1.8 2-.2 1.1-9 69.3-9 69.3l67.6 11.7 29.1-7.3L74.7 14.8zm-22.4-6.2c-1.9.6-4 1.2-6.2 1.9 1.2-4.6 3.6-6.8 5.7-7.7.6 1.5 1.2 3.7.5 5.8z" />
      </svg>
    ),
  },
  {
    name: 'OpenAI',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z" />
      </svg>
    ),
  },
  {
    name: 'Stripe',
    icon: (
      <svg viewBox="0 0 60 25" className="h-3 w-8" fill="currentColor">
        <path d="M59.64 10.28c0-5.3-3.95-9.67-9.67-9.67-6.03 0-9.87 4.2-9.87 9.87 0 3.3 1.3 5.76 3.4 7.3l-2.07 3.3c-2.4-1.9-4.3-5.5-4.3-10.6C37.13 4.2 41.53 0 47.97 0c8.2 0 13.8 5.7 13.8 13.6 0 1.2-.1 2.3-.3 3.3H41.53c.4 4.1 3.5 6.4 7.4 6.4 2.5 0 4.5-1 5.9-2.6l2.7 2.8z" />
      </svg>
    ),
  },
  {
    name: 'Supabase',
    icon: (
      <svg viewBox="0 0 109 113" className="h-4 w-4" fill="currentColor">
        <path d="M63.7 110.284c-2.788 3.507-8.397 1.571-8.543-2.938l-1.905-65.956H98.765c7.576 0 11.784 8.763 7.043 14.72L63.7 110.284z" />
        <path
          opacity=".5"
          d="M45.317 2.716c2.788-3.507 8.397-1.571 8.543 2.938l1.905 65.956H10.235C2.659 71.61-1.549 62.847 3.192 56.89L45.317 2.716z"
        />
      </svg>
    ),
  },
  {
    name: 'Next.js',
    icon: (
      <svg viewBox="0 0 180 180" className="h-4 w-4" fill="currentColor">
        <mask id="mnl" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="180" height="180">
          <circle cx="90" cy="90" r="90" fill="black" />
        </mask>
        <g mask="url(#mnl)">
          <circle cx="90" cy="90" r="90" fill="black" />
          <path d="M149.508 157.52L69.142 54H54V125.97H66.1V69.677L139.504 164.544z" fill="white" />
          <rect x="115" y="54" width="12" height="72" fill="white" />
        </g>
      </svg>
    ),
  },
  {
    name: 'Vercel',
    icon: (
      <svg viewBox="0 0 76 65" className="h-3.5 w-4" fill="currentColor">
        <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
      </svg>
    ),
  },
  {
    name: 'Claude',
    icon: (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
      </svg>
    ),
  },
]

export default function Logos() {
  return (
    <section className="relative border-y border-token py-10">
      <div className="mx-auto max-w-5xl px-6">
        <p className="mb-6 text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
          Built on the modern commerce &amp; AI stack
        </p>
        <div className="relative overflow-hidden">
          <div className="flex items-center gap-12 marquee-track" style={{ width: 'max-content' }}>
            {[...STACK, ...STACK].map((logo, i) => (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap text-muted opacity-60 transition-all duration-200',
                  'hover:text-foreground hover:opacity-100'
                )}
              >
                {logo.icon}
                <span className="text-[13px] font-medium">{logo.name}</span>
              </div>
            ))}
          </div>
          {/* Fade edges */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-16"
            style={{ background: 'linear-gradient(90deg,#f7f4ed,transparent)' }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-16"
            style={{ background: 'linear-gradient(-90deg,#f7f4ed,transparent)' }}
          />
        </div>
      </div>
    </section>
  )
}
