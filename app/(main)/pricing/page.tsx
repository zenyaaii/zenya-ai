'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { Check, ChevronDown, ArrowRight } from 'lucide-react'
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { cn } from '@/lib/utils'
import { affiliateClickHref } from '@/lib/affiliate'

const FAQS = [
  {
    q: 'What’s the difference between the one-time plan and the hosting plan?',
    a: 'The one-time $9.99 unlocks unlimited AI generations and exports — for the two e-commerce templates (Storefront, Collective) you connect or upload to your Shopify store; for the other templates you download the project ZIP and host wherever you like. The $19.99/month hosting plan adds Zenya hosting for the brochure templates (live URL, custom domain, no Zenya badge) plus everything in the one-time plan, billed monthly.',
  },
  {
    q: 'Is the one-time payment really one-time?',
    a: 'Yes. Pay $9.99 (or €9.99 in Europe, VAT included) once and the generator is yours for life. No renewal. Lifetime access to unlimited AI generations and exports.',
  },
  {
    q: 'What does Zenya hosting include?',
    a: 'A live site at zenya.app/s/your-slug for any brochure template (Atlas, Studio, Lookbook, Wellness, Trade, Restaurant, Maison), one connected custom domain (like mycoolstore.com), automatic SSL, fast CDN delivery, and removal of the “Made with Zenya” footer. E-commerce templates (Storefront, Collective) are not Zenya-hosted — they go to Shopify.',
  },
  {
    q: 'Can I cancel the hosting plan?',
    a: 'Yes, any time from your dashboard. Hosting stays active until the end of the current billing month, then your site stops resolving. Themes and exports you’ve generated stay in your account.',
  },
  {
    q: 'Do you offer a refund policy?',
    a: 'Yes. 14-day money-back guarantee on the one-time plan, and you can cancel the hosting plan at any time. See the full Refund Policy for details.',
  },
  {
    q: 'Which templates work where?',
    a: 'Two e-commerce templates — Storefront and Collective — export as Shopify OS 2.0 themes and run on Shopify (Shopify handles cart, checkout, products, payments). Don\'t have a Shopify store yet? You can start a free trial through our affiliate link below. The other six templates — Atlas, Studio, Lookbook, Wellness, Trade, Restaurant, Maison — are brochure/showcase sites that Zenya can host directly on the $19.99/mo plan.',
  },
] as const

const COMPARE = [
  { feature: 'Price',                zenya: '$9.99 once / $19.99 mo', other: '$29+/mo', agency: '$2,000+' },
  { feature: 'Setup Time',           zenya: 'Under 60 sec',           other: 'Minutes', agency: 'Weeks' },
  { feature: 'Templates',            zenya: '8 templates',            other: '1–2', agency: 'Custom' },
  { feature: 'Hosting included',     zenya: 'On $19.99 plan',         other: 'On most',  agency: 'You arrange' },
  { feature: 'Custom domain',        zenya: 'On $19.99 plan',         other: 'On most',  agency: 'Yes' },
  { feature: 'Shopify export',       zenya: 'On both paid',           other: 'Rare',     agency: 'Custom' },
  { feature: 'Platform lock-in',     zenya: 'None',                   other: 'High',     agency: 'None' },
] as const

const FREE_FEATURES = [
  '3 AI generations total',
  'All 8 templates available',
  'Preview your site at zenya.app',
  'Basic customization',
  'Community support',
]

const ONETIME_FEATURES = [
  'Unlimited AI generations',
  'All 8 premium templates',
  'Shopify OS 2.0 ZIP (Storefront + Collective)',
  'Static export ZIP (other templates)',
  'Priority AI generation',
  'Priority support',
  'Early access to new templates',
]

const HOSTING_FEATURES = [
  'Everything in One-time, plus:',
  'Zenya hosts your brochure sites',
  '1 connected custom domain',
  'Automatic SSL + CDN delivery',
  'Remove the “Made with Zenya” badge',
  'Site analytics in your dashboard',
  'Edit content anytime via AI prompts',
]

export default function PricingPage() {
  return (
    <main className="relative">
      <AuroraBackground fixed intensity={0.7} />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pb-32 pt-20">
        {/* Header */}
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
          <p className="mx-auto mt-4 max-w-xl text-[17px] leading-[1.65] text-muted">
            One AI generator, three ways to launch. Free to try. Pay once for the generator, or subscribe for full Zenya hosting.
          </p>
        </motion.div>

        {/* Pricing cards — three plans */}
        <div className="mx-auto mb-24 grid max-w-5xl gap-5 md:grid-cols-3">
          {/* Free */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col rounded-xl border border-token bg-white p-7 shadow-soft-sm"
          >
            <div className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Free
              </p>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-[42px] font-[590] leading-none tracking-[-1.4px] text-foreground">$0</span>
                <span className="text-[15px] text-muted">/forever</span>
              </div>
              <p className="text-[13.5px] text-muted">Try Zenya. See what AI can build.</p>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {FREE_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5f5f5d" />
                  <span className="text-[13px] text-muted">{feat}</span>
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

          {/* One-time */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col rounded-xl bg-white p-7"
            style={{
              border: '1px solid #5e6ad2',
              boxShadow: '0 0 0 1px #5e6ad2, 0 8px 24px rgba(94,106,210,0.16)',
            }}
          >
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
                One-time
              </p>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-[42px] font-[590] leading-none tracking-[-1.4px] gradient-text">
                  $9.99
                </span>
                <span className="text-[15px] text-muted">once</span>
              </div>
              <p className="text-[13.5px] text-muted">Lifetime generator. Export anywhere.</p>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {ONETIME_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5e6ad2" />
                  <span className="text-[13px] font-medium text-foreground">{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/checkout?plan=onetime"
              className={cn(
                'group inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary py-3 text-[14px] font-semibold text-white transition-all duration-150',
                'btn-shadow-primary hover:opacity-90 active:scale-[0.99]'
              )}
            >
              Get Lifetime Access
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <p className="mt-2.5 text-center text-[12px] text-muted">
              One-time payment · 14-day money-back guarantee
            </p>
          </motion.div>

          {/* Hosting */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex flex-col rounded-xl border border-token bg-white p-7 shadow-soft-sm"
          >
            <div className="mb-6">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
                Hosting
              </p>
              <div className="mb-2 flex items-baseline gap-1">
                <span className="text-[42px] font-[590] leading-none tracking-[-1.4px] text-foreground">$19.99</span>
                <span className="text-[15px] text-muted">/month</span>
              </div>
              <p className="text-[13.5px] text-muted">We host. You point your domain. Done.</p>
            </div>

            <ul className="mb-7 flex-1 space-y-3">
              {HOSTING_FEATURES.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5">
                  <CheckChip color="#5e6ad2" />
                  <span className="text-[13px] text-foreground">{feat}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/checkout?plan=hosting"
              className={cn(
                'group inline-flex w-full items-center justify-center gap-2 rounded-md border border-token bg-white py-3 text-[14px] font-semibold text-foreground transition-all duration-150',
                'hover:bg-black/5 active:scale-[0.99]'
              )}
              style={{ borderColor: '#5e6ad2', color: '#5e6ad2' }}
            >
              Start Hosting
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.5} />
            </Link>
            <p className="mt-2.5 text-center text-[12px] text-muted">
              Cancel anytime · Site stays live until end of month
            </p>
          </motion.div>
        </div>

        {/* Comparison table */}
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
              How we stack up against generic AI builders and traditional agencies.
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

        {/* FAQ */}
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

        {/* Shopify affiliate footer — sits below the FAQ as the natural
            "I just decided I want Storefront / Collective — what do I do
            about Shopify?" exit point. */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mx-auto mt-12 max-w-2xl"
        >
          <div className="rounded-xl border border-token bg-white px-5 py-4 text-center">
            <p className="text-[13.5px] text-foreground">
              Building a Storefront or Collective site and don’t have Shopify yet?{' '}
              <a
                href={affiliateClickHref('pricing_faq')}
                target="_blank"
                rel="sponsored noopener noreferrer"
                className="font-semibold text-[#008060] underline underline-offset-2 hover:opacity-80"
              >
                Start a free Shopify trial →
              </a>
            </p>
            <p className="mt-1 text-[11px] text-muted">
              Affiliate link — Zenya earns a small commission, no extra cost to you.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  )
}

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
