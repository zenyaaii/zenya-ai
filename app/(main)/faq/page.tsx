'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown, Sparkles, Globe, ArrowRight } from 'lucide-react'
import AuroraBackground from '@/components/marketing/AuroraBackground'
import { cn } from '@/lib/utils'
import { AR_FAQS, EN_FAQS, type QA } from './faq-data'

const EASE = [0.22, 1, 0.36, 1] as const

function FaqAccordion({ items, dir }: { items: QA[]; dir: 'rtl' | 'ltr' }) {
  return (
    <Accordion.Root type="single" collapsible className="space-y-2" dir={dir}>
      {items.map((faq, i) => (
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
                'flex w-full items-center justify-between gap-4 px-5 py-4 text-start outline-none',
                'focus-visible:ring-2 focus-visible:ring-primary/30'
              )}
            >
              <span className="text-[14.5px] font-[510] text-foreground">{faq.q}</span>
              <ChevronDown
                className="h-4 w-4 flex-shrink-0 text-muted transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-primary"
                strokeWidth={2}
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content
            className={cn(
              'overflow-hidden text-[13.5px] leading-[1.8] text-muted',
              'data-[state=open]:animate-[radix-acc-open_220ms_cubic-bezier(0.22,1,0.36,1)]',
              'data-[state=closed]:animate-[radix-acc-close_180ms_cubic-bezier(0.22,1,0.36,1)]'
            )}
          >
            <div className="px-5 pb-5">{faq.a}</div>
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  )
}

export default function FaqPage() {
  return (
    <main className="relative">
      <AuroraBackground fixed intensity={0.7} />

      <div className="relative z-10 mx-auto max-w-2xl px-6 pb-28 pt-20">
        {/* ── Hero ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mb-12 text-center"
        >
          <span className="mb-6 inline-flex items-center gap-1.5 rounded-full border border-[rgba(94,106,210,0.18)] bg-[rgba(94,106,210,0.08)] px-3 py-1 text-[12px] font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.25} />
            الأسئلة الشائعة
          </span>
          <h1 className="text-[38px] font-[590] leading-[1.15] tracking-[-1.4px] text-foreground sm:text-[48px] sm:tracking-[-1.8px]">
            أسئلة{' '}
            <span className="gradient-text">وأجوبة.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[16px] leading-[1.85] text-muted">
            كل ما تحتاج معرفته عن زينيا. لم تجد سؤالك؟{' '}
            <Link href="/contact" className="font-medium text-primary hover:underline">
              تواصل معنا
            </Link>
            .
          </p>
        </motion.div>

        {/* ── Arabic FAQs ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <FaqAccordion items={AR_FAQS} dir="rtl" />
        </motion.div>

        {/* ── English FAQs (crawlable LTR content) ── */}
        <section dir="ltr" className="mt-16 border-t border-token pt-12 text-left">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-[rgba(94,106,210,0.18)] bg-[rgba(94,106,210,0.08)] px-3 py-1 text-[12px] font-medium text-primary">
            <Globe className="h-3.5 w-3.5" strokeWidth={2.25} />
            FAQ (English)
          </span>
          <h2 className="mb-6 text-[26px] font-[590] tracking-[-0.8px] text-foreground">
            Frequently asked questions
          </h2>
          <FaqAccordion items={EN_FAQS} dir="ltr" />
        </section>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-16 flex flex-col items-center gap-3 rounded-2xl border border-token bg-white/70 p-8 text-center backdrop-blur"
        >
          <h2 className="text-[20px] font-[590] tracking-[-0.4px] text-foreground">
            جاهز لتجربة زينيا؟
          </h2>
          <p className="text-[14px] text-muted">ابدأ مجانًا — بلا بطاقة ائتمان.</p>
          <Link
            href="/login?mode=signup"
            className="group mt-1 inline-flex items-center gap-2 rounded-lg bg-primary px-7 py-3.5 text-[14.5px] font-semibold text-white btn-shadow-primary transition-all duration-200 hover:-translate-y-0.5"
          >
            ابدأ الإنشاء مجانًا
            <ArrowRight className="h-4 w-4 rtl-flip transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
          </Link>
        </motion.div>
      </div>
    </main>
  )
}
