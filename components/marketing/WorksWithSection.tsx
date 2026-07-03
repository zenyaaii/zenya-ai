'use client'

import { motion, useReducedMotion } from 'framer-motion'
import {
  ShoppingBag,
  Camera,
  MessageCircle,
  MapPin,
  CreditCard,
  Globe,
  Mail,
  Music2,
  type LucideIcon,
} from 'lucide-react'
import { Reveal } from '@/components/marketing/Reveal'

/**
 * WorksWithSection — "يعمل مع كل ما يهمّ نشاطك".
 *
 * A ring of neumorphic bubbles (quso.ai-style, in our cream/indigo palette)
 * around a centred heading. Every bubble is something a Zenya-generated site
 * ACTUALLY connects to — no fabricated integrations: a Shopify export, social
 * links, an embedded Google map, online payments, a custom domain, email
 * capture. Honest and on-brand.
 */

const EASE = [0.22, 1, 0.36, 1] as const

type Tool = { icon: LucideIcon; label: string; color: string; x: number; y: number }

// Positions are % within the constellation box; the center heading sits at 50/50.
const TOOLS: Tool[] = [
  { icon: ShoppingBag, label: 'شوبيفاي', color: '#95bf47', x: 12, y: 20 },
  { icon: Camera, label: 'إنستغرام', color: '#e1306c', x: 50, y: 8 },
  { icon: MessageCircle, label: 'واتساب', color: '#25d366', x: 88, y: 20 },
  { icon: MapPin, label: 'خرائط جوجل', color: '#ea4335', x: 6, y: 55 },
  { icon: CreditCard, label: 'مدفوعات', color: '#5e6ad2', x: 94, y: 55 },
  { icon: Music2, label: 'تيك توك', color: '#1c1c1c', x: 16, y: 88 },
  { icon: Globe, label: 'نطاق خاص', color: '#0ea5e9', x: 50, y: 96 },
  { icon: Mail, label: 'بريد وقوائم', color: '#f59e0b', x: 84, y: 88 },
]

function Bubble({ tool, delay }: { tool: Tool; delay: number }) {
  const reduce = useReducedMotion()
  const Icon = tool.icon
  return (
    <motion.div
      className="absolute z-10 flex flex-col items-center gap-1.5"
      style={{ left: `${tool.x}%`, top: `${tool.y}%`, transform: 'translate(-50%, -50%)' }}
      initial={{ opacity: 0, scale: 0.8 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      <motion.div
        animate={reduce ? {} : { y: [0, -7, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay }}
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white sm:h-16 sm:w-16"
        style={{ boxShadow: '0 14px 30px -10px rgba(28,28,28,0.25), inset 0 1px 0 rgba(255,255,255,0.9)', border: '1px solid #efece3' }}
      >
        <Icon className="h-6 w-6 sm:h-7 sm:w-7" strokeWidth={1.75} style={{ color: tool.color }} />
      </motion.div>
      <span className="text-[11px] font-semibold text-muted">{tool.label}</span>
    </motion.div>
  )
}

export default function WorksWithSection() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      <div className="mx-auto max-w-5xl px-6">
        {/* ── Desktop ring ── */}
        <div className="relative hidden h-[440px] md:block">
          {TOOLS.map((t, i) => (
            <Bubble key={t.label} tool={t} delay={0.05 * i} />
          ))}

          {/* Center heading */}
          <div className="absolute left-1/2 top-1/2 z-20 w-[360px] -translate-x-1/2 -translate-y-1/2 text-center">
            <Reveal>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-primary">تكامل حقيقي</p>
              <h2 className="display-ar text-[clamp(30px,4.4vw,46px)] leading-[1.15] text-foreground">
                يتصل بكل ما
                <br />
                يهمّ عملاءك.
              </h2>
              <p className="mx-auto mt-4 max-w-sm text-[15px] leading-7 text-muted">
                موقعك من زينيا يربط متجرك، وحساباتك على التواصل، وخريطتك، ومدفوعاتك — في مكان واحد
                يبدو احترافيًا.
              </p>
            </Reveal>
          </div>
        </div>

        {/* ── Mobile: heading + wrapped bubbles ── */}
        <div className="md:hidden">
          <div className="text-center">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.32em] text-primary">تكامل حقيقي</p>
            <h2 className="display-ar text-[32px] leading-[1.15] text-foreground">يتصل بكل ما يهمّ عملاءك.</h2>
            <p className="mx-auto mt-4 max-w-sm text-[15px] leading-7 text-muted">
              موقعك من زينيا يربط متجرك، وحساباتك على التواصل، وخريطتك، ومدفوعاتك — في مكان واحد.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-5">
            {TOOLS.map((t) => {
              const Icon = t.icon
              return (
                <div key={t.label} className="flex flex-col items-center gap-1.5">
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-white"
                    style={{ boxShadow: '0 12px 26px -10px rgba(28,28,28,0.22)', border: '1px solid #efece3' }}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} style={{ color: t.color }} />
                  </div>
                  <span className="text-[11px] font-semibold text-muted">{t.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
