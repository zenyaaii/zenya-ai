'use client'

import { motion } from 'framer-motion'
import { LayoutTemplate, PenLine, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'

const STEPS = [
  {
    num: '01',
    icon: LayoutTemplate,
    title: 'Pick your template',
    desc: 'Eight to choose from — restaurant, lookbook, SaaS landing, brand story, wellness, catalog, services, or one-product Shopify.',
    color: '#5e6ad2',
  },
  {
    num: '02',
    icon: PenLine,
    title: 'Share a brief or paste a URL',
    desc: 'Most templates take a short form — your menu, services, hours, etc. The one-product Shopify path just needs a product URL. Either way, AI takes it from there.',
    color: '#d97706',
  },
  {
    num: '03',
    icon: Rocket,
    title: 'Go live, instantly',
    desc: 'Get a hosted preview site you can ship today — or download a full Shopify OS 2.0 theme ZIP. Everything is editable.',
    color: '#27a644',
  },
] as const

export default function StepsSection() {
  return (
    <section className="relative py-28 border-b border-token">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-20 text-center"
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            How it works
          </p>
          <h2 className="text-[40px] font-[590] leading-[1.1] tracking-[-1.2px] text-foreground sm:text-[48px] sm:tracking-[-1.6px]">
            From idea to live website in{' '}
            <span className="gradient-text">three steps.</span>
          </h2>
        </motion.div>

        {/* Steps */}
        <div className="relative grid gap-px md:grid-cols-3">
          {/* Connecting line (desktop) */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] top-10 hidden h-px md:block"
            style={{
              background:
                'linear-gradient(90deg, rgba(94,106,210,0.3), rgba(217,119,6,0.3), rgba(39,166,68,0.3))',
            }}
          />

          {STEPS.map((step, i) => {
            const Icon = step.icon
            return (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.48, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className={cn(
                  'relative flex flex-col px-6 md:items-center md:text-center',
                  i > 0 && 'border-l border-token'
                )}
              >
                {/* Step number */}
                <div className="relative mb-6 flex-shrink-0">
                  <div
                    className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background"
                    style={{
                      background: `${step.color}12`,
                      border: `1px solid ${step.color}25`,
                      color: step.color,
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </div>
                  {/* Ghost number */}
                  <div
                    aria-hidden
                    className="absolute -left-3 -top-6 select-none text-[80px] font-[800] leading-none opacity-[0.035]"
                    style={{ color: step.color }}
                  >
                    {step.num}
                  </div>
                </div>

                <h3 className="mb-2 text-[16px] font-[590] text-foreground">{step.title}</h3>
                <p className="max-w-sm text-[14px] leading-relaxed text-muted">{step.desc}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Subtle footnote about the two flows */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mx-auto mt-16 max-w-2xl text-center text-[12.5px] text-muted"
        >
          The one-product <strong className="font-[590] text-foreground">Storefront</strong> template exports
          as a Shopify OS&nbsp;2.0 theme ZIP. The other seven ship as live, hosted sites on the Zenya domain.
        </motion.p>
      </div>
    </section>
  )
}
