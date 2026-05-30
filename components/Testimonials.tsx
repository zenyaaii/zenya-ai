'use client'

import { motion } from 'framer-motion'
import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

type Testimonial = {
  name: string
  role: string
  text: string
  /** Brand accent for the avatar — matches the relevant business-type tint where possible. */
  color: string
}

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Alex M.',
    role: 'One-product brand · Berlin',
    text: "Launched in a weekend. The Storefront export landed in Shopify clean — sections, blocks, settings, all there.",
    color: '#5e6ad2',
  },
  {
    name: 'Élodie M.',
    role: 'Chef · Maison Lumière, NYC',
    text: "The Maison template made our menu finally feel like the room. Reservations went up the first month — no agency involved.",
    color: '#c8a96a',
  },
  {
    name: 'Priya N.',
    role: 'Founder · Atlas user, Singapore',
    text: "Atlas for our SaaS landing saved us weeks of dev. The copy AI wrote actually understood our pricing tiers — that surprised me.",
    color: '#5e6ad2',
  },
  {
    name: 'Maya R.',
    role: 'Apparel brand · London',
    text: "The Lookbook template is stunning. Customers constantly ask who designed our site. Worth the subscription on the first sale.",
    color: '#1c1c1c',
  },
  {
    name: 'Sara L.',
    role: 'Wellness studio · Austin',
    text: "I expected basic. I got a Wellness template that handles treatments, instructors, and gift cards out of the box. We were booking within a day.",
    color: '#14b8a6',
  },
  {
    name: 'Carlos T.',
    role: 'Local services · Madrid',
    text: "The Trade template nailed the quote-request flow. I tried three other AI builders before this — none came close.",
    color: '#f59e0b',
  },
]

export default function Testimonials() {
  return (
    <section className="relative py-28 border-b border-token">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-14"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Testimonials
          </p>
          <h2 className="text-[40px] font-[590] leading-[1.1] tracking-[-1.2px] text-foreground sm:text-[48px] sm:tracking-[-1.6px]">
            Trusted by{' '}
            <span className="gradient-text">2,400+ founders &amp; operators.</span>
          </h2>
        </motion.div>

        {/* Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-24px' }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={cn(
                'group rounded-xl border border-token bg-white p-5 transition-colors duration-150',
                'hover:bg-[#faf8f3]'
              )}
            >
              {/* Stars */}
              <div className="mb-4 flex gap-0.5">
                {Array(5).fill(0).map((_, si) => (
                  <Star key={si} className="h-3.5 w-3.5" fill="#d97706" stroke="none" />
                ))}
              </div>

              {/* Quote */}
              <p className="mb-5 text-[14px] leading-[1.65] text-foreground">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-2.5 border-t border-[#f0ede6] pt-4">
                <div
                  className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                  style={{ background: t.color }}
                >
                  {t.name[0]}
                </div>
                <div>
                  <div className="text-[13px] font-[590] text-foreground">{t.name}</div>
                  <div className="text-[12px] text-muted">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
