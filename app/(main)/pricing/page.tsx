'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { Check, ChevronDown, ArrowRight } from 'lucide-react'
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { cn } from '@/lib/utils'

const FAQS = [
  {
    q: 'Can I cancel my subscription anytime?',
    a: "Yes, absolutely. Cancel from your dashboard at any time. You'll retain access until the end of your billing period — no charge afterward.",
  },
  {
    q: 'What happens to my websites if I cancel?',
    a: "Your sites stay live and your exported code (if any) is yours forever. You won't be able to create new AI sites until you resubscribe.",
  },
  {
    q: 'Do you offer a refund policy?',
    a: "We offer a 14-day money-back guarantee. If Zenya Pro doesn't deliver, just reach out to our support team — no questions asked.",
  },
  {
    q: 'Can I use templates for client projects?',
    a: 'Yes. Zenya Pro lets you use any generated website for both personal and commercial projects, including client work.',
  },
  {
    q: 'Which templates can I export as code?',
    a: "Only the Storefront template exports as a downloadable Shopify OS 2.0 theme ZIP (sections, blocks, settings_schema, the works). The other seven business templates — Maison, Atlas, Lookbook, Collective, Studio, Trade, and Wellness — ship as live hosted sites on the Zenya domain. We're working on broader export options.",
  },
  {
    q: 'How is this different from a website builder?',
    a: "Most builders give you a blank canvas. Zenya gives you a fully-written, fully-designed site that already understands your business type — restaurant menus, SaaS pricing tiers, treatment lists, lookbook galleries. You spend time editing, not building from zero.",
  },
] as const

const COMPARE = [
  { feature: 'Monthly Cost',      zenya: '$4.99',         other: '$29+',       agency: '$2,000+' },
  { feature: 'Setup Time',        zenya: 'Under 60 sec',  other: 'Minutes',    agency: 'Weeks'   },
  { feature: 'Templates Live',    zenya: '8 templates',   other: '1–2',        agency: 'Custom'  },
  { feature: 'Code Ownership',    zenya: 'Storefront ZIP', other: 'Locked in', agency: 'Yes'     },
  { feature: 'Platform Lock-in',  zenya: 'None',          other: 'High',       agency: 'None'    },
  { feature: 'Free Plan',         zenya: 'Forever free',  other: 'Trial only', agency: 'No'      },
  { feature: 'AI Customization',  zenya: 'Advanced',      other: 'Standard',   agency: 'Manual'  },
] as const

const FREE_FEATURES = [
  '3 AI websites total',
  'All 8 templates available',
  'Live preview mode',
  'Basic customization',
  'Community support',
]

const PRO_FEATURES = [
  'Unlimited AI websites',
  'All 8 premium templates',
  'Shopify OS 2.0 ZIP export (Storefront)',
  'Priority AI generation',
  'Remove Zenya branding',
  'Priority support',
  'Early access to new templates',
]

export default function PricingPage() {
  return (
    <main className="relative">
      {/* Fixed cream + indigo aurora wash behind the long scroll */}
      <AuroraBackground fixed intensity={0.7} />

      <div className="relative z-10 mx-auto max-w-5xl px-6 pb-32 pt-20">
        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-16 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[rgba(94,106,210,0.18)] bg-[rgba(94,106,210,0.08)] px-3 py-1 text-[12px] font-medium text-primary">
            Simple, transparent pricing
          </span>
          <h1 className="text-[46px] font-[590] leading-[1.08] tracking-[-1.6px] text-foreground sm:text-[58px] sm:tracking-[-2px]">
            Start free.{' '}
            <span className="gradient-text">Scale when ready.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-[17px] leading-[1.65] text-muted">
            No hidden fees, no lock-in. Eight templates on every plan. Pay only when you need more.
          </p>
        </motion.div>

        {/* ── Pricing cards ── */}
        <div className="mx-auto mb-24 grid max-w-3xl gap-5 md:grid-cols-2">
          {/* Starter */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col rounded-xl border border-token bg-white p-7 shadow-soft-sm"
          >
            <div className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Starter
              </p>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-[46px] font-[590] leading-none tracking-[-1.5px] text-foreground">$0</span>
                <span className="text-[15px] text-muted">/forever</span>
              </div>
              <p className="text-[13.5px] text-muted">Perfect for exploring Zenya&apos;s capabilities.</p>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {FREE_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5f5f5d" />
                  <span className="text-[13.5px] text-muted">{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/login?mode=signup"
              className={cn(
                'block w-full rounded-md border border-token bg-background py-3 text-center text-[14px] font-medium text-muted transition-all duration-150',
                'hover:bg-black/5 active:scale-[0.99]'
              )}
            >
              Get Started Free
            </Link>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col rounded-xl bg-white p-7"
            style={{
              border: '1px solid #5e6ad2',
              boxShadow: '0 0 0 1px #5e6ad2, 0 8px 24px rgba(94,106,210,0.16)',
            }}
          >
            {/* Most Popular badge */}
            <div
              className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-[11px] font-semibold text-white whitespace-nowrap"
              style={{
                boxShadow:
                  'rgba(255,255,255,0.20) 0px 0.5px 0px inset, rgba(94,106,210,0.50) 0px 0px 0px 0.5px inset',
              }}
            >
              Most Popular
            </div>

            <div className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary">
                Pro
              </p>
              <div className="mb-2 flex items-baseline gap-1">
                <span
                  className="text-[46px] font-[590] leading-none tracking-[-1.5px] gradient-text"
                >
                  $4.99
                </span>
                <span className="text-[15px] text-muted">/month</span>
              </div>
              <p className="text-[13.5px] text-muted">For serious founders ready to scale.</p>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {PRO_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5e6ad2" />
                  <span className="text-[13.5px] font-medium text-foreground">{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/checkout"
              className={cn(
                'group inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-[14px] font-semibold text-white transition-all duration-150',
                'btn-shadow-primary hover:opacity-90 active:scale-[0.99]'
              )}
            >
              Start 14-Day Free Trial
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <p className="mt-2.5 text-center text-[12px] text-muted">
              Cancel anytime · No questions asked
            </p>
          </motion.div>
        </div>

        {/* ── Comparison table ── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mb-24 max-w-4xl"
        >
          <div className="mb-10 text-center">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              Compare
            </p>
            <h2 className="text-[34px] font-[590] tracking-[-1px] text-foreground sm:text-[40px] sm:tracking-[-1.4px]">
              Why Zenya?
            </h2>
            <p className="mt-2 text-[15px] text-muted">
              See how we stack up against other AI builders and agencies.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-token bg-white shadow-soft-sm">
            <table className="w-full min-w-[520px] text-left">
              <thead>
                <tr className="border-b border-token">
                  <th className="px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.10em] text-muted">
                    Feature
                  </th>
                  <th
                    className="px-5 py-4 text-center text-[13px] font-[590] text-primary"
                    style={{ background: 'rgba(94,106,210,0.04)' }}
                  >
                    Zenya
                  </th>
                  <th className="px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.10em] text-muted">
                    Other AI
                  </th>
                  <th className="px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[0.10em] text-muted">
                    Agency
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i < COMPARE.length - 1 ? 'border-b border-[#f0ede6]' : ''}
                  >
                    <td className="px-5 py-3.5 text-[13.5px] font-medium text-foreground">{row.feature}</td>
                    <td
                      className="px-5 py-3.5 text-center text-[13.5px] font-[590] text-primary"
                      style={{ background: 'rgba(94,106,210,0.03)' }}
                    >
                      {row.zenya}
                    </td>
                    <td className="px-5 py-3.5 text-center text-[13.5px] text-muted">{row.other}</td>
                    <td className="px-5 py-3.5 text-center text-[13.5px] text-muted">{row.agency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ── FAQ (Radix Accordion) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto max-w-2xl"
        >
          <div className="mb-10 text-center">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
              FAQ
            </p>
            <h2 className="text-[34px] font-[590] tracking-[-1px] text-foreground sm:text-[40px] sm:tracking-[-1.4px]">
              Common questions
            </h2>
          </div>

          <Accordion.Root type="single" collapsible className="space-y-2">
            {FAQS.map((faq, i) => (
              <Accordion.Item
                key={i}
                value={`q-${i}`}
                className={cn(
                  'group overflow-hidden rounded-xl border border-token bg-white transition-all duration-150',
                  'data-[state=open]:border-[rgba(94,106,210,0.30)] data-[state=open]:bg-[rgba(94,106,210,0.04)]'
                )}
              >
                <Accordion.Header className="flex">
                  <Accordion.Trigger
                    className={cn(
                      'flex w-full items-center justify-between px-5 py-4 text-left outline-none',
                      'focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2'
                    )}
                  >
                    <span className="pr-4 text-[14px] font-[510] text-foreground">{faq.q}</span>
                    <ChevronDown
                      className="h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary"
                      strokeWidth={2}
                    />
                  </Accordion.Trigger>
                </Accordion.Header>
                <Accordion.Content
                  className={cn(
                    'overflow-hidden text-[13.5px] leading-[1.7] text-muted',
                    'data-[state=open]:animate-[radix-acc-open_220ms_cubic-bezier(0.22,1,0.36,1)]',
                    'data-[state=closed]:animate-[radix-acc-close_180ms_cubic-bezier(0.22,1,0.36,1)]'
                  )}
                >
                  <div className="px-5 pb-5">{faq.a}</div>
                </Accordion.Content>
              </Accordion.Item>
            ))}
          </Accordion.Root>
        </motion.div>
      </div>
    </main>
  )
}

/**
 * Small visual checkmark chip. The shadcn-style "circle with check inside"
 * pattern but using our color tokens.
 */
function CheckChip({ color }: { color: string }) {
  return (
    <div
      className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full"
      style={{ background: `${color}12`, border: `1px solid ${color}20` }}
    >
      <Check className="h-3 w-3" strokeWidth={2.5} style={{ color }} />
    </div>
  )
}
