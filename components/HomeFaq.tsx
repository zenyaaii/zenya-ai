'use client'

import Link from 'next/link'
import * as Accordion from '@radix-ui/react-accordion'
import { ChevronDown, ArrowLeft } from 'lucide-react'
import { Reveal } from '@/components/marketing/Reveal'
import { cn } from '@/lib/utils'
import { AR_FAQS } from '@/app/(main)/faq/faq-data'

/** Homepage FAQ teaser — shows the top questions and links to the full /faq
 *  page. Shares the same source data as /faq so answers never drift. */
export default function HomeFaq() {
  const items = AR_FAQS.slice(0, 6)
  return (
    <section className="relative border-b border-token py-28">
      <div className="mx-auto max-w-2xl px-6">
        <Reveal>
          <div className="mb-10 text-center">
            <p className="kicker mb-3">أسئلة شائعة</p>
            <h2 className="heading-ar text-[clamp(26px,4.5vw,40px)] text-foreground">
              أسئلة{' '}
              <span className="gradient-text">وأجوبة.</span>
            </h2>
          </div>
        </Reveal>

        <Reveal>
          <Accordion.Root type="single" collapsible className="space-y-2">
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
                  <Accordion.Trigger className="flex w-full items-center justify-between gap-4 px-5 py-4 text-start outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
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
        </Reveal>

        <Reveal>
          <div className="mt-8 text-center">
            <Link
              href="/faq"
              className="group inline-flex items-center gap-1.5 text-[14px] font-semibold text-primary transition hover:gap-2.5"
            >
              شاهد كل الأسئلة
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
