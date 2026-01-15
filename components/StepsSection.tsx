'use client'

import { motion } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'Paste Product URL',
    desc: 'Simply copy the link to your product from AliExpress, Amazon, or Shopify.',
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    )
  },
  {
    num: '02',
    title: 'AI Magic Happens',
    desc: 'Our AI analyzes the product, writes persuasive copy, and designs a high-converting layout.',
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    )
  },
  {
    num: '03',
    title: 'Launch & Sell',
    desc: 'Review your theme, make quick tweaks, and export the code to your store.',
    icon: (
      <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    )
  }
]

export default function StepsSection() {
  return (
    <section className="py-24 bg-surface relative overflow-hidden">
       {/* Connecting Line (Desktop) */}
      <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent -translate-y-12" />

      <div className="max-w-6xl mx-auto px-6 relative">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-extrabold text-foreground sm:text-4xl">
            From URL to Store in <span className="text-primary">3 Steps</span>
          </h2>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.2 }}
              className="relative flex flex-col items-center text-center p-6 bg-elevated rounded-2xl border border-token shadow-soft-sm z-10"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 text-primary rotate-3 transition-transform group-hover:rotate-6">
                {step.icon}
              </div>
              <div className="absolute -top-4 -right-4 text-6xl font-black text-surface-200/50 select-none z-0">
                {step.num}
              </div>
              <h3 className="text-xl font-bold text-foreground mb-3 z-10">{step.title}</h3>
              <p className="text-muted z-10">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
