'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { LayoutTemplate, PenLine, Rocket } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal, RevealGroup, RevealItem } from '@/components/marketing/Reveal'

const STEPS = [
  {
    num: '01',
    icon: LayoutTemplate,
    title: 'اختر قالبك',
    desc: 'ثمانية للاختيار — مطعم، أو لوك بوك، أو صفحة هبوط لتطبيق، أو قصة علامة، أو عافية، أو كتالوج، أو خدمات، أو متجر شوبيفاي بمنتج واحد.',
    color: '#5e6ad2',
  },
  {
    num: '02',
    icon: PenLine,
    title: 'اكتب نبذة أو ألصق رابطًا',
    desc: 'تطلب معظم القوالب نموذجًا قصيرًا — قائمتك، وخدماتك، وساعات عملك، وغيرها. أما مسار شوبيفاي بمنتج واحد فيحتاج فقط رابط المنتج. وفي الحالتين، يتكفّل الذكاء الاصطناعي بالباقي.',
    color: '#d97706',
  },
  {
    num: '03',
    icon: Rocket,
    title: 'انطلق فورًا',
    desc: 'احصل على موقع معاينة مُستضاف يمكنك نشره اليوم — أو نزّل ملف ثيم شوبيفاي OS 2.0 كاملًا. كل شيء قابل للتعديل.',
    color: '#27a644',
  },
] as const

export default function StepsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 80%', 'end 60%'],
  })
  const lineScale = useTransform(scrollYProgress, [0, 1], [0, 1])

  return (
    <section className="relative py-28 border-b border-token">
      <div className="mx-auto max-w-6xl px-6">
        {/* Header */}
        <Reveal className="mb-20 text-center">
          <p className="kicker mb-4 justify-center">كيف يعمل</p>
          <h2 className="heading-ar text-[clamp(32px,5vw,50px)] text-foreground">
            من الفكرة إلى موقع مباشر في{' '}
            <span className="gradient-text">ثلاث خطوات.</span>
          </h2>
        </Reveal>

        {/* Steps */}
        <div ref={ref} className="relative">
          {/* Connecting line (desktop) — draws as you scroll */}
          <div
            aria-hidden
            className="pointer-events-none absolute left-[calc(16.67%+24px)] right-[calc(16.67%+24px)] top-10 hidden h-px md:block"
            style={{ background: 'rgba(28,28,28,0.06)' }}
          >
            <motion.div
              className="h-full w-full origin-right"
              style={{
                scaleX: lineScale,
                background:
                  'linear-gradient(90deg, rgba(94,106,210,0.55), rgba(217,119,6,0.55), rgba(39,166,68,0.55))',
              }}
            />
          </div>

          <RevealGroup className="grid gap-px md:grid-cols-3">
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <RevealItem
                  key={step.num}
                  className={cn(
                    'group relative flex flex-col px-6 md:items-center md:text-center',
                    i > 0 && 'border-s border-token'
                  )}
                >
                  {/* Step number */}
                  <div className="relative mb-6 flex-shrink-0">
                    <div
                      className="relative z-10 flex h-11 w-11 items-center justify-center rounded-full bg-background transition-transform duration-300 group-hover:scale-110"
                      style={{
                        background: `${step.color}12`,
                        border: `1px solid ${step.color}30`,
                        color: step.color,
                        boxShadow: `0 0 0 6px ${step.color}08`,
                      }}
                    >
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                    {/* Ghost number */}
                    <div
                      aria-hidden
                      className="absolute -left-3 -top-7 select-none text-[88px] font-[900] leading-none opacity-[0.05] tnum"
                      style={{ color: step.color }}
                    >
                      {step.num}
                    </div>
                  </div>

                  <h3 className="mb-2 text-[17px] font-bold text-foreground">{step.title}</h3>
                  <p className="max-w-sm text-[14px] leading-relaxed text-muted">{step.desc}</p>
                </RevealItem>
              )
            })}
          </RevealGroup>
        </div>

        {/* Subtle footnote about the two flows */}
        <Reveal delay={0.1} className="mx-auto mt-16 max-w-2xl">
          <p className="text-center text-[12.5px] text-muted">
            يُصدَّر قالب <strong className="font-bold text-foreground">المتجر</strong> بمنتج واحد كملف ثيم
            شوبيفاي OS&nbsp;2.0. أما القوالب السبعة الأخرى فتُنشَر كمواقع مباشرة مُستضافة على نطاق زينيا.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
